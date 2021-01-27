module.exports = {
  pkcs1: require('./pkcs1'),
  pkcs1_oaep: require('./oaep'),
  pss: require('./pss'),

  isEncryption: function(scheme) {
    return module.exports[scheme] && module.exports[scheme].isEncryption;
  },

  isSignature: function(scheme) {
    return module.exports[scheme] && module.exports[scheme].isSignature;
  },
};
