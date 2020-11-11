/*!
* Blackrock Services Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ServicesWrapper(undefined) {







	/** Create parent event emitter object from which to inherit mod object */
	String.prototype.endsWith = function ServicesEndWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var core, mod, Service, log, map, orphans, services = {}, config, util;
	var loadMessages = {}, pipelines = {}, streamFns = {};









	/**
	 * ===============================
	 * Services Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function ServicesInit(coreObj){
		core = coreObj, mod = new core.Mod("Services"), util = core.module("utilities");
		log = core.module("logger").log, config = core.cfg(), map = {}, orphans = {};
		log("debug", "Blackrock Services > Initialising...", {}, "SERVICES_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		Service = new core.Mod().extend({ constructor: function ServicesServiceConstructor() { return; } });
		var Pipeline = pipelines.setupServicesPipeline();
		new Pipeline({}).pipe();
		return mod;
	}









	/**
	 * ======================
	 * Event Stream Pipelines
	 * ======================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Services Pipeline
	 */
	pipelines.setupServicesPipeline = function ServicesSetupPipeline(){
		return new core.Base().extend({
			constructor: function ServicesSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function ServicesSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function ServicesSetupPipelinePipe() {
				log("debug", "Blackrock Services > Server Initialisation Pipeline Created - Executing Now:", {}, "SERVICES_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.bindUnloadMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.bindSearchMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.bindServiceEndpoint(evt); }),
					streamFns.bindSupportMethods,
					streamFns.loadServices,

					// Fires once per loaded service:
					streamFns.fetchControllerNames,
					streamFns.preProcessControllers,
					streamFns.removeInvalidControllers,
					streamFns.setBasePathCtrl,
					streamFns.generateControllerEvents,

					// Fires once per controller within each loaded service:
					streamFns.loadControllerFiles,
					streamFns.setBasePathAndPattern,
					streamFns.checkIfWildcardPath,
					streamFns.buildRoutesObject
					
				);
				stream1.subscribe(function ServicesSetupPipelineSubscribe(evt) {});
			}
		});
	};



	/**
	 * (Internal > Pipeline [2]) Run Search Pipeline
	 */
	pipelines.runSearchPipeline = function ServicesRunSearchPipeline(){
		return new core.Base().extend({
			constructor: function ServicesRunSearchPipelineConstructor(evt) { this.evt = evt; },
			callback: function ServicesRunSearchPipelineCallback(cb) { return cb(this.evt); },
			pipe: function ServicesRunSearchPipelinePipe(cb) {
				log("debug", "Blackrock Services > Route Search Query Pipeline Created - Executing Now:", {}, "SERVICES_EXEC_ROUTE_SEARCH_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once per service route search query:
					op.map(evt => { if(evt) return streamFns.parseSearchObject(evt); }),
					op.map(evt => { if(evt) return streamFns.setupHosts(evt); }),
					streamFns.generateServiceEvents,
					op.map(evt => { if(evt) return streamFns.initSearchForService(evt); }),
					streamFns.iterateOverRoutes,
					op.map(evt => { if(evt) return streamFns.checkAndMatch(evt); })
					
				);
				stream1.subscribe(function ServicesRunSearchPipelineSubscribe(evt) { cb(evt.result); });
			}
		});
	};












	/**
	 * =====================================
	 * Services Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Bind Unload Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindUnloadMethod = function ServicesBindUnloadMethod(evt){
		mod.unload = function ServicesUnload(){
			var closeControllers = function ServicesCloseControllers(cb) {
				var ctrlCount = 0, counter = 0;
				if(services) {
					for(var service in services) {
						if(services[service].routes && services[service].routes.length > 0) { ctrlCount += services[service].routes.length; }
					}
				}
				if(ctrlCount == 0) { cb(); return; }
				for(var service in services) {
					if(services[service].routes && services[service].routes.length > 0){
						for (var i = 0; i < services[service].routes.length; i++) {
							var route = services[service].routes[i];
							if(!route.controller.shutdown || !(route.controller.shutdown instanceof Function)){
								log("debug_deep", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + "  but no shutdown interface exists.", {}, "SERVICES_SHUTDOWN_CTRL_NO_INT");
								counter ++;
							} else {
								log("debug_deep", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + ", waiting for controller response...", {}, "SERVICES_SHUTDOWN_CTRL_WAITING");
								route.controller.shutdown(function ServicesUnloadShutdownCallback(){
									log("debug", "Controller " + route.pattern + " for service " + services[service].cfg.name + " shutdown successful.", {}, "SERVICES_SHUTDOWN_CTRL_SUCCESS");
									counter ++;
								});
							}
						}				
					}
				}
				var timeout = 5000, timeoutTimer = 0, interval = setInterval(function ServicesCloseControllersTimeout(){
			    	if(counter >= ctrlCount){ log("shutdown","Blackrock Services > Controllers all shutdown where possible.", {}, "SERVICES_SHUTDOWN_CTRL_COMPLETE"); clearInterval(interval); cb(); return; }
			    	if(timeoutTimer > timeout) { log("shutdown","Blackrock Services > Controller shutdown timed out.", {}, "SERVICES_SHUTDOWN_CTRL_TIMEOUT"); clearInterval(interval); cb(); return; }
			    	timeoutTimer += 500;
			    }, 500);
				return;
			}
			closeControllers(function ServicesCloseControllersCallback(){ core.emit("module-shut-down", "Services"); });
		}
		log("debug", "Blackrock Services > [1] Attached 'unload' Method To This Module", {}, "SERVICES_UNLOAD_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Bind Search Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindSearchMethod = function ServicesBindSearchMethod(evt){
		/**
		 * (External) Searches for a Controller
		 *
		 * @param {object} searchObj - Search Definition Object
		 *
		 * Example Search Object:
		 * {
		 *	  services: ["service1", "service2"],
		 *	  hostname: "localhost",
		 *	  url: "/web/users/1"
		 * }
		 */
		mod.search = function ServicesSearch(searchObj, cb){
			var ISPipeline = pipelines.runSearchPipeline();
			new ISPipeline({ "searchObj": searchObj }).pipe(function(result) { cb(result); });
		}
		log("debug", "Blackrock Services > [2] Attached 'search' Method To This Module", {}, "SERVICES_SEARCH_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Bind Service Endpoint
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindServiceEndpoint = function ServicesBindServiceEndpoint(evt){

		/**
		 * (Internal) Middleware Router
		 *
		 * @param {object} req - Request Object
		 * @param {object} res - Response Object
		 */
		evt.MiddlewareRouter = new core.Base().extend({
			constructor: function ServicesMiddlewareRouterConstructor() {
				var self = this;
				self.myRouter = (function(req, res){
					var stackCounter = 0;
					return function (req, res) {
						if(self.myRouter.stack[stackCounter]) {
							self.myRouter.stack[stackCounter](req, res, function(){
								stackCounter++;
								if(self.myRouter.stack[stackCounter]) { 
									self.myRouter(req, res) 
								} else { 
									self.myRouter.handler(req, res); 
									stackCounter = 0;
								}
							});
						} else {
							self.myRouter.handler(req, res);
							stackCounter = 0;
						}
					}
				})();
				self.myRouter.stack = [];
				self.myRouter.handler = null;
				self.myRouter.use = function ServicesMiddlewareRouterUse(fn) { self.myRouter.stack.push(fn) };
				self.myRouter.handle = function ServicesMiddlewareRouterHandle(fn) { self.myRouter.handler = fn }
				self.myRouter.count = function ServicesMiddlewareRouterCount() { return self.myRouter.stack.length }
			}
		});

		/**
		 * (External) Gets A Service Object (By Name)
		 *
		 * @param {string} serviceName - Service Name
		 */
		mod.service = function ServicesService(name){
			if(!services[name]) { return; }
			var service = {};
			service.cfg = function ServicesServiceCfg(){ return services[name].cfg; }
			service.models = {};
			service.models.get = function ServicesServiceGetModel(mod) { return services[name].models[mod]; }
			service.models.add = function ServicesServiceAddModel(modName, modObj) { 
				if(!name || !modName || !modObj) { return false; }
				if(!services[name].models) { services[name].models = {}; }
				services[name].models[modName] = modObj;
				return true;
			}
			service.url = {};
			service.url.get = function ServicesServiceGetUrl(path, options) {
				if(options && options.protocol) { var protocol = options.protocol.toLowerCase(); }
				if(options && options.port) { var port = options.port; }
				var host = services[name].cfg.host;
				if(services[name].cfg.basePath) { var basePath = services[name].cfg.basePath; }
				else if (core.cfg().core && core.cfg().core.basePath) { var basePath = core.cfg().core.basePath; }
				else { var basePath = ""; }
				if(options && options.full == true){
					if(!protocol) { var protocol = "http"; }
					if(protocol == "http" && port && port != 80 && port != 0) { var portString = ":" + port; }
					else if (protocol == "https" && port && port != 443 && port != 0) { var portString = ":" + port; }
					else { var portString = ""; }
					var url = protocol + "://" + host + portString + basePath + path;
					return url;
				} else {
					return basePath + path;				
				}
			}
			service.vars = {};
			service.vars.get = function ServicesServiceGetVar(key) {
				return services[name].vars[key];
			}
			service.vars.set = function ServicesServiceSetVar(key, val) {
				services[name].vars[key] = val;
				return true;
			}			
			service.middleware = services[name].middleware;
			service.use = service.middleware.use;
			return service;
		}
		log("debug", "Blackrock Services > [3] Setup & Attached 'service' Method To This Module (incl. Setting Up Middleware)", {}, "SERVICES_SERVICE_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Bind Support Methods
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindSupportMethods = function ServicesBindSupportMethods(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [4] Binding Support Methods", {}, "SERVICES_SUPPORT_FNS_BOUND");
					mod.serviceStats = function ServicesServiceStats(name) {
						var stats = {};
						stats.servicesRouteCount = 0;
						if(!name) {
							stats.servicesCount = Object.keys(services).length;
							if(core.module("utilities")) { stats.servicesMemoryUse = core.module("utilities").system.getObjectMemoryUsage(services); }
						} else {
							if(services[name]) { 
								stats.servicesCount = 1; 
								if(core.module("utilities")) { stats.servicesMemoryUse = core.module("utilities").system.getObjectMemoryUsage(services[name]); }
							} else { 
								stats.servicesCount = 0; 
								stats.servicesMemoryUse = 0;
							}

						}
						stats.services = {};
						for (var service in services) {
							if((name && service == name) || !name) {
								stats.services[service] = {};
								if(core.module("utilities")) { stats.services[service].serviceMemoryUse = core.module("utilities").system.getObjectMemoryUsage(services[service]); }
								if(services[service].routes) {
									stats.services[service].serviceRouteCount = services[service].routes.length;
									stats.servicesRouteCount += services[service].routes.length;
								}
							}
						}
						return stats;
					}
					mod.serviceList = function ServicesServiceList() {
						return Object.keys(services);
					}
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [5]) Load Services
	 * @param {observable} source - The Source Observable
	 */
	streamFns.loadServices = function ServicesLoadServices(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("startup","Blackrock Services > [5] Enumerating and loading services...", {}, "SERVICES_ENUM_SERVICES");
					var loadService = function ServicesLoadService(serviceName) {
			        	if(fs.existsSync(core.fetchBasePath("services") + "/" + serviceName + "/service.json") === true) {
			        		var cfg = require(core.fetchBasePath("services") + "/" + serviceName + "/service.json");
			        		if(cfg.active) {
				        		log("startup","Blackrock Services > [5a] Loading " + serviceName + " service...", {}, "SERVICES_LOADING_SERVICE");
				            	services[serviceName] = new Service();
				            	services[serviceName].cfg = require(core.fetchBasePath("services") + "/" + serviceName + "/service.json");
				            	var middlewareRouter = new evt.MiddlewareRouter();
				            	services[serviceName].middleware = middlewareRouter.myRouter;
				            	evt.service = serviceName;
				            	process.nextTick(function ServicesLoadServicesNextTickCallback(){ observer.next({ service: serviceName }); });
				            }
			        	}
			        }
					if(config.services.runtime.services.allowLoad == true){ mod.loadService = loadService; }
					var fs = require('fs');
					fs.readdirSync(core.fetchBasePath("services")).forEach(function ServicesLoadServicesReadDirCallback(file) { loadService(file); });
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}













	/**
	 * =====================================
	 * Services Stream Processing Functions
	 * (Fires Once Per Loaded Service)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [6]) Fetch Controller Names
	 * @param {observable} source - The Source Observable
	 */
	streamFns.fetchControllerNames = function ServicesFetchCtrlNames(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("startup","Blackrock Services > [6] Building routes for " + evt.service + " service.", {}, "SERVICES_BUILDING_ROUTES");
					if(services[evt.service].routes) {
						log("startup","Blackrock Services > [6a] Service Routes for " + evt.service + " Have Already Been Built", {}, "SERVICES_ROUTES_ALREADY_BUILT");
						return;
					}
					if(services[evt.service].cfg.routing && (services[evt.service].cfg.routing == "auto") || !services[evt.service].cfg.routing){
						var filewalker = require("./support/filewalker.js");
						filewalker(core.fetchBasePath("services") + "/" + evt.service + "/controllers", function ServicesFetchCtrlNamesFilewalkerCallback(err, data){
							evt.fileWalkerErr = err;
							evt.data = data;
							observer.next(evt);	
						});
					} else {
						return;
					}	
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [7]) Pre-Process Controllers
	 * @param {object} evt - The Request Event
	 */
	streamFns.preProcessControllers = function ServicesPreProcessCtrl(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [7] Controllers Are Being Pre-Processed (" + evt.service + ")", {}, "SERVICES_CTRLS_PREPROCESSED");
					if(evt.fileWalkerErr){throw evt.fileWalkerErr;}
					evt.dataPreProcess = evt.data;
					if(!evt.data){ return {success: false, message: "No controllers exist for the " + evt.service + " service."}; }
					evt.data = [];
					evt.basePath = [];
					for (var i = 0; i < evt.dataPreProcess.length; i++) {
						if(!evt.dataPreProcess[i].endsWith(".DS_Store")){ evt.data.push(evt.dataPreProcess[i]); }
						if(evt.dataPreProcess[i].endsWith("controller.js")){ evt.basePath.push(evt.dataPreProcess[i].substring(0, evt.dataPreProcess[i].length - 14)); }
					}
					evt.basePath.sort(function ServicesPreProcessCtrlSortHandler(a, b) {
						return a.length - b.length || a.localeCompare(b);
					});
					evt.controllerBasePath = evt.basePath[0];
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [8]) Remove Invalid Controllers
	 * @param {object} evt - The Request Event
	 */
	streamFns.removeInvalidControllers = function ServicesRemoveInvalidCtrl(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					for (i = 0; i < evt.data.length; i++) { 
						evt.data[i] = evt.data[i].replace(evt.controllerBasePath, "");
						if (evt.data[i].endsWith("controller.js") && evt.data[i] != "/controller.js") { delete evt.data[i]; }
						else if (evt.data[i].endsWith("controller.js") && evt.data[i] == "/controller.js") { evt.data[i] = "/"; }
					}
					log("debug","Blackrock Services > [8] Invalid Controllers Have Been Removed (" + evt.service + ")", {}, "SERVICES_INVALID_CTRLS_REMOVED");
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [9]) Set Base Path Controller
	 * @param {object} evt - The Request Event
	 */
	streamFns.setBasePathCtrl = function ServicesSetBasePathCtrl(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					services[evt.service].routes = [];
					services[evt.service].vars = {};
					if(services[evt.service].cfg.basePath){
						var pathBits = services[evt.service].cfg.basePath.split("/");
						var pathBitsCount = pathBits.length;
						for (var i = 0; i < pathBitsCount - 1; i++) {
							if(i == 0 && pathBits[i] == "")
								var urls_piece = "/" + pathBits[0];
							else
								var urls_piece = "";
							for (var j = 1; j <= i; j++) { 
								urls_piece += "/" + pathBits[j]; 
							};
							var ctrl = {
								"init": function ServicesBasePathCtrlInit(coreObj) {
									return ctrl;
								},
								"get": function ServicesBasePathCtrlGet(req, res) {
									res.redirect(services[evt.service].cfg.basePath);
								}
							}
							services[evt.service].routes.push({
								path: "",
								pattern: urls_piece,
								controller: ctrl,
								service: evt.service
							});
						}
					}
					log("debug","Blackrock Services > [9] Have Set Base Path Controller & Service Routes", {}, "SERVICES_BASE_PATH_CTRL_SET");
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [10]) Generate Controller Events
	 * @param {observable} source - The Source Observable
	 */
	streamFns.generateControllerEvents = function ServicesGenerateCtrlEvents(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [10] Controller Events Being Generated", {}, "SERVICES_CTRL_EVTS_GEN");
					for (i = 0; i < evt.data.length; i++) { 
						if(evt.data[i]){
							evt.path = evt.controllerBasePath + evt.data[i] + "/controller.js"
							evt.path = evt.path.replace("//", "/");
							evt.i = i;
							observer.next(evt);
						}
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}













	/**
	 * ===================================================
	 * Services Stream Processing Functions
	 * (Fires Once Per Controller For Each Loaded Service)
	 * ===================================================
	 */

	/**
	 * (Internal > Stream Methods [11]) Load Controller Files in to Memory
	 * @param {observable} source - The Source Observable
	 */
	streamFns.loadControllerFiles = function ServicesLoadCtrlFiles(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(config.services.sandbox.default == true) { var type = "sandbox"; var typeString = "Via Sandbox"; }
					else { var type = "require"; var typeString = "Direct"; }
					if(!loadMessages["1-10"]) {
						loadMessages["1-10"] = true;
						log("debug","Blackrock Services > [11] Loading Controller Files In To Memory (" + typeString + ")", {}, "SERVICES_CTRL_FILES_LOADING");
					}
					var fs = require("fs");
					if (fs.existsSync(evt.path)) {
						var prepareRestrictedCore = function ServicesPrepareRestrictedCore(event) {
							var srv = event.service;
							if (event.controller.init && typeof event.controller.init === 'function') { 
								if(event.controller.init.length >= 1) {

									var RestrictedCore = new core.Base().extend({

										// Permutation of this RestrictedCore Object is Dictated By Config:
										constructor: function ServicesRestrictedCoreConstructor(cfg) {
											self = this; 
											if(cfg.globals) { self.globals = core.globals; }
											if(cfg.shutdown) { self.shutdown = core.shutdown; }
											if(cfg.cfg) { self.cfg = core.cfg; }
											if(cfg.pkg) { self.pkg = core.pkg; }
											if(cfg.fetchBasePath) { self.fetchBasePath = core.fetchBasePath; }
											if(cfg.getCurrentService) { self.pkg = function() { return srv; } }
											return self;
										},

										// Config Governs Which Modules & Methods Within Are Available to The Controller:
		    							module: function ServicesRestrictedCoreGetModule(name, interface) {
		    								if(util.prop(config, "services.allow.modules")) { var mods = config.services.allow.modules; }
		    								else { var mods = {}; }
		    								if(!mods) { return; }
		    								var methods = mods[name], loadedMethods = {}, fnNames = {};
		    								if(!methods) { return; }
		    								for (var i = 0; i < methods.length; i++) {
	    										if(core.module(name, interface) && core.module(name, interface)[methods[i]]) {
	    											loadedMethods[methods[i]] = core.module(name, interface)[methods[i]];
	    										} else if(core.module(name, interface) && methods[i].includes(".")) {
	    											var methodSplit = methods[i].split("."), nestedObject;
	    											util.assign(loadedMethods, methodSplit, util.prop(core.module(name, interface), methods[i]));
	    										} else if(core.module(name, interface) && methods[i].includes("(")) {
	    											var splitOne = methods[i].split("("), splitTwo = splitOne[1].split(")");
	    											var methodName = splitOne[0], fnName = splitTwo[0];
	    											loadedMethods[methodName] = util.prop(core.module(name, interface), methods[i]);
	    											fnNames[methodName] = fnName;
	    										}
		    								}
		    								if(loadedMethods && !fnNames) { return loadedMethods; }
		    								else {
		    									var filteredMethods = loadedMethods;
		    									for (var methodName in loadedMethods) {
		    										if(fnNames[methodName] == "serviceName") {
		    											var newService = {}, myService = core.module(name, interface)[methodName](srv);
		    											for(var subMethod in myService) { newService[subMethod] = myService[subMethod]; };
		    											filteredMethods[methodName] = function ServicesGetModuleAutoExecHandler(args) { return newService; }
		    										} else {
		    											filteredMethods[methodName] = loadedMethods[methodName];
		    										}
		    									}
		    									return filteredMethods;
		    								}
		    							}
		    						});
									if(util.prop(config, "services.allow")) { var restrictedCore = new RestrictedCore(config.services.allow) }								
		    						else { var restrictedCore = {}; }
		    						event.controller.init(restrictedCore);
								} else { event.controller.init(); }
								observer.next(event);
							} else { observer.next(event); }
						}
						if(type == "sandbox") {
							var event = evt;
							core.module("sandbox").execute({ "file": evt.path, "i": evt.i, "service": evt.service }, function ServicesSandboxExecCallback(obj) {
								event.controller = obj.ctrl;
								event.path = obj.file;
								event.i = obj.i;
								event.service = obj.service;
								prepareRestrictedCore(event);
								observer.next(event);
							});
						} else {
							evt.controller = require(evt.path);
							prepareRestrictedCore(evt);
						}
					} else { 
						evt.controller = {}; 
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [12]) Set Base Path & Pattern
	 * @param {observable} source - The Source Observable
	 */
	streamFns.setBasePathAndPattern = function ServicesSetBasePathAndPattern(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(!loadMessages["1-11"]) {
						loadMessages["1-11"] = true;
						log("debug","Blackrock Services > [12] Base Path & Pattern Being Set Now", {}, "SERVICES_BASE_PATH_PATTERN_SET");
					}
					if(!services[evt.service].cfg.basePath && core.cfg().core && core.cfg().core.basePath){
						services[evt.service].cfg.basePath = core.cfg().core.basePath;
					}
					if(services[evt.service].cfg.basePath){ evt.pattern = "" + services[evt.service].cfg.basePath + evt.data[evt.i]; }
					else { evt.pattern = "" + evt.data[evt.i]; }
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [13]) Check If Wildcard Path
	 * @param {observable} source - The Source Observable
	 */
	streamFns.checkIfWildcardPath = function ServicesCheckIfWilcardPath(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.pattern.endsWith("{*}")) {
						var parentPattern = evt.pattern.slice(0, -3);
						if(!map[parentPattern] && !services[evt.service].routes[map[parentPattern]]) { orphans[parentPattern] = true; }
						if(!services[evt.service].routes[map[parentPattern]]) { services[evt.service].routes[map[parentPattern]] = {}; }
						if(services[evt.service].routes[map[parentPattern]]) { services[evt.service].routes[map[parentPattern]].wildcard = true; evt.pattern = null; }
						if(map[parentPattern]) { services[evt.service].routes[map[parentPattern]].wildcard = true; evt.pattern = null; }
					}
					if(!loadMessages["1-12"]) {
						loadMessages["1-12"] = true;
						log("debug","Blackrock Services > [13] Checked If Wildcard Path", {}, "SERVICES_WILDCARD_PATH_CHECKED");
					}
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [14]) Build Routes Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.buildRoutesObject = function ServicesBuildRoutesObject(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.pattern) {
						var routeObject = {
							path: evt.path,
							pattern: evt.pattern,
							controller: evt.controller,
							service: evt.service
						}
						if(orphans[evt.pattern]) { routeObject.wildcard = true; }
						map[evt.pattern] = services[evt.service].routes.push(routeObject) - 1;
					}
					if(!loadMessages["1-13"]) {
						loadMessages["1-13"] = true;
						log("debug","Blackrock Services > [14] Routes Added To Routes Object", {}, "SERVICES_BUILT_ROUTES_OBJ");
					}
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}












	/**
	 * =====================================
	 * Services Stream Processing Functions
	 * (Fires Once Per Route Search)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Parse Search Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.parseSearchObject = function ServicesParseSearchObject(evt){
		if(!evt.searchObj) { evt.searchComplete = true; 
		} else if (evt.searchObj.hostname && evt.searchObj.url && !evt.searchObj.services) {
			evt.hostname = evt.searchObj.hostname, evt.url = evt.searchObj.url;
		} else if (evt.searchObj.hostname && evt.searchObj.url && evt.searchObj.services) {
			if(evt.searchObj.services.includes("*")) {
				evt.hostname = evt.searchObj.hostname, evt.url = evt.searchObj.url;
			} else {
				evt.hostname = evt.searchObj.hostname, evt.url = evt.searchObj.url, evt.services = evt.searchObj.services;
			}
		} else { evt.searchComplete = true; }
		log("debug","Blackrock Services > [1] Search object has been parsed", {}, "SERVICES_SEARCH_OBJ_PARSED");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Setup Hosts
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupHosts = function ServicesSetupHosts(evt){
		evt.results = [], evt.hosts = [];
		for (var sv in services) { 
			if(!services[sv].cfg.host && core.cfg().core && core.cfg().core.host) {
				services[sv].cfg.host = core.cfg().core.host;
			}
			evt.hosts.push(services[sv].cfg.host); 
		}
		log("debug","Blackrock Services > [2] Hosts Have Been Setup", {}, "SERVICES_HOSTS_SETUP");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Generate Service Events
	 * @param {object} evt - The Request Event
	 */
	streamFns.generateServiceEvents = function ServicesGenerateServiceEvents(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [3] Generating Service Events...", {}, "SERVICES_GEN_SRV_EVTS");
					var hostname = evt.hostname, url = evt.url, eServices = evt.services, hosts = evt.hosts;
					for(var service in services) {
						var evt2 = {
							hostname: hostname,
							url: url,
							services: eServices,
							hosts: hosts
						};
						if(hostname == services[service].cfg.host) { evt2.srv = service; }
						else if (services[service].cfg.host == "*" && !evt.hosts.includes(hostname)) { evt2.srv = service; }
						if(evt2.srv) { observer.next(evt2); }
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [4]) Initialise The Search For This Service
	 * @param {object} evt - The Request Event
	 */
	streamFns.initSearchForService = function ServicesInitSearchForService(evt){
	    if(!services[evt.srv]) { throw new Error('Service does not exist'); return; }
	    evt.urlParts = evt.url.split("/");
	    evt.param = {}, evt.currentRoute = null, evt.override = false, evt.routes = {};
	    evt.routes[services[evt.srv].cfg.host] = services[evt.srv].routes;
	    evt.directMatch = false, evt.wildcardSet = null;
	    if(evt.routes[evt.hostname]) { evt.host = evt.hostname; }
	    else if(evt.routes["*"] && !evt.routes[evt.hostname] && services[evt.srv].cfg.host == "*") { evt.host = "*"; }
		log("debug","Blackrock Services > [4] Search has been initialised for this service (" + evt.srv + ")", {}, "SERVICES_SEARCH_INIT");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Iterate Over Routes
	 * @param {object} evt - The Request Event
	 */
	streamFns.iterateOverRoutes = function ServicesIterateOverRoutes(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(!evt) { throw new Error('Event does not exist'); return; }
					log("debug","Blackrock Services > [5] Iterating Over Service Routes", {}, "SERVICES_ITERATING_OVER_ROUTES");
					if(!evt.routes[evt.host]) { observer.next(evt); }
					var processIteration = function ServicesProcessIteration(index) {
				        evt.match = true;
				        var patternSplit = evt.routes[evt.host][index].pattern.split("/");
				        if (evt.urlParts.length === patternSplit.length || (evt.url.startsWith(evt.routes[evt.host][index].pattern) && evt.routes[evt.host][index].wildcard)) {
				        	if(evt.routes[evt.host][index].wildcard) { evt.wildcardSet = { "host": evt.host, "index": index } }
				        	if(evt.url == evt.routes[evt.host][index].pattern){
				        		evt.directMatch = true;
				        		evt.override = evt.routes[evt.host][index];
				        		if(evt.host == "*") { evt.override.matchType = "wildcard"; }
				        		else { evt.override.matchType = "direct"; }
				        	}
				        	if(!evt.directMatch) {
					        	var patternReplaced = evt.routes[evt.host][index].pattern.replace(/{.*}/, '{}');
					        	var patternReplacedSplit = patternReplaced.split("/");
					        	if (evt.urlParts.length === patternReplacedSplit.length) {
					        		var patternReplacedMatch = true;
					        		for (var i = 0; i < evt.urlParts.length; i++) {
					        			if(evt.urlParts[i] != patternReplacedSplit[i] && patternReplacedSplit[i] != "{}")
					        				patternReplacedMatch = false;
					        		}
					        		if(patternReplacedMatch) {
						        		evt.override = evt.routes[evt.host][index];
						        		if(evt.host == "*") { evt.override.matchType = "wildcard"; }
						        		else { evt.override.matchType = "direct"; }
					        		}
					        	}
				        	}
				            for (var i = 0, l = evt.urlParts.length; i < l; i++) {
				            	var workaround = false;
				            	if(!patternSplit[i]) {
				            		workaround = true;
				            		patternSplit[i] = "";
				            	}
				                var reg = patternSplit[i].match(/{(.*)}/);
				                if (reg) { evt.param[reg[1]] = evt.urlParts[i]; } 
				                else if (workaround) { null; } 
				                else { if (patternSplit[i] !== evt.urlParts[i] && !evt.wildcardSet) { evt.match = false; break; } }
				            }
				        } else { 
				        	if(!evt.currentRoute) {evt.match = false; }
				        }
				        if (evt.match === true && !evt.currentRoute && !evt.override) { 
				        	evt.currentRoute = evt.routes[evt.host][index]; 
			        		if(evt.host == "*") { evt.currentRoute.matchType = "wildcard"; }
			        		else { evt.currentRoute.matchType = "direct"; }
				        }
					}
					for(var index = 0, total = evt.routes[evt.host].length; index<total; index++){ processIteration(index); }
				    if(!evt.match){
				    	evt.match = true;
				    	if(evt.wildcardSet && evt.routes[evt.wildcardSet[evt.host]] && evt.routes[evt.wildcardSet[evt.host]][evt.wildcardSet[index]]) {
				    		evt.currentRoute = evt.routes[evt.wildcardSet[evt.host]][evt.wildcardSet[index]];
				    	} else {
				    		evt.currentRoute = { service: evt.routes[evt.host][0].service }	
				    	}
		        		if(evt.host == "*")
		        			evt.currentRoute.matchType = "wildcard";
		        		else
		        			evt.currentRoute.matchType = "direct";	    	
				    }
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [6]) Check Overrides & Match
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkAndMatch = function ServicesCheckAndMatch(evt){
		if(!evt.results) { evt.results = []; }
		if(evt.override) { evt.currentRoute = evt.override; }
	    if(evt.match && evt.currentRoute){ evt.results.push({match: evt.currentRoute, param: evt.param}); }
		if(evt.results.length != 1) {
			var intermediateResults = [];
			for (var i = 0; i < evt.results.length; i++) {
				if(evt.results[i].match.matchType == "direct")
					intermediateResults.push(evt.results[i]);
			}
			if(intermediateResults && intermediateResults.length == 1) {
				evt.results = intermediateResults;
				evt.result = evt.results[0];
			} 
			else { evt.result = false; }
		} 
		else { evt.result = evt.results[0]; }
		log("debug","Blackrock Services > [6] Overrides and matches have been checked", {}, "SERVICES_OVERRIDES_CHECKED_AND_MATCHED");
		return evt;
	}











	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();