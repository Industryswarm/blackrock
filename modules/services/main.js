/*!
* ISNode Blackrock Services Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, ISService, log, services = {}, config, basePath = __dirname + "/../../../../";

	/**
	 * (Constructor) Initialises the module
	 *
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Services"), log = isnode.module("logger").log, config = isnode.cfg();
		ISService = new isnode.ISMod().extend({ constructor: function() { return; } });
		ismod.search = search;
		ismod.service = service;
		loadServices();
		return ismod;
	}

	/**
	 * (Internal) Enumerate and Load Services
	 */
	var loadServices = function(){
		process.nextTick(function(){
			log("startup","ISNode System > Enumerating and loading services...");
			var fs = require('fs');
			fs.readdirSync(basePath + "services").forEach(function(file) {
	        	if(fs.existsSync(basePath + "services/"+file+"/service.json") === true) {
	        		log("startup","ISNode System > Loading " + file + " service.");
	            	services[file] = new ISService();
	            	services[file].cfg = require(basePath + "services/"+file+"/service.json");
	               	buildRoutes(file);
	        	}
			});
			return true;
		});
	}

	/**
	 * (Internal) Build Routes for Service and Initialise Database Connections
	 *
	 * @param {string} service - Service Name
	 */
	var buildRoutes = function(service){
		process.nextTick(function(){
			log("startup","ISNode System > Building routes for " + service + " service.");
			if(services[service].routes) {
				return {success: false, message: "Service Routes for " + service + " Have Already Been Built"};
			}
			if(services[service].cfg.routing && (services[service].cfg.routing == "auto") || !services[service].cfg.routing){
				var filewalker = require("./support/filewalker.js");
				filewalker(basePath + "services/"+service+"/controllers", function(err, data){
					var dataPreProcess = data;
					if(!data){
						return {success: false, message: "No controllers exist for the " + service + " service."};
					}
					data = [];
					var basePath = [];
					for (var i = 0; i < dataPreProcess.length; i++) {
						if(!dataPreProcess[i].endsWith(".DS_Store")){
							data.push(dataPreProcess[i]);
						}
						if(dataPreProcess[i].endsWith("controller.js")){
							basePath.push(dataPreProcess[i].substring(0, dataPreProcess[i].length - 14));
						}
					}
					basePath.sort(function(a, b) {
					  return a.length - b.length || // sort by length, if equal then
					         a.localeCompare(b);    // sort by dictionary order
					});
					var controllerBasePath = basePath[0];
		    		if(err){throw err;}

		    		// Clean up array of controllers for this service by removing those files in list that are not controllers
		    		for (i = 0; i < data.length; i++) { 
		    			data[i] = data[i].replace(controllerBasePath, "");
		    			if (data[i].endsWith("controller.js") && data[i] != "/controller.js")
		    				delete data[i];
		    			else if (data[i].endsWith("controller.js") && data[i] == "/controller.js")
		    				data[i] = "/";
					}

					// Build service routes object from list of controllers
					var Routes = [];
					var map = {};
					var orphans = {};
					var j = 0;
					for (i = 0; i < data.length; i++) { 
						if(data[i]){
							var path = controllerBasePath + data[i] + "/controller.js"
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
		    						} else {
		    							controller.init();
		    						}
		    					}
		    				} else {
		    					controller = {};
		    				}
		    				if(!services[service].cfg.basePath && isnode.cfg().loader && isnode.cfg().loader.basePath){
		    					services[service].cfg.basePath = isnode.cfg().loader.basePath;
		    				}
		    				if(services[service].cfg.basePath){
		    					var pattern = services[service].cfg.basePath + data[i];
		    				} else {
		    					var pattern = data[i];
		    				}
		    				if(pattern.endsWith("{*}")) {
		    					var parentPattern = pattern.slice(0, -3);
		    					if(!map[parentPattern] && !Routes[map[parentPattern]]) {
		    						orphans[parentPattern] = true;
		    					}
		    					if(!Routes[map[parentPattern]]) {
		    						Routes[map[parentPattern]] = {};
		    					}
		    					if(Routes[map[parentPattern]]) {
		    						Routes[map[parentPattern]].wildcard = true;
		    						pattern = null;		    						
		    					}
		    					if(map[parentPattern]) {
		    						Routes[map[parentPattern]].wildcard = true;
		    						pattern = null;
		    					}
		    				}
		    				if(pattern) {
		    					map[pattern] = j;
								Routes[j] = {
									path: path,
									pattern: pattern,
									controller: controller,
									service: service
								};
								if(orphans[pattern]) {
									Routes[j].wildcard = true;
								}
								j++;
							}
						}
					}
					Routes.push({
						path: "/",
						pattern: "/uisdgdsi-mock-endpoint-to-fix-problem",
						controller: {},
						service: service
					});
					if(services[service].cfg.basePath){
						var pathBits = services[service].cfg.basePath.split("/");
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
									res.redirect(services[service].cfg.basePath);
								}
							}
							Routes.push({
								path: "",
								pattern: urls_piece,
								controller: ctrl,
								service: service
							});
						}
					}
					services[service].routes = Routes;
				});
			} else {
				log("warning","ISNode System > Autorouting not enabled on " + service + " service. Abandoning service load.");
				return;
			}
		});
	}

	/**
	 * (Internal) Unloads (or closes) each open service controller
	 *
	 * @param {function} cb - Callback function
	 */
	var closeControllers = function(cb) {
		var ctrlCount = 0;
		var counter = 0;
		if(services) {
			for(var service in services) {
				if(services[service].routes && services[service].routes.length > 0){
					ctrlCount += services[service].routes.length;
				}
			}
		}
		if(ctrlCount == 0) { cb(); return; }
		for(var service in services) {
			if(services[service].routes && services[service].routes.length > 0){
				for (var i = 0; i < services[service].routes.length; i++) {
					var route = services[service].routes[i];
					if(!route.controller.shutdown || !(route.controller.shutdown instanceof Function)){
						log("debug", "Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + "  but no shutdown interface exists.");
						counter ++;
					} else {
						log("debug", "Attempting to shutdown controller (" + route.pattern + ") for service " + services[service].cfg.name + ", waiting for controller response...");
						route.controller.shutdown(function(){
							log("debug", "Controller " + route.pattern + " for service " + services[service].cfg.name + " shutdown successful.");
							counter ++;
						});
					}
				}				
			}
		}
		var timeout = 5000, timeoutTimer = 0, interval = setInterval(function(){
	    	if(counter >= ctrlCount){ log("shutdown","ISNode System > Controllers all shutdown where possible."); clearInterval(interval); cb(); return; }
	    	if(timeoutTimer > timeout) { log("shutdown","ISNode System > Controller shutdown timed out."); clearInterval(interval); cb(); return; }
	    	timeoutTimer += 500;
	    }, 500);
    	return;
	}

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
	var search = function(searchObj){
		if(!searchObj) {
			return false;
		} else if (searchObj.hostname && searchObj.url && !searchObj.services) {
			return findCtrlUsingUrl(searchObj.hostname, searchObj.url);
		} else if (searchObj.hostname && searchObj.url && searchObj.services) {
			if(searchObj.services.includes("*"))
				return findCtrlUsingUrl(searchObj.hostname, searchObj.url);
			else
				return findCtrlUsingUrl(searchObj.hostname, searchObj.url, searchObj.services);
		} else {
			return false;
		}
	}

	/**
	 * (Internal) Searches for a Controller, given a hostname and URL
	 *
	 * @param {string} hostname - Host Name
	 * @param {string} url - URL Path
	 * @param {array} srvcs - An array of service names (as strings)
	 */
	var findCtrlUsingUrl = function(hostname, url, srvs){
		var results = [];
		function isEmpty(obj) {
		    for(var prop in obj) {
		        if(obj.hasOwnProperty(prop))
		            return false;
		    }
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
			if(hostname == services[service].cfg.host)
				srvs.push(service);
			else if (services[service].cfg.host == "*" && !hosts.includes(hostname))
				srvs.push(service);
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
			    if(routes[hostname]) {
			    	var host = hostname;
			    } else if(routes["*"] && !routes[hostname] && services[service].cfg.host == "*") {
			    	var host = "*";
			    }
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
				return results[0];
			} else {
				return false;
			}
		} else {
			return results[0];
		}
	}

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
	var service = function(name){
		if(!services[name])
			return false;
		var service = {};
		service.cfg = function(){ return services[name].cfg; }
		service.models = {};
		service.models.get = function(mod) { return services[name].models[mod]; }
		service.models.add = function(modName, modObj) { 
			if(!name || !modName || !modObj)
				return false;
			if(!services[name].models)
				services[name].models = {};
			services[name].models[modName] = modObj;
			return true;
		}
		service.url = {};
		service.url.get = function(path, options) {
			if(options && options.protocol)
				var protocol = options.protocol.toLowerCase();
			if(options && options.port)
				var port = options.port;
			var host = services[name].cfg.host;
			if(services[name].cfg.basePath)
				var basePath = services[name].cfg.basePath;
			else if (isnode.cfg().loader && isnode.cfg().loader.basePath)
				var basePath = isnode.cfg().loader.basePath;
			else
				var basePath = "";
			if(options && options.full == true){
				if(!protocol)
					var protocol = "http";
				if(protocol == "http" && port && port != 80 && port != 0)
					var portString = ":" + port;
				else if (protocol == "https" && port && port != 443 && port != 0)
					var portString = ":" + port;
				else
					var portString = "";
				var url = protocol + "://" + host + portString + basePath + path;
				return url;
			} else {
				var url = basePath + path;
				return url;				
			}
		}
		service.middleware = middleware;
		service.use = middleware.use;
		return service;
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();