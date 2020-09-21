/*!
* Response Object
*
* Copyright (c) 2018 Darren Smith
* Licensed under the [TBC] license.
*/

;!function(undefined) {

	var res = function(){
		this.app = {};
		this.clearCookies = {};
		this.cookies = {};
		this.headers = [];
		this.headersSent = false;
		this.locals = [];
		this.msgId = "";
		this.type = "";
		this.interface = "";
		this.router = "";
		this.view = false;
		this.service = "";
		this.statusCode = 200;
	};

	/**
	 * Init
	 */
	res.prototype.init = function(isnode,initObj){
		this.isnode = isnode;
		this.log = isnode.module("logger").log;
		if(initObj.msgId)
			this.msgId = initObj.msgId;
		if(initObj.type)
			this.type = initObj.type;
		if(initObj.interface)
			this.interface = initObj.interface;
		if(initObj.router)
			this.router = initObj.router;
		if(initObj.service)
			this.service = initObj.service;
		if(initObj.headers)
			this.headers = [];
		this.headersSent = false;
		this.locals = [];
		this.view = false;
		this.statusCode = 200;
		return this;
	}

	/**
	 * Append
	 */
	res.prototype.append = function(){
		return this;
	}

	/**
	 * Attachment
	 */
	res.prototype.attachment = function(){
		return this;
	}

	/**
	 * Cookie
	 */
	res.prototype.cookie = function(name, value, options){
		this.cookies[name] = {value: value, options: options};
		return this;
	}

	/**
	 * Clear Cookie
	 */
	res.prototype.clearCookie = function(name, options){
		this.clearCookies[name] = {};
		if(options)
			this.clearCookies[name].options = options;
		return this;
	}

	/**
	 * Download
	 */
	res.prototype.download = function(path, var2, var3, var4){
		this.view = false;
		if (var2 && (typeof var2 === 'string' || var2 instanceof String)) {
			var filename = var2;
		} else if(var2 && typeof var2 === 'object' && var2 !== null) {
			var options = var2;
		} else if (var2 && typeof var2 === "function") {
    		var cb = var2;
		}
		if(var3 && typeof var3 === 'object' && var3 !== null) {
			var options = var3;
		} else if (var3 && typeof var3 === "function") {
    		var cb = var3;
		}
		if (var4 && typeof var4 === "function") {
    		var cb = var4;
		}
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		if(options && options.headers) {
			for(var name in options.headers){
				var header = {};
				header[name] = options.headers[name];
				this.headers.push(header);				
			}
		}
		if(!filename) {
			var filename = path.split("/");
			filename = filename[filename.length - 1];
		}
		var contentDisposition = "attachment";
		if(filename)
			contentDisposition += "; filename=\"" + filename + "\"";
		this.headers["Content-Disposition"] = contentDisposition;
		if(!path.startsWith("/")){
			if(options && options.root) {
				path = options.root + "/" + path;
			} else {
				if(cb)
					cb({error: true, code: "ROOT_REQUIRED", message: "Path is relative so options.root must be specified"}, null);
				return;
			}
		}
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			msgId: this.msgId,
			response: {
				body: null,
				cookies: this.cookies,
				headers: this.headers,
				clearCookies: this.clearCookies,
				view: false,
				statusCode: this.statusCode,
				file: path
			}
		};
		if(cb) {
			msg.response.cb = cb;
		}
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * End
	 */
	res.prototype.end = function(){
		return this;
	}

	/**
	 * Format
	 */
	res.prototype.format = function(){
		return this;
	}

	/**
	 * Get
	 */
	res.prototype.get = function(){
		return this;
	}

	/**
	 * JSON
	 */
	res.prototype.json = function(body){
		this.view = false;
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		var msg = {
			type: this.type,
			interface: this.interface,
			service: this.service,
			router: this.router,
			msgId: this.msgId,
			response: {
				body: body,
				cookies: this.cookies,
				headers: this.headers,
				clearCookies: this.clearCookies,
				view: false,
				statusCode: this.statusCode
			}
		};
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * JSONP
	 */
	res.prototype.jsonp = function(){
		return this;
	}

	/**
	 * Links
	 */
	res.prototype.links = function(){
		return this;
	}

	/**
	 * Location
	 */
	res.prototype.location = function(path){
		return this;
	}

	/**
	 * Redirect
	 */
	res.prototype.redirect = function(param1, param2){
		if (param1 === parseInt(param1, 10) && param2){
			this.statusCode = param1;
			var location = param2;
		} else if (param1 && !param2) {
			this.statusCode = 302;
			var location = param1;
		} else {
			return this;
		}
		this.view = false;
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			msgId: this.msgId,
			response: {
				body: null,
				location: location,
				headers: this.headers,
				cookies: this.cookies,
				clearCookies: this.clearCookies,
				view: false,
				statusCode: this.statusCode
			}
		};
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * Render
	 */
	res.prototype.render = function(view, locals, cb){
		var body = locals;
		this.view = view;
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			msgId: this.msgId,
			response: {
				body: body,
				cookies: this.cookies,
				headers: this.headers,
				clearCookies: this.clearCookies,
				view: view,
				statusCode: this.statusCode
			}
		};
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * Send
	 */
	res.prototype.send = function(body){
		this.view = false;
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			msgId: this.msgId,
			response: {
				body: body,
				cookies: this.cookies,
				headers: this.headers,
				clearCookies: this.clearCookies,
				view: false,
				statusCode: this.statusCode
			}
		};
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * Send File
	 */
	res.prototype.sendFile = function(path, var2, var3){
		this.view = false;
		if(var2 && typeof var2 === 'object' && var2 !== null) {
			var options = var2;
		} else if (var2 && typeof var2 === "function") {
    		var cb = var2;
		}
		if (var3 && typeof var3 === "function") {
			var cb = var3
		}
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		if(options && options.headers) {
			for(var name in options.headers){
				var header = {};
				header[name] = options.headers[name];
				this.headers.push(header);				
			}
		}
		if(!filename) {
			var filename = path.split("/");
			filename = filename[filename.length - 1];
		}
		var contentDisposition = "inline";
		if(filename)
			contentDisposition += "; filename=\"" + filename + "\"";
		this.headers["Content-Disposition"] = contentDisposition;
		if(!path.startsWith("/")){
			if(options && options.root) {
				path = options.root + "/" + path;
			} else {
				if(cb)
					cb({error: true, code: "ROOT_REQUIRED", message: "Path is relative so options.root must be specified"}, null);
				return;
			}
		}
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			msgId: this.msgId,
			response: {
				body: null,
				cookies: this.cookies,
				headers: this.headers,
				clearCookies: this.clearCookies,
				view: false,
				statusCode: this.statusCode,
				file: path
			}
		};
		if(cb) {
			msg.response.cb = cb;
		}
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * Send Status
	 */
	res.prototype.sendStatus = function(status){
		if(this.headersSent == true){
			this.log("debug","Router > Attempting to send another response after response has already been sent");
			return;
		}
		this.headersSent = true;
		if(status)
			this.statusCode = status;
		var msg = {
			type: this.type,
			interface: this.interface,
			router: this.router,
			service: this.service,
			headers: this.headers,
			msgId: this.msgId,
			response: {
				body: {},
				cookies: this.cookies,
				clearCookies: this.clearCookies,
				statusCode: this.statusCode
			}
		};
		this.isnode.module("router").get(this.router).emit("router." + this.msgId, msg);
		return this;
	}

	/**
	 * Set Header(s)
	 */
	res.prototype.set = function(var1, var2){
		if(var1 && typeof var1 === 'object' && var1 !== null) {
			for(var name in var1){
				this.headers[name] = var1[name];				
			}
			return;
		} else if ((typeof var1 === 'string' || var1 instanceof String) && (typeof var2 === 'string' || var2 instanceof String)) {
			this.headers[var1] = var2
			return this;
		} else {
			return this;
		}
		return this;
	}

	/**
	 * Set Header(s) - Alias
	 */
	res.prototype.header = function(name, value){
		if ((typeof name === 'string' || name instanceof String) && (typeof value === 'string' || value instanceof String)) {
			this.set(name, value);
		}
		return this;
	}

	/**
	 * Status
	 */
	res.prototype.status = function(code){
		this.statusCode = code;
		return this;
	}

	/**
	 * Type
	 */
	res.prototype.type = function(){
		return this;
	}

	/**
	 * Vary
	 */
	res.prototype.vary = function(){
		return this;
	}

	/**
	 * (ENTRY POINT FOR EXECUTION)
	 */
	module.exports = res;
}();