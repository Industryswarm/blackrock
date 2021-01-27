const BigInteger = require('../libs/jsbn');
const crypt = require('crypto');

module.exports = {
  isEncryption: true,
  isSignature: false,
};

module.exports.digestLength = {
  md4: 16,
  md5: 16,
  ripemd160: 20,
  rmd160: 20,
  sha1: 20,
  sha224: 28,
  sha256: 32,
  sha384: 48,
  sha512: 64,
};

const DEFAULT_HASH_FUNCTION = 'sha1';

/*
 * OAEP Mask Generation Function 1
 * Generates a buffer full of pseudorandom bytes given seed and maskLength.
 * Giving the same seed, maskLength, and hashFunction will result in the same exact byte values in the buffer.
 *
 * https://tools.ietf.org/html/rfc3447#appendix-B.2.1
 *
 * Parameters:
 * seed			[Buffer]	The pseudo random seed for this function
 * maskLength	[int]		The length of the output
 * hashFunction	[String]	The hashing function to use. Will accept any valid crypto hash. Default "sha1"
 *		Supports "sha1" and "sha256".
 *		To add another algorythm the algorythem must be accepted by crypto.createHash, and then the length of the output of the hash function (the digest) must be added to the digestLength object below.
 *		Most RSA implementations will be expecting sha1
 */
module.exports.eme_oaep_mgf1 = function(seed, maskLength, hashFunction) {
  hashFunction = hashFunction || DEFAULT_HASH_FUNCTION;
  const hLen = module.exports.digestLength[hashFunction];
  const count = Math.ceil(maskLength / hLen);
  const T = Buffer.alloc(hLen * count);
  const c = Buffer.alloc(4);
  for (let i = 0; i < count; ++i) {
    const hash = crypt.createHash(hashFunction);
    hash.update(seed);
    c.writeUInt32BE(i, 0);
    hash.update(c);
    hash.digest().copy(T, i * hLen);
  }
  return T.slice(0, maskLength);
};

module.exports.makeScheme = function(key, options) {
  function Scheme(key, options) {
    this.key = key;
    this.options = options;
  }

  Scheme.prototype.maxMessageLength = function() {
    return this.key.encryptedDataLength - 2 * module.exports.digestLength[this.options.encryptionSchemeOptions.hash || DEFAULT_HASH_FUNCTION] - 2;
  };

  Scheme.prototype.encPad = function(buffer) {
    const hash = this.options.encryptionSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    const mgf = this.options.encryptionSchemeOptions.mgf || module.exports.eme_oaep_mgf1;
    const label = this.options.encryptionSchemeOptions.label || Buffer.alloc(0);
    const emLen = this.key.encryptedDataLength;

    const hLen = module.exports.digestLength[hash];

    // Make sure we can put message into an encoded message of emLen bytes
    if (buffer.length > emLen - 2 * hLen - 2) {
      throw new Error('Message is too long to encode into an encoded message with a length of ' + emLen + ' bytes, increase' +
            'emLen to fix this error (minimum value for given parameters and options: ' + (emLen - 2 * hLen - 2) + ')');
    }

    let lHash = crypt.createHash(hash);
    lHash.update(label);
    lHash = lHash.digest();

    const PS = Buffer.alloc(emLen - buffer.length - 2 * hLen - 1); // Padding "String"
    PS.fill(0); // Fill the buffer with octets of 0
    PS[PS.length - 1] = 1;

    const DB = Buffer.concat([lHash, PS, buffer]);
    const seed = crypt.randomBytes(hLen);

    // mask = dbMask
    let mask = mgf(seed, DB.length, hash);
    // XOR DB and dbMask together.
    for (var i = 0; i < DB.length; i++) {
      DB[i] ^= mask[i];
    }
    // DB = maskedDB

    // mask = seedMask
    mask = mgf(DB, hLen, hash);
    // XOR seed and seedMask together.
    for (i = 0; i < seed.length; i++) {
      seed[i] ^= mask[i];
    }
    // seed = maskedSeed

    const em = Buffer.alloc(1 + seed.length + DB.length);
    em[0] = 0;
    seed.copy(em, 1);
    DB.copy(em, 1 + seed.length);

    return em;
  };

  Scheme.prototype.encUnPad = function(buffer) {
    const hash = this.options.encryptionSchemeOptions.hash || DEFAULT_HASH_FUNCTION;
    const mgf = this.options.encryptionSchemeOptions.mgf || module.exports.eme_oaep_mgf1;
    const label = this.options.encryptionSchemeOptions.label || Buffer.alloc(0);

    const hLen = module.exports.digestLength[hash];

    // Check to see if buffer is a properly encoded OAEP message
    if (buffer.length < 2 * hLen + 2) {
      throw new Error('Error decoding message, the supplied message is not long enough to be a valid OAEP encoded message');
    }

    const seed = buffer.slice(1, hLen + 1);	// seed = maskedSeed
    const DB = buffer.slice(1 + hLen);		// DB = maskedDB

    let mask = mgf(DB, hLen, hash); // seedMask
    // XOR maskedSeed and seedMask together to get the original seed.
    for (var i = 0; i < seed.length; i++) {
      seed[i] ^= mask[i];
    }

    mask = mgf(seed, DB.length, hash); // dbMask
    // XOR DB and dbMask together to get the original data block.
    for (i = 0; i < DB.length; i++) {
      DB[i] ^= mask[i];
    }

    let lHash = crypt.createHash(hash);
    lHash.update(label);
    lHash = lHash.digest();

    const lHashEM = DB.slice(0, hLen);
    if (lHashEM.toString('hex') != lHash.toString('hex')) {
      throw new Error('Error decoding message, the lHash calculated from the label provided and the lHash in the encrypted data do not match.');
    }

    // Filter out padding
    i = hLen;
    while (DB[i++] === 0 && i < DB.length);
    if (DB[i - 1] != 1) {
      throw new Error('Error decoding message, there is no padding message separator byte');
    }

    return DB.slice(i); // Message
  };

  return new Scheme(key, options);
};
