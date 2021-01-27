const BigInteger = require('../libs/jsbn.js');
const schemes = require('../schemes/schemes.js');

module.exports = function(keyPair, options) {
  const pkcs1Scheme = schemes.pkcs1.makeScheme(keyPair, options);

  return {
    encrypt: function(buffer, usePrivate) {
      let m; let c;
      if (usePrivate) {
        /* Type 1: zeros padding for private key encrypt */
        m = new BigInteger(pkcs1Scheme.encPad(buffer, {type: 1}));
        c = keyPair.$doPrivate(m);
      } else {
        m = new BigInteger(keyPair.encryptionScheme.encPad(buffer));
        c = keyPair.$doPublic(m);
      }
      return c.toBuffer(keyPair.encryptedDataLength);
    },

    decrypt: function(buffer, usePublic) {
      let m; const c = new BigInteger(buffer);

      if (usePublic) {
        m = keyPair.$doPublic(c);
        /* Type 1: zeros padding for private key decrypt */
        return pkcs1Scheme.encUnPad(m.toBuffer(keyPair.encryptedDataLength), {type: 1});
      } else {
        m = keyPair.$doPrivate(c);
        return keyPair.encryptionScheme.encUnPad(m.toBuffer(keyPair.encryptedDataLength));
      }
    },
  };
};
