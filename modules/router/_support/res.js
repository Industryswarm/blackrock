/**
* Response Object
* Copyright (c) 2020 Darren Smith
*/

!function RouterResObjWrapper() {
  const res = module.exports = function RouterResObj() {
    this.app = {};
    this.clearCookies = {};
    this.cookies = {};
    this.headers = [];
    this.headersSent = false;
    this.locals = [];
    this.msgId = '';
    this.type = '';
    this.interface = '';
    this.router = '';
    this.view = false;
    this.service = '';
    this.statusCode = 200;
  };

  /**
   * Initialisation Method
   * @param {object} core - Core Object
   * @param {object} initObj - Initialisation Object
   * @return {object} res - Response Object
   */
  res.prototype.init = function RouterResObjInit(core, initObj) {
    this.core = core;
    this.log = core.module('logger').log;
    if (initObj.msgId) this.msgId = initObj.msgId;
    if (initObj.type) this.type = initObj.type;
    if (initObj.interface) this.interface = initObj.interface;
    if (initObj.router) this.router = initObj.router;
    if (initObj.service) this.service = initObj.service;
    if (initObj.headers) this.headers = [];
    this.headersSent = false;
    this.locals = [];
    this.view = false;
    this.statusCode = 200;
    return this;
  };

  /**
   * Append
   * @return {object} res - Response Object
   * @todo Build out append method on Router Module Response Object
   */
  res.prototype.append = function RouterResObjAppend() {
    return this;
  };

  /**
   * Attachment
   * @return {object} res - Response Object
   * @todo Build out attachment method on Router Module Response Object
   */
  res.prototype.attachment = function RouterResObjAttachment() {
    return this;
  };

  /**
   * Set Cookie
   * @param {string} name - Cookie Name
   * @param {string} value - Cookie Value
   * @param {object} options - Options Object
   * @return {object} res - Response Object
   */
  res.prototype.cookie = function RouterResObjCookie(name, value, options) {
    this.cookies[name] = {value: value, options: options};
    return this;
  };

  /**
   * Clear Cookie
   * @param {string} name - Cookie Name
   * @param {object} options - Options Object
   * @return {object} res - Response Object
   */
  res.prototype.clearCookie = function RouterResObjClearCookie(name, options) {
    this.clearCookies[name] = {};
    if (options) this.clearCookies[name].options = options;
    return this;
  };

  /**
   * Download File
   * @param {string} path - The Path To The File
   * @param {string|object|function} [var2] - Filename, Options Object or Callback Function
   * @param {object|function} [var3] - Options Object or Callback Function
   * @param {function} [var4] - Callback Function
   * @return {object} res - Response Object
   */
  res.prototype.download = function RouterResObjDownload(path, var2, var3, var4) {
    this.view = false;
    let filename; let options; let cb;
    if (var2 && (typeof var2 === 'string' || var2 instanceof String)) filename = var2;
    else if (var2 && typeof var2 === 'object') options = var2;
    else if (var2 && typeof var2 === 'function') cb = var2;
    if (var3 && typeof var3 === 'object') options = var3;
    else if (var3 && typeof var3 === 'function') cb = var3;
    if (var4 && typeof var4 === 'function') cb = var4;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    if (options && options.headers) {
      // eslint-disable-next-line guard-for-in
      for (const name in options.headers) {
        const header = {};
        header[name] = options.headers[name];
        this.headers.push(header);
      }
    }
    if (!filename) filename = path.split('/')[filename.length - 1];
    let contentDisposition = 'attachment';
    if (filename) contentDisposition += '; filename="' + filename + '"';
    this.headers['Content-Disposition'] = contentDisposition;
    if (!path.startsWith('/')) {
      if (options && options.root) {
        path = options.root + '/' + path;
      } else {
        if (cb) {
          cb({error: true, code: 'ROOT_REQUIRED',
            message: 'Path is relative so options.root must be specified'}, null);
        }
        return;
      }
    }
    const msg = {
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
        file: path,
      },
    };
    if (cb) msg.response.cb = cb;
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * End (Something?)
   * @return {object} res - Response Object
   * @todo Build out end method on Router Module Response Object
   */
  res.prototype.end = function RouterResObjEnd() {
    return this;
  };

  /**
   * Format (Something?)
   * @return {object} res - Response Object
   * @todo Build out format method on Router Module Response Object
   */
  res.prototype.format = function RouterResObjFormat() {
    return this;
  };

  /**
   * Get (Something?)
   * @return {object} res - Response Object
   * @todo Build out get method on Router Module Response Object
   */
  res.prototype.get = function RouterResObjGet() {
    return this;
  };

  /**
   * Send JSON Response to Client
   * @param {object} body - Body Object
   * @return {object} res - Response Object
   */
  res.prototype.json = function RouterResObjJson(body) {
    this.view = false;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    const msg = {
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
        statusCode: this.statusCode,
      },
    };
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Send JSONP Response to Client
   * @return {object} res - Response Object
   * @todo Build out jsonp method on Router Module Response Object
   */
  res.prototype.jsonp = function RouterResObjJsonP() {
    return this;
  };

  /**
   * Links
   * @return {object} res - Response Object
   * @todo Build out links method on Router Module Response Object
   */
  res.prototype.links = function RouterResObjLinks() {
    return this;
  };

  /**
   * Location
   * @return {object} res - Response Object
   * @todo Build out location method on Router Module Response Object
   */
  res.prototype.location = function RouterResObjLocation() {
    return this;
  };

  /**
   * Redirect Client to New URL
   * @param {number|string} param1 - Status Code or Location
   * @param {string} [param2] - Location (if not set in param1)
   * @return {object} res - Response Object
   */
  res.prototype.redirect = function RouterResObjRedirect(param1, param2) {
    let location;
    if (param1 === parseInt(param1, 10) && param2) {
      this.statusCode = param1;
      location = param2;
    } else if (param1 && !param2) {
      this.statusCode = 302;
      location = param1;
    } else {
      return this;
    }
    this.view = false;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    const msg = {
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
        statusCode: this.statusCode,
      },
    };
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Render Response to Client
   * @param {string|object} view - View Object or String
   * @param {object} locals - Context to Inject Into View
   * @return {object} res - Response Object
   */
  res.prototype.render = function RouterResObjRender(view, locals) {
    const body = locals;
    this.view = view;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    const msg = {
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
        statusCode: this.statusCode,
      },
    };
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Send Response To Client
   * @param {object} body - Callback Function
   * @return {object} res - Response Object
   */
  res.prototype.send = function RouterResObjSend(body) {
    this.view = false;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    const msg = {
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
        statusCode: this.statusCode,
      },
    };
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Send File Response To Client
   * @param {string} path - The Path to the File
   * @param {object|function} [var2] - Options Object or Callback Function
   * @param {object} [var3] - Callback Function (if not specified in var2)
   * @return {object} res - Response Object
   */
  res.prototype.sendFile = function RouterResObjSendFile(path, var2, var3) {
    this.view = false;
    let options; let cb; let filename;
    if (var2 && typeof var2 === 'object') options = var2;
    else if (var2 && typeof var2 === 'function') cb = var2;
    if (var3 && typeof var3 === 'function') cb = var3;
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    if (options && options.headers) {
      // eslint-disable-next-line guard-for-in
      for (const name in options.headers) {
        const header = {};
        header[name] = options.headers[name];
        this.headers.push(header);
      }
    }
    if (!filename) filename = path.split('/')[path.split('/').length - 1];
    let contentDisposition = 'inline';
    if (filename) contentDisposition += '; filename="' + filename + '"';
    this.headers['Content-Disposition'] = contentDisposition;
    if (!path.startsWith('/')) {
      if (options && options.root) path = options.root + '/' + path;
      else {
        if (cb) {
          cb({error: true, code: 'ROOT_REQUIRED', message: 'Path is relative so options.root must be specified'}, null);
        }
        return;
      }
    }
    const msg = {
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
        file: path,
      },
    };
    if (cb) msg.response.cb = cb;
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Send HTTP Status Code
   * @param {integer} status - Header Value
   * @return {object} req - Request Object
   */
  res.prototype.sendStatus = function RouterResObjSendStatus(status) {
    if (this.headersSent === true) {
      this.log('debug',
          'Router > Attempting to send another response after response has already been sent',
          {}, 'ROUTER_RES_DUPLICATE');
      return;
    }
    this.headersSent = true;
    if (status) this.statusCode = status;
    const msg = {
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
        statusCode: this.statusCode,
      },
    };
    this.core.module('router').get(this.router).emit('router.' + this.msgId, msg);
    return this;
  };

  /**
   * Set Header(s)
   * @param {string|object} var1 - Header Name (or Object of Header Name-Value Pairs)
   * @param {string} [var2] - Header Value (if Header Name String Was Passed Into var1)
   * @return {object} req - Request Object
   */
  res.prototype.set = function RouterResObjSet(var1, var2) {
    if (var1 && typeof var1 === 'object') {
      // eslint-disable-next-line guard-for-in
      for (const name in var1) {
        this.headers[name] = var1[name];
      }
    } else if ((typeof var1 === 'string' || var1 instanceof String) &&
        (typeof var2 === 'string' || var2 instanceof String)) {
      this.headers[var1] = var2;
    }
    return this;
  };

  /**
   * Set Header(s) - Alias
   * @param {string} name - Header Name
   * @param {string} value - Header Value
   * @return {object} req - Request Object
   */
  res.prototype.header = function RouterResObjHeader(name, value) {
    if ((typeof name === 'string' || name instanceof String) &&
        (typeof value === 'string' || value instanceof String)) {
      this.set(name, value);
    }
    return this;
  };

  /**
   * Set HTTP Status Code
   * @param {integer} code - HTTP Status Code
   * @return {object} req - Request Object
   */
  res.prototype.status = function RouterResObjStatus(code) {
    this.statusCode = code;
    return this;
  };

  /**
   * Type (Of Something?)
   * @return {object} req - Request Object
   * @todo Build out type method on Router Module Response Object
   */
  res.prototype.type = function RouterResObjType() {
    return this;
  };

  /**
   * Vary (Something?)
   * @return {object} req - Request Object
   * @todo Build out vary method on Router Module Response Object
   */
  res.prototype.vary = function RouterResObjVary() {
    return this;
  };
}();
