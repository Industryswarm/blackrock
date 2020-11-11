/*!
* Blackrock Swagger (OpenAPI) Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function SwaggerWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ===============================
	 * Universe Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function SwaggerInit(coreObj){
		core = coreObj, mod = new core.Mod("Swagger"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Swagger > Initialising...", {}, "SWAGGER_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupSwagger();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Swagger
	 */
	pipelines.setupSwagger = function SwaggerSetupPipeline(){
		return new core.Base().extend({
			constructor: function SwaggerSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function SwaggerSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function SwaggerSetupPipelinePipe() {
				log("debug", "Blackrock Swagger > Server Initialisation Pipeline Created - Executing Now:", {}, "SWAGGER_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function SwaggerSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Swagger Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function SwaggerSetup(evt){
		log("debug", "Blackrock Swagger > [1] Module Not Implemented", {}, "SWAGGER_NOT_IMPLEMENTED");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();