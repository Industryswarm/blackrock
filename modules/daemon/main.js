/*!
* ISNode Blackrock Daemon Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log, daemonize, daemon = false, restartingDaemon = false;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Daemon"), log = isnode.module("logger").log;
		setup();
		return ismod;
	}

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var setup = function(){
		daemonize = require("./support/daemonize");
		isnode.on("startDaemon", function(){
			if(!process.send) {
				run({name: isnode.pkg().name, isChildProcess: process.send});
			} else {
				log("fatal", "Daemon Initiated, but running in daemon mode. Terminating...");
			}
		});
	}

	/**
	 * (Internal) Checks whether the user executing the service is trying to
	 * start or stop the daemon, or check its status and executes the relevent action
	 * @param {object} params - An object of parameters
	 */
	var run = function(params){
		process.nextTick(function(){
			var strippedName = params.name.replace(/-/g, "");
			if(!params.name){
				log("startup", "Name not passed correctly to daemon module");
				process.exit();
			}
			daemon = daemonize.setup({
	    		main: "../../../server.js",
	    		name: strippedName,
	    		pidfile: "/var/run/" + strippedName + ".pid",
	    		cwd: process.cwd(),
	    		silent: true
			});
			if(process.argv[0].endsWith("sudo") && process.argv[1].endsWith("node")) { var i = 3 }
			else if (process.argv[0].endsWith("sudo") && !process.argv[1].endsWith("node")) { var i = 2 }
			else if (process.argv[0].endsWith("node")) { var i = 2 }
			else { var i = 1 }
			if((((process.argv[i] == "start" && process.argv[i+1] == "daemon") || (process.argv[i] == "start" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon")) || ((process.argv[i] == "stop" && process.argv[i+1] == "daemon") || (process.argv[i] == "stop" && !process.argv[i+1]))) && !params.isChildProcess){
				if (process.getuid() != 0) {
				    log("startup", "Daemon is expected to run as root");
				    process.exit();
				    return false;
				}
				daemon
				    .on("starting", function() {
				        log("startup", "Starting daemon...");
				    })
				    .on("started", function(pid) {
				        log("startup", "Daemon started. PID: " + pid);
				        process.exit();
				    })
				    .on("stopping", function() {
				        log("startup", "Stopping daemon...");
				    })
				    .on("stopped", function(pid) {
				        log("startup", "Daemon stopped.");
				        process.exit();
				    })
				    .on("running", function(pid) {
				        log("startup", "Daemon already running. PID: " + pid);
				        process.exit();
				    })
				    .on("notrunning", function() {
				        log("startup", "Daemon is not running");
				        process.exit();
				    })
				    .on("error", function(err) {
				        log("startup", "Daemon failed to start:  " + err.message);
				        process.exit();
				    });
				if ((process.argv[i] == "start" && process.argv[i+1] == "daemon") || (process.argv[i] == "start" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon" && !daemon.status())) {
					daemon.start();
				} else if ((process.argv[i] == "stop" && process.argv[i+1] == "daemon") || (process.argv[i] == "stop" && !process.argv[i+1]) || (config.cli && config.cli.mode && config.cli.mode == "daemon" && daemon.status())) {
					daemon.stop();
				}
				return true;
			} else if ((process.argv[i] == "status" && process.argv[i+1] == "daemon") || (process.argv[i] == "status" && !process.argv[i+1])) {
				var status = daemon.status();
				if(status){
					log("startup", "Daemon is running.");
					process.exit();
				} else {
					log("startup", "Daemon is not running.");
					process.exit();
				}
				return true;
			} else if (((process.argv[i] == "restart" && process.argv[i+1] == "daemon") || (process.argv[i] == "restart" && !process.argv[i+1]))  && !params.isChildProcess) {
				if (process.getuid() != 0) {
				    log("startup", "Daemon is expected to run as root");
				    process.exit();
				    return false;
				}
				var status = daemon.status();
				daemon
				    .on("starting", function() {
				        log("startup", "Starting daemon...");
				    })
				    .on("started", function(pid) {
				        log("startup", "Daemon started. PID: " + pid);
				        process.exit();
				    })
				    .on("stopping", function() {
				        log("startup", "Stopping daemon...");
				    })
				    .on("stopped", function(pid) {
				        log("startup", "Daemon stopped.");
				        daemon.start();
				    })
				    .on("running", function(pid) {
				        log("startup", "Daemon already running. PID: " + pid);
				        process.exit();
				    })
				    .on("notrunning", function() {
				        log("startup", "Daemon is not running");
				        process.exit();
				    })
				    .on("error", function(err) {
				        log("startup", "Daemon failed to start:  " + err.message);
				        process.exit();
				    });
				if(status){
					daemon.stop();
				} else {
					daemon.start();
				}
			} else {
				log("fatal", "Daemon received invalid command. Terminating application.");
				process.exit();
				return false;
			}
		});		
	}

	/**
	 * (Internal) Export The Module
	 */
	module.exports = init;
}();