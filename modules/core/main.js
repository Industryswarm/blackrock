/*!
* ISNode Blackrock Core Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function CoreWrapper(undefined) {






	/* ================================= *
	 * Initialise Core Module Variables: *
	 * ================================= */
	 
	var isnode, modules = { interfaces: {} }, globals = {};
	var log, enableConsole, config, package;

	var displayConsoleBanner = function CoreDisplayConsoleBanner() { 
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
 %  ,%%%%    (%% %%%%%%%%%%%%%%%%%%&  %        ` + package.name + ` v` + package.version + `
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
		var Base = require('./support/base');
	} catch (err) {
		console.log(err);
		var currentDate = new Date();
		currentDate = currentDate.toISOString();
		console.log(currentDate + "(fatal) Blackrock Core > Missing Critical System File - Terminating");
		process.exit();
	}









	/* ======================== *
	 * External Module Methods: *
	 * ======================== */

	/**
	 * (Internal) Setup External Module Methods
	 */
	var setupExternalModuleMethods = function CoreSetupExternalModuleMethods(isnode){ 

		// LOGGER MODULE (LOG METHOD):
		log = function CoreLog(level, logMsg, attrObj) {
			var logger = isnode.module("logger");
			if(logger && logger.log) { logger.log(level, logMsg, attrObj); }
		}

		// LOGGER MODULE (ENABLE CONSOLE METHOD):
		enableConsole = function CoreEnableConsole() {
			var logger = isnode.module("logger");
			if(logger && logger.enableConsole) { logger.enableConsole(); }
		}
		
	}










	/* ======================== *
	 * Define ISNode Prototype: *
	 * ======================== */

	var ISNode = new Base().extend({

		constructor: function CoreISNodeConstructor(specName) { 
			this.name = specName; 
			this.status = "Inactive"; 
		},

		init: function CoreISNodeInit(initialConfig) {
			var self = this;
			if(initialConfig && initialConfig.silent) { self.globals.set("silent", true); }
			if(initialConfig && initialConfig.test) { self.globals.set("test", true); }
			if(!initialConfig || !initialConfig.config) { config = require('../../../../config/config.json'); }
			else { config = initialConfig.config; }
			if(!initialConfig || !initialConfig.package) { package = require('../../../../package.json'); }
			else { package = initialConfig.package; }
			if(!config) { self.status = "Error"; self.reason = "No config provided"; return self; }
			if(!config.core) { self.status = "Error"; self.reason = "No core module section in config provided"; return self; }
			if(!config.core.modules) { self.status = "Error"; self.reason = "No modules listed in config"; return self; }
			if(!config.core.startupModules) { self.status = "Error"; self.reason = "No startup modules listed in config"; return self; }
			if(!config.core.timeouts) { self.status = "Error"; self.reason = "No timeouts listed in config"; return self; }
			if(!config.core.timeouts.loadDependencies) { self.status = "Error"; self.reason = "No loadDependencies timeout listed in config"; return self; }
			if(!config.core.timeouts.closeModules) { self.status = "Error"; self.reason = "No closeModules timeout listed in config"; return self; }
			modules.core = self;
			if(self.status != "Inactive" || self.status == "Error") { return self; }
			self.status = "Starting";
			if(package && package.name && package.version && ((initialConfig && !initialConfig.silent) || !initialConfig)) { displayConsoleBanner(); }
			setupExternalModuleMethods(self);
			if(config && config.core && config.core.startupModules && config.core.startupModules.length > 0) { for (var i = 0; i < config.core.startupModules.length; i++) { self.loadModule("module", config.core.startupModules[i]); } }
			else { self.shutdown(); return; }
			setTimeout(function CoreISNodeEnableConsoleTimeout(){ enableConsole(); }, 50);
			self.on("loadDependencies", function CoreISNodeLoadDependenciesCallback(){
				if (process.stdin.isTTY) {
					var stdin = process.openStdin();
					stdin.setRawMode(true); 
					stdin.setEncoding('utf8');
					stdin.on('data', function(chunk) { if(chunk == "e") { self.shutdown(); } });
				}
				var fs = require("fs");
				fs.readdirSync(self.getBasePath("two") + "/modules").forEach(function CoreISNodeLoadModulesReadDirCallback(file) { 
					if(!modules[file]) { self.loadModule("module", file); } 
				});
				fs.readdirSync(self.getBasePath("two") + "/interfaces").forEach(function CoreISNodeLoadInterfacesReadDirCallback(file) { 
					if(!modules.interfaces[file]) { self.loadModule("interface", file); } 
				});
				self.status = "Active";
			}); 
			var counter = 0;
			if(config.core.timeouts.loadDependencies) { var timeout = config.core.timeouts.loadDependencies; } else { var timeout = 5000; }
			var interval = setInterval(function CoreISNodeDependencyLoadIntervalCallback(){
				enableConsole();
				if(self.status == "Active"){ clearInterval(interval); self.startEventLoop(); }
				if(counter >= timeout) { 
					var currentDate = new Date().toISOString(); 
					var err = currentDate + " Blackrock Core > Timed out initiating startup. Terminating application server.";
					log("error", err);
					clearInterval(interval); 
					self.shutdown(); 
				}
				counter += 500;
			}, 500);
			return self;
		},

		pkg: function CoreISNodePkg() { return package; },

		cfg: function CoreISNodeCfg() { return config; },

		getBasePath: function CoreISNodeGetBasePath(type) { 
			if(type == "four" || !type)
				return __dirname + "/../../../..";
			else
				return __dirname + "/../..";
		},

		shutdown: function CoreISNodeShutdown() {
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated") { return; }
			log("shutdown","Blackrock Core > Initiating System Shutdown.");
			self.status == "Shutting Down";
			self.closeModules(function CoreISNodeCloseModulesCallback(){ self.exitProcess(); });
			return;
		},

		module: function CoreISNodeGetModule(name, type) {
			if(type && type == "interface") { if(modules.interfaces[name]){ return modules.interfaces[name]; } else { return; } }
			else if (name != "interface") { if(modules[name]) { return modules[name]; } else { return; } } 
			else { return; }
		},

		moduleCount: function CoreISNodeModuleCount(type) {
			if(type && type == "interfaces") { 
				return Object.keys(modules.interfaces).length;
			} else if(type && type == "modules") { 
				return Object.keys(modules).length - 1; 
			} else { 
				return 0; 
			}
		},

		globals: {
			set: function CoreIsNodeSetGlobal(name, value) { if(!name) { return false; } globals[name] = value; return true; },
			get: function CoreISNodeGetGlobal(name) { if(!globals[name]) { return; } return globals[name]; }
		},

		startEventLoop: function CoreISNodeStartEventLoop() {
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated"){ return; }
			else {
				setTimeout(function CoreISNodeStartLoopTimeout(){ 
					if(!self.status == "Shutting Down" && !self.status == "Terminated") { 
						log("startup","Blackrock Core > System Loaded, Event Loop Executing. Press 'e' key to shutdown."); 
					} 
				}, 1000); 
				setInterval(function CoreISNodeStartLoopInterval(){}, 1000); 
			} 
		},

		loadModule: function CoreISNodeLoadModule(type, moduleName, cb){
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated") { return; }
			if(type == "module" && config.core.modules && config.core.modules.length > 0 && !config.core.modules.includes(moduleName)) { return; }
			if(type == "interface" && config.core.interfaces && config.core.interfaces.length > 0 && !config.core.interfaces.includes(moduleName)) { return; }
			if(moduleName.startsWith(".")) { return; }
			try {
				if(type == "module")
					modules[moduleName] = require(self.getBasePath("two") + "/" + type + "s/" + moduleName + "/main.js")(isnode);
				else if (type == "interface")
					modules.interfaces[moduleName] = require(self.getBasePath("two") + "/" + type + "s/" + moduleName + "/main.js")(isnode);
			} catch(err) {
				var error = { success: false, message: "Error Loading '" + moduleName + "' Module (Type: " + type + ")", error: err };
				log("debug", "Blackrock Core > " + error.message, error.error);
				if(cb) { cb(error, null); }
				return error;
			}
			var output = { success: true, message: "'" + moduleName + "' Module (Type: " + type + ") Loaded Successfully", module: modules[moduleName] };
			log("debug", "Blackrock Core > " + output.message);
			if(cb) { cb(null,output); }
			return output;
		},

		closeModules: function CoreISNodeCloseModules(cb) {
			var self = this;
			log("shutdown","Blackrock Core > Attempting to Close All Open Modules.");
			var modCount = 0, stdModCount = 0, interfaceModCount = 0, counter = 0, timeoutTimer = 0;
			if(config.core.timeouts.closeModules) { var timeout = config.core.timeouts.closeModules }
			else { var timeout = 2000; }
			Object.keys(modules).forEach(function CoreISNodeCloseModulesModForEachCallback(key) { stdModCount ++; });
			stdModCount = stdModCount - 1;
			Object.keys(modules.interfaces).forEach(function CoreISNodeCloseModulesIntForEachCallback(key) { interfaceModCount ++; });
			modCount = stdModCount + interfaceModCount;
			var interval = setInterval(function CoreISNodeCloseModulesIntervalCallback(){
		    	if(counter >= (modCount - 1)) {
		    		log("shutdown","Blackrock Core > Modules All Shutdown Successfully ("+counter+"/"+(modCount - 1)+").");
				    clearInterval(interval);
				    cb(null, {success:true, message: "Modules All Shutdown Successfully"});
				    return;	
		    	}
		    	if(timeoutTimer > timeout) {
		    		log("shutdown","Blackrock Core > Module Shutdown Timed Out ("+counter+"/"+(modCount - 1)+" Closed Successfully).");
		    		clearInterval(interval);
		    		cb({ message: "Module Shutdown Timed Out" }, null);
		    		return;
		    	}
		    	timeoutTimer += 500;
		    }, 500);
			process.nextTick(function CoreISNodeCloseModulesNextTickCallback(){
				self.on("module-shut-down", function CoreISNodeCloseModulesOnModShutdownCallback(){ counter ++; });
				self.emit("shutdown", "All Modules Have Been Terminated");
		    	return;
	    	});
		},

		exitProcess: function CoreISNodeExitProcess() { 
			var currentDate = new Date().toISOString(); 
			if(!isnode.globals.get("silent")) { console.log(currentDate + " (shutdown) Blackrock Core > Shutdown Complete"); }
			process.exit(); 
		}

	});









	/* ================================ *
	 * Define ISMod (Module) Prototype: *
	 * ================================ */

	var ISMod = new ISNode().extend({

		constructor: function CoreISModConstructor(specName) { 
			var self = this; 
			if(specName) { 
				self.name = specName; 
				self.uber.on("shutdown", function CoreISModConstructorOnShutdownCallback(){ 
					self.unload();
				}); 
			} 
		},

		unload: function CoreISModUnload() { 
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

		constructor: function CoreISInterfaceConstructor(specName) { var self = this; self.name = specName; self.uber.uber.on("shutdown", function(){ self.unload() }); },
		
		instances: {},

		startInterfaces: function CoreISInterfaceStartInterfaces(){
			var self = this;
			process.nextTick(function CoreISInterfaceStartInterfacesNextTickCallback(){
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

		get: function CoreISInterfaceGetInstance(name) {
			var self = this;
			if(!self.instances[name]) { return false; }
			else { return self.instances[name]; };
		},

		closeInterfaces: function CoreISInterfaceCloseInterfaces(cb) {
			var totalInterfaces = 0, interfacesClosed = 0;
			for(var name in this.instances){ totalInterfaces ++; }
			for(var name in this.instances){ this.instances[name].server.close(function(err, res){ if(!err){ interfacesClosed ++; } }); }
			var counter = 0, timeout = 5000;
			var interval = setInterval(function CoreISInterfaceCloseInterfacesTimeout(){
				if(interfacesClosed >= totalInterfaces){ clearInterval(interval); cb(true); return; };
				if(counter >= timeout){ clearInterval(interval); cb(false); return; };
				counter += 500;
			},500);
		},

		unload: function CoreISInterfaceUnload(){
			var self = this;
			self.closeInterfaces(function CoreISInterfaceUnloadCloseInterfacesCallback(){
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
	isnode.ISMod = ISMod, isnode.ISInterface = ISInterface, isnode.Base = Base;
	module.exports = isnode;

}();