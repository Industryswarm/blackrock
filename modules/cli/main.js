/*!
* ISNode Blackrock CLI Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("CLI"), log = isnode.module("logger").log;
		start();
		return ismod;
	}

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
					console.log("  start daemon			Starts the daemon server");
				}
				console.log("  start console			Starts a non-interactive console server (blocking)");
				if(isnode.module("daemon")){
					console.log("  stop 				Stops the daemon server");
					console.log("  stop daemon			Stops the daemon server");
					console.log("  restart 			Restarts the daemon server");
					console.log("  restart daemon		Restarts the daemon server");
					console.log("  status	 		Shows the status of the daemon server");
					console.log("  status daemon			Shows the status of the daemon server");
				}
				console.log("\n\n");
				process.exit();
				return;
 			}

 			stream.pipe(

 				op.filter(function(evt) { 
					var endsWithAny = function(suffixes, string) { for (let suffix of suffixes) { if(string.endsWith(suffix)) return true; } return false; };
 					return !endsWithAny([
 							"sudo", "node", "nodemon", "forever", 
 							"npm", "pm2", "server.js", Object.keys(isnode.pkg().bin)[0]
 						], evt);
 				}),

 				op.reduce(function(acc, one) { return acc + " " + one }),

 			).subscribe(function(val) {
 				subRec = true;
 				var daemonOptions = ["start", "start daemon", "stop", "stop daemon", "restart", "restart daemon", "status", "status daemon"];
				if((val && daemonOptions.includes(val) && isnode.module("daemon")) || (isnode.cfg().cli && isnode.cfg().cli.mode && isnode.cfg().cli.mode == "daemon")) {
					isnode.emit("startDaemon");
					isnode.emit("loadDependencies");
				} else if (process.send || val == "start console" || (isnode.cfg().cli && isnode.cfg().cli.mode && isnode.cfg().cli.mode == "console")) {
					isnode.emit("loadDependencies");
				} else {
					showHelp();
				}
			  
			}).unsubscribe();

			setTimeout(function(){ if(!subRec) { showHelp(); } }, 1);

		});
	}

	/**
	 * (Internal) Export This Module
	 */
	module.exports = init;
}();