/*!
* Blackrock Containers Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ContainersWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * =================================
	 * Containers Initialisation Methods
	 * =================================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function ContainersInit(coreObj){
		core = coreObj, mod = new core.Mod("Containers"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Containers > Initialising...", {}, "CONTAINERS_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupContainers();
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
	pipelines.setupContainers = function ContainersSetupPipeline(){
		return new core.Base().extend({
			constructor: function ContainersSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function ContainersSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function ContainersSetupPipelinePipe() {
				log("debug", "Blackrock Containers > Server Initialisation Pipeline Created - Executing Now:", {}, "CONTAINERS_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function ContainersSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * ======================================
	 * Containers Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * ======================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function ContainersSetup(evt){
		log("debug", "Blackrock Containers > [1] Module Not Implemented", {}, "CONTAINERS_NOT_IMPLEMENTED");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();