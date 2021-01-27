!function() {
  const https = require('https');
  module.exports = function(key, cert) {
    const fs = require('fs');
    const options = {
      key: fs.readFileSync(key, 'utf8'),
      cert: fs.readFileSync(cert, 'utf8'),
    };
    return https.createServer(options);
  };
}();
