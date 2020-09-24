/*!
* ISNode Blackrock Router Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {




	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log, routers = {}, routerCount = 0, pipelines = {}, utils = {}, streamFns = {}, lib, rx, op, Observable;





	/**
	 * =============================
	 * Router Initialisation Methods
	 * =============================
	 */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Router"), log = isnode.module("logger").log;
		log("debug", "Blackrock Router > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var ISPipeline = pipelines.createRouters();
		new ISPipeline({}).pipe();
		return ismod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipelines) Pipeline to Create Routers
	 */
	pipelines.createRouters = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
				log("debug", "Blackrock Router > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.createRouterPrototype(evt); }),
					op.map(evt => { if(evt) return streamFns.attachExternalMethods(evt); }),
					streamFns.createRouters,

					// Fires once per router on server initialisation:
					op.map(evt => { if(evt) return streamFns.initRouter(evt); }),
					op.map(evt => { if(evt) return streamFns.setupReturnErrorMethod(evt); }),
					op.map(evt => { if(evt) return streamFns.setupRouteMethod(evt); }),
					streamFns.setupListenerMethod,

					// Fires once per incoming request for each router:
					streamFns.determineNewRequestRoute,
					op.map(evt => { if(evt) return streamFns.buildRequestObject(evt); }),
					op.map(evt => { if(evt) return streamFns.buildResponseObject(evt); }),
					op.map(evt => { if(evt) return streamFns.logAnalyticsNotificationForRequest(evt); }),
					op.map(evt => { if(evt) return streamFns.prepareResponseListener(evt); }),
					op.map(evt => { if(evt) return streamFns.routeRequestToController(evt); })
					
				);
				stream1.subscribe(function(res) {
					//console.log(res);
				});
			}
		});
	};








	/**
	 * =====================================
	 * Router Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */


	/**
	 * (Internal > Stream Methods [1]) Create Router Prototype
	 * @param {object} evt - The Request Event
	 */
	streamFns.createRouterPrototype = function(evt) {
		evt.ISRouter = new isnode.ISMod().extend({
			constructor: function() {
				return;
			}
		});
		log("debug", "Blackrock Router > [1] Router Prototype Created");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Attach External Methods to Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.attachExternalMethods = function(evt) {
		ismod.get = function(name){ if(routers[name]){ return routers[name]; } else { return; } }
		ismod.count = function(){ return routerCount; }
		evt.ismod = ismod;
		log("debug", "Blackrock Router > [2] External Methods 'get' and 'count' Attached to This Module");
	    return evt;
	}

	/**
	 * (Internal > Stream  Methods [3] - Operator) Create Routers
	 */
	streamFns.createRouters = function(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Router > [3] Creating Routers...");
					if(isnode.cfg().router.instances) {
						var count = 0;
						for(var instance in isnode.cfg().router.instances){
							if(isnode.cfg().router.instances[instance].services && isnode.cfg().router.instances[instance].interfaces) {
								evt.instanceName = instance; observer.next(evt); routerCount ++;
							} else {
								log("fatal", "Blackrock Router > [3a] One or more routers are misconfigured. Terminating application server..."); isnode.shutdown();			
							}
						}
					} else {
						log("fatal", "Blackrock Router > [3a] No routers configured. Terminating application server..."); isnode.shutdown();
					}
				},
				error(error) { observer.error(error); },
				complete() { observer.complete(); }
			});
			return () => subscription.unsubscribe();
		});
	}









	/**
	 * ================================================
	 * Router Stream Processing Functions
	 * (Fires Once Per Router on Server Initialisation)
	 * ================================================
	 */


	/**
	 * (Internal > Stream Methods [4]) Initialise Router
	 * @param {object} evt - The Request Event
	 */
	streamFns.initRouter = function(evt) {
		var name = evt.instanceName;
		var routerCfg = isnode.cfg().router.instances[name];
		routers[name] = new evt.ISRouter();
		evt.routers = routers;
		log("debug", "Blackrock Router > [3a] New Router (" + name + ") Instantiated");		
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Setup Return Error Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupReturnErrorMethod = function(evt) {
		evt.ReturnError = function(msgObject,message,statusCode){
			var msg = {
				"type": msgObject.type,
				"interface": msgObject.interface,
				"msgId": msgObject.msgId,
				"sessionId": msgObject.sessionId,
				"state": "outgoing",
				"directional": msgObject.directional,
				"response": {
					"body": {"message":message},
					"message": message,
					"statusCode": statusCode
				}
			}	
			log("debug","Blackrock Router > Sending message " + msgObject.msgId + " back to originating interface", msgObject);
			if(msgObject.sessionId) { isnode.module(msgObject.type, "interface").get(msgObject.interface).emit("outgoing." + msgObject.sessionId,msg); }
			else { isnode.module(msgObject.type, "interface").get(msgObject.interface).emit("outgoing." + msgObject.msgId, msg); }
		}
		log("debug", "Blackrock Router > [3b] 'ReturnError' Method Attached To This Router");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Setup Route Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupRouteMethod = function(evt) {
		evt.Route = function(hostname, url, cb){
			isnode.module("services").search({
				hostname: hostname,
				url: url,
				services: isnode.cfg().router.instances[evt.instanceName].services
			}, cb);
		}
		routers[evt.instanceName].route = evt.Route;
		log("debug", "Blackrock Router > [3c] 'Route' Method Attached To This Router");
	    return evt;
	}

	/**
	 * (Internal > Stream  Methods [7] - Operator) Setup Listener Method
	 */
	streamFns.setupListenerMethod = function(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					evt.Listener = function(msg) { 
						var message = {};
						message.parentEvent = evt; 
						message.routerMsg = msg;
						observer.next(message); 
					}
					routers[evt.instanceName].incoming = evt.Listener;
					log("debug", "Blackrock Router > [3d] 'Listener' Method Attached To This Router (Accessible via 'get')");
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}









	/**
	 * ===========================================
	 * Router Stream Processing Functions
	 * (Fires Once Per Incoming Request to Router)
	 * ===========================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Determine New Request Route
	 * @param {object} evt - The Request Event
	 */
	streamFns.determineNewRequestRoute = function(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					evt.startTime = isnode.module("utilities").system.getStartTime();
					evt.routerInternals = {};
					evt.routerInternals.verb = evt.routerMsg.request.verb.toLowerCase();
					evt.parentEvent.Route(evt.routerMsg.request.host, evt.routerMsg.request.path, function(routeResult) {
						evt.routerInternals.route = routeResult;
						log("debug","Blackrock Router > Received Incoming Request:", evt.routerMsg);
						if(!evt.routerInternals.route || !evt.routerInternals.route.match.controller) { 
							evt.parentEvent.ReturnError(evt.routerMsg,"Page Not Found",404); 
							log("warning","Blackrock Router > [1] Could not resolve endpoint - 404 - " + evt.routerMsg.msgId);
						} else {
							evt.routerInternals.controller = evt.routerInternals.route.match.controller;
							log("debug","Blackrock Router > [1] Found Route for " + evt.routerMsg.request.host + evt.routerMsg.request.path);
							observer.next(evt); 			
						}
					});
				    return;
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [2]) Build Request Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.buildRequestObject = function(evt) {
		var Req = require("./support/req");
		evt.routerInternals.req = new Req;
		evt.routerInternals.req.init(isnode, {
			msgId: evt.routerMsg.msgId,
			type: evt.routerMsg.type,
			interface: evt.routerMsg.interface,
			router: evt.parentEvent.instanceName,
			path: evt.routerMsg.request.path,
			host: evt.routerMsg.request.host,
			headers: evt.routerMsg.request.headers,
			port: evt.routerMsg.request.port,
			query: evt.routerMsg.request.query,
			params: evt.routerInternals.route.param,
			cookies: evt.routerMsg.request.cookies,
			ip: evt.routerMsg.request.ip,
			ipv6: evt.routerMsg.request.ipv6,
			verb: evt.routerMsg.request.verb,
			secure: evt.routerMsg.request.secure,
			service: isnode.module("services").service(evt.routerInternals.route.match.service),
			serviceName: evt.routerInternals.route.match.service,
			body: evt.routerMsg.request.body,
			log: log
		});
		log("debug", "Blackrock Router > [2] Built Request Object");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Build Response Object
	 * @param {object} evt - The Request Event
	 */
	streamFns.buildResponseObject = function(evt) {
		var Res = require("./support/res");
		evt.routerInternals.res = new Res;
		evt.routerInternals.res.init(isnode, {
			msgId: evt.routerMsg.msgId,
			service: evt.routerInternals.route.match.service,
			type: evt.routerMsg.type,
			interface: evt.routerMsg.interface,
			router: evt.parentEvent.instanceName
		});
		log("debug", "Blackrock Router > [3] Built Response Object");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Log Analytics Notification With Logger
	 * @param {object} evt - The Request Event
	 */
	streamFns.logAnalyticsNotificationForRequest = function(evt) {
		log("debug", "Blackrock Router > [4] Logging Analytics Notification");
		var reqSize = JSON.stringify(evt.routerMsg.request.verb) +
						 JSON.stringify(evt.routerMsg.request.host) +
						 JSON.stringify(evt.routerMsg.request.port) +
						 JSON.stringify(evt.routerMsg.request.path) +
						 JSON.stringify(evt.routerMsg.request.query) +
						 JSON.stringify(evt.routerMsg.request.headers) +
						 JSON.stringify(evt.routerMsg.request.cookies) +
						 JSON.stringify(evt.routerMsg.request.body) || "";
		reqSize = reqSize.length;
		var analyticsObject = { 
			"msgs": { 
				"reqSize": reqSize, 
				"avgMemUsed": isnode.module("utilities").system.getMemoryUse()
			} 
		}
		isnode.module("utilities").system.getCpuLoad(function(load) {
			analyticsObject.msgs.avgCpuLoad = load;
			isnode.module("logger").analytics.log(analyticsObject);
		});
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Prepare Response Listener
	 * @param {object} evt - The Request Event
	 */
	streamFns.prepareResponseListener = function(evt) {
		evt.routerInternals.responseListener = function(msg){
			log("debug","Blackrock Router > [7] Received response from controller - Routing back to original interface. Message ID: " + msg.msgId, msg);
			var resSize = (JSON.stringify(msg.response.body) || "") +
						  (JSON.stringify(msg.response.headers) || "") +
						  (JSON.stringify(msg.response.cookies) || "");
			resSize = resSize.length;
			if(msg.view) {
				var fs = require("fs"), stats = fs.statSync(isnode.getBasePath() + "services/" + msg.service + "/views/" + msg.view);
				resSize += stats["size"];
			}
			var endTime = isnode.module("utilities").system.getEndTime(evt.startTime);
			var analyticsObject = { 
				"msgs": { 
					"resSize": resSize, 
					"avgMemUsed": isnode.module("utilities").system.getMemoryUse(),
					"avgProcessingTime": endTime
				} 
			}
			isnode.module("utilities").system.getCpuLoad(function(load) {
				analyticsObject.msgs.avgCpuLoad = load;
				isnode.module("logger").analytics.log(analyticsObject);
			});
			isnode.module(msg.type, "interface").get(msg.interface).emit("outgoing." + msg.msgId, msg);
			routers[evt.parentEvent.instanceName].removeListener('router.' + msg.msgId, evt.routerInternals.responseListener);
		}
		routers[evt.parentEvent.instanceName].on('router.' + evt.routerMsg.msgId, evt.routerInternals.responseListener);
		log("debug", "Blackrock Router > [5] Attached Response Listener (Specific to this Router Message) To This Router");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Route Request To Controller
	 * @param {object} evt - The Request Event
	 */
	streamFns.routeRequestToController = function(evt) {
		var verbs = ["get", "post", "put", "delete", "update", "patch", "head", "options", "trace"];
		if(evt.routerMsg.request.verb && evt.routerInternals.controller && evt.routerInternals.controller[evt.routerInternals.verb] && verbs.includes(evt.routerInternals.verb)) {
			var service = isnode.module("services").service(evt.routerInternals.route.match.service);
			if(service.middleware.count() == 0) {
				evt.routerInternals.controller[evt.routerInternals.verb](evt.routerInternals.req, evt.routerInternals.res);
				log("debug", "Blackrock Router > [6] Routed This Request To The Target Controller Without Middleware");
			} else {
				service.middleware.handle(evt.routerInternals.controller[evt.routerInternals.verb]);
				service.middleware(evt.routerInternals.req, evt.routerInternals.res);
				log("debug", "Blackrock Router > [6] Routed This Request To The Target Controller With Middleware");
			}

		} else {
			log("error","Blackrock Router > [6] Controller Function Cannot Be Found - " + JSON.stringify(evt.routerInternals.controller), evt.routerMsg);
			evt.parentEvent.ReturnError(evt.routerMsg,"Internal Server Error", 500);
		}
	    return evt;
	}











	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();