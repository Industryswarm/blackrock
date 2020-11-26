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
	 * (Internal > Pipeline [1]) Setup Configure
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
					streamFns.registerWithCLI,

					// Fires once per CLI command:
					streamFns.listenToStart,
					streamFns.reloadConfig,
					streamFns.listConfig,
					streamFns.getConfig,
					streamFns.updateConfig
					
				);
				stream1.subscribe(function ConfigureSetupPipelineSubscribe(res) {
					if(!res.complete) {
						console.log("\nNot Implemented - Configure\n");
					}
					process.exit();
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
	 * (Internal > Stream Methods [1]) Register With CLI
	 * @param {observable} source - The Source Observable
	 */
	streamFns.registerWithCLI = function ConfigureRegisterWithCLI(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Configure > [1] Configure registering with CLI...", {}, "CONFIGURE_REGISTER_WITH_CLI");
					core.isLoaded("cli").then(function(cliMod) {
						cliMod.register([
							{"cmd": "update", "params": "[param]=[value]", "info": "Updates a config parameter", "fn": function(params) { core.emit("CONFIGURE_INIT_CONFIGURE", { "command": "update", "params": params }); }},
							{"cmd": "list", "params": "\t\t", "info": "Shows list of config parameters", "fn": function(params) { core.emit("CONFIGURE_INIT_CONFIGURE", { "command": "list", "params": params }); }},
							{"cmd": "get", "params": "[param]\t", "info": "Gets value for a config parameter", "fn": function(params) { core.emit("CONFIGURE_INIT_CONFIGURE", { "command": "get", "params": params }); }},
							{"cmd": "reload", "params": "\t\t", "info": "Reloads system config file", "fn": function(params) { core.emit("CONFIGURE_INIT_CONFIGURE", { "command": "reload", "params": params }); }}
						]);
					}).catch(function(err) {
						log("error", "Blackrock Configure > Failed to register with CLI - CLI module not loaded", {}, "CONFIGURE_CLI_MOD_NOT_LOADED");
					});
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [2]) Listen to Start Endpoint
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listenToStart = function ConfigurePipelineFnsListenToStart(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Configure > [2a] Listener created for 'CONFIGURE_INIT_CONFIGURE' event", {}, "CONFIGURE_LISTENER_CREATED");
					core.on("CONFIGURE_INIT_CONFIGURE", function ConfigurePipelineFns1ListenToStartStartConfigureCallback(configParams){
						core.stopActivation = true;
						log("debug", "Blackrock Configure > [2b] 'CONFIGURE_INIT_CONFIGURE' Event Received", {}, "CONFIGURE_LISTENER_EVT_RECEIVED");
						evt.command = configParams.command;
						evt.params = configParams.params;
						evt.complete = false;
						observer.next(evt);
					});
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Reloads Config
	 * @param {observable} source - The Source Observable
	 */
	streamFns.reloadConfig = function ConfigurePipelineFnsReloadConfig(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "reload") {
						log("debug", "Blackrock Configure > [3] Reloading System Config...", {}, "CONFIGURE_RELOADING_CONFIG");
						var configPath = core.fetchBasePath("config");
						try {
							var config = require(configPath);
						} catch(err) {
							evt.error = err;
							observer.next(evt);
							return;
						}
						var result = core.updateConfig(config);
						if(result) { evt.complete = true; }
						observer.next(evt);
					} else {
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [4]) Lists Config
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listConfig = function ConfigurePipelineFnsListConfig(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "list") {
						log("debug", "Blackrock Configure > [4] Listing System Config...", {}, "CONFIGURE_LISTING_CONFIG");
						observer.next(evt);
					} else {
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [5]) Gets Config
	 * @param {observable} source - The Source Observable
	 */
	streamFns.getConfig = function ConfigurePipelineFnsGetConfig(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "list") {
						log("debug", "Blackrock Configure > [5] Getting System Config...", {}, "CONFIGURE_GETTING_CONFIG");
						observer.next(evt);
					} else {
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [6]) Updates Config
	 * @param {observable} source - The Source Observable
	 */
	streamFns.updateConfig = function ConfigurePipelineFnsUpdateConfig(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "list") {
						log("debug", "Blackrock Configure > [6] Updating System Config...", {}, "CONFIGURE_UPDATING_CONFIG");
						observer.next(evt);
					} else {
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();