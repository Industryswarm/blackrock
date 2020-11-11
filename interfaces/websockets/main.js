/*!
* Blackrock WebSockets Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function WebSocketsWrapper(undefined) {

	/** Create parent event emitter object from which to inherit interface object */
	var core, interface, log, instances = {};

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function WebSocketsInit(coreObj){
		core = coreObj, interface = new core.Interface("WebSockets"), log = core.module("logger").log;
		log("debug", "Blackrock WebSockets Interface > Initialising...", {}, "WEBSOCKETS_INIT");
		interface.startInterface = startInterface;
		interface.startInterfaces();
		return interface;
	}

	/**
	 * (Internal) Attempts to start a defined WebSockets interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function WebSocketsStartInterface(name){
		var self = this;
		var cfg = core.cfg().interfaces.websockets[name];
		log("startup","WebSockets Server Interface > Starting and binding WebSockets Interface (" + name + ") to the HTTP Server Interface (" + cfg.httpInterface + ").", {}, "WEBSOCKETS_STARTING");
		var routers = [];
		for(var routerName in core.cfg().router.instances){
			if(core.cfg().router.instances[routerName].interfaces && (core.cfg().router.instances[routerName].interfaces.includes("*") || core.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(core.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){
			log("startup","WebSockets Interface Module > Cannot start " + protocol + " interface (" + name + ") on port " + cfg.port + " as it is not mapped to any routers.", {}, "WEBSOCKETS_NO_ROUTERS");
			return;
		}
		var	WebSocket = require('./support/ws/ws');
		var timeoutCounter = 0;
		var timeout = 10000;
		var intervalObject = setInterval(function WebSocketsStartInterfaceTimeoutHandler(){
			timeoutCounter = timeoutCounter + 100;
			if(core.module("http", "interface")) { var httpInterface = core.module("http", "interface").get(cfg.httpInterface); }
			if(httpInterface && httpInterface.server && httpInterface.listening == true){
				clearInterval(intervalObject);
				var server = httpInterface.server;
				instances = self.instances;
				if(!instances[name]) { instances[name] = new core.Base().extend({}); }
				instances[name].wss = new WebSocket.Server({server});
				listen(instances[name].wss, name, routers);
				log("startup","WebSockets Interface > Started, Bound to HTTP Server Interface and Listening.", {}, "WEBSOCKETS_STARTED");
				return true;				
			}
			if(timeoutCounter >= timeout){
				clearInterval(intervalObject);
				log("error","WebSockets Interface > Error binding to HTTP interface.", {}, "WEBSOCKETS_ERR_BIND_TO_HTTP");
				return false;
			}
		},100);
	}

	/**
	 * (Internal) Listen for Incoming Connections
	 * @param {object} server - WebSockets Server Object
	 */
	var listen = function WebSocketsListen(server, name, routers) {
		var os = require("os");
		server.on('connection', function WebSocketsConnectionHandler(ws, req) {
			log("debug","WebSockets Interface > New remote client session initiated", {}, "WEBSOCKETS_NEW_SESSION");
			var cxnFormat = "string";
			var cxnMode = "gateway";
			var sessionId = core.module("utilities").uuid4();
			var responseListener = function WebSocketsConnectionResponseListener(resMsg){
				log("debug","WebSockets Interface > Received message " + resMsg.msgId + " from router", resMsg, "WEBSOCKETS_RES_FROM_ROUTER");
				if(cxnFormat == "string")
					ws.send(resMsg.response.message);
				else
					ws.send(JSON.stringify(resMsg.response.body));
			}
			instances[name].on('outgoing.' + sessionId, responseListener);
			ws.on('close', function incoming(msg){
				instances[name].removeListener('outgoing.' + sessionId, responseListener);
				log("debug","WebSockets Server Interface > Remote client session closed.", {sessionId: sessionId}, "WEBSOCKETS_SESSION_CLOSED");
			});
			ws.on('message', function WebSocketsIncomingMessageHandler(msg) {
				if(cxnMode == "gateway"){
					var msgType = core.module("utilities").isJSON(msg);
					if(msgType == "json_string"){
						var msgObject = JSON.parse(msg);
						msgObject.reference = core.module("utilities").randomString(12);
						if(!msgObject.command){
							ws.send('{\"message\":\"Command not specified\"}');
							return;
						}
					} else {
						var msgObject = {
							"command": msg,
							"reference": core.module("utilities").randomString(12)
						}
					}
					if(msgObject.command == "help"){
						Help(ws,req,msgObject,cxnFormat);
					} else if (msgObject.command.startsWith("set format")) {
						cxnFormat = SetFormat(ws,req,msgObject,cxnFormat);
					} else if(msgObject.command == "exit"){
						Exit(ws,req,msgObject,cxnFormat,responseListener,sessionId);
					} else {
						for (var i = 0; i < routers.length; i++) {
							req.router = routers[i];
							RouteMessage(ws, req, msgObject, cxnFormat, sessionId, name);
						}	
					}
				}
			});
		});	
	    return;
	}

	var Help = function WebSocketsHelp(ws, req, msgObject, cxnFormat){
		log("debug","WebSockets Server Interface > Returning help section on client request", {}, "WEBSOCKETS_SHOWING_HELP");
		if(cxnFormat == "string"){
			ws.send('Help not implemented.');
		} else if (cxnFormat == "json"){
			ws.send("{\"message\":\"Help not implemented\"}");
		}
		return;
	}

	var Exit = function WebSocketsExit(ws, req, msgObject, cxnFormat, responseListener, sessionId){
		ws.close(1000,'Exiting WebSocket Shell on Client Request.');
		return;
	}

	var SetFormat = function WebSocketsSetFormat(ws,req,msgObject,cxnFormat){
		var formatString = msgObject.command.split(" ");
		var format = formatString[2];
		if(format == cxnFormat && format == "string"){
			ws.send('Format already set to string.');
		} else if(format == cxnFormat && format == "json"){
			ws.send("{\"message\":\"Format already set to json\"}");
		} else {
			if(format == "string") {
				cxnFormat = "string";
				ws.send('Format now set to string');
			} else if (format == "json") {
				cxnFormat = "json";
				ws.send("{\"message\":\"Format now set to json\"}");
			} else {
				if(cxnFormat == "string"){
					ws.send('Specified message format unknown');
				} else if (cxnFormat == "json") {
					ws.send("{\"message\":\"Specified message format unknown\"}");
				} else {
					ws.send("Specified message format unknown, current format invalid");
				}
			}
		}
		log("debug","WebSockets Server Interface > Updating session format to " + cxnFormat + " on client request", {}, "WEBSOCKETS_UPDATE_FORMAT");
		return cxnFormat;
	}

	var RouteMessage = function WebSocketsRouteMessage(ws, req, msgObject, cxnFormat, sessionId, name){
		var resReturned = false;
		var msgId = core.module("utilities").uuid4();
		var host = req.headers.host;
		var splitHost = host.split(":");
		var command = msgObject.command;
		command = command.split(" ");
		var method = command[0];
		var path = command[1];
		var message = {
			"type": "websockets",
			"msgId": msgId,
			"state": "incoming",
			"directional": "duplex",
			"request": {
				"path": path,
				"host": splitHost[0],
				"port": splitHost[1],
				"query": null,
				"params": null,
				"cookies": null,
				"ip": null,
				"verb": method,
				"secure": false,
				"body": msgObject,					
			}
		}
		log("debug","WebSockets Server Interface > Sending message " + message.msgId + " to router", message, "WEBSOCKETS_REQ_TO_ROUTER");
		var responseListener = function WebSocketsRouteMessageResponseListener(msg){
			log("debug","WebSockets Server Interface > Received response " + msg.msgId + " from router", msg, "WEBSOCKETS_RES_FROM_ROUTER");
			resReturned = true;
			ws.send(JSON.stringify(msg.response.body));
			instances[name].removeListener('outgoing.' + msgId, responseListener);
		}
		instances[name].on('outgoing.' + msgId, responseListener);
		req.router.incoming(message);
		var timeout = 5000;
		var timer = 0;
		var interval = setInterval(function WebsocketsRouteMessageTimeoutHandler(){
			if(!resReturned && timer < timeout){
				timer += 500;
			} else if (!resReturned && timer >= timeout) {
				ws.send(JSON.stringify({"error":"Request timed out"}));
				resReturned = true;
				clearInterval(interval);
				instances[name].removeListener('outgoing.' + msgId, responseListener);
			} else if (resReturned) {
				clearInterval(interval);
				instances[name].removeListener('outgoing.' + msgId, responseListener);
			}
		},500);
		return;
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();