/*!
* Blackrock Universe Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function UniverseWrapper(undefined) {





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
	var init = function UniverseInit(coreObj){
		core = coreObj, mod = new core.Mod("Universe"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Universe > Initialising...");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupUniverse();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Universe
	 */
	pipelines.setupUniverse = function UniverseSetupPipeline(){
		return new core.Base().extend({
			constructor: function UniverseSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function UniverseSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function UniverseSetupPipelinePipe() {
				log("debug", "Blackrock Universe > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function UniverseSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Universe Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function UniverseSetup(evt){
		log("debug", "Blackrock Universe > [1] Setup Universe Module Initial State");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();