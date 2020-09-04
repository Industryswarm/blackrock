/*!
* ISNode Blackrock HTTP Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var mustache = require('./support/mustache.js'), formidable = require('./support/formidable');
	var isnode, ismod, log, config, instances = [], client = {};

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISInterface("HTTP"), log = isnode.module("logger").log, config = isnode.cfg();
		ismod.client = client;
		ismod.startInterface = startInterface;
		ismod.startInterfaces();
		return ismod;
	}

	/**
	 * (Internal) Attempts to start a defined HTTP interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function(name){
		var cfg = config.interfaces.http[name];
		if(cfg.ssl == true)
			var protocol = "HTTPS"
		else
			var protocol = "HTTP"
		log("startup","HTTP Interface Module > Attempting to start " + protocol + " interface (" + name + ") on port " + cfg.port + ".");
		var routers = [];
		for(var routerName in config.router.instances){
			if(config.router.instances[routerName].interfaces && (config.router.instances[routerName].interfaces.includes("*") || config.router.instances[routerName].interfaces.includes(name))) {
				routers.push(isnode.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){
			log("startup","HTTP Interface Module > Cannot start " + protocol + " interface (" + name + ") on port " + cfg.port + " as it is not mapped to any routers.");
			return;
		}
		isPortTaken(cfg.port, function(err, result){
			if(result != false){
				log("error","HTTP Interface Module > Cannot load HTTP interface (" + name + ") as the defined port (" + cfg.port + ") is already in use.");
				return;
			}
			if(cfg.ssl == true) {
				if(!cfg.key || !cfg.cert){
					log("error","HTTP Interface Module > Cannot load SSL interface as either the key or cert has not been defined (" + name + ").");
					return;
				}
				try {
					instances[name] = new isnode.ISNode().extend({});
					instances[name].server = require('./support/https')(cfg.key, cfg.cert);
					instances[name].listening = false;
				} catch (err) {
					log("error","HTTP Interface Module > Error instantiating HTTPS interface - check key and cert (" + name + ").",err);
					if(instances[name])
						delete instances[name];
					return;
				}
				instances[name].server.on('request', (request, response) => {
					request.interface = name;
					for (var i = 0; i < routers.length; i++) {
						request.router = routers[i];
						handleRequest(request, response);
					}
				});
				instances[name].server.listen(cfg.port, function(){
					log("startup","HTTP Interface Module > SSL Interface ("+name+") started successfully on port "+cfg.port);
					instances[name].listening = true;
					return;
				});
			} else {
				try {
					instances[name] = new isnode.ISNode().extend({});
					instances[name].server = require('./support/http')();
					instances[name].listening = false;
				} catch (err) {
					log("error","HTTP Interface Module > Error instantiating HTTP interface (" + name + ").",err);
					if(instances[name])
						delete instances[name];
					return;
				}
				instances[name].server.on('request', (request, response) => {
					request.interface = name;
					for (var i = 0; i < routers.length; i++) {
						request.router = routers[i];
						if(protocol == "HTTPS")
							request.secure = true;
						else
							request.secure = false;
						handleRequest(request, response);
					}
				});
				instances[name].server.listen(cfg.port, function(){
					log("startup","HTTP Interface Module > Interface ("+name+") started successfully on port "+cfg.port);
					instances[name].listening = true;
					return;
				});
			}
			ismod.instances = instances;
		});
	}

	/**
	 * (Internal) HTTP Request Received, Handles the HTTP Request
	 * @param {object} req - The incomingRequest object
	 * @param {object} res - The outgoingResponse object
	 */
	var handleRequest = function(req, res) {
	    req.on('error', (err) => {
	        log("error","HTTP Interface > Error processing incoming request",err);
	        res.statusCode = 400;
	        res.end();
	        return;
	    });
	    res.on('error', (err) => {
	        log("error","HTTP Interface > Error processing outgoing response",err);
	        return;
	    });
	    determineContentType(req, res);
	    return;
	}

	/**
	 * (Internal) Determine if message is multi-part or not
	 * @param {object} req - The incomingRequest object
	 * @param {object} res - The outgoingResponse object
	 */
	var determineContentType = function(req, res) {
	    const {method, url, headers} = req;
	    for(var header in headers){
	    	header = header.toLowerCase();
	    	if(header == "content-type")
	    		var contentType = headers[header];
	    }
	    var contentTypes = {};
	    if(contentType){
	    	contentType = contentType.split(";");
	    	for (var i = 0; i < contentType.length; i++) {
	    		contentType[i] = contentType[i].trim();
	    		if(contentType[i] == "multipart/form-data")
	    			var multipart = true;
	    		if(contentType[i].startsWith("boundary=")){
	    			var boundary = contentType[i].split("=");
	    			boundary = boundary[1];
	    		}
	    	}
	    }
	    if(!boundary) { var boundary = "" };
	    if(multipart) { parseMultiPart(req, res) }
	    else { parseNonMultiPart(req, res) };
		return;
	}

	/**
	 * (Internal) Parses a multi-part http message
	 * @param {object} req - The incomingRequest object
	 * @param {object} res - The outgoingResponse object
	 */
	var parseMultiPart = function(req, res) {
		var form = new formidable.IncomingForm();
		if(config.interfaces.http[req.interface].fileUploadPath)
			form.uploadDir = config.interfaces.http[req.interface].fileUploadPath;
		else
			form.uploadDir = "./tmp/";
		if(config.interfaces.http[req.interface].maxUploadFileSizeMb)
			form.maxFileSize = config.interfaces.http[req.interface].maxUploadFileSizeMb * 1024 * 1024;
		else
			form.maxFileSize = 50 * 1024 * 1024;
		try {
		    form.parse(req, function(err, fields, files) {
		    	var body = fields;
		    	body.files = files;
		    	body.error = err;
				processCompleteRequest(req, res, body);
		    });
		} catch (err) {
			processCompleteRequest(req, res, {error: "File Upload Size Was Too Large"});
		}
	}

	/**
	 * (Internal) Parses a non-multi-part http message
	 * @param {object} req - The incomingRequest object
	 * @param {object} res - The outgoingResponse object
	 */
	var parseNonMultiPart = function(req, res) {
	    let data = [];
        req.on('data', (chunk) => {
            data.push(chunk);
        }).on('end', () => {
        	processCompleteRequest(req, res, data);
        });
	}

	/**
	 * (Internal) Process HTTP Request that Has Completed Being Received
	 * @param {object} request - The incomingRequest object
	 * @param {object} response - The outgoingResponse object
	 * @param {object} data - The body data that was received
	 */
	var processCompleteRequest = function(request, response, data) {
		const {method, url, headers} = request;
		try { if(Buffer.from(data)) { data = Buffer.concat(data).toString(); } } catch(err){ null; }

        if(data && isnode.module("utilities").isJSON(data) == "json_string"){
        	data = JSON.parse(data);
        } else if (data && isnode.module("utilities").isJSON(data) == "json_object") {
        	data = data;
        } else if (data) {
        	const qs = require('querystring');
        	data = qs.parse(data);
        }
        response.on('error', (err) => {
            log("error","HTTP Interface > Error processing outgoing response",err);
        });
		var resReturned = false;
		var os = require("os");
		var msgId = isnode.module("utilities").uuid4();
		var host = headers.host;
		var splitHost = host.split(":");
		var path = url;
		var queryString = {};
		var splitPath = path.split("?");
		if(splitPath[1]){
			var splitQuery = splitPath[1].split("&");
			for (var i = 0; i < splitQuery.length; i++) {
				var moreSplitQuery = splitQuery[i].split("=");
				if(!queryString[moreSplitQuery[0]]) {
					queryString[moreSplitQuery[0]] = moreSplitQuery[1];
				} else {
					var oldValue = queryString[moreSplitQuery[0]];
					queryString[moreSplitQuery[0]] = [];
					queryString[moreSplitQuery[0]].push(oldValue);
					queryString[moreSplitQuery[0]].push(moreSplitQuery[1]);
				}
			}
		}
		function parseCookies (request) {
		    var list = {},
		        rc = request.headers.cookie;
		    rc && rc.split(';').forEach(function( cookie ) {
		        var parts = cookie.split('=');
		        list[parts.shift().trim()] = decodeURI(parts.join('='));
		    });
		    return list;
		}
		var cookies = parseCookies(request);
		if(request.headers["X-Forwarded-For"])
			var reqIpAddress = request.headers["X-Forwarded-For"];
		else if (request.connection.remoteAddress)
			var reqIpAddress = request.connection.remoteAddress;
		else
			var reqIpAddress = "";
		var reqIpAddressV6 = "";
		if (reqIpAddress.indexOf(':') > -1) {
			var startPos = reqIpAddress.lastIndexOf(':');
			var endPos = reqIpAddress.length;
			var ipv4 = reqIpAddress.slice(startPos + 1, endPos);
			var ipv6 = reqIpAddress.slice(0, startPos - 1);
			reqIpAddress = ipv4;
			reqIpAddressV6 = ipv6;
		}
		if(request.headers["X-Forwarded-Proto"] && request.headers["X-Forwarded-Proto"] == "http")
			var reqSecure = false;
		else if(request.headers["X-Forwarded-Proto"] && request.headers["X-Forwarded-Proto"] == "https")
			var reqSecure = true;
		else
			var reqSecure = request.secure;
		var message = {
			"type": "http",
			"interface": request.interface,
			"msgId": msgId,
			"state": "incoming",
			"directional": "simplex",
			"request": {
				"path": splitPath[0],
				"host": splitHost[0],
				"port": splitHost[1],
				"query": queryString,
				"headers": request.headers,
				"params": null,
				"cookies": cookies,
				"ip": reqIpAddress,
				"ipv6": reqIpAddressV6,
				"verb": method,
				"secure": reqSecure,
				"body": data,
			}
		}
		if(message.request.path.endsWith("/") && message.request.path != "/"){
			var newPath = message.request.path.slice(0, -1);
			response.writeHead(301, {Location: newPath});
			response.end();
			return;
		} else if (message.request.path == "") {
			response.writeHead(301, {Location: "/"});
			response.end();
			return;
		}
		var responseListener = function(msg){
			var basePath = __dirname + "/../../../../";
			log("debug","HTTP Interface > Received response " + msg.msgId + " from router", msg);
			var mimeTypes = {
				"html": "text/html",
				"jpeg": "image/jpeg",
				"jpg": "image/jpeg",
				"png": "image/png",
				"gif": "image/gif",
				"js": "text/javascript",
				"css": "text/css",
				"csv": "text/csv",
				"pdf": "application/pdf",
				"md": "text/plain",
				"txt": "text/plain"
			};
			resReturned = true;
			response.statusCode = msg.response.statusCode;
			if(msg.response.cookies){
				for (var name in msg.response.cookies) {
					response.setHeader('Set-Cookie', name + "=" + msg.response.cookies[name].value + "; path=/;");
				}
			}
			if(msg.response.clearCookies){
				for (var name in msg.response.clearCookies) {
					response.setHeader('Set-Cookie', name + '=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
				}
			}
			if(msg.response.headers && typeof msg.response.headers === 'object' && msg.response.headers !== null){
				for (var header in msg.response.headers) {
					response.setHeader(header, msg.response.headers[header]);
				}
			}
			if(msg.response.location){
				response.setHeader('Location', msg.response.location);
				response.end();
			} else if(!msg.response.view && msg.response.body){
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify(msg.response.body));
			} else if (msg.response.file) {
				var fs = require('fs');
				try { var stats = fs.lstatSync(msg.response.file); }
				catch(e) { var stats = false; }
				if(stats && stats.isFile()){
					var pathToRead = msg.response.file;
					log("debug","HTTP Interface > Sending File " + pathToRead + " to client. " + message.msgId, message);
					var filename = pathToRead.split("/");
					var mimeType = mimeTypes[filename[filename.length - 1].split('.').pop()];
					if (!mimeType) { mimeType = 'application/octet-stream'; }
					response.writeHead(200, { "Content-Type": mimeType });
					var stream = fs.createReadStream(pathToRead);
					stream.pipe(response);
					var had_error = false;
					stream.on('error', function(err){
						had_error = true;
						if(msg.response.cb) {
							msg.response.cb(err, null);
						}
					});
					stream.on('close', function(){
						if (!had_error && msg.response.cb) {
							msg.response.cb(null, { success: true, code: "FILE_DOWNLOADED", message: "File Successfully Downloaded"});
						}
					});
					return;
				} else {
					response.setHeader('Content-Type', 'application/json');
					response.end(JSON.stringify({error: "Cannot Find File"}));
					return;
				}
			} else {
				var urlSplit = url.split("/");
				var filename = urlSplit[urlSplit.length - 1];
				var fileType = filename.split(".");
				var fileType = fileType[1];
				var mimeType = mimeTypes[fileType];
				if (!mimeType) { mimeType = 'text/html'; }
				response.setHeader('Content-Type', mimeType);
				var fs = require('fs');
				if(typeof msg.response.view === 'object' && msg.response.view !== null) {
					if(msg.response.view.file) {
						try {
							fs.readFile(basePath + "services/"+msg.service+"/views/"+msg.response.view.file, "utf8", function (err, htmlData) {
							    if (err) {
									log("error","HTTP Server Interface > " + basePath + "services/"+msg.service+"/views/"+msg.response.view.file + " view does not exist.", msg);
									response.setHeader('Content-Type', 'application/json');
									response.end(JSON.stringify(msg.response.body));	
									return;							    	
							    }       
							    renderView(msg, response, mustache, htmlData);
							    return;
							});
						} catch(err){
							log("error","HTTP Interface > "+msg.response.view+" view does not exist.", msg);
							response.setHeader('Content-Type', 'application/json');
							response.end(JSON.stringify(msg.response.body));	
							return;	
						}
					} else if (msg.response.view.html) {
						var htmlData = msg.response.view.html;
						renderView(msg, response, mustache, htmlData);
						return;
					} else {
						log("error","HTTP Interface > Error loading view - unknown type.", msg);
						response.setHeader('Content-Type', 'application/json');
						response.end(JSON.stringify(msg.response.body));	
						return;	
					}
				} else {
					try {
						fs.readFile(basePath + "services/" + msg.service + "/views/" + msg.response.view, "utf8", function (err, htmlData) {
						    if (err) {
								log("error","HTTP Server Interface > " + basePath + "services/" + msg.service + "/views/" + msg.response.view + " view does not exist.", msg);
								response.setHeader('Content-Type', 'application/json');
								response.end(JSON.stringify(msg.response.body));	
								return;							    	
						    }       
						    renderView(msg, response, mustache, htmlData);
						    return;
						});
					} catch(err){
						log("error","HTTP Interface > " + msg.response.view + " view does not exist...", msg);
						response.setHeader('Content-Type', 'application/json');
						response.end(JSON.stringify(msg.response.body));	
						return;	
					}
				}
			}
			instances[request.interface].removeListener('outgoing.' + msgId, responseListener);
		}
		var rootBasePath = __dirname + "/../../../../";
		var route = request.router.route(message.request.host, message.request.path);
		if(route && route.match && route.match.service){
			var basePath = isnode.module("services").service(route.match.service).cfg().basePath;
			if(message.request.path == basePath)
				message.request.path += "/";
		}
		message.request.params = route.param;
		if(route && route.match && route.match.service){
			var srv = isnode.module("services").service(route.match.service);
			if(srv.cfg().basePath)
				var base = srv.cfg().basePath;
			else
				var base = "";
			if(message.request.path.startsWith(base)){
				var htmlPath = message.request.path.slice(base.length);
			} else {
				var htmlPath = message.request.path;
			}
		} else {
			var htmlPath = message.request.path;
		}
		var fs = require('fs');
		try { 
			var stats = fs.lstatSync(rootBasePath + "services/" + route.match.service + "/html" + htmlPath); 
			var directPath = true;
		} 
		catch(e) { var stats = false; }
		if(!stats || stats.isDirectory()){
			try { 
				var stats = fs.lstatSync(rootBasePath + "services/" + route.match.service + "/html" + htmlPath + "/index.html"); 
				var directPath = false;
			} 
			catch(e) { var stats = false; }
		}
		if(stats && stats.isFile()){
			if(directPath == true){
				var pathToRead = rootBasePath + "services/" + route.match.service + "/html/" + htmlPath;
			} else {
				var pathToRead = rootBasePath + "services/" + route.match.service+"/html/" + htmlPath + "/index.html";
			}
			log("debug","HTTP Interface > File " + message.request.path + " found and returned to interface for message " + message.msgId, message);
			var mimeTypes = {
				"html": "text/html",
				"jpeg": "image/jpeg",
				"jpg": "image/jpeg",
				"png": "image/png",
				"gif": "image/gif",
				"js": "text/javascript",
				"css": "text/css",
				"csv": "text/csv",
				"pdf": "application/pdf",
				"md": "text/plain",
				"txt": "text/plain"
			};
			var filename = message.request.path.split("/");
			var mimeType = mimeTypes[filename[filename.length - 1].split('.').pop()];
			if (!mimeType) { mimeType = 'application/octet-stream'; }
			response.writeHead(200, { "Content-Type": mimeType });
			fs.createReadStream(pathToRead).pipe(response);
			return;
		}
		instances[request.interface].on('outgoing.' + msgId, responseListener);
		log("debug","HTTP Interface > Routing incoming message " + message.msgId, message);
		request.router.incoming(message);
		var timeout = config.interfaces.http[request.interface].requestTimeout;
		var timer = 0;
		var interval = setInterval(function(){
			if(!resReturned && timer < timeout){
				timer += 500;
			} else if (!resReturned && timer >= timeout) {
				response.statusCode = 504;
				response.setHeader('Content-Type', 'application/json');
				response.end(JSON.stringify({"error":"Request timed out"}));
				resReturned = true;
				clearInterval(interval);
				instances[request.interface].removeListener('outgoing.' + msgId, responseListener);
			} else if (resReturned) {
				clearInterval(interval);
				instances[request.interface].removeListener('outgoing.' + msgId, responseListener);
			}
		},500);
	}


	/**
	 * (Internal) Render View
	 * @param {function} cb - Callback function
	 */
	var renderView = function(msg, response, mustache, htmlData) {
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
	 * (Internal) Checks if a port is already taken or in use
	 * @param {integer} port - The port number to check
	 * @param {function} cb - Callback function
	 */
	var isPortTaken = function(port, cb) {
	  var tester = require('net').createServer()
	  	.once('error', function (err) { if (err.code != 'EADDRINUSE') { return cb(err); }; cb(null, true); })
	  	.once('listening', function() { tester.once('close', function() { cb(null, false) }).close(); })
	  	.listen(port)
	}

	/**
	 * (External) Makes an HTTP Request
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
	client.request = function(req, cb) {

		if(!req.url) { cb({ success: false, code: 1, message: "URL Not Defined"}, null); return; }
		if(!req.method) { cb({ success: false, code: 2, message: "Method Not Defined"}, null); return; }
		if(req.url.split("/") == "http:") { var protocol = "http"; }
		else if (req.url.split("/") == "https:") { var protocol = "https"; } 
		else { cb({ success: false, code: 3, message: "Unknown Protocol"}, null); return; }
		var httpLib = require(protocol), hostname = urlPieces[2].split(":")[0];
		if(domainPieces[1]) { var port = domainPieces[1]; }
		urlPieces.shift(); urlPieces.shift(); urlPieces.shift();
		var path = "/" + urlPieces.join("/").split("?")[0], options = { "hostname": hostname, "method": req.method }

		if(port)
			options.port = port;
		if(req.headers)
			options.headers = req.headers;
		else
			options.headers = {};
		if(path)
			options.path = path;

		if (req.data && isnode.module("utilities").isJSON(req.data) == "json_object") {
			if(!options.headers["Content-Type"])
				options.headers["Content-Type"] = "application/json";
			req.data = JSON.stringify(req.data);
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String) && isnode.module("utilities").isJSON(req.data) == "json_string") {
			if(!options.headers["Content-Type"])
				options.headers["Content-Type"] = "application/json";
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String) && req.data.indexOf('<') !== -1 && req.data.indexOf('>') !== -1) {
			if(!options.headers["Content-Type"])
				options.headers["Content-Type"] = "application/xml";
		} else if (req.data && (typeof req.data === 'string' || req.data instanceof String)) {
			if(!options.headers["Content-Type"])
				options.headers["Content-Type"] = "text/plain";
		} else {
			if(!options.headers["Content-Type"])
				options.headers["Content-Type"] = "text/plain";
		}

		if(req.data && !options.headers["Content-Length"]) {
			options.headers["Content-Length"] = Buffer.byteLength(req.data);
		}

		var reqObj = httpLib.request(options, function (res) {
		  let responseData = "";
		  if(req.encoding)
		  	res.setEncoding(req.encoding);
		  else
		  	res.setEncoding("utf8");
		  res.on('data', (chunk) => {
		    responseData += chunk;
		  });
		  res.on('end', () => {
		  	if (responseData && isnode.module("utilities").isJSON(responseData) == "json_string") {
		    	responseData = JSON.parse(responseData);
		    } else if (responseData && responseData.indexOf('<') == -1 && responseData.indexOf('>') == -1 && responseData.indexOf('=') !== -1) {
		    	var responseDataSplit = responseData.split("&");
		    	var responseDataNew = {};
		    	for (var i = 0; i < responseDataSplit.length; i++) {
		    		var valueSplit = responseDataSplit[i].split("=");
		    		responseDataNew[decodeURIComponent(valueSplit[0])] = decodeURIComponent(valueSplit[1]);
		    	}
		    	responseData = responseDataNew;
		    } else {
		    	responseData = decodeURIComponent(responseData);
		    }
		    cb(null, { success: true, code: 4, message: "Response Received Successfully", statusCode: res.statusCode, data: responseData });
		    return;
		  });
		});

		reqObj.on('error', (error) => {
		  cb({ success: false, code: 5, message: "Request Error", error: error}, null);
		});

		if(req.data) {
			reqObj.write(req.data);
		}

		reqObj.end();
	}

	/**
	 * (External) Makes a GET HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.get = function(url, cb) { 
		ismod.client.request({ "url": url, "headers": {}, "method": "GET", "encoding": "utf8" }, cb); 
	}

	/**
	 * (External) Makes a POST HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.post = function(url, data, options, cb) {
		var reqObj = { "url": url, "headers": {}, "method": "POST", "encoding": "utf8" };
		if(data) { reqObj.data = data; }
		if(options && options.headers) { reqObj.headers = options.headers; }
		ismod.client.request(reqObj, cb);
	}

	/**
	 * (External) Makes a PUT HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.put = function(url, data, options, cb) {
		var reqObj = { "url": url, "headers": {}, "method": "PUT", "encoding": "utf8" };
		if(data) { reqObj.data = data; }
		if(options && options.headers) { reqObj.headers = options.headers; }
		ismod.client.request(reqObj, cb);
	}

	/**
	 * (External) Makes a DELETE HTTP Request
	 * @param {string} url - Request URL
	 * @param {function} cb - Callback Function
	 */
	client.delete = function(url, data, options, cb) {
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