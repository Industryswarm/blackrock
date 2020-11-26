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

	var core, mod, log, enableConsole, cliCommands = {};


	





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
		mod.register = register;
		log("debug", "Blackrock CLI > Initialising...", {}, "CLI_INIT");
		core.on("CORE_FINALISING", function(evt) { start(); });
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

		// LOGGER MODULE (ENABLE CONSOLE METHOD):
		enableConsole = function CoreEnableConsole() {
			var logger = core.module("logger");
			if(logger && logger.enableConsole) { logger.enableConsole(); }
		}
		
	}






	/* ==================== *
	 * Bind Module Methods: *
	 * ==================== */

	/**
	 * (External) Register CLI Commands
	 */
	var register = function CLIRegisterCommands(commands){ 
		if(typeof commands === 'object' && commands !== null && !Array.isArray(commands)) {
			cliCommands[commands.cmd] = commands;
		} else if(Array.isArray(commands)) {
			for (var i = 0; i < commands.length; i++) {
				cliCommands[commands[i].cmd] = commands[i];
			}
		}
		return true;
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

 			process.argv.push("terminator");
 			const lib = core.lib, rx = lib.rxjs, op = lib.operators, stream = new rx.from(process.argv);

 			var showHelp = function CLIShowHelp() {
 				core.stopActivation = true;
 				console.log("\n");
 				console.log("Usage: " + core.pkg().name + " [options]\n");
				console.log("Options: ");
				console.log("start console\t\t\t\tStarts the server in console mode")
				for (var cmd in cliCommands) {
					console.log(cmd + " " + cliCommands[cmd].params + "\t\t\t" + cliCommands[cmd].info);
				}
				console.log("\n");
				process.exit();
 			}

 			log("debug", "Blackrock CLI > Server Initialisation Pipeline Created - Executing Now:", {}, "CLI_EXEC_INIT_PIPELINE");

 			stream.pipe(

 				op.filter(function CLIStreamFn1Filter(evt) { 
 					String.prototype.endsWith = function CLIEndsWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
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
 				val = val.replace("terminator", "").trim();
 				setTimeout(function(){
 					var command;
 					for(var cmd in cliCommands) { if(val.startsWith(cmd)) { command = cmd; } }
					if (val == "start console" || core.globals.get("test") || process.send) {
						core.stopActivation = false;
						log("debug", "Blackrock CLI > [3] Start Console Called - Enabling Console and emitting CORE_START_INTERFACES", {}, "CLI_ENABLE_CONSOLE");
						setTimeout(function CLIEnableConsoleTimeout(){ enableConsole(); }, 50);
						core.emit("CORE_START_INTERFACES");
					} else if(cliCommands[command] && cliCommands[command].fn) {
						log("debug", "Blackrock CLI > [3] Registered CLI command being executed", { "cmd": val }, "CLI_EXECUTING_CLI_COMMAND");
						cliCommands[command].fn(val.slice(command.length));
					} else {
						showHelp();
						log("debug", "Blackrock CLI > [3] No valid commands received - Displaying Command-Line Help", {}, "CLI_NO_ARGS_SHOWING_HELP");
					}
				}, 5);
			  
			}).unsubscribe();

		});
	}

	/**
	 * (Internal) Export This Module
	 */
	module.exports = init;
}();