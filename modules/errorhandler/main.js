/*!
* ISNode Blackrock Error Handler Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnodeObj - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("ErrorHandler"), log = isnode.module("logger").log;
		manageErrors();
		return ismod;
	}

	/**
	 * (Internal) Manages uncaught exceptions
	 */
	var manageErrors = function(){
		var errorCount = 0;
		var errorMessages = {};
		ismod.on("errorhandled", function(err){
			if(errorMessages[err] && errorMessages[err] == true){
				errorCount --;
				errorMessages[err] = false;
				delete errorMessages[err];
				return;
			}
		});
		process.on('uncaughtException', function(err) {
			errorMessages[err.message] = true;
			errorCount ++;
			var counter = 0;
			if(isnode.cfg().errorhandler && isnode.cfg().errorhandler.timeout) { var timeout = isnode.cfg().errorhandler.timeout; } else { var timeout = 5000; }
			ismod.emit("errorthrown", err.message);
			var interval = setInterval(function(){
				if(errorCount <= 0){
					clearInterval(interval);
					log("debug", "Error Handler > Thrown exception(s) handled by a listening module or service - " + err.message, err);
					return;
				}
				if(counter >= timeout){
					clearInterval(interval);
					log("fatal", "Error Handler > Caught unhandled exception(s). Terminating application server. Error - " + err.message, err);
					isnode.shutdown();
					return;
				}
				counter += 10;
			}, 10);
		});
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();