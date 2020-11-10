/*!
* Blackrock Core Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function CoreWrapper(undefined) {






	/* ================================= *
	 * Initialise Core Module Variables: *
	 * ================================= */
	 
	var core, modules = { interfaces: {} }, globals = {};
	var log, enableConsole, config, package;

	var displayConsoleBanner = function CoreDisplayConsoleBanner(displayCore) { 
		var alertLineOne = "", alertLineTwo = "";
		if(displayCore.status == "Error") { var alertLineOne = "Error Initialising:", alertLineTwo = displayCore.reason; }
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
 ##  %           %%%%%%%%%%%%%%%%%%  .%        ` + alertLineOne + `
   %%           %%%%%%%%%%%%%%%    &%          ` + alertLineTwo + `
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
		console.log(currentDate + "(fatal) Blackrock Core > Missing Critical System File (./support/base) - Terminating");
		process.exit();
	}









	/* ======================== *
	 * External Module Methods: *
	 * ======================== */

	/**
	 * (Internal) Setup External Module Methods
	 */
	var setupExternalModuleMethods = function CoreSetupExternalModuleMethods(core){ 

		// LOGGER MODULE (LOG METHOD):
		log = function CoreLog(level, logMsg, attrObj, evtName) {
			var logger = core.module("logger");
			if(logger && logger.log) { logger.log(level, logMsg, attrObj, evtName); }
		}

		// LOGGER MODULE (ENABLE CONSOLE METHOD):
		enableConsole = function CoreEnableConsole() {
			var logger = core.module("logger");
			if(logger && logger.enableConsole) { logger.enableConsole(); }
		}
		
	}










	/* ======================== *
	 * Define Core Prototype: *
	 * ======================== */

	var Core = new Base().extend({

		constructor: function CoreConstructor(specName) { 
			this.name = specName; 
			this.status = "Inactive"; 
			this.reason = "";
		},

		init: function CoreInit(initialConfig, callbackFn) {
			var self = this;
			var myPromise = new Promise(function(resolve, reject) {
				if(initialConfig && initialConfig.silent) { self.globals.set("silent", true); }
				if(initialConfig && initialConfig.test) { self.globals.set("test", true); }
				if(!initialConfig || !initialConfig.config) { try { config = require('../../../../config/config.json'); } catch(err) {} }
				else if (initialConfig.config) { config = initialConfig.config; }
				if(!initialConfig || !initialConfig.package) { try { package = require('../../../../package.json'); } catch(err) {} }
				else if (initialConfig.package) { package = initialConfig.package; }
				var resolvePromise = function CoreResolvePromise(){
					if(callbackFn) { callbackFn(self); } 
					if(self.status == "Error") { reject(core) }
					else if (self.status == "Active") { resolve(core) }
					setTimeout(function(){
						const welcomeMsg = { "welcome": "Blackrock Application Server", "name": package.name, "version": package.version, "status": self.status, "reason": self.reason };
						core.emit("log", welcomeMsg);
						core.emit("Blackrock Core", welcomeMsg);
						core.emit("CORE_WELCOME", welcomeMsg);
					}, 10);
				}
				if(!package) { self.status = "Error"; self.reason = "No package provided";  }
				if(!config) { self.status = "Error"; self.reason = "No config provided"; }
				if(config && !config.core) { self.status = "Error"; self.reason = "No core module section in config provided"; }
				if(config && config.core && !config.core.modules) { self.status = "Error"; self.reason = "No modules listed in config"; }
				if(config && config.core && !config.core.startupModules) { self.status = "Error"; self.reason = "No startup modules listed in config"; }
				if(config && config.core && !config.core.timeouts) { self.status = "Error"; self.reason = "No timeouts listed in config"; }
				if(config && config.core && config.core.timeouts && !config.core.timeouts.loadDependencies) { self.status = "Error"; self.reason = "No loadDependencies timeout listed in config"; }
				if(config && config.core && config.core.timeouts && !config.core.timeouts.closeModules) { self.status = "Error"; self.reason = "No closeModules timeout listed in config"; }
				modules.core = self;
				if(!package) { package.name = "Unknown"; package.version = "Unknown"; }
				if((initialConfig && !initialConfig.silent) || !initialConfig) { displayConsoleBanner(self); }
				if(self.status != "Inactive" || self.status == "Error") { resolvePromise(); return; }
				self.status = "Starting";
				setupExternalModuleMethods(self);
				if(config && config.core && config.core.startupModules && config.core.startupModules.length > 0) { for (var i = 0; i < config.core.startupModules.length; i++) { self.loadModule("module", config.core.startupModules[i]); } }
				else { self.shutdown(); return; }
				setTimeout(function CoreEnableConsoleTimeout(){ enableConsole(); }, 50);
				self.on("loadDependencies", function CoreLoadDependenciesCallback(){
					if (process.stdin.isTTY) {
						var stdin = process.openStdin();
						stdin.setRawMode(true); 
						stdin.setEncoding('utf8');
						stdin.on('data', function(chunk) { if(chunk == "e") { self.shutdown(); } });
					}
					var fs = require("fs");
					fs.readdirSync(self.getBasePath("two") + "/modules").forEach(function CoreLoadModulesReadDirCallback(file) { 
						if(!modules[file]) { self.loadModule("module", file); } 
					});
					fs.readdirSync(self.getBasePath("two") + "/interfaces").forEach(function CoreLoadInterfacesReadDirCallback(file) { 
						if(!modules.interfaces[file]) { self.loadModule("interface", file); } 
					});
					self.status = "Finalising";
				}); 
				var counter = 0;
				if(config.core.timeouts.loadDependencies) { var timeout = config.core.timeouts.loadDependencies; } else { var timeout = 5000; }
				var interval = setInterval(function CoreDependencyLoadIntervalCallback(){
					enableConsole();
					if(self.status == "Finalising"){ clearInterval(interval); self.startEventLoop(function(){ resolvePromise(); }); }
					if(counter >= timeout) { 
						log("error", "Blackrock Core > Timed out initiating startup. Terminating application server.", {}, "CORE_STARTUP_TIMEOUT");
						clearInterval(interval); 
						self.shutdown(); 
					}
					counter += 500;
				}, 500);
			});
			if(initialConfig && initialConfig.return == "promise") { return myPromise; } 
			else { return self; }
		},

		pkg: function CoreGetPkg() { return package; },

		cfg: function CoreGetCfg() { return config; },

		getBasePath: function CoreGetBasePath(type) { 
			if(type == "four" || !type) { return __dirname + "/../../../.."; }
			else { return __dirname + "/../.."; }
		},

		shutdown: function CoreShutdown() {
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated") { return; }
			log("shutdown","Blackrock Core > Initiating System Shutdown.", {}, "CORE_INIT_SHUTDOWN");
			self.status == "Shutting Down";
			self.closeModules(function CoreCloseModulesCallback(){ self.exitProcess(); });
			return;
		},

		module: function CoreGetModule(name, type) {
			if(type && type == "interface") { if(modules.interfaces[name]){ return modules.interfaces[name]; } else { return; } }
			else if (name != "interface") { if(modules[name]) { return modules[name]; } else { return; } } 
			else { return; }
		},

		moduleCount: function CoreModuleCount(type) {
			if(type && type == "interfaces") { return Object.keys(modules.interfaces).length; }
			else if(type && type == "modules") { return Object.keys(modules).length - 1; } 
			else { return 0; }
		},

		globals: {
			set: function CoreSetGlobal(name, value) { if(!name) { return false; } globals[name] = value; return true; },
			get: function CoreGetGlobal(name) { if(!globals[name]) { return; } return globals[name]; }
		},

		startEventLoop: function CoreStartEventLoop(cb) {
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated" || self.status == "Active"){ return; }
			else {
				setTimeout(function CoreStartLoopTimeout(){ 
					if(!self.status == "Shutting Down" && !self.status == "Terminated" && !self.status == "Active") { 
						log("startup","Blackrock Core > System Loaded, Event Loop Executing. Press 'e' key to shutdown.", {}, "CORE_SYSTEM_LOADED"); 
					} 
				}, 1000); 
				self.status = "Active"; if(cb) { cb(); }
				setInterval(function CoreStartLoopInterval(){}, 1000); 
			} 
		},

		loadModule: function CoreLoadModule(type, moduleName, cb){
			var self = this;
			if(self.status == "Shutting Down" || self.status == "Terminated") { return; }
			if(type == "module" && config.core.modules && config.core.modules.length > 0 && !config.core.modules.includes(moduleName)) { return; }
			if(type == "interface" && config.core.interfaces && config.core.interfaces.length > 0 && !config.core.interfaces.includes(moduleName)) { return; }
			if(moduleName.startsWith(".")) { return; }
			try {
				if(type == "module")
					modules[moduleName] = require(self.getBasePath("two") + "/" + type + "s/" + moduleName + "/main.js")(core);
				else if (type == "interface")
					modules.interfaces[moduleName] = require(self.getBasePath("two") + "/" + type + "s/" + moduleName + "/main.js")(core);
			} catch(err) {
				var error = { success: false, message: "Error Loading '" + moduleName + "' Module (Type: " + type + ")", error: err };
				log("debug", "Blackrock Core > " + error.message, error.error, "CORE_ERR_LOADING_MOD");
				if(cb) { cb(error, null); }
				return error;
			}
			var output = { success: true, message: "'" + moduleName + "' Module (Type: " + type + ") Loaded Successfully" };
			if(type == "module") { output.module = modules[moduleName]; }
			if(type == "interface") { output.module = modules.interfaces[moduleName] }
			log("debug", "Blackrock Core > " + output.message, {}, "CORE_MOD_LOADED");
			if(cb) { cb(null,output); }
			return output;
		},

		closeModules: function CoreCloseModules(cb) {
			var self = this;
			log("shutdown","Blackrock Core > Attempting to Close All Open Modules.", {}, "CORE_CLOSING_MODULES");
			var modCount = 0, stdModCount = 0, interfaceModCount = 0, counter = 0, timeoutTimer = 0;
			if(config.core.timeouts.closeModules) { var timeout = config.core.timeouts.closeModules }
			else { var timeout = 2000; }
			Object.keys(modules).forEach(function CoreCloseModulesModForEachCallback(key) { stdModCount ++; });
			stdModCount = stdModCount - 1;
			Object.keys(modules.interfaces).forEach(function CoreCloseModulesIntForEachCallback(key) { interfaceModCount ++; });
			modCount = stdModCount + interfaceModCount;
			var interval = setInterval(function CoreCloseModulesIntervalCallback(){
		    	if(counter >= (modCount - 1)) {
		    		log("shutdown","Blackrock Core > Modules All Closed Successfully ("+counter+"/"+(modCount - 1)+").", {}, "CORE_MODS_CLOSED");
				    clearInterval(interval);
				    cb(null, {success:true, message: "Modules All Closed Successfully"});
				    return;	
		    	}
		    	if(timeoutTimer > timeout) {
		    		log("shutdown","Blackrock Core > Module Closure Timed Out ("+counter+"/"+(modCount - 1)+" Closed Successfully).", {}, "CORE_TIMEOUT_CLOSING_MODS");
		    		clearInterval(interval);
		    		cb({ message: "Module Shutdown Timed Out" }, null);
		    		return;
		    	}
		    	timeoutTimer += 500;
		    }, 500);
			process.nextTick(function CoreCloseModulesNextTickCallback(){
				self.on("module-shut-down", function CoreCloseModulesOnModShutdownCallback(){ counter ++; });
				self.emit("shutdown", "All Modules Have Been Terminated");
		    	return;
	    	});
		},

		exitProcess: function CoreExitProcess() { 
			var currentDate = new Date().toISOString(); 
			if(!core.globals.get("silent")) { console.log(currentDate + " (shutdown) Blackrock Core > Shutdown Complete"); }
			process.exit(); 
		}

	});









	/* ================================ *
	 * Define Mod (Module) Prototype: *
	 * ================================ */

	var Mod = new Core().extend({

		constructor: function CoreModConstructor(specName) { 
			var self = this; 
			if(specName) { 
				self.name = specName; 
				self.uber.on("shutdown", function CoreModConstructorOnShutdownCallback(){ 
					self.unload();
				}); 
			} 
		},

		unload: function CoreModUnload() { 
			var self = this; 
			log("debug", self.name + " Module > Module Unloaded", {}, "CORE_MOD_UNLOADED");
			self.uber.emit("module-shut-down", self.name); 
			delete self; 
		}

	});







	/* ========================================= *
	 * Define Interface (Interface) Prototype: *
	 * ========================================= */

	var Interface = new Mod().extend({

		constructor: function CoreInterfaceConstructor(specName) { 
			var self = this; 
			self.name = specName; 
			self.uber.uber.on("shutdown", function(){ 
				self.unload() 
			}); 
		},
		
		instances: {},

		startInterfaces: function CoreInterfaceStartInterfaces(){
			var self = this;
			process.nextTick(function CoreInterfaceStartInterfacesNextTickCallback(){
				var myName = self.name.toLowerCase();
				if(!core.cfg().interfaces || !core.cfg().interfaces[myName]) { log("debug", self.name + " Interface Module > No Interfaces Defined in System Configuration File.", {}, "CORE_ERR_START_INTERFACES_NONE_DEFINED"); return; }
				if(!core.cfg().router || !core.cfg().router.instances){ log("error", self.name + " Interface Module > Cannot start interfaces as there are no routers defined."); return; }
				for(var interface in core.cfg().interfaces[myName]) {
					var cfg = core.cfg().interfaces[myName][interface];
					if(self.instances[interface]){ log("error", self.name + " Interface Module > Attempting to load an interface that has already been loaded (" + interface + ").", {}, "CORE_ERR_START_INTERFACES_ALREADY_LOADED"); }
					else if (!cfg.enabled || cfg.enabled != true) { log("warning", self.name + " Interface Module > Attempting to load an interface that is not enabled in the system configuration (" + interface + ").", {}, "CORE_ERR_START_INTERFACE_NOT_DEFINED"); } 
					else { self.startInterface(interface); }
				}
			});
		},

		get: function CoreInterfaceGetInstance(name) {
			var self = this;
			if(!self.instances[name]) { return false; }
			else { return self.instances[name]; };
		},

		closeInterfaces: function CoreInterfaceCloseInterfaces(cb) {
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

		unload: function CoreInterfaceUnload(){
			var self = this;
			self.closeInterfaces(function CoreInterfaceUnloadCloseInterfacesCallback(){
				log("debug", self.name + " Interface > Closing interface instances... Succeeded.", {}, "CORE_INTERFACES_CLOSED");
				self.uber.emit("module-shut-down", self.name);
				delete self;
			});
		}

	});















	/* ========================= *
	 * Instantiate Core Objects: *
	 * ========================= */

	core = new Core("Blackrock"), core.Core = core.ISNode = Core;
	core.ISMod = core.Mod = Mod, core.ISInterface = core.Interface = Interface, core.Base = Base;
	module.exports = core;

}();