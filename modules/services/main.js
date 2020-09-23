/*!
* ISNode Blackrock Services Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {







	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, ISService, log, map, orphans, services = {}, config, loadMessages = {}, basePath = __dirname + "/../../../../", pipelines = {}, streamFns = {};









	/**
	 * ===============================
	 * Services Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Services"), log = isnode.module("logger").log, config = isnode.cfg(), map = {}, orphans = {};
		log("debug", "Blackrock Services > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		ISService = new isnode.ISMod().extend({ constructor: function() { return; } });
		var ISPipeline = pipelines.setupServicesPipeline();
		new ISPipeline({}).pipe();
		return ismod;
	}









	/**
	 * ======================
	 * Event Stream Pipelines
	 * ======================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Services Pipeline
	 */
	pipelines.setupServicesPipeline = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
				log("debug", "Blackrock Services > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupUnloadMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.setupSearchMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.setupServiceEndpoint(evt); }),
					streamFns.loadServices,
					streamFns.fetchControllerNames,
					op.map(evt => { if(evt) return streamFns.preProcessControllers(evt); }),
					op.map(evt => { if(evt) return streamFns.removeInvalidControllers(evt); }),
					op.map(evt => { if(evt) return streamFns.setBasePathCtrl(evt); }),
					streamFns.generateControllerEvents,
					streamFns.loadControllerFiles,
					streamFns.setBasePathAndPattern,
					streamFns.checkIfWildcardPath,
					streamFns.buildRoutesObject
					
				);
				stream1.subscribe(function(evt) {});
			}
		});
	};



	/**
	 * (Internal > Pipeline [2]) Run Search Pipeline
	 */
	pipelines.runSearchPipeline = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function(cb) {
				log("debug", "Blackrock Services > Route Search Query Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.parseSearchObject(evt); }),
					op.map(evt => { if(evt) return streamFns.setupHosts(evt); }),
					streamFns.generateServiceEvents,
					op.map(evt => { if(evt) return streamFns.initSearchForService(evt); }),
					streamFns.iterateOverRoutes,
					op.map(evt => { if(evt) return streamFns.checkAndMatch(evt); })
					
				);
				stream1.subscribe(function(evt) { cb(evt.result); });
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
	 * (Internal > Stream Methods [1]) Setup Unload Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupUnloadMethod = function(evt){
		ismod.unload = function(){
			var closeControllers = function closeControllers(cb) {
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
								log("debug_deep", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + "  but no shutdown interface exists.");
								counter ++;
							} else {
								log("debug_deep", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + ", waiting for controller response...");
								route.controller.shutdown(function(){
									log("debug", "Controller " + route.pattern + " for service " + services[service].cfg.name + " shutdown successful.");
									counter ++;
								});
							}
						}				
					}
				}
				var timeout = 5000, timeoutTimer = 0, interval = setInterval(function(){
			    	if(counter >= ctrlCount){ log("shutdown","Blackrock Services > Controllers all shutdown where possible."); clearInterval(interval); cb(); return; }
			    	if(timeoutTimer > timeout) { log("shutdown","Blackrock Services > Controller shutdown timed out."); clearInterval(interval); cb(); return; }
			    	timeoutTimer += 500;
			    }, 500);
				return;
			}
			closeControllers(function(){ isnode.emit("module-shut-down", "Services"); });
		}
		log("debug", "Blackrock Services > [1] Attached 'unload' Method To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Setup Search Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupSearchMethod = function(evt){
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
		ismod.search = function(searchObj, cb){
			var ISPipeline = pipelines.runSearchPipeline();
			new ISPipeline({ "searchObj": searchObj }).pipe(function(result) { cb(result); });
		}
		log("debug", "Blackrock Services > [2] Attached 'search' Method To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Service Endpoint
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupServiceEndpoint = function(evt){
		/**
		 * (Internal) Middleware Router
		 *
		 * @param {object} req - Request Object
		 * @param {object} res - Response Object
		 */
		var middleware = (function(req, res){
			var stackCounter = 0;
			return function (req, res) {
				if(middleware.stack[stackCounter]) {
					middleware.stack[stackCounter](req, res, function(){
						stackCounter++;
						if(middleware.stack[stackCounter]) { middleware(req, res) }
						else { middleware.handler(req, res); stackCounter = 0; }
					});
				} else {
					middleware.handler(req, res);
					stackCounter = 0;
				}
			}
		})();
		middleware.stack = [];
		middleware.handler = null;
		middleware.use = function(fn) { middleware.stack.push(fn) };
		middleware.handle = function(fn) { middleware.handler = fn }
		middleware.count = function() { return middleware.stack.length }

		/**
		 * (External) Gets A Service Object (By Name)
		 *
		 * @param {string} serviceName - Service Name
		 */
		ismod.service = function(name){
			if(!services[name]) { return; }
			var service = {};
			service.cfg = function(){ return services[name].cfg; }
			service.models = {};
			service.models.get = function(mod) { return services[name].models[mod]; }
			service.models.add = function(modName, modObj) { 
				if(!name || !modName || !modObj) { return false; }
				if(!services[name].models) { services[name].models = {}; }
				services[name].models[modName] = modObj;
				return true;
			}
			service.url = {};
			service.url.get = function(path, options) {
				if(options && options.protocol) { var protocol = options.protocol.toLowerCase(); }
				if(options && options.port) { var port = options.port; }
				var host = services[name].cfg.host;
				if(services[name].cfg.basePath) { var basePath = services[name].cfg.basePath; }
				else if (isnode.cfg().loader && isnode.cfg().loader.basePath) { var basePath = isnode.cfg().loader.basePath; }
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
			service.middleware = middleware;
			service.use = middleware.use;
			return service;
		}
		log("debug", "Blackrock Services > [3] Setup & Attached 'service' Method To This Module (incl. Setting Up Middleware)");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Load Services
	 * @param {observable} source - The Source Observable
	 */
	streamFns.loadServices = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("startup","Blackrock Services > [4] Enumerating and loading services...");
					var loadService = function(serviceName) {
			        	if(fs.existsSync(basePath + "services/" + serviceName + "/service.json") === true) {
			        		log("startup","Blackrock Services > [4a] Loading " + serviceName + " service...");
			            	services[serviceName] = new ISService();
			            	services[serviceName].cfg = require(basePath + "services/" + serviceName + "/service.json");
			            	evt.service = serviceName;
			               	observer.next(evt);
			        	}
			        }
					if(config.services.runtime.services.allowLoad == true){ ismod.loadService = loadService; }
					var fs = require('fs');
					fs.readdirSync(basePath + "services").forEach(function(file) { loadService(file); });
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [5]) Fetch Controller Names
	 * @param {observable} source - The Source Observable
	 */
	streamFns.fetchControllerNames = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("startup","Blackrock Services > [5] Building routes for " + evt.service + " service.");
					if(services[evt.service].routes) {
						log("startup","Blackrock Services > [5a] Service Routes for " + evt.service + " Have Already Been Built");
						return {success: false, message: "Service Routes for " + evt.service + " Have Already Been Built"};
					}
					if(services[evt.service].cfg.routing && (services[evt.service].cfg.routing == "auto") || !services[evt.service].cfg.routing){
						var filewalker = require("./support/filewalker.js");
						filewalker(basePath + "services/" + evt.service + "/controllers", function(err, data){
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
	 * (Internal > Stream Methods [6]) Pre-Process Controllers
	 * @param {object} evt - The Request Event
	 */
	streamFns.preProcessControllers = function(evt){
		if(evt.fileWalkerErr){throw evt.fileWalkerErr;}
		evt.dataPreProcess = evt.data;
		if(!evt.data){ return {success: false, message: "No controllers exist for the " + evt.service + " service."}; }
		evt.data = [];
		evt.basePath = [];
		for (var i = 0; i < evt.dataPreProcess.length; i++) {
			if(!evt.dataPreProcess[i].endsWith(".DS_Store")){ evt.data.push(evt.dataPreProcess[i]); }
			if(evt.dataPreProcess[i].endsWith("controller.js")){ evt.basePath.push(evt.dataPreProcess[i].substring(0, evt.dataPreProcess[i].length - 14)); }
		}
		evt.basePath.sort(function(a, b) {
			return a.length - b.length || a.localeCompare(b);
		});
		evt.controllerBasePath = evt.basePath[0];
		log("debug","Blackrock Services > [6] Controllers Have Been Pre-Processed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Remove Invalid Controllers
	 * @param {object} evt - The Request Event
	 */
	streamFns.removeInvalidControllers = function(evt){
		for (i = 0; i < evt.data.length; i++) { 
			evt.data[i] = evt.data[i].replace(evt.controllerBasePath, "");
			if (evt.data[i].endsWith("controller.js") && evt.data[i] != "/controller.js") { delete evt.data[i]; }
			else if (evt.data[i].endsWith("controller.js") && evt.data[i] == "/controller.js") { evt.data[i] = "/"; }
		}
		log("debug","Blackrock Services > [7] Invalid Controllers Have Been Removed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Set Base Path Controller
	 * @param {object} evt - The Request Event
	 */
	streamFns.setBasePathCtrl = function(evt){
		services[evt.service].routes = [];
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
					"init": function(isnodeObj) {
						return ctrl;
					},
					"get": function(req, res) {
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
		if(!loadMessages["1-8"]) {
			loadMessages["1-8"] = true;
			log("debug","Blackrock Services > [8] Have Set Base Path Controller & Service Routes");
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Generate Controller Events
	 * @param {observable} source - The Source Observable
	 */
	streamFns.generateControllerEvents = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(!loadMessages["1-9"]) {
						loadMessages["1-9"] = true;
						log("debug","Blackrock Services > [9] Controller Events Being Generated");
					}
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
	 * (Internal > Stream Methods [10]) Load Controller Files in to Memory
	 * @param {observable} source - The Source Observable
	 */
	streamFns.loadControllerFiles = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(config.services.sandbox.default == true) { var type = "sandbox"; var typeString = "Via Sandbox"; }
					else { var type = "require"; var typeString = "Direct"; }
					if(!loadMessages["1-10"]) {
						loadMessages["1-10"] = true;
						log("debug","Blackrock Services > [10] Loading Controller Files In To Memory (" + typeString + ")");
					}
					var fs = require("fs");
					if (fs.existsSync(evt.path)) {
						var prepareRestrictedISNode = function(event) {
							if (event.controller.init && typeof event.controller.init === 'function') { 
								if(event.controller.init.length >= 1) {
									var restrictedISNode = {
		    							cfg: isnode.cfg,
		    							pkg: isnode.pkg,
		    							module: isnode.module,
		    							globals: isnode.globals,
		    							getBasePath: isnode.getBasePath
		    						};
		    						if(config && config.services && config.services.allowShutdownFromControllers) {
		    							restrictedISNode.shutdown = isnode.shutdown;
		    						}
		    						event.controller.init(restrictedISNode);
								} else { 
									event.controller.init(); 
								}
								observer.next(event);
							} else { observer.next(event); }
						}
						if(type == "sandbox") {
							var event = evt;
							isnode.module("sandbox").execute({ "file": evt.path, "i": evt.i }, function(obj) {
								event.controller = obj.ctrl;
								event.path = obj.file;
								event.i = obj.i;
								prepareRestrictedISNode(event);
							});
						} else {
							evt.controller = require(evt.path);
							prepareRestrictedISNode(evt);
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
	 * (Internal > Stream Methods [11]) Set Base Path & Pattern
	 * @param {observable} source - The Source Observable
	 */
	streamFns.setBasePathAndPattern = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(!loadMessages["1-11"]) {
						loadMessages["1-11"] = true;
						log("debug","Blackrock Services > [11] Base Path & Pattern Being Set Now");
					}
					if(!services[evt.service].cfg.basePath && isnode.cfg().loader && isnode.cfg().loader.basePath){
						services[evt.service].cfg.basePath = isnode.cfg().loader.basePath;
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
	 * (Internal > Stream Methods [12]) Check If Wildcard Path
	 * @param {observable} source - The Source Observable
	 */
	streamFns.checkIfWildcardPath = function(source){
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
						log("debug","Blackrock Services > [12] Checked If Wildcard Path");
					}
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [13]) Build Routes Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.buildRoutesObject = function(source){
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
						log("debug","Blackrock Services > [13] Routes Added To Routes Object");
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
	streamFns.parseSearchObject = function(evt){
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
		log("debug","Blackrock Services > [1] Search object has been parsed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Setup Hosts
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupHosts = function(evt){
		evt.results = [], evt.hosts = [];
		for (var sv in services) { 
			if(!services[sv].cfg.host && isnode.cfg().loader && isnode.cfg().loader.host) {
				services[sv].cfg.host = isnode.cfg().loader.host;
			}
			evt.hosts.push(services[sv].cfg.host); 
		}
		log("debug","Blackrock Services > [2] Hosts Have Been Setup");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Generate Service Events
	 * @param {object} evt - The Request Event
	 */
	streamFns.generateServiceEvents = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [3] Generating Service Events...");
					for(var service in services) {
						if(evt.hostname == services[service].cfg.host) { evt.srv = service; }
						else if (services[service].cfg.host == "*" && !evt.hosts.includes(evt.hostname)) { evt.srv = service; }
						observer.next(evt);
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
	streamFns.initSearchForService = function(evt){
	    evt.urlParts = evt.url.split("/");
	    evt.param = {}, evt.currentRoute = null, evt.override = false, evt.routes = {};
	    evt.routes[services[evt.srv].cfg.host] = services[evt.srv].routes;
	    evt.directMatch = false, evt.wildcardSet = null;
	    if(evt.routes[evt.hostname]) { evt.host = evt.hostname; }
	    else if(evt.routes["*"] && !evt.routes[evt.hostname] && services[evt.srv].cfg.host == "*") { evt.host = "*"; }
		log("debug","Blackrock Services > [4] Search has been initialised for this service (" + evt.srv + ")");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Iterate Over Routes
	 * @param {object} evt - The Request Event
	 */
	streamFns.iterateOverRoutes = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug","Blackrock Services > [5] Iterating Over Service Routes");
					if(!evt.routes[evt.host]) { observer.next(evt); }
					var processIteration = function(index) {
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
	streamFns.checkAndMatch = function(evt){
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
		log("debug","Blackrock Services > [6] Overrides and matches have been checked");
		return evt;
	}











	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();