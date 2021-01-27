/* !
 * RSA library for Node.js
 *
 * Author: rzcoder
 * License MIT
 */

const constants = require('constants');
const rsa = require('./libs/rsa.js');
const crypt = require('crypto');
const ber = require('../lib/asn1').Ber;
const _ = require('./utils')._;
const utils = require('./utils');
const schemes = require('./schemes/schemes.js');
const formats = require('./formats/formats.js');

if (typeof constants.RSA_NO_PADDING === 'undefined') {
  // patch for node v0.10.x, constants do not defined
  constants.RSA_NO_PADDING = 3;
}

module.exports = (function() {
  const SUPPORTED_HASH_ALGORITHMS = {
    node10: ['md4', 'md5', 'ripemd160', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'],
    node: ['md4', 'md5', 'ripemd160', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'],
    iojs: ['md4', 'md5', 'ripemd160', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'],
    browser: ['md5', 'ripemd160', 'sha1', 'sha256', 'sha512'],
  };

  const DEFAULT_ENCRYPTION_SCHEME = 'pkcs1_oaep';
  const DEFAULT_SIGNING_SCHEME = 'pkcs1';

  const DEFAULT_EXPORT_FORMAT = 'private';
  const EXPORT_FORMAT_ALIASES = {
    'private': 'pkcs1-private-pem',
    'private-der': 'pkcs1-private-der',
    'public': 'pkcs8-public-pem',
    'public-der': 'pkcs8-public-der',
  };

  function NodeRSA(key, format, options) {
    if (!(this instanceof NodeRSA)) {
      return new NodeRSA(key, format, options);
    }

    if (_.isObject(format)) {
      options = format;
      format = undefined;
    }

    this.$options = {
      signingScheme: DEFAULT_SIGNING_SCHEME,
      signingSchemeOptions: {
        hash: 'sha256',
        saltLength: null,
      },
      encryptionScheme: DEFAULT_ENCRYPTION_SCHEME,
      encryptionSchemeOptions: {
        hash: 'sha1',
        label: null,
      },
      environment: utils.detectEnvironment(),
      rsaUtils: this,
    };
    this.keyPair = new rsa.Key();
    this.$cache = {};

    if (Buffer.isBuffer(key) || _.isString(key)) {
      this.importKey(key, format);
    } else if (_.isObject(key)) {
      this.generateKeyPair(key.b, key.e);
    }

    this.setOptions(options);
  }

  NodeRSA.prototype.setOptions = function(options) {
    options = options || {};
    if (options.environment) {
      this.$options.environment = options.environment;
    }

    if (options.signingScheme) {
      if (_.isString(options.signingScheme)) {
        const signingScheme = options.signingScheme.toLowerCase().split('-');
        if (signingScheme.length == 1) {
          if (SUPPORTED_HASH_ALGORITHMS.node.indexOf(signingScheme[0]) > -1) {
            this.$options.signingSchemeOptions = {
              hash: signingScheme[0],
            };
            this.$options.signingScheme = DEFAULT_SIGNING_SCHEME;
          } else {
            this.$options.signingScheme = signingScheme[0];
            this.$options.signingSchemeOptions = {
              hash: null,
            };
          }
        } else {
          this.$options.signingSchemeOptions = {
            hash: signingScheme[1],
          };
          this.$options.signingScheme = signingScheme[0];
        }
      } else if (_.isObject(options.signingScheme)) {
        this.$options.signingScheme = options.signingScheme.scheme || DEFAULT_SIGNING_SCHEME;
        this.$options.signingSchemeOptions = _.omit(options.signingScheme, 'scheme');
      }

      if (!schemes.isSignature(this.$options.signingScheme)) {
        throw Error('Unsupported signing scheme');
      }

      if (this.$options.signingSchemeOptions.hash &&
                SUPPORTED_HASH_ALGORITHMS[this.$options.environment].indexOf(this.$options.signingSchemeOptions.hash) === -1) {
        throw Error('Unsupported hashing algorithm for ' + this.$options.environment + ' environment');
      }
    }

    if (options.encryptionScheme) {
      if (_.isString(options.encryptionScheme)) {
        this.$options.encryptionScheme = options.encryptionScheme.toLowerCase();
        this.$options.encryptionSchemeOptions = {};
      } else if (_.isObject(options.encryptionScheme)) {
        this.$options.encryptionScheme = options.encryptionScheme.scheme || DEFAULT_ENCRYPTION_SCHEME;
        this.$options.encryptionSchemeOptions = _.omit(options.encryptionScheme, 'scheme');
      }

      if (!schemes.isEncryption(this.$options.encryptionScheme)) {
        throw Error('Unsupported encryption scheme');
      }

      if (this.$options.encryptionSchemeOptions.hash &&
                SUPPORTED_HASH_ALGORITHMS[this.$options.environment].indexOf(this.$options.encryptionSchemeOptions.hash) === -1) {
        throw Error('Unsupported hashing algorithm for ' + this.$options.environment + ' environment');
      }
    }

    this.keyPair.setOptions(this.$options);
  };

  NodeRSA.prototype.generateKeyPair = function(bits, exp) {
    bits = bits || 2048;
    exp = exp || 65537;

    if (bits % 8 !== 0) {
      throw Error('Key size must be a multiple of 8.');
    }

    this.keyPair.generate(bits, exp.toString(16));
    this.$cache = {};
    return this;
  };

  NodeRSA.prototype.importKey = function(keyData, format) {
    if (!keyData) {
      throw Error('Empty key given');
    }

    if (format) {
      format = EXPORT_FORMAT_ALIASES[format] || format;
    }

    if (!formats.detectAndImport(this.keyPair, keyData, format) && format === undefined) {
      throw Error('Key format must be specified');
    }

    this.$cache = {};

    return this;
  };

  NodeRSA.prototype.exportKey = function(format) {
    format = format || DEFAULT_EXPORT_FORMAT;
    format = EXPORT_FORMAT_ALIASES[format] || format;

    if (!this.$cache[format]) {
      this.$cache[format] = formats.detectAndExport(this.keyPair, format);
    }

    return this.$cache[format];
  };

  NodeRSA.prototype.isPrivate = function() {
    return this.keyPair.isPrivate();
  };

  NodeRSA.prototype.isPublic = function(strict) {
    return this.keyPair.isPublic(strict);
  };

  NodeRSA.prototype.isEmpty = function(strict) {
    return !(this.keyPair.n || this.keyPair.e || this.keyPair.d);
  };

  NodeRSA.prototype.encrypt = function(buffer, encoding, source_encoding) {
    return this.$$encryptKey(false, buffer, encoding, source_encoding);
  };

  NodeRSA.prototype.decrypt = function(buffer, encoding) {
    return this.$$decryptKey(false, buffer, encoding);
  };

  NodeRSA.prototype.encryptPrivate = function(buffer, encoding, source_encoding) {
    return this.$$encryptKey(true, buffer, encoding, source_encoding);
  };

  NodeRSA.prototype.decryptPublic = function(buffer, encoding) {
    return this.$$decryptKey(true, buffer, encoding);
  };

  NodeRSA.prototype.$$encryptKey = function(usePrivate, buffer, encoding, source_encoding) {
    try {
      const res = this.keyPair.encrypt(this.$getDataForEncrypt(buffer, source_encoding), usePrivate);

      if (encoding == 'buffer' || !encoding) {
        return res;
      } else {
        return res.toString(encoding);
      }
    } catch (e) {
      throw Error('Error during encryption. Original error: ' + e);
    }
  };

  NodeRSA.prototype.$$decryptKey = function(usePublic, buffer, encoding) {
    try {
      buffer = _.isString(buffer) ? Buffer.from(buffer, 'base64') : buffer;
      const res = this.keyPair.decrypt(buffer, usePublic);

      if (res === null) {
        throw Error('Key decrypt method returns null.');
      }

      return this.$getDecryptedData(res, encoding);
    } catch (e) {
      throw Error('Error during decryption (probably incorrect key). Original error: ' + e);
    }
  };

  NodeRSA.prototype.sign = function(buffer, encoding, source_encoding) {
    if (!this.isPrivate()) {
      throw Error('This is not private key');
    }

    let res = this.keyPair.sign(this.$getDataForEncrypt(buffer, source_encoding));

    if (encoding && encoding != 'buffer') {
      res = res.toString(encoding);
    }

    return res;
  };

  NodeRSA.prototype.verify = function(buffer, signature, source_encoding, signature_encoding) {
    if (!this.isPublic()) {
      throw Error('This is not public key');
    }
    signature_encoding = (!signature_encoding || signature_encoding == 'buffer' ? null : signature_encoding);
    return this.keyPair.verify(this.$getDataForEncrypt(buffer, source_encoding), signature, signature_encoding);
  };

  NodeRSA.prototype.getKeySize = function() {
    return this.keyPair.keySize;
  };

  NodeRSA.prototype.getMaxMessageSize = function() {
    return this.keyPair.maxMessageLength;
  };

  NodeRSA.prototype.$getDataForEncrypt = function(buffer, encoding) {
    if (_.isString(buffer) || _.isNumber(buffer)) {
      return Buffer.from('' + buffer, encoding || 'utf8');
    } else if (Buffer.isBuffer(buffer)) {
      return buffer;
    } else if (_.isObject(buffer)) {
      return Buffer.from(JSON.stringify(buffer));
    } else {
      throw Error('Unexpected data type');
    }
  };

  NodeRSA.prototype.$getDecryptedData = function(buffer, encoding) {
    encoding = encoding || 'buffer';

    if (encoding == 'buffer') {
      return buffer;
    } else if (encoding == 'json') {
      return JSON.parse(buffer.toString());
    } else {
      return buffer.toString(encoding);
    }
  };

  return NodeRSA;
})();
