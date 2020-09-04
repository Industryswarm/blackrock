/*!
* ISNode Blackrock Router Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, ISRouter, log, routers = {}, routerCount = 0;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Router"), log = isnode.module("logger").log;

		/**
		 * Define ISRouter Prototype:
		 */
		ISRouter = new isnode.ISMod().extend({
			constructor: function() {
				return;
			}
		});

		ismod.get = get;
		ismod.count = count;
		setup();
		return ismod;
	}

	/**
	 * (Internal) Setup
	 */
	var setup = function(isnodeObj){
		if(isnode.cfg().router.instances) {
			var count = 0;
			for(var instance in isnode.cfg().router.instances){
				if(isnode.cfg().router.instances[instance].services && isnode.cfg().router.instances[instance].interfaces) {
					makeRouter(instance);
					routerCount ++;
				} else {
					log("fatal", "One or more routers are misconfigured. Terminating application server...");
					isnode.shutdown();					
				}
			}
		} else {
			log("fatal", "No routers configured. Terminating application server...");
			isnode.shutdown();
		}
		return;
	}

	/**
	 * (Internal) Initialises the router
	 * @param {string} name - Router Name
	 */
	var makeRouter = function(name){
		var routerCfg = isnode.cfg().router.instances[name];
		log("debug", "Instantiating Router - " + name);
		routers[name] = new ISRouter();
		var Incoming = function(message){
			var route = Route(message.request.host, message.request.path);
			var verb = message.request.verb.toLowerCase();
			if(!route || !route.match.controller) { 
				log("warning","Router > Received request from an interface but could not resolve endpoint - 404 - " + message.msgId, message);
				ReturnError(message,"Page Not Found",404); 
				return; 
			}
			log("debug","Router > Found Route for " + message.request.host + message.request.path, message);
			if(log)
				var logger = log;
			else
				var logger = function(level, msg){};
			var controller = route.match.controller;
			var Req = require("./support/req");
			var req = new Req;
			req.init(isnode, {
				msgId: message.msgId,
				type: message.type,
				interface: message.interface,
				router: name,
				path: message.request.path,
				host: message.request.host,
				headers: message.request.headers,
				port: message.request.port,
				query: message.request.query,
				params: route.param,
				cookies: message.request.cookies,
				ip: message.request.ip,
				ipv6: message.request.ipv6,
				verb: message.request.verb,
				secure: message.request.secure,
				service: isnode.module("services").service(route.match.service),
				serviceName: route.match.service,
				body: message.request.body,
				log: logger
			});
			var Res = require("./support/res");
			var res = new Res;
			res.init(isnode, {
				msgId: message.msgId,
				service: route.match.service,
				type: message.type,
				interface: message.interface,
				router: name
			});
			var responseListener = function(msg){
				log("debug","Router > Received response from controller. Message ID: " + message.msgId, message);
				isnode.module(message.type, "interface").get(message.interface).emit("outgoing."+message.msgId,msg);
				routers[name].removeListener('router.' + msg.msgId, responseListener);
			}
			routers[name].on('router.' + message.msgId, responseListener);
			var verbs = ["get", "post", "put", "delete", "update", "patch", "head", "options", "trace"];
			if(message.request.verb && controller && controller[verb] && verbs.includes(verb)) {
				var service = isnode.module("services").service(route.match.service);
				if(service.middleware.count() == 0) {
					controller[verb](req,res);
				} else {
					service.middleware.handle(controller[verb]);
					service.middleware(req, res);
				}
			} else {
				log("error","Router > Cannot pass control to controller because controller function cannot be found - " + JSON.stringify(controller), message);
				ReturnError(message,"Internal Server Error",500);
			}
		}
		var Route = function(hostname,url){
			var searchObj = {
				hostname: hostname,
				url: url,
				services: isnode.cfg().router.instances[name].services
			}
			return isnode.module("services").search(searchObj);
		}
		var ReturnError = function(msgObject,message,statusCode){
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
			log("debug","Router > Sending message " + msgObject.msgId + " back to originating interface", msgObject);
			if(msgObject.sessionId)
				isnode.module(msgObject.type, "interface").get(msgObject.interface).emit("outgoing."+msgObject.sessionId,msg);
			else
				isnode.module(msgObject.type, "interface").get(msgObject.interface).emit("outgoing."+msgObject.msgId,msg);
			return;
		}
		routers[name].incoming = Incoming;
		routers[name].route = Route;
		return;
	}

	/**
	 * Gets a Router By Name
	 * @param {string} name - Router Name
	 */
	var get = function(name){ if(routers[name]){ return routers[name]; } else { return false; } }

	/**
	 * Gets Count of Number of Routers Instantiated
	 */
	var count = function(){ return routerCount; }

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();