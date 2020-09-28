/*!
* Request Object
*
* Copyright (c) 2018 Darren Smith
* Licensed under the [TBC] license.
*/

;!function RouterReqObjWrapper(undefined) {

	var req = function RouterReqObj(){
		this.app = {};
		this.baseUrl = "";
		this.body = "";
		this.cookies = [];
		this.fresh = true;
		this.hostname = "";
		this.headers = [];
		this.ip = "";
		this.ipv6 = "";
		this.ips = [];
		this.isnode = {};
		this.log = function RouterReqObjLogFn(level, msg){};
		this.method = "";
		this.originalUrl = "";
		this.params = [];
		this.path = "";
		this.port = 0;
		this.protocol = "";
		this.query = {};
		this.route = {};
		this.secure = false;
		this.service = {};
		this.serviceName = "";
		this.signedCookies = {};
		this.stale = false;
		this.subdomains = [];
		this.xhr = false;
		this.msgId = "";
		this.type = "";
		this.interface = "";
		this.router = "";
	};

	/**
	 * Init
	 */
	req.prototype.init = function RouterReqObjInit(isnode,initObj){
		this.isnode = isnode;
		if(initObj.msgId)
			this.msgId = initObj.msgId;
		if(initObj.type)
			this.type = initObj.type;
		if(initObj.interface)
			this.interface = initObj.interface;
		if(initObj.router)
			this.router = initObj.router;
		if(initObj.path)
			this.path = initObj.path;
		if(initObj.log)
			this.log = initObj.log;
		if(initObj.host)
			this.hostname = initObj.host;
		if(initObj.port)
			this.port = initObj.port;
		if(initObj.query)
			this.query = initObj.query;
		if(initObj.params)
			this.params = initObj.params;
		if(initObj.cookies)
			this.cookies = initObj.cookies;
		if(initObj.ip){
			this.ip = initObj.ip;
			this.ips.push(initObj.ip)
		}
		if(initObj.ipv6) {
			this.ipv6 = initObj.ipv6;
		}
		if(initObj.headers){
			this.headers = initObj.headers;
		}
		if(initObj.verb)
			this.method = initObj.verb;
		if(initObj.secure){
			this.secure = true;
			this.protocol = "https";
		} else {
			this.secure = false;
			this.protocol = "http";
		}
		if(initObj.body)
			this.body = initObj.body;
		if(initObj.serviceName)
			this.serviceName = initObj.serviceName;
		if(initObj.service)
			this.service = initObj.service;
		return this;
	}

	/**
	 * Accepts
	 */
	req.prototype.accepts = function RouterReqObjAccepts(){
		return this;
	}

	/**
	 * Accepts Charsets
	 */
	req.prototype.acceptsCharsets = function RouterReqObjAcceptsCharsets(){
		return this;
	}

	/**
	 * Accepts Encodings
	 */
	req.prototype.acceptsEncodings = function RouterReqObjAcceptsEncoding(){
		return this;
	}

	/**
	 * Accepts Languages
	 */
	req.prototype.acceptsLanguages = function RouterReqObjAcceptsLanguages(){
		return this;
	}

	/**
	 * Get
	 */
	req.prototype.get = function RouterReqObjGet(name){
		for (var i = 0; i < this.headers.length; i++) {
			if(this.headers[i].name == name)
				return headers[i].value;
		}
		return false;
	}

	/**
	 * Is
	 */
	req.prototype.is = function RouterReqObjIs(){
		return this;
	}

	/**
	 * Param
	 */
	req.prototype.param = function RouterReqObjParam(){
		return this;
	}

	/**
	 * Range
	 */
	req.prototype.range = function RouterReqObjRange(){
		return this;
	}

	/**
	 * (ENTRY POINT FOR EXECUTION)
	 */
	module.exports = req;
}();