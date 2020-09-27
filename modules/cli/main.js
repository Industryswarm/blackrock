/*!
* ISNode Blackrock CLI Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/* ================================= *
	 * Initialise Core Module Variables: *
	 * ================================= */

	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log;






	/* ======================= *
	 * Initialise This Module: *
	 * ======================= */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){ 
		isnode = isnodeObj, ismod = new isnode.ISMod("CLI");
		setupExternalModuleMethods();
		log("debug", "Blackrock CLI > Initialising...");
		start(); 
		return ismod; 
	}






	/* ======================== *
	 * External Module Methods: *
	 * ======================== */

	/**
	 * (Internal) Setup External Module Methods
	 */
	var setupExternalModuleMethods = function(){ 

		// LOGGER MODULE (LOG METHOD):
		log = function(level, logMsg, attrObj) {
			var logger = isnode.module("logger");
			if(logger && logger.log) { logger.log(level, logMsg, attrObj); }
		}
		
	}











	/* ================ *
	 * Primary Methods: *
	 * ================ */

	/**
	 * (Internal) Initialises the CLI server interface module
	 * @param {object} params - An object of parameters
	 */
	var start = function(){
 		process.nextTick(function(){

 			const lib = isnode.lib, rx = lib.rxjs, op = lib.operators, stream = new rx.from(process.argv);
 			var subRec = false;

 			var showHelp = function() {
 				console.log("Usage: " + isnode.pkg().name + " [options]\n");
				console.log("Options: ");
				if(isnode.module("daemon")){
					console.log("  start				Starts the daemon server");
				}
				console.log("  start console			Starts a non-interactive console server (blocking)");
				if(isnode.module("daemon")){
					console.log("  stop 				Stops the daemon server");
					console.log("  restart 			Restarts the daemon server");
					console.log("  status	 		Shows the status of the daemon server");
				}
				console.log("\n\n");
				process.exit();
				return;
 			}

 			log("debug", "Blackrock CLI > Server Initialisation Pipeline Created - Executing Now:");

 			stream.pipe(

 				op.filter(function(evt) { 
					var endsWithAny = function(suffixes, string) { for (let suffix of suffixes) { if(string.endsWith(suffix)) return true; } return false; };
 					return !endsWithAny([
 							"sudo", "node", "nodemon", "forever", 
 							"npm", "pm2", "server.js", Object.keys(isnode.pkg().bin)[0]
 						], evt);
 				}),

 				op.map(function(evt) {
 					log("debug", "Blackrock CLI > [1] Command-Line Arguments Filtered");
 					return evt; 
 				}),

 				op.reduce(function(acc, one) { return acc + " " + one }),

  				op.map(function(evt) {
 					log("debug", "Blackrock CLI > [2] Remaining Arguments Reduced");
 					return evt; 
 				})

 			).subscribe(function(val) {
 				subRec = true;
 				var daemonOptions = ["start", "start daemon", "stop", "stop daemon", "restart", "restart daemon", "status", "status daemon"];
				if((val && daemonOptions.includes(val) && isnode.module("daemon")) || (isnode.cfg().cli && isnode.cfg().cli.mode && isnode.cfg().cli.mode == "daemon")) {
					log("debug", "Blackrock CLI > [3] Events sent to 'Start Daemon' and 'Load Dependencies'");
					isnode.emit("startDaemon");
					isnode.emit("loadDependencies");
				} else if (process.send || val == "start console" || (isnode.cfg().cli && isnode.cfg().cli.mode && isnode.cfg().cli.mode == "console")) {
					log("debug", "Blackrock CLI > [3] Event sent to 'Load Dependencies' (but not to 'Start Daemon')");
					isnode.emit("loadDependencies");
				} else {
					showHelp();
					log("debug", "Blackrock CLI > [3] No valid commands received - Displaying Command-Line Help");
				}
			  
			}).unsubscribe();

			setTimeout(function(){ if(!subRec) {
				showHelp(); 
				log("debug", "Blackrock CLI > [4] Timed Out Whilst Processing Command-Line Arguments - Displaying Command-Line Help");
			} }, 1);

		});
	}

	/**
	 * (Internal) Export This Module
	 */
	module.exports = init;
}();