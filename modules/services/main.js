/*!
* ISNode Blackrock Services Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {







	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, ISService, log, services = {}, config, basePath = __dirname + "/../../../../", pipelines = {}, streamFns = {};









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
		isnode = isnodeObj, ismod = new isnode.ISMod("Services"), log = isnode.module("logger").log, config = isnode.cfg();
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
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupUnloadMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.setupSearchMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.setupServiceEndpoint(evt); }),
					streamFns.loadServices,
					streamFns.fetchControllers,
					op.map(evt => { if(evt) return streamFns.preProcessControllers(evt); }),
					op.map(evt => { if(evt) return streamFns.removeInvalidControllers(evt); }),
					op.map(evt => { if(evt) return streamFns.buildRoutesObject(evt); }),
					op.map(evt => { if(evt) return streamFns.setBasePathCtrlAndServiceRoutes(evt); })
					
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
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.parseSearchObject(evt); }),
					op.map(evt => { if(evt) return streamFns.findCtrlUsingUrl(evt); }),
					
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
								log("debug", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + "  but no shutdown interface exists.");
								counter ++;
							} else {
								log("debug", "Blackrock Services > Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + ", waiting for controller response...");
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
					process.nextTick(function(){
						log("startup","Blackrock Services > Enumerating and loading services...");
						var fs = require('fs');
						fs.readdirSync(basePath + "services").forEach(function(file) {
				        	if(fs.existsSync(basePath + "services/"+file+"/service.json") === true) {
				        		log("startup","Blackrock Services > Loading " + file + " service.");
				            	services[file] = new ISService();
				            	services[file].cfg = require(basePath + "services/" + file + "/service.json");
				            	evt.service = file;
				               	observer.next(evt);
				        	}
						});
						return;
					});
					
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [5]) Fetch Controllers
	 * @param {observable} source - The Source Observable
	 */
	streamFns.fetchControllers = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					process.nextTick(function(){
						log("startup","Blackrock Services > Building routes for " + evt.service + " service.");
						if(services[evt.service].routes) {
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
							log("warning","Blackrock Services > Autorouting not enabled on " + evt.service + " service. Abandoning service load.");
							return;
						}
					});		
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
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Build Routes Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.buildRoutesObject = function(evt){
		evt.Routes = [], evt.map = {}, evt.orphans = {}, j = 0;
		for (i = 0; i < evt.data.length; i++) { 
			if(evt.data[i]){
				var path = evt.controllerBasePath + evt.data[i] + "/controller.js"
				path = path.replace("//", "/");
				var fs = require("fs");
				if (fs.existsSync(path)) {
					var controller = require(path);
					if (controller.init && typeof controller.init === 'function') { 
						if(controller.init.length >= 1) {
    						var restrictedISNode = {};
    						restrictedISNode.cfg = isnode.cfg;
    						restrictedISNode.pkg = isnode.pkg;
    						restrictedISNode.module = isnode.module;
    						restrictedISNode.globals = isnode.globals;
    						if(config && config.services && config.services.allowShutdownFromControllers)
    							restrictedISNode.shutdown = isnode.shutdown;
    						controller.init(restrictedISNode);
						} else { controller.init(); }
					}
				} else { controller = {}; }
				if(!services[evt.service].cfg.basePath && isnode.cfg().loader && isnode.cfg().loader.basePath){
					services[evt.service].cfg.basePath = isnode.cfg().loader.basePath;
				}
				if(services[evt.service].cfg.basePath){ evt.pattern = services[evt.service].cfg.basePath + evt.data[i]; }
				else { evt.pattern = evt.data[i]; }
				if(evt.pattern.endsWith("{*}")) {
					var parentPattern = evt.pattern.slice(0, -3);
					if(!evt.map[parentPattern] && !evt.Routes[evt.map[parentPattern]]) { evt.orphans[parentPattern] = true; }
					if(!evt.Routes[evt.map[parentPattern]]) { evt.Routes[evt.map[parentPattern]] = {}; }
					if(evt.Routes[evt.map[parentPattern]]) { evt.Routes[evt.map[parentPattern]].wildcard = true; evt.pattern = null; }
					if(evt.map[parentPattern]) { evt.Routes[evt.map[parentPattern]].wildcard = true; evt.pattern = null; }
				}
				if(evt.pattern) {
					evt.map[evt.pattern] = j;
					evt.Routes[j] = {
						path: path,
						pattern: evt.pattern,
						controller: controller,
						service: evt.service
					};
					if(evt.orphans[evt.pattern]) {
						evt.Routes[j].wildcard = true;
					}
					j++;
				}
			}
		}
		evt.Routes.push({ path: "/", pattern: "/uisdgdsi-mock-endpoint-to-fix-problem", controller: {}, service: evt.service });
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Set Base Path Controller
	 * @param {object} evt - The Request Event
	 */
	streamFns.setBasePathCtrlAndServiceRoutes = function(evt){
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
				evt.Routes.push({
					path: "",
					pattern: urls_piece,
					controller: ctrl,
					service: evt.service
				});
			}
		}
		services[evt.service].routes = evt.Routes;
		return evt;
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
			evt.hostname = evt.searchObj.hostname;
			evt.url = evt.searchObj.url;
		} else if (evt.searchObj.hostname && evt.searchObj.url && evt.searchObj.services) {
			if(evt.searchObj.services.includes("*")) {
				evt.hostname = evt.searchObj.hostname;
				evt.url = evt.searchObj.url;
			} else {
				evt.hostname = evt.searchObj.hostname;
				evt.url = evt.searchObj.url;
				evt.services = evt.searchObj.services;
			}
		} else { evt.searchComplete = true; }
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Find Controller Using URL
	 * @param {object} evt - The Request Event
	 */
	streamFns.findCtrlUsingUrl = function(evt){
		var results = [], hostname = evt.hostname, url = evt.url, srvs = evt.srvs;
		function isEmpty(obj) {
		    for(var prop in obj) { if(obj.hasOwnProperty(prop)) { return false; } }
		    return JSON.stringify(obj) === JSON.stringify({});
		}
		var srvsArray = [];
		var hosts = [];
		for (var sv in services) { 
			if(!services[sv].cfg.host && isnode.cfg().loader && isnode.cfg().loader.host) {
				services[sv].cfg.host = isnode.cfg().loader.host;
			}
			hosts.push(services[sv].cfg.host); 
		}
		for(var service in services) {
			srvs = srvsArray;
			if(hostname == services[service].cfg.host) { srvs.push(service); }
			else if (services[service].cfg.host == "*" && !hosts.includes(hostname)) { srvs.push(service); }
			if(!srvs || srvs.includes(service)) {
			    var urlParts = url.split("/");
			    var param = {};
			    var currentRoute = null;
			    var override = false;
			    var routes = {};
			    routes[services[service].cfg.host] = services[service].routes;
			    var urlParts = url.split("/");
			    var param = {};
			    var currentRoute = null;
			    var override = false;
			    var directMatch = false;
			    var wildcardSet = null;
			    if(routes[hostname]) { var host = hostname; }
			    else if(routes["*"] && !routes[hostname] && services[service].cfg.host == "*") { var host = "*"; }
			    if(routes[host]) {
				    for(var index = 0, total = routes[host].length; index<total; index++){
				        var match = true;
				        var patternSplit = routes[host][index].pattern.split("/");
				        if (urlParts.length === patternSplit.length || (url.startsWith(routes[host][index].pattern) && routes[host][index].wildcard)) {
				        	if(routes[host][index].wildcard) {
				        		wildcardSet = { "host": host, "index": index }
				        	}
				        	if(url == routes[host][index].pattern){
				        		directMatch = true;
				        		override = routes[host][index];
				        		if(host == "*")
				        			override.matchType = "wildcard";
				        		else
				        			override.matchType = "direct";
				        	}
				        	if(!directMatch) {
					        	var patternReplaced = routes[host][index].pattern.replace(/{.*}/, '{}');
					        	var patternReplacedSplit = patternReplaced.split("/");
					        	if (urlParts.length === patternReplacedSplit.length) {
					        		var patternReplacedMatch = true;
					        		for (var i = 0; i < urlParts.length; i++) {
					        			if(urlParts[i] != patternReplacedSplit[i] && patternReplacedSplit[i] != "{}")
					        				patternReplacedMatch = false;
					        		}
					        		if(patternReplacedMatch) {
						        		override = routes[host][index];
						        		if(host == "*")
						        			override.matchType = "wildcard";
						        		else
						        			override.matchType = "direct";
					        		}
					        	}
				        	}
				            for (var i = 0, l = urlParts.length;i<l;i++) {
				            	var workaround = false;
				            	if(!patternSplit[i]) {
				            		workaround = true;
				            		patternSplit[i] = "";
				            	}
				                var reg = patternSplit[i].match(/{(.*)}/);
				                if (reg) {
				                	param[reg[1]] = urlParts[i];
				                } else if (workaround) {
				                	null;
				                } else { 
				                	if (patternSplit[i] !== urlParts[i] && !wildcardSet) { match = false; break; } 
				                }
				            }
				        } else { 
				        	if(!currentRoute)
				        		match = false; 
				        }
				        if (match === true && !currentRoute && !override) { 
				        	currentRoute = routes[host][index]; 
			        		if(host == "*")
			        			currentRoute.matchType = "wildcard";
			        		else
			        			currentRoute.matchType = "direct";
				        }
				    }
				    if(!match){
				    	var match = true;
				    	if(wildcardSet && routes[wildcardSet[host]] && routes[wildcardSet[host]][wildcardSet[index]]) {
				    		currentRoute = routes[wildcardSet[host]][wildcardSet[index]];
				    	} else {
				    		currentRoute = { service: routes[host][0].service }	
				    	}
		        		if(host == "*")
		        			currentRoute.matchType = "wildcard";
		        		else
		        			currentRoute.matchType = "direct";	    	
				    }
				}
				if(override) { currentRoute = override; }
			    if(match && currentRoute){
			    	results.push({match: currentRoute, param: param});
			    }
			}
		}
		if(results.length != 1) {
			var intermediateResults = [];
			for (var i = 0; i < results.length; i++) {
				if(results[i].match.matchType == "direct")
					intermediateResults.push(results[i]);
			}
			if(intermediateResults && intermediateResults.length == 1) {
				results = intermediateResults;
				evt.result = results[0];
			} else {
				evt.result = false;
			}
		} else {
			evt.result = results[0];
		}
		return evt;
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();