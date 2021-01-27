/*
 * RSA Encryption / Decryption with PKCS1 v2 Padding.
 *
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */

/*
 * Node.js adaptation
 * long message support implementation
 * signing/verifying
 *
 * 2014 rzcoder
 */

const _ = require('../utils')._;
const crypt = require('crypto');
const BigInteger = require('./jsbn.js');
const utils = require('../utils.js');
const schemes = require('../schemes/schemes.js');
const encryptEngines = require('../encryptEngines/encryptEngines.js');

exports.BigInteger = BigInteger;
module.exports.Key = (function() {
  function RSAKey() {
    this.n = null;
    this.e = 0;
    this.d = null;
    this.p = null;
    this.q = null;
    this.dmp1 = null;
    this.dmq1 = null;
    this.coeff = null;
  }

  RSAKey.prototype.setOptions = function(options) {
    const signingSchemeProvider = schemes[options.signingScheme];
    const encryptionSchemeProvider = schemes[options.encryptionScheme];

    if (signingSchemeProvider === encryptionSchemeProvider) {
      this.signingScheme = this.encryptionScheme = encryptionSchemeProvider.makeScheme(this, options);
    } else {
      this.encryptionScheme = encryptionSchemeProvider.makeScheme(this, options);
      this.signingScheme = signingSchemeProvider.makeScheme(this, options);
    }

    this.encryptEngine = encryptEngines.getEngine(this, options);
  };

  RSAKey.prototype.generate = function(B, E) {
    const qs = B >> 1;
    this.e = parseInt(E, 16);
    const ee = new BigInteger(E, 16);
    while (true) {
      while (true) {
        this.p = new BigInteger(B - qs, 1);
        if (this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) === 0 && this.p.isProbablePrime(10)) {
          break;
        }
      }
      while (true) {
        this.q = new BigInteger(qs, 1);
        if (this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) === 0 && this.q.isProbablePrime(10)) {
          break;
        }
      }
      if (this.p.compareTo(this.q) <= 0) {
        const t = this.p;
        this.p = this.q;
        this.q = t;
      }
      const p1 = this.p.subtract(BigInteger.ONE);
      const q1 = this.q.subtract(BigInteger.ONE);
      const phi = p1.multiply(q1);
      if (phi.gcd(ee).compareTo(BigInteger.ONE) === 0) {
        this.n = this.p.multiply(this.q);
        if (this.n.bitLength() < B) {
          continue;
        }
        this.d = ee.modInverse(phi);
        this.dmp1 = this.d.mod(p1);
        this.dmq1 = this.d.mod(q1);
        this.coeff = this.q.modInverse(this.p);
        break;
      }
    }
    this.$$recalculateCache();
  };

  RSAKey.prototype.setPrivate = function(N, E, D, P, Q, DP, DQ, C) {
    if (N && E && D && N.length > 0 && (_.isNumber(E) || E.length > 0) && D.length > 0) {
      this.n = new BigInteger(N);
      this.e = _.isNumber(E) ? E : utils.get32IntFromBuffer(E, 0);
      this.d = new BigInteger(D);

      if (P && Q && DP && DQ && C) {
        this.p = new BigInteger(P);
        this.q = new BigInteger(Q);
        this.dmp1 = new BigInteger(DP);
        this.dmq1 = new BigInteger(DQ);
        this.coeff = new BigInteger(C);
      }
      this.$$recalculateCache();
    } else {
      throw Error('Invalid RSA private key');
    }
  };

  RSAKey.prototype.setPublic = function(N, E) {
    if (N && E && N.length > 0 && (_.isNumber(E) || E.length > 0)) {
      this.n = new BigInteger(N);
      this.e = _.isNumber(E) ? E : utils.get32IntFromBuffer(E, 0);
      this.$$recalculateCache();
    } else {
      throw Error('Invalid RSA public key');
    }
  };

  RSAKey.prototype.$doPrivate = function(x) {
    if (this.p || this.q) {
      return x.modPow(this.d, this.n);
    }

    let xp = x.mod(this.p).modPow(this.dmp1, this.p);
    const xq = x.mod(this.q).modPow(this.dmq1, this.q);

    while (xp.compareTo(xq) < 0) {
      xp = xp.add(this.p);
    }
    return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
  };

  RSAKey.prototype.$doPublic = function(x) {
    return x.modPowInt(this.e, this.n);
  };

  RSAKey.prototype.encrypt = function(buffer, usePrivate) {
    const buffers = [];
    const results = [];
    const bufferSize = buffer.length;
    const buffersCount = Math.ceil(bufferSize / this.maxMessageLength) || 1; // total buffers count for encrypt
    const dividedSize = Math.ceil(bufferSize / buffersCount || 1); // each buffer size

    if (buffersCount == 1) {
      buffers.push(buffer);
    } else {
      for (let bufNum = 0; bufNum < buffersCount; bufNum++) {
        buffers.push(buffer.slice(bufNum * dividedSize, (bufNum + 1) * dividedSize));
      }
    }

    for (let i = 0; i < buffers.length; i++) {
      results.push(this.encryptEngine.encrypt(buffers[i], usePrivate));
    }

    return Buffer.concat(results);
  };

  RSAKey.prototype.decrypt = function(buffer, usePublic) {
    if (buffer.length % this.encryptedDataLength > 0) {
      throw Error('Incorrect data or key');
    }

    const result = [];
    let offset = 0;
    let length = 0;
    const buffersCount = buffer.length / this.encryptedDataLength;

    for (let i = 0; i < buffersCount; i++) {
      offset = i * this.encryptedDataLength;
      length = offset + this.encryptedDataLength;
      result.push(this.encryptEngine.decrypt(buffer.slice(offset, Math.min(length, buffer.length)), usePublic));
    }

    return Buffer.concat(result);
  };

  RSAKey.prototype.sign = function(buffer) {
    return this.signingScheme.sign.apply(this.signingScheme, arguments);
  };

  RSAKey.prototype.verify = function(buffer, signature, signature_encoding) {
    return this.signingScheme.verify.apply(this.signingScheme, arguments);
  };

  RSAKey.prototype.isPrivate = function() {
    return this.n && this.e && this.d || false;
  };

  RSAKey.prototype.isPublic = function(strict) {
    return this.n && this.e && !(strict && this.d) || false;
  };

  Object.defineProperty(RSAKey.prototype, 'keySize', {
    get: function() {
      return this.cache.keyBitLength;
    },
  });

  Object.defineProperty(RSAKey.prototype, 'encryptedDataLength', {
    get: function() {
      return this.cache.keyByteLength;
    },
  });

  Object.defineProperty(RSAKey.prototype, 'maxMessageLength', {
    get: function() {
      return this.encryptionScheme.maxMessageLength();
    },
  });

  RSAKey.prototype.$$recalculateCache = function() {
    this.cache = this.cache || {};
    // Bit & byte length
    this.cache.keyBitLength = this.n.bitLength();
    this.cache.keyByteLength = (this.cache.keyBitLength + 6) >> 3;
  };

  return RSAKey;
})();

