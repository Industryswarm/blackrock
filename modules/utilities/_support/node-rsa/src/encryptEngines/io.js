const crypto = require('crypto');
const constants = require('constants');
const schemes = require('../schemes/schemes.js');

module.exports = function(keyPair, options) {
  const pkcs1Scheme = schemes.pkcs1.makeScheme(keyPair, options);

  return {
    encrypt: function(buffer, usePrivate) {
      let padding;
      if (usePrivate) {
        padding = constants.RSA_PKCS1_PADDING;
        if (options.encryptionSchemeOptions && options.encryptionSchemeOptions.padding) {
          padding = options.encryptionSchemeOptions.padding;
        }
        return crypto.privateEncrypt({
          key: options.rsaUtils.exportKey('private'),
          padding: padding,
        }, buffer);
      } else {
        padding = constants.RSA_PKCS1_OAEP_PADDING;
        if (options.encryptionScheme === 'pkcs1') {
          padding = constants.RSA_PKCS1_PADDING;
        }
        if (options.encryptionSchemeOptions && options.encryptionSchemeOptions.padding) {
          padding = options.encryptionSchemeOptions.padding;
        }

        let data = buffer;
        if (padding === constants.RSA_NO_PADDING) {
          data = pkcs1Scheme.pkcs0pad(buffer);
        }

        return crypto.publicEncrypt({
          key: options.rsaUtils.exportKey('public'),
          padding: padding,
        }, data);
      }
    },

    decrypt: function(buffer, usePublic) {
      let padding;
      if (usePublic) {
        padding = constants.RSA_PKCS1_PADDING;
        if (options.encryptionSchemeOptions && options.encryptionSchemeOptions.padding) {
          padding = options.encryptionSchemeOptions.padding;
        }
        return crypto.publicDecrypt({
          key: options.rsaUtils.exportKey('public'),
          padding: padding,
        }, buffer);
      } else {
        padding = constants.RSA_PKCS1_OAEP_PADDING;
        if (options.encryptionScheme === 'pkcs1') {
          padding = constants.RSA_PKCS1_PADDING;
        }
        if (options.encryptionSchemeOptions && options.encryptionSchemeOptions.padding) {
          padding = options.encryptionSchemeOptions.padding;
        }
        const res = crypto.privateDecrypt({
          key: options.rsaUtils.exportKey('private'),
          padding: padding,
        }, buffer);

        if (padding === constants.RSA_NO_PADDING) {
          return pkcs1Scheme.pkcs0unpad(res);
        }
        return res;
      }
    },
  };
};
