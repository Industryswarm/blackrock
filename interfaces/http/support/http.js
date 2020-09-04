;!function(undefined) {
	var	http = require('http');
	var init = function() {
		return http.createServer();
	}
	module.exports = init;
}();