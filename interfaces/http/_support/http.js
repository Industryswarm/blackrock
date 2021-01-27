!function() {
  const http = require('http');
  module.exports = function() {
    return http.createServer();
  };
}();
