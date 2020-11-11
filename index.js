#!/usr/bin/env node

;!function(undefined) { 
	if (!module.parent) {
		require("./modules/core/main.js").init();
	} else {
		module.exports = require("./modules/core/main.js"); 
	}
}();