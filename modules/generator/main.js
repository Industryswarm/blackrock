/*!
* Blackrock Generator Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function GeneratorWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ===============================
	 * Generator Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function GeneratorInit(coreObj){
		core = coreObj, mod = new core.Mod("Generator"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Generator > Initialising...", {}, "GENERATOR_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupGenerator();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Generator
	 */
	pipelines.setupGenerator = function GeneratorSetupPipeline(){
		return new core.Base().extend({
			constructor: function GeneratorSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function GeneratorSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function GeneratorSetupPipelinePipe() {
				log("debug", "Blackrock Generator > Server Initialisation Pipeline Created - Executing Now:", {}, "GENERATOR_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function GeneratorSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Generator Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function GeneratorSetup(evt){
		log("debug", "Blackrock Generator > [1] Module Not Implemented", {}, "GENERATOR_NOT_IMPLEMENTED");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();