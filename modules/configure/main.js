/*!
* Blackrock Configure Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ConfigureWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ================================
	 * Configure Initialisation Methods
	 * ================================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function ConfigureInit(coreObj){
		core = coreObj, mod = new core.Mod("Configure"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Configure > Initialising...", {}, "CONFIGURE_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupConfigure();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Containers
	 */
	pipelines.setupConfigure = function ConfigureSetupPipeline(){
		return new core.Base().extend({
			constructor: function ConfigureSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function ConfigureSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function ConfigureSetupPipelinePipe() {
				log("debug", "Blackrock Configure > Server Initialisation Pipeline Created - Executing Now:", {}, "CONFIGURE_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function ConfigureSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Configure Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function ConfigureSetup(evt){
		log("debug", "Blackrock Configure > [1] Module Not Implemented", {}, "CONFIGURE_NOT_IMPLEMENTED");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();