/*!
* ISNode Blackrock WebSockets Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISInterface("WebSockets"), log = isnode.module("logger").log;
		log("debug", "Blackrock WebSockets Interface > Initialising...");
		ismod.startInterface = startInterface;
		//ismod.startInterfaces();
		return ismod;
	}

	/**
	 * (Internal) Attempts to start a defined WebSockets interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function(name){
		var cfg = isnode.cfg().interfaces.websockets[name];
		log("startup","WebSockets Server Interface > Starting and binding WebSockets Interface (" + name + ") to the HTTP Server Interface (" + cfg.httpInterface + ").");
		var routers = [];
		for(var routerName in isnode.cfg().router.instances){
			if(isnode.cfg().router.instances[routerName].interfaces && (isnode.cfg().router.instances[routerName].interfaces.includes("*") || isnode.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(isnode.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){
			log("startup","WebSockets Interface Module > Cannot start " + protocol + " interface (" + name + ") on port " + cfg.port + " as it is not mapped to any routers.");
			return;
		}
		var httpInterface = isnode.module("http", "interface").get(cfg.httpInterface);
		var	WebSocket = require('./support/ws/ws');
		var timeoutCounter = 0;
		var timeout = 10000;
		var intervalObject = setInterval(function(){
			timeoutCounter = timeoutCounter + 100;
			if(httpInterface.server && httpInterface.listening == true){
				clearInterval(intervalObject);
				var server = httpInterface.server;
				instances[name].wss = new WebSocket.Server({server});
				listen(instances[name].wss);
				log("startup","WebSockets Interface > Started, Bound to HTTP Server Interface and Listening.");
				return true;				
			}
			if(timeoutCounter >= timeout){
				clearInterval(intervalObject);
				log("error","WebSockets Interface > Error binding to HTTP interface.");
				return false;
			}
		},5);
	}

	/**
	 * (Internal) Listen for Incoming Connections
	 * @param {object} server - WebSockets Server Object
	 */
	var listen = function(server) {
		var os = require("os");
		server.on('connection', function connection(ws, req) {
			log("debug","WebSockets Interface > New remote client session initiated");
			var cxnFormat = "string";
			var cxnMode = "gateway";
			var sessionId = isnode.module("utilities").uuid4();
			var responseListener = function(resMsg){
				log("debug","WebSockets Interface > Received message " + resMsg.msgId + " from router", resMsg);
				if(cxnFormat == "string")
					ws.send(resMsg.response.message);
				else
					ws.send(JSON.stringify(resMsg.response.body));
			}
			ismod.isnode.interfaces.server.websockets.on('outgoing.' + sessionId, responseListener);
			ws.on('close', function incoming(msg){
				ismod.isnode.interfaces.server.websockets.removeListener('outgoing.' + sessionId, responseListener);
				log("debug","WebSockets Server Interface > Remote client session closed.",{sessionId: sessionId});
			});
			ws.on('message', function incoming(msg) {
				if(cxnMode == "gateway"){
					var msgType = isnode.module("utilities").isJSON(msg);
					if(msgType == "json_string"){
						var msgObject = JSON.parse(msg);
						msgObject.reference = isnode.module("utilities").randomString(12);
						if(!msgObject.command){
							ws.send('{\"message\":\"Command not specified\"}');
							return;
						}
					} else {
						var msgObject = {
							"command": msg,
							"reference": isnode.module("utilities").randomString(12)
						}
					}
					if(msgObject.command == "help"){
						Help(ws,req,msgObject,cxnFormat);
					} else if (msgObject.command.startsWith("set format")) {
						cxnFormat = SetFormat(ws,req,msgObject,cxnFormat);
					} else if(msgObject.command == "exit"){
						Exit(ws,req,msgObject,cxnFormat,responseListener,sessionId);
					} else {
						RouteMessage(ws,req,msgObject,cxnFormat,sessionId);
					}
				}
			});
		});	
	    return;
	}

	var Help = function(ws,req,msgObject,cxnFormat){
		log("debug","WebSockets Server Interface > Returning help section on client request");
		if(cxnFormat == "string"){
			ws.send('Help not implemented.');
		} else if (cxnFormat == "json"){
			ws.send("{\"message\":\"Help not implemented\"}");
		}
		return;
	}

	var Exit = function(ws,req,msgObject,cxnFormat,responseListener,sessionId){
		ws.close(1000,'Exiting ISNode WebSocket Shell on Client Request.');
		return;
	}

	var SetFormat = function(ws,req,msgObject,cxnFormat){
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
		log("debug","WebSockets Server Interface > Updating session format to "+cxnFormat+" on client request");
		return cxnFormat;
	}

	var RouteMessage = function(ws,req,msgObject,cxnFormat,sessionId){
		var resReturned = false;
		var msgId = isnode.module("utilities").uuid4();
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
		log("debug","WebSockets Server Interface > Sending message " + message.msgId + " to router", message);
		var responseListener = function(msg){
			log("debug","WebSockets Server Interface > Received response " + msg.msgId + " from router", msg);
			resReturned = true;
			ws.send(JSON.stringify(msg.response.body));
			ismod.isnode.interfaces.server.websockets.removeListener('outgoing.' + msgId, responseListener);
		}
		ismod.isnode.interfaces.server.websockets.on('outgoing.' + msgId, responseListener);
		ismod.isnode.router.incoming(message);
		var timeout = 5000;
		var timer = 0;
		var interval = setInterval(function(){
			if(!resReturned && timer < timeout){
				timer += 500;
			} else if (!resReturned && timer >= timeout) {
				ws.send(JSON.stringify({"error":"Request timed out"}));
				resReturned = true;
				clearInterval(interval);
				ismod.isnode.interfaces.server.websockets.removeListener('outgoing.' + msgId, responseListener);
			} else if (resReturned) {
				clearInterval(interval);
				ismod.isnode.interfaces.server.websockets.removeListener('outgoing.' + msgId, responseListener);
			}
		},500);
		return;
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();