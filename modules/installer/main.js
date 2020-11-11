/*!
* Blackrock Installer Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function InstallerWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ===============================
	 * Installer Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function InstallerInit(coreObj){
		core = coreObj, mod = new core.Mod("Installer"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Installer > Initialising...", {}, "INSTALLER_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupInstaller();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Installer
	 */
	pipelines.setupInstaller = function InstallerSetupPipeline(){
		return new core.Base().extend({
			constructor: function InstallerSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function InstallerSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function InstallerSetupPipelinePipe() {
				log("debug", "Blackrock Installer > Server Initialisation Pipeline Created - Executing Now:", {}, "INSTALLER_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupModule(evt); })
					
				);
				stream1.subscribe(function InstallerSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Installer Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupModule = function InstallerSetup(evt){
		log("debug", "Blackrock Installer > [1] Module Not Implemented", {}, "INSTALLER_NOT_IMPLEMENTED");
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();