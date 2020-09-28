/*!
* ISNode Blackrock Daemon Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function DaemonWrapper(undefined) {








	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function DaemonEndsWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log, config, daemonize, daemon = false, restartingDaemon = false, pipelines = {}, streamFns = {}, lib, rx, op, Observable;








	/**
	 * =============================
	 * Daemon Initialisation Methods
	 * =============================
	 */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function DaemonInit(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Daemon"), log = isnode.module("logger").log, config = isnode.cfg();
		isnode.on("updateLogFn", function(){ log = isnode.module("logger").log });
		log("debug", "Blackrock Daemon > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var ISPipeline = pipelines.setupDaemon();
		new ISPipeline({}).pipe();
		return ismod;
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
		return new isnode.ISNode().extend({
			constructor: function DaemonSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function DaemonSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function DaemonSetupPipelinePipe() {
				log("debug", "Blackrock Daemon > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					streamFns.listenToStart,
					op.map(evt => { if(evt) return streamFns.checkNameAndInit(evt); }),
					op.map(evt => { if(evt) return streamFns.checkStatus(evt); }),
					op.map(evt => { if(evt) return streamFns.setupCallbacks(evt); }),
					op.map(evt => { if(evt) return streamFns.checkRoot(evt); }),
					op.map(evt => { if(evt) return streamFns.startDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.stopDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.restartDaemon(evt); }),
					op.map(evt => { if(evt) return streamFns.statusDaemon(evt); })
					
				);
				stream1.subscribe(function DaemonSetupPipelineSubscribeCallback(res) {
					//console.log(res);
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
	 * (Internal > Stream Methods [1]) Listen to Start Endpoint
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listenToStart = function DaemonPipelineFnsListenToStart(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Daemon > [1a] Listener created for 'startDaemon' event");
					isnode.on("startDaemon", function DaemonPipelineFns1ListenToStartStartDaemonCallback(){
						log("debug", "Blackrock Daemon > [1b] 'startDaemon' Event Received");
						evt.name = isnode.pkg().name;
						evt.isChildProcess = process.send;
						if(!process.send) {  observer.next(evt); }
						else { log("fatal", "Blackrock Daemon > Initiated, but running in daemon mode. Terminating..."); }
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
			log("error", "Blackrock Daemon > Name not passed correctly to daemon module");
			process.exit();
		}
		daemonize = require("./support/daemonize");
		var strippedName = evt.name.replace(/-/g, "");
		evt.daemon = daemonize.setup({
    		main: "../../../server.js",
    		name: strippedName,
    		pidfile: "/var/run/" + strippedName + ".pid",
    		cwd: process.cwd(),
    		silent: true
		});
		log("debug", "Blackrock Daemon > [2] Daemon Name Checked & Daemon Initialised");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Check Status
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkStatus = function DaemonPipelineFnsCheckStatus(evt){
		evt.status = "";
		if(process.argv[0].endsWith("sudo") && process.argv[1].endsWith("node")) { var i = 3 }
		else if (process.argv[0].endsWith("sudo") && !process.argv[1].endsWith("node")) { var i = 2 }
		else if (process.argv[0].endsWith("node")) { var i = 2 }
		else { var i = 1 }
		if((((process.argv[i] == "start" && process.argv[i+1] == "daemon") || (process.argv[i] == "start" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon")) || ((process.argv[i] == "stop" && process.argv[i+1] == "daemon") || (process.argv[i] == "stop" && !process.argv[i+1]))) && !evt.isChildProcess){
			if ((process.argv[i] == "start" && process.argv[i+1] == "daemon") || (process.argv[i] == "start" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon" && !evt.daemon.status())) {
				evt.status = "start";
			} else if ((process.argv[i] == "stop" && process.argv[i+1] == "daemon") || (process.argv[i] == "stop" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon" && evt.daemon.status())) {
				evt.status = "stop";
			}
		} else if ((process.argv[i] == "status" && process.argv[i+1] == "daemon") || (process.argv[i] == "status" && !process.argv[i+1])) {
			evt.status = "status";
		} else if (((process.argv[i] == "restart" && process.argv[i+1] == "daemon") || (process.argv[i] == "restart" && !process.argv[i+1]))  && !evt.isChildProcess) {
			evt.status = "restart";
		} else {
			log("fatal", "Daemon received invalid command. Terminating application.");
			process.exit();
			return;
		}
		log("debug", "Blackrock Daemon > [3] Status Calculated From Command-Line Arguments");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Setup Daemon Callbacks
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
	    if(evt.status == "restart") {
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
	    log("debug", "Blackrock Daemon > [4] Setup callbacks for daemon");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Check Root
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkRoot = function DaemonPipelineFnsCheckRoot(evt){
		if((evt.status == "start" || evt.status == "stop" || evt.status == "restart") && process.getuid() != 0) {
			console.log("Blackrock Daemon > Expected to run as root\n");
			process.exit();
			return;
		} else {
			return evt;
		}
	}

	/**
	 * (Internal > Stream Methods [6]) Start Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.startDaemon = function DaemonPipelineFnsStartDaemon(evt){
		if(evt.status == "start") {
			evt.daemon.start();
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Stop Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.stopDaemon = function DaemonPipelineFnsStopDaemon(evt){
		if(evt.status == "stop") {
			evt.daemon.stop();
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Restart Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.restartDaemon = function DaemonPipelineFnsRestartDaemon(evt){
		if(evt.status == "restart") {
			var status = evt.daemon.status();
			if(status){ evt.daemon.stop(); } 
			else { evt.daemon.start(); }
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Status of Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.statusDaemon = function DaemonPipelineFnsStatusDaemon(evt){
		if(evt.status == "status") {
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