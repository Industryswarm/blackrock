/*
 * ISNode Blackrock HTTP Interface Module
 *
 * Copyright (c) 2020 Darren Smith
 * Licensed under the LGPL license.
 */

;!function HTTPWrapper(undefined) {




	/** Initialise Variables & Create String Prototype Method */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var mustache = require('./support/mustache.js'), formidable = require('./support/formidable');
	var isnode, ismod, log, config, instances = [], client = {}, utils = {}, streamFns = {}, pipelines = {}, viewCache = {};






	/**
	 * =======================================
	 * HTTP/S Interface Initialisation Methods
	 * =======================================
	 */


	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function HTTPInit(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISInterface("HTTP"), log = isnode.module("logger").log, config = isnode.cfg();
		log("debug", "Blackrock HTTP Interface > Initialising...");
		ismod.client = client;
		ismod.startInterface = startInterface;
		ismod.get = get;
		ismod.startInterfaces();
		return ismod;
	}

	/**
	 * (Internal > Init) Attempts to start a defined HTTP interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function HTTPStartInterface(name){
		const cfg = config.interfaces.http[name];
		if(cfg.ssl == true) { var protocol = "HTTPS" }
		else { var protocol = "HTTP" }
		log("startup","Blackrock HTTP Interface > Attempting to start " + protocol + " interface (" + name + ") on port " + cfg.port + ".");
		var routers = [];
		for(var routerName in config.router.instances){
			if(config.router.instances[routerName].interfaces && (config.router.instances[routerName].interfaces.includes("*") || config.router.instances[routerName].interfaces.includes(name))) {
				routers.push(isnode.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){ log("error","Blackrock HTTP Interface > Cannot start " + protocol + " interface (" + name + ") on port " + cfg.port + " as it is not mapped to any routers."); return; }
		var ISPipeline = pipelines.processRequestStream();
		utils.isPortTaken(cfg.port, function HTTPIsPortTakenHandler(err, result){
			var inst;
			if(result != false){ log("error","Blackrock HTTP Interface > Cannot load HTTP interface (" + name + ") as the defined port (" + cfg.port + ") is already in use."); return; }
			if(cfg.ssl && (!cfg.key || !cfg.cert)){ log("error","Blackrock HTTP Interface > Cannot load SSL interface as either the key or cert has not been defined (" + name + ")."); return; }
			try {
				if(cfg.ssl) { var httpLib = "https" } else { var httpLib = "http" };
				instances[name] = inst = new isnode.ISNode().extend({});
				inst.listening = false;
				var serverLib = require('./support/' + httpLib);
				if(cfg.ssl) { inst.server = serverLib(cfg.key, cfg.cert) } else { inst.server = serverLib() };
				
			} catch (err) {
				log("error","Blackrock HTTP Interface > Error instantiating " + httpLib.toUpperCase() + " interface (" + name + ").",err);
				if(inst) { delete inst; }
				return;
			}
			inst.server.on('request', function HTTPPrimaryRequestHandler(request, response) {
				var myMsg = {
					httpVersion: request.httpVersion,
					host: request.headers.host,
					verb: request.method,
					url: request.url,
					headers: request.headers,

				}
				log("debug","Blackrock HTTP Interface > Received Incoming Request", myMsg);
				request.interface = name;
				for (var i = 0; i < routers.length; i++) {
					request.router = routers[i];
					if(protocol == "HTTPS") { request.secure = true; } else { request.secure = false; }
					new ISPipeline({ "req": request, "res": response }).pipe();
				}
			});
			inst.server.listen(cfg.port, function HTTPListenHandler(){
				log("startup","Blackrock HTTP Interface > " + httpLib.toUpperCase() + " Interface (" + name + ") started successfully on port " + cfg.port); inst.listening = true;
			});
			ismod.instances = instances;
		});

	}




	/**
	 * (Internal > Init) Exports the HTTP/S Server Interface
	 * @param {string} name - The name of the interface
	 */
	var get = function HTTPGetInstance(name){
		return instances[name];
	}




	/**
	 * ======================
	 * Event Stream Pipelines
	 * ======================
	 */

	/**
	 * (Internal > Pipelines) Processes the Incoming Request Stream [HTTP/S]
	 */
	pipelines.processRequestStream = function HTTPProcessRequestStreamPipeline(){
		const lib = isnode.lib, rx = lib.rxjs, op = lib.operators;
		const ISPipeline = new isnode.ISNode().extend({
			constructor: function HTTPProcessRequestStreamConstructor(evt) { this.evt = evt; },
			callback: function HTTPProcessRequestStreamCallback(cb) { return cb(this.evt); },
			pipe: function HTTPProcessRequestStreamPipe() {
				log("debug", "Blackrock HTTP Interface > Request Event Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(
					op.map(evt => { if(evt) return streamFns.checkErrors(evt); }),
					op.map(evt => { if(evt) return streamFns.determineContentType(evt); }),
					op.map(evt => { 
						if(evt && evt.req.multipart) { 
							return streamFns.parseMultiPart(evt); 
						} else if (evt && !evt.req.multipart) { 
							return streamFns.parseNonMultiPart(evt); 
						} 
					})
				).toPromise();
				const stream2 = rx.from(stream1).pipe(
					op.map(evt => { if(evt) return streamFns.processRequestData(evt); }),
					op.map(evt => { if(evt) return streamFns.parseCookies(evt); }),
					op.map(evt => { if(evt) return streamFns.processHostPathAndQuery(evt); }),
					op.map(evt => { if(evt) return streamFns.fetchIPAddresses(evt); }),
					op.map(evt => { if(evt) return streamFns.isRequestSecure(evt); }),
					op.map(evt => { if(evt) return streamFns.prepareRequestMessage(evt); }),
					op.map(evt => { if(evt) return streamFns.fixTrailingSlash(evt); }),
					streamFns.lookupRequestRoute,
					op.map(evt => { if(evt) return streamFns.pipeFilesystemFiles(evt); }),
					op.map(evt => { if(evt) return streamFns.routeRequest(evt); })
				);
				stream2.subscribe(function HTTPProcessRequestStreamSubscribeHandler(res) {
					//console.log(res);
				});
			}
		});
		return ISPipeline;
	};

	/**
	 * (Internal > Pipelines) Processes the Outgoing Response Stream [HTTP/S]
	 */
	pipelines.processResponseStream = function HTTPProcessResponseStreamPipeline(){
		const lib = isnode.lib, rx = lib.rxjs, op = lib.operators;
		const ISPipeline = new isnode.ISNode().extend({
			constructor: function HTTPProcessResponseStreamConstructor(evt) { this.evt = evt; },
			callback: function HTTPProcessResponseStreamCallback(cb) { return cb(this.evt); },
			pipe: function HTTPProcessResponseStreamPipe() {
				log("debug", "Blackrock HTTP Interface > Response Event Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(
					op.map(evt => { if(evt) return streamFns.preventDuplicateResponses(evt); }),
					op.map(evt => { if(evt) return streamFns.setStatusCookiesAndHeaders(evt); }),
					op.map(evt => { if(evt) return streamFns.checkAndFinaliseLocationRequest(evt); }),
					op.map(evt => { if(evt) return streamFns.checkAndFinaliseResponseWithoutView(evt); }),
					op.map(evt => { if(evt) return streamFns.checkAndFinaliseFileResponse(evt); }),
					op.map(evt => { if(evt) return streamFns.checkAndSetMIMEType(evt); }),
					op.map(evt => { if(evt) return streamFns.detectViewType(evt); }),
					op.map(evt => { 
						if(evt && evt.msg.viewType == "object") { 
							return streamFns.processObjectViewResponse(evt); 
						} else if (evt && evt.msg.viewType != "object") { 
							return streamFns.processFileViewResponse(evt); 
						}  
					})
				).toPromise();
				const stream2 = rx.from(stream1).pipe(
					op.map(evt => { if(evt) return streamFns.afterResPromise(evt); })
				);
				stream2.subscribe(function HTTPProcessResponseStreamSubscribeHandler(res) {
					//console.log(res);
				});
			}
		});
		return ISPipeline;
	};





	/**
	 * =================================
	 * Request Stream Processing Methods
	 * =================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Check HTTP Request For Errors
	 * @param {object} evt - The Request Event
	 */
	streamFns.checkErrors = function HTTPCheckErrors(evt) {
		evt.res.resReturned = false;
	    evt.req.on('error', (err) => { log("error","HTTP Interface > Error processing incoming request", err); evt.res.statusCode = 400; evt.res.end(); evt.res.resReturned = true; });
	    evt.res.on('error', (err) => { log("error","HTTP Interface > Error processing outgoing response", err); });
	    log("debug", "Blackrock HTTP Interface > [1] Checked Request for Errors");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Determine Content-Type of Request Message
	 * @param {object} evt - The Request Event
	 */
	streamFns.determineContentType = function HTTPDetermineContentType(evt) {
	    const {method, url, headers} = evt.req;
	    for(var header in headers){ header = header.toLowerCase(); if(header == "content-type") { var contentType = headers[header]; } }
	    var contentTypes = {};
	    if(contentType){
	    	contentType = contentType.split(";");
	    	for (var i = 0; i < contentType.length; i++) {
	    		contentType[i] = contentType[i].trim();
	    		if(contentType[i] == "multipart/form-data") { var multipart = true; }
	    		if(contentType[i].startsWith("boundary=")){ var boundary = contentType[i].split("="); boundary = boundary[1]; }
	    	}
	    }
	    if(!boundary) { var boundary = "" }; 
	    if(multipart) { evt.req.multipart = true; } else { evt.req.multipart = false; }; 
	    log("debug", "Blackrock HTTP Interface > [2] Content Type Determined");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [3a]) Parses a multi-part http message
	 * @param {object} evt - The Request Event
	 */
	streamFns.parseMultiPart = function HTTPParseMultiPart(evt) {
  		return new Promise((resolve, reject) => {
			var form = new formidable.IncomingForm();
			if(config.interfaces.http[req.interface].fileUploadPath) { form.uploadDir = config.interfaces.http[req.interface].fileUploadPath; }
			else { form.uploadDir = "./tmp/"; }
			if(config.interfaces.http[req.interface].maxUploadFileSizeMb) { form.maxFileSize = config.interfaces.http[req.interface].maxUploadFileSizeMb * 1024 * 1024; }
			else { form.maxFileSize = 50 * 1024 * 1024; }
			try { form.parse(req, function HTTPParseMultiPartFormParser(err, fields, files) { var body = fields; body.files = files; body.error = err; evt.data = body; resolve(evt); }); }
			catch (err) { evt.data = {error: "File Upload Size Was Too Large"}; resolve(evt); }
			log("debug", "Blackrock HTTP Interface > [3] Parsed Multi-Part Request Message");
		});
	}

	/**
	 * (Internal > Stream Methods [3b]) Parses a non-multi-part http message
	 * @param {object} evt - The Request Event
	 */
	streamFns.parseNonMultiPart = function HTTPParseNonMultiPart(evt) {
		return new Promise((resolve, reject) => {
		    let data = []; 
		    evt.req.on('data', (chunk) => { 
		    	data.push(chunk); 
		    }).on('end', () => { 
		    	evt.data = data; 
		    	resolve(evt); 
		    });
		    log("debug", "Blackrock HTTP Interface > [3] Parsed Non-Multi-Part Request Message");
	    });
	}

	/**
	 * (Internal > Stream Methods [4]) Process Request Data
	 * @param {object} evt - The Request Event
	 */
	streamFns.processRequestData = function HTTPProcessRequestData(evt) {
	 	var data = evt.data;
		try { if(Buffer.from(data)) { data = Buffer.concat(data).toString(); } } catch(err){ null; }
        if(data && isnode.module("utilities").isJSON(data) == "json_string"){ data = JSON.parse(data); }
        else if (data && isnode.module("utilities").isJSON(data) == "json_object") { data = data; }
        else if (data) { data = require('querystring').parse(data); }
        evt.data = data;
        log("debug", "Blackrock HTTP Interface > [4] Request Body Data Processed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Parses Cookies From Headers
	 * @param {object} evt - The Request Event
	 */
	streamFns.parseCookies = function HTTPProcessCookies(evt) {
	    var list = {}, rc = evt.req.headers.cookie;
	    rc && rc.split(';').forEach(function( cookie ) {
	        var parts = cookie.split('=');
	        list[parts.shift().trim()] = decodeURI(parts.join('='));
	    });
	    evt.req.cookieObject = list;
	    log("debug", "Blackrock HTTP Interface > [5] Cookies Parsed");
	    return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Parse Host, Path & Query From URL
	 * @param {object} evt - The Request Event
	 */
	streamFns.processHostPathAndQuery = function HTTPProcessHostPathAndQuery(evt) {
		var url = evt.req.url, headers = evt.req.headers, path = url, splitPath = path.split("?");
		evt.req.queryStringObject = {};
		if(splitPath[1]){
			var splitQuery = splitPath[1].split("&");
			for (var i = 0; i < splitQuery.length; i++) {
				var moreSplitQuery = splitQuery[i].split("=");
				if(!evt.req.queryStringObject[moreSplitQuery[0]]) { evt.req.queryStringObject[moreSplitQuery[0]] = moreSplitQuery[1]; }
				else {
					var oldValue = evt.req.queryStringObject[moreSplitQuery[0]];
					evt.req.queryStringObject[moreSplitQuery[0]] = [];
					evt.req.queryStringObject[moreSplitQuery[0]].push(oldValue);
					evt.req.queryStringObject[moreSplitQuery[0]].push(moreSplitQuery[1]);
				}
			}
		}
		var splitHost = headers.host.split(":"), host = splitHost[0], port = splitHost[1];
		evt.req.theHost = host;
		evt.req.thePort = port;
		evt.req.thePath = splitPath[0];
		log("debug", "Blackrock HTTP Interface > [6] Host Path & Query Processed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Parse IP Addresses
	 * @param {object} evt - The Request Event
	 */
	streamFns.fetchIPAddresses = function HTTPFetchIPAddresses(evt) {
	 	const {method, url, headers, connection} = evt.req; var reqIpAddressV6 = "";
		if(headers["X-Forwarded-For"]) { var reqIpAddress = headers["X-Forwarded-For"]; }
		else if (connection.remoteAddress) { var reqIpAddress = connection.remoteAddress; }
		else { var reqIpAddress = ""; }
		if (reqIpAddress.indexOf(':') > -1) {
			var startPos = reqIpAddress.lastIndexOf(':'), endPos = reqIpAddress.length;
			var ipv4 = reqIpAddress.slice(startPos + 1, endPos), ipv6 = reqIpAddress.slice(0, startPos - 1);
			evt.req.reqIpAddress = ipv4; evt.req.reqIpAddressV6 = ipv6;
		}
		log("debug", "Blackrock HTTP Interface > [7] IP Addresses Processed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Parse Whether Request is Secure
	 * @param {object} evt - The Request Event
	 */
	streamFns.isRequestSecure = function HTTPIsRequestSecure(evt) {
	 	const {headers} = evt.req, request = evt.req;
		if(headers["X-Forwarded-Proto"] && headers["X-Forwarded-Proto"] == "http") { evt.req.reqSecure = false; }
		else if(headers["X-Forwarded-Proto"] && headers["X-Forwarded-Proto"] == "https") { evt.req.reqSecure = true; }
		else { evt.req.reqSecure = request.secure; }
		log("debug", "Blackrock HTTP Interface > [8] Request SSL (Secure) Enabled Flag Processed");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Prepare Request Message
	 * @param {object} evt - The Request Event
	 */
	streamFns.prepareRequestMessage = function HTTPPrepareRequestMessage(evt) {
		var request = evt.req, msgId = isnode.module("utilities").uuid4(), {method, url, headers} = request;
		evt.req.theMessage = {
			"type": "http", "interface": request.interface, "msgId": msgId, "state": "incoming", "directional": "request/response",
			"request": {
				"path": evt.req.thePath, "host": evt.req.theHost, "port": evt.req.thePort, "query": evt.req.queryStringObject, 
				"headers": request.headers, "params": null, "cookies": evt.req.cookieObject,
				"ip": evt.req.reqIpAddress, "ipv6": evt.req.reqIpAddressV6, "verb": method, "secure": evt.req.reqSecure, "body": evt.data,
			}
		}
		log("debug", "Blackrock HTTP Interface > [9] Request Message Prepared");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [10]) Fix Trailing Slash
	 * @param {object} evt - The Request Event
	 */
	streamFns.fixTrailingSlash = function HTTPFixTrailingSlash(evt) {
	 	const {method, url, headers, connection, theMessage} = evt.req, response = evt.res;
		if(theMessage.request.path.endsWith("/") && theMessage.request.path != "/"){
			evt.res.resReturned = true;
			var newPath = theMessage.request.path.slice(0, -1);
			response.writeHead(301, {Location: newPath});
			response.end();
			return;
		} else if (theMessage.request.path == "") {
			evt.res.resReturned = true;
			response.writeHead(301, {Location: "/"});
			response.end();
			return;
		}
		log("debug", "Blackrock HTTP Interface > [10] Trailing Slash Fixed If Present");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [11]) Lookup Request Route
	 * @param {object} evt - The Request Event
	 */
	streamFns.lookupRequestRoute = function HTTPLookupRequestRoute(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					const request = evt.req, {theMessage} = request;
					log("debug", "Blackrock HTTP Interface > [11] Searching For Request Route");
					request.router.route(theMessage.request.host, theMessage.request.path, function HTTPRouterRouteCallback(route) {
						if(route && route.match && route.match.service){
							var basePath = isnode.module("services").service(route.match.service).cfg().basePath;
							if(theMessage.request.path == basePath) { theMessage.request.path += "/"; }
						}
						theMessage.request.params = route.param;
						if(route && route.match && route.match.service){
							var srv = isnode.module("services").service(route.match.service);
							if(srv.cfg().basePath) { var base = srv.cfg().basePath; }
							else { var base = ""; }
							if(theMessage.request.path.startsWith(base)){ var htmlPath = theMessage.request.path.slice(base.length); }
							else { var htmlPath = theMessage.request.path; }
						} else { var htmlPath = theMessage.request.path; }
						evt.req.route = route;
						evt.req.htmlPath = htmlPath;
						observer.next(evt);
					}); 
					return;
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [12]) Pipe (HTML) Filesystem Files
	 * @param {object} evt - The Request Event
	 */
	streamFns.pipeFilesystemFiles = function HTTPPipeFilesystemFiles(evt) {
		var fs = require('fs'), os = require("os"), request = evt.req, response = evt.res, resReturned = false, {method, url, headers, route, htmlPath, theMessage} = request, rootBasePath = __dirname + "/../../../../";
		var msg = request.theMessage;
		try { var stats = fs.lstatSync(rootBasePath + "services/" + route.match.service + "/html" + htmlPath); var directPath = true; } 
		catch(e) { var stats = false; }
		if(!stats || stats.isDirectory()){
			try { var stats = fs.lstatSync(rootBasePath + "services/" + route.match.service + "/html" + htmlPath + "/index.html"); var directPath = false; } 
			catch(e) { var stats = false; }
		}
		if(stats && stats.isFile()){
			if(directPath == true){ var pathToRead = rootBasePath + "services/" + route.match.service + "/html/" + htmlPath; }
			else { var pathToRead = rootBasePath + "services/" + route.match.service+"/html/" + htmlPath + "/index.html"; }
			var filename = theMessage.request.path.split("/"), mimeType = utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
			if (!mimeType) { mimeType = 'application/octet-stream'; }
			response.writeHead(200, { "Content-Type": mimeType });
			fs.createReadStream(pathToRead).pipe(response);
			evt.res.resReturned = true;
			log("debug", "Blackrock HTTP Interface > [12] Filesystem file piped directly through", { file: theMessage.request.path, msgId: theMessage.msgId });
			return;
		} else {
			log("debug", "Blackrock HTTP Interface > [12] Requested File is Not a Filesystem File (would have piped if so)");
			return evt;
		}
	}

	/**
	 * (Internal > Stream Methods [13]) Route Request via Router
	 * @param {object} evt - The Request Event
	 */
	streamFns.routeRequest = function HTTPRouteRequest(evt) {
		const request = evt.req, ISResPipeline = pipelines.processResponseStream();
		var resReturned = false;
		var responseListener = function HTTPRouteRequestResponseListener(msg){ 
			instances[request.interface].removeListener('outgoing.' + msg.msgId, responseListener);
			resReturned = true;
			new ISResPipeline({"req": evt.req, "res": evt.res, "msg": msg}).pipe(); 
		}
		instances[request.interface].on('outgoing.' + request.theMessage.msgId, responseListener);
		var timeout = config.interfaces.http[request.interface].requestTimeout, timer = 0;
		var interval = setInterval(function HTTPRouteRequestTimeoutHandler(){
			if(!resReturned && timer < timeout){
				timer += 10;
			} else if (!resReturned && timer >= timeout) {
				evt.res.statusCode = 504;
				evt.res.setHeader('Content-Type', 'application/json');
				evt.res.end(JSON.stringify({"error":"Request timed out"}));
				resReturned = true;
				clearInterval(interval);
				instances[request.interface].removeListener('outgoing.' + evt.req.theMessage.msgId, responseListener);
			} else if (resReturned) {
				clearInterval(interval);
			}
		}, 10);
		log("debug","HTTP Interface > [13] Sending incoming message " + request.theMessage.msgId + " to router", request.theMessage);
		request.router.incoming(request.theMessage);
		return evt;
	}











	/**
	 * =================================
	 * Response Stream Processing Methods
	 * =================================
	 */

	/**
	 * (Internal > Response Stream Methods [1]) Prevent Duplicate Responses
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.preventDuplicateResponses = function HTTPPreventDuplicateResponses(evt) {
		log("debug", "Blackrock HTTP Interface > [1] Received response from router, Mitigating Against Duplicate Responses", { msgId: evt.msg.msgId });
 		if(!evt.msg.interface) { return; }; if(evt.res.resReturned) { return; }
		evt.res.resReturned = true;
		return evt;
	}

	/**
	 * (Internal > Response Stream Methods [2]) Set Status Code, Cookies & Headers
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.setStatusCookiesAndHeaders = function HTTPSetStatusCookiesAndHeaders(evt) {
		evt.res.statusCode = evt.msg.response.statusCode;
		if(evt.msg.response.cookies){
			for (var name in evt.msg.response.cookies) {
				evt.res.setHeader('Set-Cookie', name + "=" + evt.msg.response.cookies[name].value + "; path=/;");
			}
		}
		if(evt.msg.response.clearCookies){
			for (var name in evt.msg.response.clearCookies) {
				evt.res.setHeader('Set-Cookie', name + '=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
			}
		}
		if(evt.msg.response.headers && typeof evt.msg.response.headers === 'object' && evt.msg.response.headers !== null){
			for (var header in evt.msg.response.headers) {
				evt.res.setHeader(header, evt.msg.response.headers[header]);
			}
		}
		log("debug", "Blackrock HTTP Interface > [2] Status, Headers & Cookies Set Against the Response Message");
		return evt;
	}

	/**
	 * (Internal > Response Stream Methods [3]) Check & Finalise Location Request
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.checkAndFinaliseLocationRequest = function HTTPCheckAndFinaliseLocationRequest(evt) {
		if(evt.msg.response.location){
			evt.res.setHeader('Location', evt.msg.response.location);
			evt.res.end();
			log("debug", "Blackrock HTTP Interface > [3] Checked If Redirect & Redirected Request");
			return;
		} else {
			log("debug", "Blackrock HTTP Interface > [3] Checked If Redirect & It Was Not");
			return evt;
		}
	}

	/**
	 * (Internal > Response Stream Methods [4]) Check & Finalise JSON Response Without View
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.checkAndFinaliseResponseWithoutView = function HTTPCheckAndFinaliseResponseWithoutView(evt) {
		if(!evt.msg.response.view && evt.msg.response.body){
			evt.res.setHeader('Content-Type', 'application/json');
			evt.res.end(JSON.stringify(evt.msg.response.body));
			log("debug", "Blackrock HTTP Interface > [4] Checked If No View & Finalised Response");
			return;
		} else {
			log("debug", "Blackrock HTTP Interface > [4] Checked If No View But There Was One");
			return evt;
		}
	}

	/**
	 * (Internal > Response Stream Methods [5]) Check & Finalise File Response
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.checkAndFinaliseFileResponse = function HTTPCheckAndFinaliseFileResponse(evt) {
		if (evt.msg.response.file) {
			var fs = require('fs');
			try { var stats = fs.lstatSync(evt.msg.response.file); }
			catch(e) { var stats = false; }
			if(stats && stats.isFile()){
				var pathToRead = evt.msg.response.file;
				log("debug","Blackrock HTTP Interface > [5] Found File - Sending to client ", {file: pathToRead, msgId: evt.msg.msgId });
				var filename = pathToRead.split("/");
				var mimeType = utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
				if (!mimeType) { mimeType = 'application/octet-stream'; }
				evt.res.writeHead(200, { "Content-Type": mimeType });
				var stream = fs.createReadStream(pathToRead), had_error = false;
				stream.pipe(evt.res);
				stream.on('error', function HTTPCheckAndFinaliseFileResponseErrHandler(err){ had_error = true; if(evt.msg.response.cb) { evt.msg.response.cb(err, null); } });
				stream.on('close', function HTTPCheckAndFinaliseFileResponseCloseHandler(){
					if (!had_error && evt.msg.response.cb) {
						evt.msg.response.cb(null, { success: true, code: "FILE_DOWNLOADED", message: "File Successfully Downloaded"});
					}
				});
				return;
			} else {
				log("debug", "Blackrock HTTP Interface > [5] Could Not Find File - Responding With Error");
				evt.res.setHeader('Content-Type', 'application/json');
				evt.res.end(JSON.stringify({error: "Cannot Find File"}));
				return;
			}
		} else {
			log("debug", "Blackrock HTTP Interface > [5] Checked If This Was a File Response But It Was Not");
			return evt;
		}
	}

	/**
	 * (Internal > Response Stream Methods [6]) Check & Set MIME Type
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.checkAndSetMIMEType = function HTTPCheckAndSetMIMEType(evt) {
		var urlSplit = evt.req.url.split("/");
		var filename = urlSplit[urlSplit.length - 1];
		var fileType = filename.split(".")[1];
		var mimeType = utils.checkMIMEType(fileType);
		if (!mimeType) { mimeType = 'text/html'; }
		evt.res.setHeader('Content-Type', mimeType);
		log("debug", "Blackrock HTTP Interface > [6] Checked & Set MIME Type for This Response", {mimeType: mimeType});
		return evt;
	}

	/**
	 * (Internal > Response Stream Methods [7]) Detect View Type
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.detectViewType = function HTTPDetectViewType(evt) {
		if(typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) { evt.msg.viewType = "object"; }
		else { evt.msg.viewType = "file"; }
		log("debug", "Blackrock HTTP Interface > [7] View Type Detected", {viewType: evt.msg.viewType});
		return evt;
	}

	/**
	 * (Internal > Response Stream Methods [8]) Process Object View Response
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.processObjectViewResponse = function HTTPProcessObjectViewResponse(evt) {
		return new Promise((resolve, reject) => {
			var basePath = __dirname + "/../../../../", fs = require('fs');
			if(typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) {
				if(evt.msg.response.view.file) {
					try {
						fs.readFile(basePath + "services/" + evt.msg.service + "/views/" + evt.msg.response.view.file, "utf8", function HTTPProcessObjectViewResponseReadFileCallback(err, htmlData) {
						    if (err) {
								log("error","Blackrock HTTP Interface > [8] " + basePath + "services/" + evt.msg.service + "/views/" + evt.msg.response.view.file + " view does not exist.", evt.msg);
								evt.res.setHeader('Content-Type', 'application/json');
								evt.res.end(JSON.stringify(evt.msg.response.body));	
								return;							    	
						    }       
						    renderView(evt.msg, evt.res, mustache, htmlData);
						    log("debug","Blackrock HTTP Interface > [8] Object-Type View Rendered Successfully");
						    return;
						});
					} catch(err){
						log("error","Blackrock HTTP Interface > [8] View does not exist", { view: evt.msg.response.view });
						evt.res.setHeader('Content-Type', 'application/json');
						evt.res.end(JSON.stringify(evt.msg.response.body));	
						return;	
					}
				} else if (evt.msg.response.view.html) {
					var htmlData = evt.msg.response.view.html;
					utils.renderView(evt.msg, evt.res, mustache, htmlData);
					log("debug","Blackrock HTTP Interface > [8] Successfully Rendered HTML View");
					return;
				} else {
					log("error","Blackrock HTTP Interface > [8] Error Loading View - Unknown Type.");
					evt.res.setHeader('Content-Type', 'application/json');
					evt.res.end(JSON.stringify(evt.msg.response.body));
					return;	
				}
			} else {
				log("error","Blackrock HTTP Interface > [8] Skipped Method to Process Object View Response");
				resolve(evt);
			}
		});
	}

	/**
	 * (Internal > Response Stream Methods [9]) Process File View Response
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.processFileViewResponse = function HTTPProcessFileViewResponse(evt) {
		return new Promise((resolve, reject) => {
			var basePath = __dirname + "/../../../../", fs = require('fs');
			var viewPath = basePath + "services/" + evt.msg.service + "/views/" + evt.msg.response.view;
			if(viewCache[viewPath] && viewCache[viewPath].content) {
				utils.renderView(evt.msg, evt.res, mustache, viewCache[viewPath].content);
				resolve(evt);
				return;
			} else {
				try {
					fs.readFile(viewPath, "utf8", function HTTPProcessFileViewResReadFileCallback(err, htmlData) {
					    if (err) {
							log("error","Blackrock HTTP Interface > [9] View does not exist", {view: evt.msg.response.view });
							evt.res.setHeader('Content-Type', 'application/json');
							evt.res.end(JSON.stringify(evt.msg.response.body));	
							return;							    	
					    }
					    viewCache[viewPath] = {
					    	content: htmlData,
					    	expiry: "TBC"
					    }
					    utils.renderView(evt.msg, evt.res, mustache, htmlData);
					    log("debug","Blackrock HTTP Interface > [9] File-Type View Rendered Successfully");
					    return;
					});
				} catch(err){
					log("error","Blackrock HTTP Interface > [9] View does not exist...", {view: evt.msg.response.view });
					evt.res.setHeader('Content-Type', 'application/json');
					evt.res.end(JSON.stringify(evt.msg.response.body));
				}
				resolve(evt);
			}
		});
	}

	/**
	 * (Internal > Response Stream Methods [10]) After Response Promise Method
	 * @param {object} evt - Response Message From Router (Not Same As Request Event)
	*/
	streamFns.afterResPromise = function HTTPAfterResPromise(evt) {
		return evt;
	}










	/**
	 * ===============
	 * Utility Methods
	 * ===============
	 */


	/**
	 * (Internal > Utilities) Render View
	 * @param {object} msg - Message Object
	 * @param {object} response - Response Object
	 * @param {object} mustache - Mustache Library
	 * @param {string} htmlData - HTML Data Context
	 */
	utils.renderView = function HTTPRenderView(msg, response, mustache, htmlData) {
		var rootBasePath = __dirname + "/../../../../", fs = require("fs"), partials = {}, regex = /{{>(.+)}}+/g, found = htmlData.match(regex);
		if(found){
			for (var i = 0; i < found.length; i++) {
				var frontRemoved = found[i].substring(4).slice(0, -2);
				try { partials[frontRemoved] = fs.readFileSync(rootBasePath + "services/" + msg.service + "/views/includes/" + frontRemoved + ".mustache", "utf8"); }
				catch(err){ null; }
			}
		}
		var output = mustache.render(htmlData, msg.response.body, partials);
		response.end(output);	
	}

	/**
	 * (Internal > Utilities) Checks if a port is already taken or in use
	 * @param {integer} port - The port number to check
	 * @param {function} cb - Callback function
	 */
	utils.isPortTaken = function HTTPIsPortTaken(port, cb) {
	  var tester = require('net').createServer()
	  	.once('error', function HTTPIsPortTakenErrHandler(err) { if (err.code != 'EADDRINUSE') { return cb(err); }; cb(null, true); })
	  	.once('listening', function HTTPIsPortTakenListeningHandler() { tester.once('close', function() { cb(null, false) }).close(); })
	  	.listen(port)
	}

	/**
	 * (Internal > Utilities) Check MIME Type Based On File Type
	 * @param {string} fileType - File Type
	 */
	utils.checkMIMEType = function HTTPCheckMIMEType(fileType) {
		var mimeTypes = {
			"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "gif": "image/gif",
			"html": "text/html", "js": "text/javascript", "css": "text/css", "csv": "text/csv",
			"pdf": "application/pdf", "md": "text/plain", "txt": "text/plain"
		};
		return mimeTypes[fileType];
	}











	/**
	 * ===================
	 * HTTP Client Library
	 * ===================
	 */


	/**
	 * (External > Client Library) Makes an HTTP Request
	 * @param {string} req - Request Object. Example:
	 * {
	 *   "url": "https://www.google.com:8080/path1/path2?test=now",
	 *   "headers": {
	 *		"Content-Type": "application/json",
	 *      "Content-Length": data.length
	 *   },
	 *   "method": "POST",
	 *   "data": {"test": "value"},
	 *   "encoding": "utf8"
	 * }
	 * @param {function} cb - Callback Function
	 */
	client.request = function HTTPClientRequest(req, cb) {

		if(!req.url) { cb({ success: false, code: 1, message: "URL Not Defined"}, null); return; }
		if(!req.method) { cb({ success: false, code: 2, message: "Method Not Defined"}, null); return; }
		if(req.url.split("/") == "http:") { var protocol = "http"; }
		else if (req.url.split("/") == "https:") { var protocol = "https"; } 
		else { cb({ success: false, code: 3, message: "Unknown Protocol"}, null); return; }
		var httpLib = require(protocol), hostname = urlPieces[2].split(":")[0];
		if(domainPieces[1]) { var port = domainPieces[1]; }
		urlPieces.shift(); urlPieces.shift(); urlPieces.shift();
		var path = "/" + urlPieces.join("/").split("?")[0], options = { "hostname": hostname, "method": req.method }

		if(port) { options.port = port; }
		if(req.headers) { options.headers = req.headers; } else { options.headers = {}; }
		if(path) { options.path = path; }

		if (req.data && isnode.module("utilities").isJSON(req.data) == "json_object") {
			if(!options.headers["Content-Type"]) { options.headers["Content-Type"] = "application/json"; }; req.data = JSON.stringify(req.data);
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String) && isnode.module("utilities").isJSON(req.data) == "json_string") {
			if(!options.headers["Content-Type"]) { options.headers["Content-Type"] = "application/json"; }
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String) && req.data.indexOf('<') !== -1 && req.data.indexOf('>') !== -1) {
			if(!options.headers["Content-Type"]) { options.headers["Content-Type"] = "application/xml"; }
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String)) {
			if(!options.headers["Content-Type"]) { options.headers["Content-Type"] = "text/plain"; }
		} else {
			if(!options.headers["Content-Type"]) { options.headers["Content-Type"] = "text/plain"; }
		}

		if(req.data && !options.headers["Content-Length"]) { options.headers["Content-Length"] = Buffer.byteLength(req.data); }

		var reqObj = httpLib.request(options, function HTTPClientRequestCallback(res) {
		  let responseData = "";
		  if(req.encoding) { res.setEncoding(req.encoding) }
		  else { res.setEncoding("utf8"); }
		  res.on('data', (chunk) => { responseData += chunk; });
		  res.on('end', () => {
		  	if (responseData && isnode.module("utilities").isJSON(responseData) == "json_string") { responseData = JSON.parse(responseData); }
		    else if (responseData && responseData.indexOf('<') == -1 && responseData.indexOf('>') == -1 && responseData.indexOf('=') !== -1) {
		    	var responseDataSplit = responseData.split("&"), responseDataNew = {};
		    	for (var i = 0; i < responseDataSplit.length; i++) {
		    		var valueSplit = responseDataSplit[i].split("=");
		    		responseDataNew[decodeURIComponent(valueSplit[0])] = decodeURIComponent(valueSplit[1]);
		    	}
		    	responseData = responseDataNew;
		    } else { responseData = decodeURIComponent(responseData); }
		    cb(null, { success: true, code: 4, message: "Response Received Successfully", statusCode: res.statusCode, data: responseData });
		    return;
		  });
		});
		reqObj.on('error', (error) => { cb({ success: false, code: 5, message: "Request Error", error: error}, null); });
		if(req.data) { reqObj.write(req.data); }
		reqObj.end();
	}

	/**
	 * (External > Client Library) Makes a GET HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.get = function HTTPClientGetRequest(url, cb) { 
		ismod.client.request({ "url": url, "headers": {}, "method": "GET", "encoding": "utf8" }, cb); 
	}

	/**
	 * (External > Client Library) Makes a POST HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.post = function HTTPClientPostRequest(url, data, options, cb) {
		var reqObj = { "url": url, "headers": {}, "method": "POST", "encoding": "utf8" };
		if(data) { reqObj.data = data; }
		if(options && options.headers) { reqObj.headers = options.headers; }
		ismod.client.request(reqObj, cb);
	}

	/**
	 * (External > Client Library) Makes a PUT HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.put = function HTTPClientPutRequest(url, data, options, cb) {
		var reqObj = { "url": url, "headers": {}, "method": "PUT", "encoding": "utf8" };
		if(data) { reqObj.data = data; }
		if(options && options.headers) { reqObj.headers = options.headers; }
		ismod.client.request(reqObj, cb);
	}

	/**
	 * (External > Client Library) Makes a DELETE HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.delete = function HTTPClientDeleteRequest(url, data, options, cb) {
		var reqObj = { "url": url, "headers": {}, "method": "DELETE", "encoding": "utf8" };
		if(data) { reqObj.data = data; }
		if(options && options.headers) { reqObj.headers = options.headers; }
		ismod.client.request(reqObj, cb);
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();