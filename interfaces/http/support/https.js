;!function(undefined) {
	var	https = require('https');
	var init = function(key, cert) {
		var fs = require("fs");
		var options = {
			key: fs.readFileSync(key, 'utf8'),
			cert: fs.readFileSync(cert, 'utf8')
		};
		return https.createServer(options);
	}
	module.exports = init;
}();