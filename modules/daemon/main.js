/*!
* ISNode Blackrock Daemon Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {








	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
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
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Daemon"), log = isnode.module("logger").log, config = isnode.cfg();
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
	pipelines.setupDaemon = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
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
				stream1.subscribe(function(res) {
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
	streamFns.listenToStart = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					isnode.on("startDaemon", function(){
						evt.name = isnode.pkg().name;
						evt.isChildProcess = process.send;
						if(!process.send) { process.nextTick(function(){ observer.next(evt); }); }
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
	streamFns.checkNameAndInit = function(evt){
		if(!evt.name){
			log("startup", "Blackrock Daemon > Name not passed correctly to daemon module");
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
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Check Status
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkStatus = function(evt){
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
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Setup Daemon Callbacks
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupCallbacks = function(evt){
		evt.daemon
		    .on("starting", function() {
		        log("startup", "Blackrock Daemon > Starting...");
		    })
		    .on("started", function(pid) {
		        log("startup", "Blackrock Daemon > Started. PID: " + pid);
		        process.exit();
		    })
		    .on("stopping", function() {
		        log("startup", "Blackrock Daemon > Stopping...");
		    })
		    .on("running", function(pid) {
		        log("startup", "Blackrock Daemon > Already running. PID: " + pid);
		        process.exit();
		    })
		    .on("notrunning", function() {
		        log("startup", "Blackrock Daemon > Not running");
		        process.exit();
		    })
		    .on("error", function(err) {
		        log("startup", "Blackrock Daemon > Failed to start:  " + err.message);
		        process.exit();
		    });
	    if(evt.status == "restart") {
		   	evt.daemon.on("stopped", function(pid) {
		        log("startup", "Blackrock Daemon > Stopped");
		        evt.daemon.start();
		    });
	    } else {
    		evt.daemon.on("stopped", function(pid) {
		        log("startup", "Blackrock Daemon > Stopped");
		        process.exit();
		    });
	    }
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Check Root
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkRoot = function(evt){
		if((evt.status == "start" || evt.status == "stop" || evt.status == "restart") && process.getuid() != 0) {
			log("startup", "Blackrock Daemon > Expected to run as root");
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
	streamFns.startDaemon = function(evt){
		if(evt.status == "start")
			evt.daemon.start();
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Stop Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.stopDaemon = function(evt){
		if(evt.status == "stop")
			evt.daemon.stop();
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Restart Daemon
	 * @param {object} evt - The Request Event
	 */
	streamFns.restartDaemon = function(evt){
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
	streamFns.statusDaemon = function(evt){
		if(evt.status == "status") {
			if(evt.daemon.status()){
				log("startup", "Blackrock Daemon > Daemon is running.");
				process.exit();
			} else {
				log("startup", "Blackrock Daemon > Daemon is not running.");
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