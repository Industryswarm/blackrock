/*!
* ISNode Blackrock Error Handler Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ErrorHandlerWrapper(undefined) {





	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log, errorCount = 0, errorMessages = {}, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ====================================
	 * Error Handler Initialisation Methods
	 * ====================================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function ErrorHandlerInit(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("ErrorHandler"), ismod.log = log = isnode.module("logger").log;
		log("debug", "Blackrock Error Handler > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		if(isnode.cfg().errorHandler && isnode.cfg().errorHandler.enabled == true){
			var ISPipeline = pipelines.setupErrorHandler();
			new ISPipeline({}).pipe();
		}
		return ismod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Error Handler
	 */
	pipelines.setupErrorHandler = function ErrorHandlerSetupPipeline(){
		return new isnode.ISNode().extend({
			constructor: function ErrorHandlerSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function ErrorHandlerSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function ErrorHandlerSetupPipelinePipe() {
				log("debug", "Blackrock Error Handler > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupErrorHandled(evt); }),
					op.map(evt => { if(evt) return streamFns.setupUncaughtException(evt); }),
					
				);
				stream1.subscribe(function ErrorHandlerSetupPipelineSubscribeCallback(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =========================================
	 * Error Handler Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =========================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Error Handled
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupErrorHandled = function ErrorHandlerSetupErrorHandled(evt){
		ismod.on("errorhandled", function ErrorHandlerErrorHandledCallback(err){
			if(errorMessages[err] && errorMessages[err] == true){
				errorCount --;
				errorMessages[err] = false;
				delete errorMessages[err];
				return;
			}
		});
		log("debug", "Blackrock Error Handler > [1] Setup Listener Method for the 'errorhandled' event");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Setup Uncaught Exception
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupUncaughtException = function ErrorHandlerSetupUncaughtException(evt){
		process.on('uncaughtException', function ErrorHandlerUncaughtExceptionCallback(err) {
			errorMessages[err.message] = true;
			errorCount ++;
			var counter = 0;
			if(isnode.cfg().errorhandler && isnode.cfg().errorhandler.timeout) { var timeout = isnode.cfg().errorhandler.timeout; } else { var timeout = 5000; }
			ismod.emit("errorthrown", err.message);
			var interval = setInterval(function ErrorHandlerUncaughtExceptionTimeout(){
				if(errorCount <= 0){
					clearInterval(interval);
					log("debug", "Blackrock Error Handler > Thrown exception(s) handled by a listening module or service - " + err.message, err);
					return;
				}
				if(counter >= timeout){
					clearInterval(interval);
					log("fatal", "Blackrock Error Handler > Caught unhandled exception(s). Terminating application server. Error - " + err.message, err);
					isnode.shutdown();
					return;
				}
				counter += 10;
			}, 10);
		});
		log("debug", "Blackrock Error Handler > [2] Setup Listener Method for the 'uncaughtexception' event");
		return evt;
	}








	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();