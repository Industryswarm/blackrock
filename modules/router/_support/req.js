/**
* Request Object
* Copyright (c) 2020 Darren Smith
*/

!function RouterReqObjWrapper() {
  const req = module.exports = function RouterReqObj() {
    this.app = {};
    this.baseUrl = '';
    this.body = '';
    this.cookies = [];
    this.fresh = true;
    this.hostname = '';
    this.headers = [];
    this.ip = '';
    this.ipv6 = '';
    this.ips = [];
    this.core = {};
    this.log = function RouterReqObjLogFn(level, msg) {};
    this.method = '';
    this.originalUrl = '';
    this.params = [];
    this.path = '';
    this.port = 0;
    this.protocol = '';
    this.query = {};
    this.route = {};
    this.secure = false;
    this.service = {};
    this.serviceName = '';
    this.signedCookies = {};
    this.stale = false;
    this.subdomains = [];
    this.xhr = false;
    this.msgId = '';
    this.type = '';
    this.interface = '';
    this.router = '';
    this.internal = {};
  };

  /**
   * Request Initialisation Method
   * @param {object} core - Core Object
   * @param {object} initObj - Initialisation Object
   * @return {object} req - Request Object
   */
  req.prototype.init = function RouterReqObjInit(core, initObj) {
    this.core = core;
    if (initObj.msgId) this.msgId = initObj.msgId;
    if (initObj.type) this.type = initObj.type;
    if (initObj.interface) this.interface = initObj.interface;
    if (initObj.router) this.router = initObj.router;
    if (initObj.path) this.path = initObj.path;
    if (initObj.log) this.log = initObj.log;
    if (initObj.host) this.hostname = initObj.host;
    if (initObj.port) this.port = initObj.port;
    if (initObj.query) this.query = initObj.query;
    if (initObj.params) this.params = initObj.params;
    if (initObj.cookies) this.cookies = initObj.cookies;
    if (initObj.ip) {
      this.ip = initObj.ip;
      this.ips.push(initObj.ip);
    }
    if (initObj.ipv6) this.ipv6 = initObj.ipv6;
    if (initObj.headers) this.headers = initObj.headers;
    if (initObj.verb) this.method = initObj.verb;
    if (initObj.secure) {
      this.secure = true;
      this.protocol = 'https';
    } else {
      this.secure = false;
      this.protocol = 'http';
    }
    if (initObj.body) this.body = initObj.body;
    if (initObj.internal) this.internal = initObj.internal;
    if (initObj.serviceName) this.serviceName = initObj.serviceName;
    if (initObj.service) this.service = initObj.service;
    return this;
  };

  /**
   * Accepts
   * @return {object} req - Request Object
   * @todo Build out accepts method on Router Module Request Object
   */
  req.prototype.accepts = function RouterReqObjAccepts() {
    return this;
  };

  /**
   * Accepts Charsets
   * @return {object} req - Request Object
   * @todo Build out acceptsCharsets method on Router Module Request Object
   */
  req.prototype.acceptsCharsets = function RouterReqObjAcceptsCharsets() {
    return this;
  };

  /**
   * Accepts Encodings
   * @return {object} req - Request Object
   * @todo Build out acceptsEncodings method on Router Module Request Object
   */
  req.prototype.acceptsEncodings = function RouterReqObjAcceptsEncoding() {
    return this;
  };

  /**
   * Accepts Languages
   * @return {object} req - Request Object
   * @todo Build out acceptsLanguages method on Router Module Request Object
   */
  req.prototype.acceptsLanguages = function RouterReqObjAcceptsLanguages() {
    return this;
  };

  /**
   * Get Header Value
   * @param {string} name - Header Name
   * @return {string} value - Header Value
   */
  req.prototype.get = function RouterReqObjGet(name) {
    for (let i = 0; i < this.headers.length; i++) {
      if (this.headers[i].name === name) {
        return this.headers[i].value;
      }
    }
    return false;
  };

  /**
   * Is (Something?)
   * @return {object} req - Request Object
   * @todo Build out is method on Router Module Request Object
   */
  req.prototype.is = function RouterReqObjIs() {
    return this;
  };

  /**
   * Param (Something?)
   * @return {object} req - Request Object
   * @todo Build out param method on Router Module Request Object
   */
  req.prototype.param = function RouterReqObjParam() {
    return this;
  };

  /**
   * Range (Of Something?)
   * @return {object} req - Request Object
   * @todo Build out range method on Router Module Request Object
   */
  req.prototype.range = function RouterReqObjRange() {
    return this;
  };
}();
