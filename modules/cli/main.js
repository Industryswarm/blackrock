/*!
* Blackrock CLI Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function CLIWrapper(undefined) {

	/* ================================= *
	 * Initialise Core Module Variables: *
	 * ================================= */

	String.prototype.endsWith = function CLIEndsWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var core, mod, log;






	/* ======================= *
	 * Initialise This Module: *
	 * ======================= */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function CLIInit(coreObj) {
		core = coreObj, mod = new core.Mod("CLI");
		setupExternalModuleMethods();
		log("debug", "Blackrock CLI > Initialising...", {}, "CLI_INIT");
		start(); 
		return mod; 
	}






	/* ======================== *
	 * External Module Methods: *
	 * ======================== */

	/**
	 * (Internal) Setup External Module Methods
	 */
	var setupExternalModuleMethods = function CLISetupExternalModuleMethods(){ 

		// LOGGER MODULE (LOG METHOD):
		log = function CLILog(level, logMsg, attrObj, evtName) {
			var logger = core.module("logger");
			if(logger && logger.log) { logger.log(level, logMsg, attrObj, evtName); }
		}
		
	}











	/* ================ *
	 * Primary Methods: *
	 * ================ */

	/**
	 * (Internal) Initialises the CLI server interface module
	 * @param {object} params - An object of parameters
	 */
	var start = function CLIStart(){
 		process.nextTick(function CLIStartNextTickCallback(){

 			const lib = core.lib, rx = lib.rxjs, op = lib.operators, stream = new rx.from(process.argv);
 			var subRec = false;

 			var showHelp = function CLIShowHelp() {
 				var servicesAvailable = true;
 				console.log("Usage: " + core.pkg().name + " [options]\n");
				console.log("Options: ");
				console.log("  config			Starts Server Configuration Flow");
				if(core.module("daemon") && servicesAvailable){
					console.log("  start				Starts the daemon server");
				}
				if(servicesAvailable){
					console.log("  start console			Starts a non-interactive console server (blocking)");
				}
				if(core.module("daemon") && servicesAvailable){
					console.log("  stop 				Stops the daemon server");
					console.log("  restart 			Restarts the daemon server");
					console.log("  status	 		Shows the status of the daemon server");
				}
				console.log("\n\n");
				process.exit();
				return;
 			}

 			log("debug", "Blackrock CLI > Server Initialisation Pipeline Created - Executing Now:", {}, "CLI_EXEC_INIT_PIPELINE");

 			stream.pipe(

 				op.filter(function CLIStreamFn1Filter(evt) { 
					var endsWithAny = function CLIEndsWithAny(suffixes, string) { for (let suffix of suffixes) { if(string.endsWith(suffix)) return true; } return false; };
 					return !endsWithAny([
 							"sudo", "node", "nodemon", "forever", "blackrock", "index.js",
 							"npm", "pm2", "server.js", Object.keys(core.pkg().bin)[0]
 						], evt);
 				}),

 				op.map(function CLIStreamFn2Map(evt) {
 					log("debug", "Blackrock CLI > [1] Command-Line Arguments Filtered", {}, "CLI_ARGS_FILTERED");
 					return evt; 
 				}),

 				op.reduce(function CLIStreamFn3Reduce(acc, one) { return acc + " " + one }),

  				op.map(function CLIStreamFn4Map(evt) {
 					log("debug", "Blackrock CLI > [2] Remaining Arguments Reduced", {}, "CLI_ARGS_REDUCED");
 					return evt; 
 				})

 			).subscribe(function CLISubscribeCallback(val) {
 				subRec = true;
 				var daemonOptions = ["start", "start daemon", "stop", "stop daemon", "restart", "restart daemon", "status", "status daemon"];
				if(((val && daemonOptions.includes(val) && core.module("daemon")) || (core.cfg().cli && core.cfg().cli.mode && core.cfg().cli.mode == "daemon")) && !process.send) {
					log("debug", "Blackrock CLI > [3] Event sent to 'Start Daemon'", {}, "CLI_EVTS_DAEMON_DEP");
					core.emit("startDaemon");
				} else if (process.send || val == "start console" || core.globals.get("test") || (core.cfg().cli && core.cfg().cli.mode && core.cfg().cli.mode == "console")) {
					log("debug", "Blackrock CLI > [3] Event sent to 'Load Dependencies'", {}, "CLI_EVTS_DEP");
					core.emit("loadDependencies");
				} else {
					showHelp();
					log("debug", "Blackrock CLI > [3] No valid commands received - Displaying Command-Line Help", {}, "CLI_NO_ARGS_SHOWING_HELP");
				}
			  
			}).unsubscribe();

			setTimeout(function CLIHelpTimeoutCallback(){ if(!subRec) {
				showHelp(); 
				log("debug", "Blackrock CLI > [4] Timed Out Whilst Processing Command-Line Arguments - Displaying Command-Line Help", {}, "CLI_TIMEOUT_SHOWING_HELP");
			} }, 1);

		});
	}

	/**
	 * (Internal) Export This Module
	 */
	module.exports = init;
}();