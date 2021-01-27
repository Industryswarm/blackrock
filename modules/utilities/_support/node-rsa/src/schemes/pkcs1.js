const BigInteger = require('../libs/jsbn');
const crypt = require('crypto');
const constants = require('constants');
const SIGN_INFO_HEAD = {
  md2: Buffer.from('3020300c06082a864886f70d020205000410', 'hex'),
  md5: Buffer.from('3020300c06082a864886f70d020505000410', 'hex'),
  sha1: Buffer.from('3021300906052b0e03021a05000414', 'hex'),
  sha224: Buffer.from('302d300d06096086480165030402040500041c', 'hex'),
  sha256: Buffer.from('3031300d060960864801650304020105000420', 'hex'),
  sha384: Buffer.from('3041300d060960864801650304020205000430', 'hex'),
  sha512: Buffer.from('3051300d060960864801650304020305000440', 'hex'),
  ripemd160: Buffer.from('3021300906052b2403020105000414', 'hex'),
  rmd160: Buffer.from('3021300906052b2403020105000414', 'hex'),
};

const SIGN_ALG_TO_HASH_ALIASES = {
  'ripemd160': 'rmd160',
};

const DEFAULT_HASH_FUNCTION = 'sha256';

module.exports = {
  isEncryption: true,
  isSignature: true,
};

module.exports.makeScheme = function(key, options) {
  function Scheme(key, options) {
    this.key = key;
    this.options = options;
  }

  Scheme.prototype.maxMessageLength = function() {
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      return this.key.encryptedDataLength;
    }
    return this.key.encryptedDataLength - 11;
  };

  Scheme.prototype.encPad = function(buffer, options) {
    options = options || {};
    let filled;
    if (buffer.length > this.key.maxMessageLength) {
      throw new Error('Message too long for RSA (n=' + this.key.encryptedDataLength + ', l=' + buffer.length + ')');
    }
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      // RSA_NO_PADDING treated like JAVA left pad with zero character
      filled = Buffer.alloc(this.key.maxMessageLength - buffer.length);
      filled.fill(0);
      return Buffer.concat([filled, buffer]);
    }

    /* Type 1: zeros padding for private key encrypt */
    if (options.type === 1) {
      filled = Buffer.alloc(this.key.encryptedDataLength - buffer.length - 1);
      filled.fill(0xff, 0, filled.length - 1);
      filled[0] = 1;
      filled[filled.length - 1] = 0;

      return Buffer.concat([filled, buffer]);
    } else {
      /* random padding for public key encrypt */
      filled = Buffer.alloc(this.key.encryptedDataLength - buffer.length);
      filled[0] = 0;
      filled[1] = 2;
      const rand = crypt.randomBytes(filled.length - 3);
      for (let i = 0; i < rand.length; i++) {
        let r = rand[i];
        while (r === 0) { // non-zero only
          r = crypt.randomBytes(1)[0];
        }
        filled[i + 2] = r;
      }
      filled[filled.length - 1] = 0;
      return Buffer.concat([filled, buffer]);
    }
  };

  Scheme.prototype.encUnPad = function(buffer, options) {
    options = options || {};
    let i = 0;

    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      // RSA_NO_PADDING treated like JAVA left pad with zero character
      let unPad;
      if (typeof buffer.lastIndexOf == 'function') { // patch for old node version
        unPad = buffer.slice(buffer.lastIndexOf('\0') + 1, buffer.length);
      } else {
        unPad = buffer.slice(String.prototype.lastIndexOf.call(buffer, '\0') + 1, buffer.length);
      }
      return unPad;
    }

    if (buffer.length < 4) {
      return null;
    }

    /* Type 1: zeros padding for private key decrypt */
    if (options.type === 1) {
      if (buffer[0] !== 0 && buffer[1] !== 1) {
        return null;
      }
      i = 3;
      while (buffer[i] !== 0) {
        if (buffer[i] != 0xFF || ++i >= buffer.length) {
          return null;
        }
      }
    } else {
      /* random padding for public key decrypt */
      if (buffer[0] !== 0 && buffer[1] !== 2) {
        return null;
      }
      i = 3;
      while (buffer[i] !== 0) {
        if (++i >= buffer.length) {
          return null;
        }
      }
    }
    return buffer.slice(i + 1, buffer.length);
  };

  Scheme.prototype.sign = function(buffer) {
    let hashAlgorithm = this.options.signingSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    if (this.options.environment === 'browser') {
      hashAlgorithm = SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm] || hashAlgorithm;

      const hasher = crypt.createHash(hashAlgorithm);
      hasher.update(buffer);
      const hash = this.pkcs1pad(hasher.digest(), hashAlgorithm);
      const res = this.key.$doPrivate(new BigInteger(hash)).toBuffer(this.key.encryptedDataLength);

      return res;
    } else {
      const signer = crypt.createSign('RSA-' + hashAlgorithm.toUpperCase());
      signer.update(buffer);
      return signer.sign(this.options.rsaUtils.exportKey('private'));
    }
  };

  Scheme.prototype.verify = function(buffer, signature, signature_encoding) {
    if (this.options.encryptionSchemeOptions && this.options.encryptionSchemeOptions.padding == constants.RSA_NO_PADDING) {
      // RSA_NO_PADDING has no verify data
      return false;
    }
    let hashAlgorithm = this.options.signingSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    if (this.options.environment === 'browser') {
      hashAlgorithm = SIGN_ALG_TO_HASH_ALIASES[hashAlgorithm] || hashAlgorithm;

      if (signature_encoding) {
        signature = Buffer.from(signature, signature_encoding);
      }

      const hasher = crypt.createHash(hashAlgorithm);
      hasher.update(buffer);
      const hash = this.pkcs1pad(hasher.digest(), hashAlgorithm);
      const m = this.key.$doPublic(new BigInteger(signature));

      return m.toBuffer().toString('hex') == hash.toString('hex');
    } else {
      const verifier = crypt.createVerify('RSA-' + hashAlgorithm.toUpperCase());
      verifier.update(buffer);
      return verifier.verify(this.options.rsaUtils.exportKey('public'), signature, signature_encoding);
    }
  };

  Scheme.prototype.pkcs0pad = function(buffer) {
    const filled = Buffer.alloc(this.key.maxMessageLength - buffer.length);
    filled.fill(0);
    return Buffer.concat([filled, buffer]);
  };

  Scheme.prototype.pkcs0unpad = function(buffer) {
    let unPad;
    if (typeof buffer.lastIndexOf == 'function') { // patch for old node version
      unPad = buffer.slice(buffer.lastIndexOf('\0') + 1, buffer.length);
    } else {
      unPad = buffer.slice(String.prototype.lastIndexOf.call(buffer, '\0') + 1, buffer.length);
    }

    return unPad;
  };

  Scheme.prototype.pkcs1pad = function(hashBuf, hashAlgorithm) {
    const digest = SIGN_INFO_HEAD[hashAlgorithm];
    if (!digest) {
      throw Error('Unsupported hash algorithm');
    }

    const data = Buffer.concat([digest, hashBuf]);

    if (data.length + 10 > this.key.encryptedDataLength) {
      throw Error('Key is too short for signing algorithm (' + hashAlgorithm + ')');
    }

    const filled = Buffer.alloc(this.key.encryptedDataLength - data.length - 1);
    filled.fill(0xff, 0, filled.length - 1);
    filled[0] = 1;
    filled[filled.length - 1] = 0;

    const res = Buffer.concat([filled, data]);

    return res;
  };

  return new Scheme(key, options);
};


