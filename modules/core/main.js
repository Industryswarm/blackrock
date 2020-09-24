/*!
* ISNode Blackrock Core Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {






	/* ================================= *
	 * Initialise Core Module Variables: *
	 * ================================= */
	 
	var basePath = __dirname + "/../..", modules = { interfaces: {} };
	var globals = {}, isnode, shuttingDown = false, fs = require("fs"), log;

	var displayConsoleBanner = function(){ 
		console.log(`\n\n\n
================================================================================================

                    *                   
              ,%%      ,%#              
          &%    /%%%%%%#    %%          
      %%    #%%%%%%%%%%%%%(     #%,     
  %%     %%%%%%%%%%%%%%%%           /%  
 %        %%%%%%%%%%%%%%%             %        IndustrySwarm
 %       #%%%%%%%%%%%%%%%%            %        Blackrock Application Server
 %  ,%% #%%%%%%%%%%%%%%%,*%%%     %&  %        Copyright 2020, Darren Smith.
 %  ,%%% %%%%%%%%%%%%# %%%%%%%%%%%%&  % 
 %  ,%%%%.%%%%%%%%# %%%%%%%%%%%%%%%&  %        Server Name:
 %  ,%%%%    (%% %%%%%%%%%%%%%%%%%%&  %        ` + package.name + " v" + package.version + `
 %  ,%%         %%%%%%%%%%%%%%%%%%%&  % 
 ##  %           %%%%%%%%%%%%%%%%%%  .% 
   %%           %%%%%%%%%%%%%%%    &%   
       %%     %%%%%%%%%%%%.    %%       
           .%#    %%%%    ,%(           
                %%    %%                 

------------------------------------------------------------------------------------------------\n
		`);
	}

	try { 
		var Base = require('./support/base'), config = require(basePath + '/../../config/config.json');
		var package = require(basePath + '/../../package.json'); 

	} catch (err) {
		console.log(err);
		var currentDate = new Date();
		currentDate = currentDate.toISOString();
		displayConsoleBanner();
		console.log(currentDate + "(fatal) Blackrock Core > Missing Critical System File - Terminating");
		process.exit();
	}










	/* ======================== *
	 * Define ISNode Prototype: *
	 * ======================== */

	var ISNode = new Base().extend({

		constructor: function(specName) { this.name = specName; this.status = "Inactive"; },

		init: function() {
			if(this.status != "Inactive") { return false; }
			this.status = "Starting";
			if(package && package.name && package.version) { displayConsoleBanner(); }
			modules.logger = {};
			modules.logger.log = log = function(level, message, data){
				if(config.logger.levels.includes(level)){
					var currentDate = new Date();
					currentDate = currentDate.toISOString();
					console.log(currentDate + " (" + level + ") " + message);
					if(data && config.logger.logMetadataObjects) { console.log(data); }
				}
			}
			modules.core = function(){};
			var self = this;
			if(config && config.loader && config.loader.startupModules && config.loader.startupModules.length > 0) { for (var i = 0; i < config.loader.startupModules.length; i++) { self.loadModule("module", config.loader.startupModules[i]); } }
			else { self.shutdown(); return; }
			self.on("loadDependencies", function(){
				if (process.stdin.isTTY) {
					var stdin = process.openStdin();
					stdin.setRawMode(true); 
					stdin.setEncoding('utf8');
					stdin.on('data', function(chunk) { if(chunk == "e") { self.shutdown(); } });
				}
				fs.readdirSync(basePath + "/modules").forEach(function(file) { 
					if(!modules[file]) { self.loadModule("module", file); } 
				});
				fs.readdirSync(basePath + "/interfaces").forEach(function(file) { 
					if(!modules.interfaces[file]) { self.loadModule("interface", file); } 
				});
				self.status = "Active";
			}); 
			var counter = 0;
			if(config.loader.timeouts.loadDependencies) { var timeout = config.loader.timeouts.loadDependencies; } else { var timeout = 5000; }
			var interval = setInterval(function(){
				if(self.status == "Active"){ clearInterval(interval); self.startEventLoop(); }
				if(counter >= timeout) { log("error","Blackrock Core > Timed out initiating startup. Terminating application server."); clearInterval(interval); self.shutdown(); }
				counter += 500;
			}, 500);
		},

		pkg: function () { return package; },

		cfg: function() { return config; },

		getBasePath: function() { return __dirname + "/../../../.."; },

		shutdown: function() {
			if(shuttingDown == true) { return; }
			log("shutdown","Blackrock Core > Initiating System Shutdown.");
			shuttingDown = true;
			this.closeModules(function(){ this.exitProcess(); });
			return;
		},

		module: function(name, type) {
			if(type && type == "interface"){ if(modules.interfaces[name]){ return modules.interfaces[name]; } else { return false; } }
			else if (name != "interface") { if(modules[name]) { return modules[name]; } else { return false; } } 
			else { return false; }
		},

		globals: {
			set: function(name, value) { if(!name) { return false; } globals[name] = value; return true; },
			get: function(name) { if(!globals[name]) { return false; } return globals[name]; }
		},

		startEventLoop: function() {
			if(shuttingDown == true){ 
				return;
			} else { 
				setTimeout(function(){ 
					if(!shuttingDown) { 
						log("startup","Blackrock Core > System Loaded, Event Loop Executing. Press 'e' key to shutdown."); 
					} 
				}, 1000); 
				setInterval(function(){}, 1000); 
			} 
		},

		loadModule: function(type, moduleName, cb){
			if(shuttingDown == true) { return; }
			if(moduleName.startsWith(".")) { return; }
			try {
				if(type == "module")
					modules[moduleName] = require(basePath + "/" + type + "s/" + moduleName + "/main.js")(isnode);
				else if (type == "interface")
					modules.interfaces[moduleName] = require(basePath + "/" + type + "s/" + moduleName + "/main.js")(isnode);
			} catch(err) {
				var error = { success: false, message: "Error Loading '" + moduleName + "' Module (Type: " + type + ")", error: err };
				log("debug", "Blackrock Core > " + error.message, error.error);
				if(cb) { cb(error, null); }
				return;
			}
			var output = { success: true, message: "'" + moduleName + "' Module (Type: " + type + ") Loaded Successfully" };
			log("debug", "Blackrock Core > " + output.message);
			if(cb) { cb(null,output); }
			return;
		},

		closeModules: function(cb) {
			var self = this;
			log("shutdown","Blackrock Core > Attempting to Close All Open Modules.");
			var modCount = 0, stdModCount = 0, interfaceModCount = 0, counter = 0, timeoutTimer = 0;
			if(config.loader.timeouts.closeModules) { var timeout = config.loader.timeouts.closeModules }
			else { var timeout = 2000; }
			Object.keys(modules).forEach(function(key) { stdModCount ++; });
			stdModCount = stdModCount - 1;
			Object.keys(modules.interfaces).forEach(function(key) { interfaceModCount ++; });
			modCount = stdModCount + interfaceModCount;
			var interval = setInterval(function(){
		    	if(counter >= (modCount - 1)) {
		    		if(log) { log("shutdown","Blackrock Core > Modules All Shutdown Successfully ("+counter+"/"+(modCount - 1)+")."); }
		    		else {
						var currentDate = new Date();
						currentDate = currentDate.toISOString();
						console.log(currentDate + "(shutdown) Blackrock Core > Modules All Shutdown Successfully ("+counter+"/"+(modCount - 1)+").");
		    		}
				    clearInterval(interval);
				    cb(null, {success:true, message: "Modules All Shutdown Successfully"});
				    return;	
		    	}
		    	if(timeoutTimer > timeout) {
		    		if(log) { log("shutdown","Blackrock Core > Module Shutdown Timed Out ("+counter+"/"+(modCount - 1)+" Closed Successfully)."); }
		    		else {
						var currentDate = new Date().toISOString();
						console.log(currentDate + "(shutdown) Blackrock Core > Module Shutdown Timed Out ("+counter+"/"+(modCount - 1)+" Closed Successfully).");
		    		}
		    		clearInterval(interval);
		    		cb({ message: "Module Shutdown Timed Out" }, null);
		    		return;
		    	}
		    	timeoutTimer += 500;
		    }, 500);
			process.nextTick(function(){
				self.on("module-shut-down", function(){ counter ++; });
				self.emit("shutdown", "Shutdown All Modules");
		    	return;
	    	});
		},

		exitProcess: function() { 
			var currentDate = new Date().toISOString(); 
			console.log(currentDate + " (shutdown) Blackrock Core > Shutdown Complete"); 
			process.exit(); 
		}

	});









	/* ================================ *
	 * Define ISMod (Module) Prototype: *
	 * ================================ */

	var ISMod = new ISNode().extend({

		constructor: function(specName) { 
			var self = this; 
			if(specName) { 
				self.name = specName; 
				self.uber.on("shutdown", function(){ 
					self.unload();
				}); 
			} 
		},

		unload: function() { 
			var self = this; 
			log("debug", self.name + " Module > Module Unloaded"); 
			self.uber.emit("module-shut-down", self.name); 
			delete self; 
		}

	});







	/* ========================================= *
	 * Define ISInterface (Interface) Prototype: *
	 * ========================================= */

	var ISInterface = new ISMod().extend({

		constructor: function(specName) { var self = this; self.name = specName; self.uber.uber.on("shutdown", function(){ self.unload() }); },
		instances: {},

		startInterfaces: function(){
			var self = this;
			process.nextTick(function(){
				var myName = self.name.toLowerCase();
				if(!isnode.cfg().interfaces || !isnode.cfg().interfaces[myName]) { log("debug", self.name + " Interface Module > No Interfaces Defined in System Configuration File."); return; }
				if(!isnode.cfg().router || !isnode.cfg().router.instances){ log("error", self.name + " Interface Module > Cannot start interfaces as there are no routers defined."); return; }
				for(var interface in isnode.cfg().interfaces[myName]) {
					var cfg = isnode.cfg().interfaces[myName][interface];
					if(self.instances[interface]){ log("error", self.name + " Interface Module > Attempting to load an interface that has already been loaded (" + interface + ")."); }
					else if (!cfg.enabled || cfg.enabled != true) { log("warning", self.name + " Interface Module > Attempting to load an interface that is not enabled in the system configuration (" + interface + ")."); } 
					else { self.startInterface(interface); }
				}
			});
		},

		get: function(name) {
			var self = this;
			if(!self.instances[name]) { return false; }
			else { return self.instances[name]; };
		},

		closeInterfaces: function(cb) {
			var totalInterfaces = 0, interfacesClosed = 0;
			for(var name in this.instances){ totalInterfaces ++; }
			for(var name in this.instances){ this.instances[name].server.close(function(err, res){ if(!err){ interfacesClosed ++; } }); }
			var counter = 0, timeout = 5000;
			var interval = setInterval(function(){
				if(interfacesClosed >= totalInterfaces){ clearInterval(interval); cb(true); return; };
				if(counter >= timeout){ clearInterval(interval); cb(false); return; };
				counter += 500;
			},500);
		},

		unload: function(){
			var self = this;
			self.closeInterfaces(function(){
				log("debug", self.name + " Interface > Closing interface instances... Succeeded.");
				self.uber.emit("module-shut-down", self.name);
				delete self;
			});
		}

	});















	/* ========================= *
	 * Instantiate Core Objects: *
	 * ========================= */

	isnode = new ISNode("Blackrock"), isnode.ISNode = ISNode;
	isnode.ISMod = ISMod, isnode.ISInterface = ISInterface, isnode.Base = Base, isnode.init();
	module.exports = isnode;

}();