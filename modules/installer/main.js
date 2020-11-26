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
					streamFns.registerWithCLI,

					// Fires once per CLI command:
					streamFns.listenToStart,
					streamFns.installService,
					streamFns.removeService,
					streamFns.switchRegistry,
					streamFns.listServices,
					streamFns.searchServices
					
				);
				stream1.subscribe(function InstallerSetupPipelineSubscribe(res) {
					console.log("\nNot Implemented - Installer\n");
					process.exit();
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
	 * (Internal > Stream Methods [1]) Register With CLI
	 * @param {observable} source - The Source Observable
	 */
	streamFns.registerWithCLI = function InstallerRegisterWithCLI(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Installer > [1] Installer registering with CLI...", {}, "INSTALLER_REGISTER_WITH_CLI");
					core.isLoaded("cli").then(function(cliMod) {
						cliMod.register([
							{"cmd": "install", "params": "[service]", "info": "Installs a new service", "fn": function(params) { core.emit("INSTALLER_INIT_INSTALLER", { "command": "install", "params": params }); }},
							{"cmd": "remove", "params": "[service]", "info": "Removes an installed service", "fn": function(params) { core.emit("INSTALLER_INIT_INSTALLER", { "command": "remove", "params": params }); }},
							{"cmd": "switch", "params": "[registry]", "info": "Switches service registry", "fn": function(params) { core.emit("INSTALLER_INIT_INSTALLER", { "command": "switch", "params": params }); }},
							{"cmd": "list-services", "params": "\t", "info": "Lists installed services", "fn": function(params) { core.emit("INSTALLER_INIT_INSTALLER", { "command": "list-services", "params": params }); }},
							{"cmd": "search", "params": "\t\t", "info": "Searches registry for service", "fn": function(params) { core.emit("INSTALLER_INIT_INSTALLER", { "command": "search", "params": params }); }}
						]);
					}).catch(function(err) {
						log("error", "Blackrock Installer > Failed to register with CLI - CLI module not loaded", {}, "INSTALLER_CLI_MOD_NOT_LOADED");
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
	streamFns.listenToStart = function InstallerPipelineFnsListenToStart(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Installer > [2a] Listener created for 'INSTALLER_INIT_INSTALLER' event", {}, "INSTALLER_LISTENER_CREATED");
					core.on("INSTALLER_INIT_INSTALLER", function InstallerPipelineFns1ListenToStartStartInstallerCallback(installerParams){
						core.stopActivation = true;
						log("debug", "Blackrock Installer > [2b] 'INSTALLER_INIT_INSTALLER' Event Received", {}, "INSTALLER_LISTENER_EVT_RECEIVED");
						evt.command = installerParams.command;
						evt.params = installerParams.params;
						observer.next(evt);
					});
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Install Service
	 * @param {observable} source - The Source Observable
	 */
	streamFns.installService = function InstallerPipelineFnsInstall(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "install") {
						log("debug", "Blackrock Installer > [3] Installing Service...", {}, "INSTALLER_INSTALL");
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
	 * (Internal > Stream Methods [4]) Remove Service
	 * @param {observable} source - The Source Observable
	 */
	streamFns.removeService = function InstallerPipelineFnsRemove(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "remove") {
						log("debug", "Blackrock Installer > [4] Removing Service...", {}, "INSTALLER_REMOVE");
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
	 * (Internal > Stream Methods [5]) Switch Registry
	 * @param {observable} source - The Source Observable
	 */
	streamFns.switchRegistry = function InstallerPipelineFnsSwitch(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "switch") {
						log("debug", "Blackrock Installer > [5] Switching Registry...", {}, "INSTALLER_SWITCH");
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
	 * (Internal > Stream Methods [6]) List Services In Registry
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listServices = function InstallerPipelineFnsListServices(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "list-services") {
						log("debug", "Blackrock Installer > [6] Listing Services...", {}, "INSTALLER_LIST_SERVICES");
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
	 * (Internal > Stream Methods [7]) Search for Service
	 * @param {observable} source - The Source Observable
	 */
	streamFns.searchServices = function InstallerPipelineFnsSearch(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "search") {
						log("debug", "Blackrock Installer > [7] Listing Services...", {}, "INSTALLER_SEARCH");
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