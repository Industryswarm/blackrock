/*!
* Blackrock Daemon Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function DaemonWrapper(undefined) {








	/** Create parent event emitter object from which to inherit mod object */
	String.prototype.endsWith = function DaemonEndsWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var core, mod, log, config, daemonize, daemon = false, restartingDaemon = false, pipelines = {}, streamFns = {}, lib, rx, op, Observable;








	/**
	 * =============================
	 * Daemon Initialisation Methods
	 * =============================
	 */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function DaemonInit(coreObj){
		core = coreObj, mod = new core.Mod("Daemon"), log = core.module("logger").log, config = core.cfg();
		core.on("updateLogFn", function(){ log = core.module("logger").log });
		log("debug", "Blackrock Daemon > Initialising...", {}, "DAEMON_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupDaemon();
		new Pipeline({}).pipe();
		return mod;
	}








	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */

	/**
	 * (Internal > Pipeline [1]) Setup Daemon
	 */
	pipelines.setupDaemon = function DaemonSetupPipeline(){
		return new core.Base().extend({
			constructor: function DaemonSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function DaemonSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function DaemonSetupPipelinePipe() {
				log("debug", "Blackrock Daemon > Server Initialisation Pipeline Created - Executing Now:", {}, "DAEMON_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					streamFns.registerWithCLI,
					streamFns.listenToStart,
					op.map(evt => { if(evt) return streamFns.checkNameAndInit(evt); }),
					op.map(evt => { if(evt) return streamFns.setupCallbacks(evt); }),
					op.map(evt => { if(evt) return streamFns.checkRoot(evt); }),
					op.map(evt => { if(evt) return streamFns.startDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.stopDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.restartDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.statusDaemon(evt); })
					
				);
				stream1.subscribe(function DaemonSetupPipelineSubscribeCallback(res) {
					null;
				});
			}
		});
	};










	/**
	 * =====================================
	 * Daemon Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [0]) Register With CLI
	 * @param {observable} source - The Source Observable
	 */
	streamFns.registerWithCLI = function DaemonRegisterWithCLI(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Daemon > [0] Daemon registering with CLI...", {}, "DAEMON_REGISTER_WITH_CLI");
					core.isLoaded("cli").then(function(cliMod) {
						cliMod.register([
							{"cmd": "start", "params": "\t\t", "info": "Starts the daemon server", "fn": function(params) { core.emit("DAEMON_INIT_DAEMON", { "command": "start", "params": params }); }},
							{"cmd": "stop", "params": "\t\t", "info": "Stops the daemon server", "fn": function(params) { core.emit("DAEMON_INIT_DAEMON", { "command": "stop", "params": params }); }},
							{"cmd": "status", "params": "\t\t", "info": "Gets the status of the daemon server", "fn": function(params) { core.emit("DAEMON_INIT_DAEMON", { "command": "status", "params": params }); }},
							{"cmd": "restart", "params": "\t", "info": "Restarts the daemon server", "fn": function(params) { core.emit("DAEMON_INIT_DAEMON", { "command": "restart", "params": params }); }}
						]);
					}).catch(function(err) {
						log("error", "Blackrock Daemon > Failed to register with CLI - CLI module not loaded", {}, "DAEMON_CLI_MOD_NOT_LOADED");
					});
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [1]) Listen to Start Endpoint
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listenToStart = function DaemonPipelineFnsListenToStart(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Daemon > [1a] Listener created for 'DAEMON_INIT_DAEMON' event", {}, "DAEMON_LISTENER_CREATED");
					core.on("DAEMON_INIT_DAEMON", function DaemonPipelineFns1ListenToStartStartDaemonCallback(daemonParams){
						core.stopActivation = true;
						log("debug", "Blackrock Daemon > [1b] 'DAEMON_INIT_DAEMON' Event Received", {}, "DAEMON_LISTENER_EVT_RECEIVED");
						evt.name = core.pkg().name;
						evt.isChildProcess = process.send;
						evt.command = daemonParams.command;
						if(!process.send) {  observer.next(evt); }
						else { log("fatal", "Blackrock Daemon > Initiated, but running in daemon mode. Terminating...", {}, "DAEMON_RUNNING_IN_DAEMON_MODE_TERM"); }
					});
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [2]) Check Daemon Name And Init Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkNameAndInit = function DaemonPipelineFnsCheckNameAndInit(evt){
		if(!evt.name){
			log("error", "Blackrock Daemon > Name not passed correctly to daemon module", {}, "DAEMON_INCORRECT_NAME");
			process.exit();
		}
		daemonize = require("./support/daemonize");
		var strippedName = evt.name.replace(/-/g, "");
		evt.daemon = daemonize.setup({
    		main: "../../../" + core.pkg().main,
    		name: strippedName,
    		pidfile: "/var/run/" + strippedName + ".pid",
    		cwd: process.cwd(),
    		silent: true
		});
		log("debug", "Blackrock Daemon > [2] Daemon Name Checked & Daemon Initialised", {}, "DAEMON_NAME_CHECKED_AND_INIT");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Daemon Callbacks
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupCallbacks = function DaemonPipelineFnsSetupCallbacks(evt){
		evt.daemon
		    .on("starting", function DaemonPipelineFnsSetupCallbacksOnStarting() {
		        console.log("Blackrock Daemon > Starting...\n");
		    })
		    .on("started", function DaemonPipelineFnsSetupCallbacksOnStarted(pid) {
		        console.log("Blackrock Daemon > Started. PID: " + pid + "\n");
		        process.exit();
		    })
		    .on("stopping", function DaemonPipelineFnsSetupCallbacksOnStopping() {
		        console.log("Blackrock Daemon > Stopping...\n");
		    })
		    .on("running", function DaemonPipelineFnsSetupCallbacksOnRunning(pid) {
		        console.log("Blackrock Daemon > Already running. PID: " + pid + "\n");
		        process.exit();
		    })
		    .on("notrunning", function DaemonPipelineFnsSetupCallbacksOnNotRunning() {
		        console.log("Blackrock Daemon > Not running\n");
		        process.exit();
		    })
		    .on("error", function DaemonPipelineFnsSetupCallbacksOnError(err) {
		        console.log("Blackrock Daemon > Failed to start:  " + err.message + "\n");
		        process.exit();
		    });
	    if(evt.command == "restart") {
		   	evt.daemon.on("stopped", function DaemonPipelineFnsSetupCallbacksOnStoppedForRestart(pid) {
		        console.log("Blackrock Daemon > Stopped\n");
		        evt.daemon.start();
		    });
	    } else {
    		evt.daemon.on("stopped", function DaemonPipelineFnsSetupCallbacksOnStopped(pid) {
		        console.log("Blackrock Daemon > Stopped\n");
		        process.exit();
		    });
	    }
	    log("debug", "Blackrock Daemon > [3] Setup callbacks for daemon", {}, "DAEMON_CALLBACKS_SETUP");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Check Root
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkRoot = function DaemonPipelineFnsCheckRoot(evt){
		if((evt.command == "start" || evt.command == "stop" || evt.command == "restart") && process.getuid() != 0) {
			console.log("Blackrock Daemon > Expected to run as root\n");
			process.exit();
			return;
		} else {
			return evt;
		}
	}

	/**
	 * (Internal > Stream Methods [5]) Start Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.startDaemon = function DaemonPipelineFnsStartDaemon(evt){
		if(evt.command == "start") {
			evt.daemon.start();
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Stop Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.stopDaemon = function DaemonPipelineFnsStopDaemon(evt){
		if(evt.command == "stop") {
			evt.daemon.stop();
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Restart Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.restartDaemon = function DaemonPipelineFnsRestartDaemon(evt){
		if(evt.command == "restart") {
			var status = evt.daemon.status();
			if(status){ evt.daemon.stop(); } 
			else { evt.daemon.start(); }
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Status of Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.statusDaemon = function DaemonPipelineFnsStatusDaemon(evt){
		if(evt.command == "status") {
			if(evt.daemon.status()){
				console.log("Blackrock Daemon > Daemon is running\n");
				process.exit();
			} else {
				console.log("Blackrock Daemon > Daemon is not running\n");
				process.exit();
			}
		}
		return evt;
	}








	/**
	 * (Internal) Export The Module
	 */
	module.exports = init;
}();