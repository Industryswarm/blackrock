!function HTTPInterfaceWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  const mustache = require('./_support/mustache.js');
  const formidable = require('./_support/formidable');
  const cheerio = require('./_support/cheerio.js');
  let core; let myInterface; let log; let config; const instances = [];
  const streamFns = {}; const pipelines = {}; const viewCache = {};


  /**
   * Blackrock HTTP Interface
   * @class Server.Interfaces.HTTP
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.HTTP} interface - The Axon Interface
   *
   * @description This is the HTTP Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the HTTP and HTTPS protocols.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function HTTPInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('HTTP'); log = core.module('logger').log; config = core.cfg();
    log('debug', 'Blackrock HTTP Interface > Initialising...', {}, 'HTTP_INIT');
    myInterface.client = client;
    myInterface.startInterface = startInterface;
    myInterface.hook = hook;
    myInterface.cheerio = cheerio;
    myInterface.formidable = formidable;
    myInterface.mustache = mustache;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
    });
    return myInterface;
  };

  /**
   * Start HTTP Interface
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {string} name - HTTP Interface Name
   */
  const startInterface = function HTTPInterfaceStartInterface(name) {
    const self = this;
    const cfg = config.interfaces.http[name];
    const port = parseInt(process.env.PORT || cfg.port);
    let protocol;
    if (cfg.ssl === true) protocol = 'HTTPS';
    else protocol = 'HTTP';
    log('startup',
        'Blackrock HTTP Interface > Attempting to start ' + protocol + ' interface (' +
        name + ') on port ' + port + '.', {}, 'HTTP_STARTING');
    const routers = [];
    for (const routerName in config.router.instances) {
      if (config.router.instances[routerName].interfaces &&
        (config.router.instances[routerName].interfaces.includes('*') ||
          config.router.instances[routerName].interfaces.includes(name))) {
        routers.push(core.module('router').get(routerName));
      }
    }
    if (routers.length <= 0) {
      log('error',
          'Blackrock HTTP Interface > Cannot start ' + protocol + ' interface (' + name + ') on port ' +
          cfg.port + ' as it is not mapped to any routers.', {}, 'HTTP_NOT_MAPPED_TO_ROUTER'); return;
    }
    const ISPipeline = pipelines.processRequestStream();
    utils.isPortTaken(port, function HTTPIsPortTakenHandler(err, result) {
      let inst;
      if (result !== false) {
        log('error',
            'Blackrock HTTP Interface > Cannot load HTTP interface (' + name + ') as the defined port (' +
            port + ') is already in use.', {}, 'HTTP_PORT_IN_USE'); return;
      }
      if (cfg.ssl && (!cfg.key || !cfg.cert)) {
        log('error',
            'Blackrock HTTP Interface > Cannot load SSL interface as either the key or cert has not been defined (' +
            name + ').', {}, 'HTTP_SSL_CERT_OR_KEY_MISSING'); return;
      }
      let httpLib;
      try {
        if (cfg.ssl) httpLib = 'https';
        else httpLib = 'http';
        instances[name] = inst = self.instances[name] = new core.Base().extend({});
        inst.listening = false;
        inst.port = port;
        inst.hooks = {
          onIncomingRequest: {}, onOutgoingResponsePostRender: {}, onOutgoingRequest: {}, onIncomingResponse: {},
        };
        inst.hookIdDirectory = {};
        const serverLib = require('./_support/' + httpLib);
        if (cfg.ssl) {
          inst.server = serverLib(cfg.key, cfg.cert);
        } else {
          inst.server = serverLib();
        }
      } catch (err) {
        log('error',
            'Blackrock HTTP Interface > Error instantiating ' + httpLib.toUpperCase() + ' interface (' +
            name + ').', err, 'HTTP_ERROR_INST_INTERFACE');
        if (inst) {
          // eslint-disable-next-line no-delete-var
          delete inst;
        }
        return;
      }
      inst.server.on('request', function HTTPPrimaryRequestHandler(request, response) {
        const myMsg = {
          httpVersion: request.httpVersion,
          host: request.headers.host,
          verb: request.method,
          url: request.url,
          headers: request.headers,
        };
        log('debug', 'Blackrock HTTP Interface > Received Incoming Request', myMsg, 'HTTP_RECEIVED_INCOMING_REQUEST');
        request.interface = name;
        for (let i = 0; i < routers.length; i++) {
          request.router = routers[i];
          request.secure = protocol === 'HTTPS';
          executeHookFns(name, 'onIncomingRequest', request).then(function(output) {
            new ISPipeline({'req': output, 'res': response}).pipe();
          }).catch(function() {
            new ISPipeline({'req': request, 'res': response}).pipe();
          });
        }
      });
      inst.server.listen(port, function HTTPListenHandler() {
        log('startup',
            'Blackrock HTTP Interface > ' + httpLib.toUpperCase() + ' Interface (' +
            name + ') started successfully on port ' + cfg.port, {}, 'HTTP_STARTED'); inst.listening = true;
      });
      myInterface.instances = instances;
    });
  };

  /**
   * @class Server.Interfaces.HTTP.Hook
   * @hideconstructor
   *
   * @description
   * This is the HTTP Hook class. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.hook.method". This
   * class contains methods that allow you to hook in to HTTP requests and responses, and execute
   * intermediate functions on the content of these messages.
   */
  const hook = function HTTPInterfaceHook() {};


  /**
   * Add Hook Function
   * @memberof Server.Interfaces.HTTP.Hook
   * @name add
   * @function
   * @param {string|array} names - Array or String Containing Interface Name(s)
   * @param {string} hookType - Type of Hook
   * @param {function} hookFn - Hook Function
   * @return {Promise} promise - Promise
   */
  hook.add = function HTTPInterfaceAddHook(names, hookType, hookFn) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      let hookCount = 0; const hooksSet = [];
      const addNow = function(inst, hook, fn) {
        const uniqueId = core.module('utilities').uuid4();
        inst.hooks[hook][uniqueId] = fn;
        inst.hookIdDirectory[uniqueId] = hook;
        hooksSet.push(uniqueId);
      };
      if (Array.isArray(names)) {
        hookCount = names.length;
        for (const name in names) {
          if (instances && instances[name]) addNow(instances[name], hookType, hookFn);
        }
      } else if (names === '*') {
        hookCount = instances.length;
        // eslint-disable-next-line guard-for-in
        for (const name in instances) {
          addNow(instances[name], hookType, hookFn);
        }
      } else if (instances && instances[names]) {
        hookCount = 1;
        addNow(instances[names], hookType, hookFn);
      } else {
        log('debug',
            'Blackrock HTTP Interface > Failed to Add New Hooks',
            {'names': names, 'type': hookType}, 'HTTP_FAILED_TO_ADD_HOOKS');
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({'message': 'No Valid Hook Targets Defined', 'code': 'NO_TARGETS'});
        return;
      }
      const interval = setInterval(function() {
        if (hooksSet.length >= hookCount) {
          clearInterval(interval);
          log('debug',
              'Blackrock HTTP Interface > New Hooks Added',
              {'names': names, 'type': hookType, 'hooks': hooksSet}, 'HTTP_HOOKS_ADDED');
          resolve({'message': 'Hooks Added', 'code': 'HOOKS_ADDED', 'hooks': hooksSet});
        }
      }, 10);
    });
  };

  /**
   * Remove Defined Hook Function
   * @memberof Server.Interfaces.HTTP.Hook
   * @name remove
   * @function
   * @param {string} hookId - The Hook UUID to Remove
   * @return {boolean} result - True or False
   */
  hook.remove = function HTTPInterfaceRemoveHook(hookId) {
    for (const name in instances) {
      if (instances[name].hookIdDirectory[hookId]) {
        if (instances[name].hooks[instances[name].hookIdDirectory[hookId]] &&
          instances[name].hooks[instances[name].hookIdDirectory[hookId]][hookId]) {
          delete instances[name].hookIdDirectory[hookId];
          delete instances[name].hooks[instances[name].hookIdDirectory[hookId]][hookId];
        }
      }
    }
    log('debug', 'Blackrock HTTP Interface > Hook Removed', {'id': hookId}, 'HTTP_HOOK_REMOVED');
    return true;
  };

  /**
   * Execute Hook Functions
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {string} name - Name
   * @param {string} type - Type
   * @param {*} input - Input
   * @return {Promise} promise - Promise
   */
  const executeHookFns = function HTTPInterfaceExecuteHooks(name, type, input) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      Object.keys(instances[name].hooks[type]).length;
      const hookStack = [];
      // eslint-disable-next-line guard-for-in
      for (const hookId in instances[name].hooks[type]) {
        hookStack.push(instances[name].hooks[type][hookId]);
      }
      const executeNow = function HTTPExecuteHookInner(newInput) {
        if (!instances[name]) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({'message': 'Invalid Instance', 'code': 'INVALID_INSTANCE'}, null);
        }
        const types = ['onIncomingRequest', 'onOutgoingResponsePostRender', 'onOutgoingRequest', 'onIncomingResponse'];
        if (!types.includes(type)) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({'message': 'Invalid Type', 'code': 'INVALID_TYPE'}, null);
        }
        if (hookStack.length > 0) {
          const hookFn = hookStack.pop();
          hookFn(newInput, function(output) {
            executeNow(output);
          });
        } else {
          log('debug', 'Blackrock HTTP Interface > Hooks Executed', {'name': name, 'type': type}, 'HTTP_HOOK_EXECUTED');
          resolve(newInput);
        }
      };
      executeNow(input);
    });
  };


  /**
   * Event Stream Pipelines:
   */

  /**
   * Pipelines: Processes the Incoming Request Stream [HTTP/S]
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.processRequestStream = function HTTPProcessRequestStreamPipeline() {
    const lib = core.lib; const rx = lib.rxjs; const op = lib.operators;
    return new core.Base().extend({
      constructor: function HTTPProcessRequestStreamConstructor(evt) {
        this.evt = evt;
      },
      callback: function HTTPProcessRequestStreamCallback(cb) {
        return cb(this.evt);
      },
      pipe: function HTTPProcessRequestStreamPipe() {
        log('debug',
            'Blackrock HTTP Interface > Request Event Pipeline Created - Executing Now:', {}, 'HTTP_EXEC_REQ_PIPELINE');
        const self = this;
        const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        const stream1 = Stream.pipe(
            op.map((evt) => {
              if (evt) return streamFns.checkErrors(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.determineContentType(evt);
            }),
            op.map((evt) => {
              if (evt && evt.req.multipart) {
                return streamFns.parseMultiPart(evt);
              } else if (evt && !evt.req.multipart) {
                return streamFns.parseNonMultiPart(evt);
              }
            })
        ).toPromise();
        rx.from(stream1).pipe(
            op.map((evt) => {
              if (evt) return streamFns.processRequestData(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.parseCookies(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.processHostPathAndQuery(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.fetchIPAddresses(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.isRequestSecure(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.prepareRequestMessage(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.fixTrailingSlash(evt);
            }),
            streamFns.lookupRequestRoute,
            op.map((evt) => {
              if (evt) return streamFns.pipeFilesystemFiles(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.routeRequest(evt);
            })
        ).subscribe();
      },
    });
  };

  /**
   * Pipelines: Processes the Outgoing Response Stream [HTTP/S]
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.processResponseStream = function HTTPProcessResponseStreamPipeline() {
    const lib = core.lib; const rx = lib.rxjs; const op = lib.operators;
    return new core.Base().extend({
      constructor: function HTTPProcessResponseStreamConstructor(evt) {
        this.evt = evt;
      },
      callback: function HTTPProcessResponseStreamCallback(cb) {
        return cb(this.evt);
      },
      pipe: function HTTPProcessResponseStreamPipe() {
        log('debug',
            'Blackrock HTTP Interface > Response Event Pipeline Created - Executing Now:',
            {}, 'HTTP_EXEC_RESP_PIPELINE');
        const self = this;
        const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        const stream1 = Stream.pipe(
            op.map((evt) => {
              if (evt) return streamFns.preventDuplicateResponses(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.setStatusCookiesAndHeaders(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.checkAndFinaliseLocationRequest(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.checkAndFinaliseResponseWithoutView(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.checkAndFinaliseFileResponse(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.checkAndSetMIMEType(evt);
            }),
            op.map((evt) => {
              if (evt) return streamFns.detectViewType(evt);
            }),
            op.map((evt) => {
              if (evt && evt.msg.viewType === 'object') {
                return streamFns.processObjectViewResponse(evt);
              } else if (evt && evt.msg.viewType !== 'object') {
                return streamFns.processFileViewResponse(evt);
              }
            })
        ).toPromise();
        rx.from(stream1).pipe(
            op.map((evt) => {
              if (evt) return streamFns.afterResPromise(evt);
            })
        ).subscribe();
      },
    });
  };


  /**
   * Request Stream Processing Methods:
   */

  /**
   * Request Stream Method [1]: Check HTTP Request For Errors
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.checkErrors = function HTTPCheckErrors(evt) {
    evt.res.resReturned = false;
    evt.req.on('error', (err) => {
      log('error', 'HTTP Interface > Error processing incoming request', err, 'HTTP_REQ_ERR_PROCESS_REQ');
      evt.res.statusCode = 400; evt.res.end(); evt.res.resReturned = true;
    });
    evt.res.on('error', (err) => {
      log('error', 'HTTP Interface > Error processing outgoing response', err, 'HTTP_REQ_ERR_PROCESS_RES');
    });
    log('debug', 'Blackrock HTTP Interface > [1] Checked Request for Errors');
    return evt;
  };

  /**
   * Request Stream Method [2]: Determine Content-Type of Request Message
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.determineContentType = function HTTPDetermineContentType(evt) {
    const {headers} = evt.req;
    let contentType; let boundary; let multipart = false;
    // eslint-disable-next-line guard-for-in
    for (let header in headers) {
      header = header.toLowerCase();
      if (header === 'content-type') contentType = headers[header];
    }
    if (contentType) {
      contentType = contentType.split(';');
      for (let i = 0; i < contentType.length; i++) {
        contentType[i] = contentType[i].trim();
        if (contentType[i] === 'multipart/form-data') multipart = true;
        if (contentType[i].startsWith('boundary=')) {
          boundary = contentType[i].split('=');
          boundary = boundary[1];
        }
      }
    }
    // if (!boundary) boundary = '';
    evt.req.multipart = multipart;
    log('debug', 'Blackrock HTTP Interface > [2] Content Type Determined', {}, 'HTTP_REQ_CONTENT_TYPE_DETERMINED');
    return evt;
  };

  /**
   * Request Stream Method [3a]: Parses a multi-part http message
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.parseMultiPart = function HTTPParseMultiPart(evt) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      if (config.interfaces.http[evt.req.interface].fileUploadPath) {
        form.uploadDir = config.interfaces.http[evt.req.interface].fileUploadPath;
      } else {
        form.uploadDir = core.fetchBasePath('root') + './upload/';
      }
      if (config.interfaces.http[evt.req.interface].maxUploadFileSizeMb) {
        form.maxFileSize = config.interfaces.http[evt.req.interface].maxUploadFileSizeMb * 1024 * 1024;
      } else {
        form.maxFileSize = 50 * 1024 * 1024;
      }
      try {
        form.parse(evt.req, function HTTPParseMultiPartFormParser(err, fields, files) {
          const body = fields; body.files = files; body.error = err; evt.data = body; resolve(evt);
        });
      } catch (err) {
        evt.data = {error: 'File Upload Size Was Too Large'};
        reject(evt);
      }
      log('debug',
          'Blackrock HTTP Interface > [3] Parsed Multi-Part Request Message',
          {}, 'HTTP_REQ_PARSED_MULTI_PART');
    });
  };

  /**
   * Request Stream Method [3b]: Parses a non-multi-part http message
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.parseNonMultiPart = function HTTPParseNonMultiPart(evt) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve) => {
      const data = [];
      evt.req.on('data', (chunk) => {
        data.push(chunk);
      }).on('end', () => {
        evt.data = data;
        resolve(evt);
      });
      log('debug',
          'Blackrock HTTP Interface > [3] Parsed Non-Multi-Part Request Message',
          {}, 'HTTP_REQ_PARSED_NON_MULTI_PART');
    });
  };

  /**
   * Request Stream Method [4]: Process Request Data
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.processRequestData = function HTTPProcessRequestData(evt) {
    let data = evt.data;
    try {
      if (Buffer.from(data)) {
        data = Buffer.concat(data).toString();
      }
    } catch (err) {
      log('error', 'Blackrock HTTP Interface > [4] Error Processing Request Data', err, 'ERR_PROC_REQ_DATA');
    }
    if (data && core.module('utilities').isJSON(data) === 'json_string') {
      data = JSON.parse(data);
    } else if (data && core.module('utilities').isJSON(data) !== 'json_object') {
      data = require('querystring').parse(data);
    }
    evt.data = data;
    log('debug', 'Blackrock HTTP Interface > [4] Request Body Data Processed', {}, 'HTTP_REQ_BODY_DATA_PROCESSED');
    return evt;
  };

  /**
   * Request Stream Method [5]: Parses Cookies From Headers
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.parseCookies = function HTTPProcessCookies(evt) {
    const list = {}; const rc = evt.req.headers.cookie;
    rc && rc.split(';').forEach(function( cookie ) {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    evt.req.cookieObject = list;
    log('debug', 'Blackrock HTTP Interface > [5] Cookies Parsed', {}, 'HTTP_REQ_COOKIES_PARSED');
    return evt;
  };

  /**
   * Request Stream Method [6]: Parse Host, Path & Query From URL
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.processHostPathAndQuery = function HTTPProcessHostPathAndQuery(evt) {
    const url = evt.req.url;
    const headers = evt.req.headers;
    const splitPath = url.split('?');
    evt.req.queryStringObject = {};
    if (splitPath[1]) {
      const splitQuery = splitPath[1].split('&');
      for (let i = 0; i < splitQuery.length; i++) {
        const moreSplitQuery = splitQuery[i].split('=');
        if (!evt.req.queryStringObject[moreSplitQuery[0]]) {
          evt.req.queryStringObject[moreSplitQuery[0]] = moreSplitQuery[1];
        } else {
          const oldValue = evt.req.queryStringObject[moreSplitQuery[0]];
          evt.req.queryStringObject[moreSplitQuery[0]] = [];
          evt.req.queryStringObject[moreSplitQuery[0]].push(oldValue);
          evt.req.queryStringObject[moreSplitQuery[0]].push(moreSplitQuery[1]);
        }
      }
    }
    const splitHost = headers.host.split(':'); const host = splitHost[0]; const port = splitHost[1];
    evt.req.theHost = host;
    evt.req.thePort = port;
    evt.req.thePath = splitPath[0];
    log('debug', 'Blackrock HTTP Interface > [6] Host Path & Query Processed', {}, 'HTTP_REQ_PATH_QUERY_PROCESSED');
    return evt;
  };

  /**
   * Request Stream Method [7]: Parse IP Addresses
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.fetchIPAddresses = function HTTPFetchIPAddresses(evt) {
    const {headers, connection} = evt.req;
    let reqIpAddress;
    if (headers['X-Forwarded-For']) reqIpAddress = headers['X-Forwarded-For'];
    else if (connection.remoteAddress) reqIpAddress = connection.remoteAddress;
    else reqIpAddress = '';
    if (reqIpAddress.indexOf(':') > -1) {
      const startPos = reqIpAddress.lastIndexOf(':'); const endPos = reqIpAddress.length;
      const ipv4 = reqIpAddress.slice(startPos + 1, endPos); const ipv6 = reqIpAddress.slice(0, startPos - 1);
      evt.req.reqIpAddress = ipv4; evt.req.reqIpAddressV6 = ipv6;
    }
    log('debug', 'Blackrock HTTP Interface > [7] IP Addresses Processed', {}, 'HTTP_REQ_IP_ADDR_PROCESSED');
    return evt;
  };

  /**
   * Request Stream Method [8]: Parse Whether Request is Secure
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.isRequestSecure = function HTTPIsRequestSecure(evt) {
    const {headers} = evt.req; const request = evt.req;
    if (headers['X-Forwarded-Proto'] && headers['X-Forwarded-Proto'] === 'http') {
      evt.req.reqSecure = false;
    } else if (headers['X-Forwarded-Proto'] && headers['X-Forwarded-Proto'] === 'https') {
      evt.req.reqSecure = true;
    } else {
      evt.req.reqSecure = request.secure;
    }
    log('debug',
        'Blackrock HTTP Interface > [8] Request SSL (Secure) Enabled Flag Processed',
        {}, 'HTTP_REQ_SSL_FLAG_PROCESSED');
    return evt;
  };

  /**
   * Request Stream Method [9]: Prepare Request Message
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.prepareRequestMessage = function HTTPPrepareRequestMessage(evt) {
    const request = evt.req; const msgId = core.module('utilities').uuid4(); const {method} = request;
    evt.req.theMessage = {
      'type': 'http', 'interface': request.interface, 'msgId': msgId,
      'state': 'incoming', 'directional': 'request/response',
      'request': {
        'path': evt.req.thePath, 'host': evt.req.theHost, 'port': evt.req.thePort, 'query': evt.req.queryStringObject,
        'headers': request.headers, 'params': null, 'cookies': evt.req.cookieObject,
        'ip': evt.req.reqIpAddress, 'ipv6': evt.req.reqIpAddressV6, 'verb': method,
        'secure': evt.req.reqSecure, 'body': evt.data,
      },
    };
    log('debug', 'Blackrock HTTP Interface > [9] Request Message Prepared', {}, 'HTTP_REQ_MSG_PREPARED');
    return evt;
  };

  /**
   * Request Stream Method [10]: Fix Trailing Slash
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.fixTrailingSlash = function HTTPFixTrailingSlash(evt) {
    const {theMessage} = evt.req; const response = evt.res;
    if (theMessage.request.path.endsWith('/') && theMessage.request.path !== '/') {
      evt.res.resReturned = true;
      const newPath = theMessage.request.path.slice(0, -1);
      response.writeHead(301, {Location: newPath});
      response.end();
      return;
    } else if (theMessage.request.path === '') {
      evt.res.resReturned = true;
      response.writeHead(301, {Location: '/'});
      response.end();
      return;
    }
    log('debug',
        'Blackrock HTTP Interface > [10] Trailing Slash Fixed If Present',
        {}, 'HTTP_REQ_TRAILING_SLASH_FIXED');
    return evt;
  };

  /**
   * Request Stream Method [11]: Lookup Request Route
   * @memberof Server.Interfaces.HTTP
   * @function
   * @private
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.lookupRequestRoute = function HTTPLookupRequestRoute(source) {
    const Observable = core.lib.rxjs.Observable;
    return new Observable((observer) => {
      const subscription = source.subscribe({
        next(evt) {
          const request = evt.req; const {theMessage} = request;
          log('debug',
              'Blackrock HTTP Interface > [11] Searching For Request Route', {},
              'HTTP_REQ_SEARCHING_FOR_ROUTE');
          request.router.route(theMessage.request.host, theMessage.request.path,
              function HTTPRouterRouteCallback(route) {
                if (route && route.match && route.match.service) {
                  const basePath = core.module('services').service(route.match.service).cfg().basePath;
                  if (theMessage.request.path === basePath) {
                    theMessage.request.path += '/';
                  }
                }
                theMessage.request.params = route.param;
                let htmlPath;
                if (route && route.match && route.match.service) {
                  const srv = core.module('services').service(route.match.service);
                  let base;
                  if (srv.cfg().basePath) base = srv.cfg().basePath;
                  else base = '';
                  if (theMessage.request.path.startsWith(base)) htmlPath = theMessage.request.path.slice(base.length);
                  else htmlPath = theMessage.request.path;
                } else htmlPath = theMessage.request.path;
                evt.req.route = route;
                evt.req.htmlPath = htmlPath;
                observer.next(evt);
              });
        },
        error(error) {
          observer.error(error);
        },
      });
      return () => subscription.unsubscribe();
    });
  };

  /**
   * Request Stream Method [12]: Pipe (HTML) Filesystem Files
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.pipeFilesystemFiles = function HTTPPipeFilesystemFiles(evt) {
    const fs = require('fs'); const request = evt.req; const response = evt.res;
    const {route, htmlPath, theMessage} = request;
    const srvPath = core.module('services').service(route.match.service).cfg().servicePath;
    let stats;
    try {
      stats = fs.lstatSync(srvPath + '/html' + htmlPath);
    } catch (e) {
      stats = false;
    }
    let directPath = true;
    if (!stats || stats.isDirectory()) {
      try {
        stats = fs.lstatSync(srvPath + '/html' + htmlPath + '/index.html');
        directPath = false;
      } catch (e) {
        stats = false;
      }
    }
    let pathToRead; let filename; let mimeType;
    if (stats && stats.isFile()) {
      if (directPath === true) {
        pathToRead = srvPath + '/html' + htmlPath;
        filename = theMessage.request.path.split('/');
        mimeType = utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
      } else {
        pathToRead = srvPath + '/html' + htmlPath + '/index.html';
        filename = [];
        filename[0] = 'index.html';
        mimeType = utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
      }

      if (!mimeType) mimeType = 'application/octet-stream';
      response.writeHead(200, {'Content-Type': mimeType});
      fs.createReadStream(pathToRead).pipe(response);
      evt.res.resReturned = true;
      log('debug',
          'Blackrock HTTP Interface > [12] Filesystem file piped directly through',
          {file: theMessage.request.path, msgId: theMessage.msgId}, 'HTTP_REQ_FILE_PIPED');
    } else {
      log('debug',
          'Blackrock HTTP Interface > [12] Requested File is Not a Filesystem File (would have piped if so)',
          {}, 'HTTP_REQ_NO_FILE_PIPED');
      return evt;
    }
  };

  /**
   * Request Stream Method [13]: Route Request via Router
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.routeRequest = function HTTPRouteRequest(evt) {
    const request = evt.req; const ISResPipeline = pipelines.processResponseStream();
    let resReturned = false;
    const responseListener = function HTTPRouteRequestResponseListener(msg) {
      instances[request.interface].removeListener('outgoing.' + msg.msgId, responseListener);
      resReturned = true;
      new ISResPipeline({'req': evt.req, 'res': evt.res, 'msg': msg}).pipe();
    };
    instances[request.interface].on('outgoing.' + request.theMessage.msgId, responseListener);
    const timeout = config.interfaces.http[request.interface].requestTimeout; let timer = 0;
    const interval = setInterval(function HTTPRouteRequestTimeoutHandler() {
      if (!resReturned && timer < timeout) {
        timer += 10;
      } else if (!resReturned && timer >= timeout) {
        evt.res.statusCode = 504;
        evt.res.setHeader('Content-Type', 'application/json');
        evt.res.end(JSON.stringify({'error': 'Request timed out'}));
        resReturned = true;
        clearInterval(interval);
        instances[request.interface].removeListener('outgoing.' + evt.req.theMessage.msgId, responseListener);
      } else if (resReturned) {
        clearInterval(interval);
      }
    }, 10);
    log('debug',
        'HTTP Interface > [13] Sending incoming message ' + request.theMessage.msgId +
        ' to router', request.theMessage, 'HTTP_REQ_SEND_TO_ROUTER');
    request.router.incoming(request.theMessage);
    return evt;
  };


  /**
   * Response Stream Processing Methods:
   */

  /**
   * Response Stream Method [1]: Prevent Duplicate Responses
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.preventDuplicateResponses = function HTTPPreventDuplicateResponses(evt) {
    log('debug',
        'Blackrock HTTP Interface > [1] Received response from router, Mitigating Against Duplicate Responses',
        {msgId: evt.msg.msgId}, 'HTTP_RES_STOP_DUP_RES');
    if (!evt.msg.interface || evt.res.resReturned) return;
    evt.res.resReturned = true;
    return evt;
  };

  /**
   * Response Stream Method [2]: Set Status Code, Cookies & Headers
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.setStatusCookiesAndHeaders = function HTTPSetStatusCookiesAndHeaders(evt) {
    evt.res.statusCode = evt.msg.response.statusCode;
    if (evt.msg.response.cookies) {
      // eslint-disable-next-line guard-for-in
      for (const name in evt.msg.response.cookies) {
        evt.res.setHeader('Set-Cookie', name + '=' + evt.msg.response.cookies[name].value + '; path=/;');
      }
    }
    if (evt.msg.response.clearCookies) {
      // eslint-disable-next-line guard-for-in
      for (const name in evt.msg.response.clearCookies) {
        evt.res.setHeader('Set-Cookie', name + '=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
      }
    }
    if (evt.msg.response.headers && typeof evt.msg.response.headers === 'object') {
      // eslint-disable-next-line guard-for-in
      for (const header in evt.msg.response.headers) {
        evt.res.setHeader(header, evt.msg.response.headers[header]);
      }
    }
    log('debug',
        'Blackrock HTTP Interface > [2] Status, Headers & Cookies Set Against the Response Message',
        {}, 'HTTP_RES_STATUS_COOKIES_HEADERS_SET');
    return evt;
  };

  /**
   * Response Stream Method [3]: Check & Finalise Location Request
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.checkAndFinaliseLocationRequest = function HTTPCheckAndFinaliseLocationRequest(evt) {
    if (evt.msg.response.location) {
      evt.res.setHeader('Location', evt.msg.response.location);
      evt.res.end();
      log('debug',
          'Blackrock HTTP Interface > [3] Checked If Redirect & Redirected Request',
          {'location': evt.msg.response.location}, 'HTTP_RES_EXEC_REDIRECT');
    } else {
      log('debug', 'Blackrock HTTP Interface > [3] Checked If Redirect & It Was Not', {}, 'HTTP_RES_NOT_REDIRECT');
      return evt;
    }
  };

  /**
   * Response Stream Method [4]: Check & Finalise JSON Response Without View
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.checkAndFinaliseResponseWithoutView = function HTTPCheckAndFinaliseResponseWithoutView(evt) {
    if (!evt.msg.response.view && evt.msg.response.body) {
      evt.res.setHeader('Content-Type', 'application/json');
      evt.res.end(JSON.stringify(evt.msg.response.body));
      log('debug',
          'Blackrock HTTP Interface > [4] Checked If No View & Finalised Response',
          {}, 'HTTP_RES_SENT_JSON_RES');
    } else {
      log('debug', 'Blackrock HTTP Interface > [4] Checked If No View But There Was One', {}, 'HTTP_RES_FOUND_VIEW');
      return evt;
    }
  };

  /**
   * Response Stream Method [5]: Check & Finalise File Response
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.checkAndFinaliseFileResponse = function HTTPCheckAndFinaliseFileResponse(evt) {
    if (evt.msg.response.file) {
      const fs = require('fs');
      let stats;
      try {
        stats = fs.lstatSync(evt.msg.response.file);
      } catch (e) {
        stats = false;
      }
      if (stats && stats.isFile()) {
        const pathToRead = evt.msg.response.file;
        log('debug',
            'Blackrock HTTP Interface > [5] Found File - Sending to client ',
            {file: pathToRead, msgId: evt.msg.msgId}, 'HTTP_RES_SENT_FILE_TO_CLIENT');
        const filename = pathToRead.split('/');
        let mimeType = utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
        if (!mimeType) {
          mimeType = 'application/octet-stream';
        }
        evt.res.writeHead(200, {'Content-Type': mimeType});
        const stream = fs.createReadStream(pathToRead); let hadError = false;
        stream.pipe(evt.res);
        stream.on('error', function HTTPCheckAndFinaliseFileResponseErrHandler(err) {
          hadError = true; if (evt.msg.response.cb) {
            evt.msg.response.cb(err, null);
          }
        });
        stream.on('close', function HTTPCheckAndFinaliseFileResponseCloseHandler() {
          if (!hadError && evt.msg.response.cb) {
            evt.msg.response.cb(null,
                {success: true, code: 'FILE_DOWNLOADED', message: 'File Successfully Downloaded'});
          }
        });
      } else {
        log('debug',
            'Blackrock HTTP Interface > [5] Could Not Find File - Responding With Error',
            {'file': evt.msg.response.file}, 'HTTP_RES_CANNOT_FIND_FILE');
        evt.res.setHeader('Content-Type', 'application/json');
        evt.res.end(JSON.stringify({error: 'Cannot Find File'}));
      }
    } else {
      log('debug',
          'Blackrock HTTP Interface > [5] Checked If This Was a File Response But It Was Not',
          {}, 'HTTP_RES_NOT_FILE_RES');
      return evt;
    }
  };

  /**
   * Response Stream Method [6]: Check & Set MIME Type
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.checkAndSetMIMEType = function HTTPCheckAndSetMIMEType(evt) {
    const urlSplit = evt.req.url.split('/');
    const filename = urlSplit[urlSplit.length - 1];
    const fileType = filename.split('.')[1];
    let mimeType = utils.checkMIMEType(fileType);
    if (!mimeType) {
      mimeType = 'text/html';
    }
    evt.res.setHeader('Content-Type', mimeType);
    log('debug',
        'Blackrock HTTP Interface > [6] Checked & Set MIME Type for This Response',
        {mimeType: mimeType}, 'HTTP_RES_SET_MIME');
    return evt;
  };

  /**
   * Response Stream Method [7]: Detect View Type
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.detectViewType = function HTTPDetectViewType(evt) {
    if (typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) evt.msg.viewType = 'object';
    else evt.msg.viewType = 'file';
    log('debug',
        'Blackrock HTTP Interface > [7] View Type Detected',
        {viewType: evt.msg.viewType}, 'HTTP_RES_VIEW_TYPE_DETECTED');
    return evt;
  };

  /**
   * Response Stream Method [8]: Process Object View Response
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.processObjectViewResponse = function HTTPProcessObjectViewResponse(evt) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const srvPath = core.module('services').service(evt.msg.service).cfg().servicePath;
      if (typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) {
        if (evt.msg.response.view.file) {
          try {
            fs.readFile(srvPath + '/views/' + evt.msg.response.view.file, 'utf8',
                function HTTPProcessObjectViewResponseReadFileCallback(err, htmlData) {
                  if (err) {
                    log('error',
                        'Blackrock HTTP Interface > [8] ' + srvPath + '/views/' +
                        evt.msg.response.view.file + ' view does not exist.', evt.msg, 'HTTP_RES_ERR_VIEW_NOT_EXIST');
                    evt.res.setHeader('Content-Type', 'application/json');
                    evt.res.end(JSON.stringify(evt.msg.response.body));
                    reject(err);
                    return;
                  }
                  log('debug',
                      'Blackrock HTTP Interface > [8] Rendering Object-Type HTML View...',
                      {}, 'HTTP_RES_RENDERING_OBJ_VIEW');
                  utils.renderView(evt.msg, evt.res, htmlData);
                });
          } catch (err) {
            log('error',
                'Blackrock HTTP Interface > [8] View does not exist',
                {view: evt.msg.response.view}, 'HTTP_RES_ERR_VIEW_NOT_EXIST');
            evt.res.setHeader('Content-Type', 'application/json');
            evt.res.end(JSON.stringify(evt.msg.response.body));
            reject(err);
          }
        } else if (evt.msg.response.view.html) {
          const htmlData = evt.msg.response.view.html;
          log('debug',
              'Blackrock HTTP Interface > [8] Rendering Object-Type HTML View...',
              {}, 'HTTP_RES_RENDERING_OBJ_VIEW');
          utils.renderView(evt.msg, evt.res, htmlData);
        } else {
          log('error',
              'Blackrock HTTP Interface > [8] Error Loading View - Unknown Type.',
              {}, 'HTTP_RES_ERR_LOADING_VIEW_UNKNOWN');
          evt.res.setHeader('Content-Type', 'application/json');
          evt.res.end(JSON.stringify(evt.msg.response.body));
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({error: 'Error Loading View - Unknown Type'});
        }
      } else {
        log('error',
            'Blackrock HTTP Interface > [8] Skipped Method to Process Object View Response',
            {}, 'HTTP_RES_NOT_OBJ_VIEW');
        resolve(evt);
      }
    });
  };

  /**
   * Response Stream Method [9]: Process File View Response
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.processFileViewResponse = function HTTPProcessFileViewResponse(evt) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const srvPath = core.module('services').service(evt.msg.service).cfg().servicePath;
      const viewPath = srvPath + '/views/' + evt.msg.response.view;
      if (viewCache[viewPath] && viewCache[viewPath].content) {
        log('debug', 'Blackrock HTTP Interface > [9] Rendering File-Type View...', {}, 'HTTP_RES_RENDERING_FILE_VIEW');
        utils.renderView(evt.msg, evt.res, viewCache[viewPath].content);
        resolve(evt);
      } else {
        try {
          fs.readFile(viewPath, 'utf8', function HTTPProcessFileViewResReadFileCallback(err, htmlData) {
            if (err) {
              log('error',
                  'Blackrock HTTP Interface > [9] View does not exist',
                  {view: evt.msg.response.view}, 'HTTP_RES_ERR_FILE_VIEW_NOT_EXIST');
              evt.res.setHeader('Content-Type', 'application/json');
              evt.res.end(JSON.stringify(evt.msg.response.body));
              return;
            }
            viewCache[viewPath] = {
              content: htmlData,
              expiry: 'TBC',
            };
            log('debug',
                'Blackrock HTTP Interface > [9] Rendering File-Type View...',
                {}, 'HTTP_RES_RENDERING_FILE_VIEW');
            utils.renderView(evt.msg, evt.res, htmlData);
          });
        } catch (err) {
          log('error',
              'Blackrock HTTP Interface > [9] View does not exist...',
              {view: evt.msg.response.view}, 'HTTP_RES_ERR_FILE_VIEW_NOT_EXIST');
          evt.res.setHeader('Content-Type', 'application/json');
          evt.res.end(JSON.stringify(evt.msg.response.body));
          reject(err);
        }
        resolve(evt);
      }
    });
  };

  /**
   * Response Stream Method [10]: After Response Promise
   * @memberof Server.Interfaces.HTTP
   * @private
   * @ignore
   * @param {object} evt - Response Message From Router (Not Same As Request Event)
   * @return {object} evt - Return Event
   */
  streamFns.afterResPromise = function HTTPAfterResPromise(evt) {
    return evt;
  };


  /**
   * @class Server.Interfaces.HTTP.Utils
   * @hideconstructor
   * @ignore
   *
   * @description
   * This is the Utilities class. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.utils.method"
   */
  const utils = function() {};

  /**
   * Render View
   * @memberof Server.Interfaces.HTTP.Utils
   * @function
   * @ignore
   * @param {object} msg - Message Object
   * @param {object} response - Response Object
   * @param {string} htmlData - HTML Data Context
   */
  utils.renderView = function HTTPRenderView(msg, response, htmlData) {
    const fs = require('fs'); const partials = {}; const regex = /{{>(.+)}}+/g; const found = htmlData.match(regex);
    if (found) {
      for (let i = 0; i < found.length; i++) {
        const frontRemoved = found[i].substring(4).slice(0, -2);
        try {
          partials[frontRemoved] = fs.readFileSync(core.fetchBasePath('services') + '/' + msg.service +
            '/views/includes/' + frontRemoved + '.mustache', 'utf8');
        } catch (err) {
          log('error', 'Blackrock HTTP Interface > Failed To Render View', err, 'VIEW_RENDER_FAILED');
        }
      }
    }
    const result = mustache.render(htmlData, msg.response.body, partials);
    executeHookFns(msg.interface, 'onOutgoingResponsePostRender', result).then(function(output) {
      response.end(output);
      log('debug', 'Blackrock HTTP Interface > [10] View Rendered Successfully.', {}, 'HTTP_RES_VIEW_RENDERED');
    }).catch(function(err) {
      response.end(result);
      log('debug', 'Blackrock HTTP Interface > [10] View Rendered Successfully.', err, 'HTTP_RES_VIEW_RENDERED');
    });
  };

  /**
   * Check If Port Is Taken
   * @memberof Server.Interfaces.HTTP.Utils
   * @function
   * @ignore
   * @param {number} port - The port number to check
   * @param {function} cb - Callback function
   */
  utils.isPortTaken = function HTTPIsPortTaken(port, cb) {
    const tester = require('net').createServer()
        .once('error', function HTTPIsPortTakenErrHandler(err) {
          if (err.code !== 'EADDRINUSE') {
            return cb(err);
          } cb(null, true);
        })
        .once('listening', function HTTPIsPortTakenListeningHandler() {
          tester.once('close', function() {
            cb(null, false);
          }).close();
        })
        .listen(port);
  };

  /**
   * Get File MIME Type
   * @memberof Server.Interfaces.HTTP.Utils
   * @function
   * @ignore
   * @param {string} fileType - File Type
   * @return {string} mimeType - MIME Type
   */
  utils.checkMIMEType = function HTTPCheckMIMEType(fileType) {
    const mimeTypes = {
      'jpeg': 'image/jpeg', 'jpg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
      'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'csv': 'text/csv',
      'pdf': 'application/pdf', 'md': 'text/plain', 'txt': 'text/plain',
    };
    return mimeTypes[fileType];
  };


  /**
   * @class Server.Interfaces.HTTP.Client
   * @hideconstructor
   *
   * @description
   * This is the HTTP Client class. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.client.method". This
   * class contains methods to make outgoing HTTP requests and receive responses.
   */
  const client = function() {};

  /**
   * Make HTTP Request
   * @param {object} req - Request Object
   * @param {function} cb - Callback Function
   * @memberof Server.Interfaces.HTTP.Client
   * @function
   *
   * @example
   * {
   *   "url": "https://www.google.com:8080/path1/path2?test=now",
   *   "headers": {
   *      "Content-Type": "application/json",
   *      "Content-Length": data.length
   *   },
   *   "method": "POST",
   *   "data": {"test": "value"},
   *   "encoding": "utf8"
   * }
   *
   */
  client.request = function HTTPClientRequest(req, cb) {
    if (!req.url) {
      cb({success: false, code: 1, message: 'URL Not Defined'}, null); return;
    }
    if (!req.method) {
      cb({success: false, code: 2, message: 'Method Not Defined'}, null); return;
    }
    let protocol;
    if (req.url.split('/')[0] === 'http:') protocol = 'http';
    else if (req.url.split('/')[0] === 'https:') protocol = 'https';
    else {
      cb({success: false, code: 3, message: 'Unknown Protocol'}, null);
      return;
    }
    const urlPieces = req.url.split('/');
    const httpLib = require(protocol); const hostname = urlPieces[2].split(':')[0];
    const port = urlPieces[2].split(':')[1];
    urlPieces.shift(); urlPieces.shift(); urlPieces.shift();
    const path = '/' + urlPieces.join('/').split('?')[0]; const options = {'hostname': hostname, 'method': req.method};
    if (port) options.port = port;
    if (req.headers) options.headers = req.headers;
    else options.headers = {};
    if (path) options.path = path;
    if (req.data && core.module('utilities').isJSON(req.data) === 'json_object') {
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
      req.data = JSON.stringify(req.data);
    } else if (req.data && (typeof req.data === 'string' || req.data instanceof String) &&
      core.module('utilities').isJSON(req.data) === 'json_string') {
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
    } else if (req.data && (typeof req.data === 'string' || req.data instanceof String) &&
      req.data.indexOf('<') !== -1 && req.data.indexOf('>') !== -1) {
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'application/xml';
    } else if (req.data && (typeof req.data === 'string' || req.data instanceof String)) {
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'text/plain';
    } else {
      if (!options.headers['Content-Type']) options.headers['Content-Type'] = 'text/plain';
    }
    if (req.data && !options.headers['Content-Length']) options.headers['Content-Length'] = Buffer.byteLength(req.data);
    const makeRequest = function(theOptions) {
      const reqObj = httpLib.request(theOptions, function HTTPClientRequestCallback(res) {
        let responseData = '';
        if (req.encoding) res.setEncoding(req.encoding);
        else res.setEncoding('utf8');
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (responseData && core.module('utilities').isJSON(responseData) === 'json_string') {
            responseData = JSON.parse(responseData);
          } else if (responseData && responseData.indexOf('<') === -1 &&
            responseData.indexOf('>') === -1 && responseData.indexOf('=') !== -1) {
            const responseDataSplit = responseData.split('&'); const responseDataNew = {};
            for (let i = 0; i < responseDataSplit.length; i++) {
              const valueSplit = responseDataSplit[i].split('=');
              responseDataNew[decodeURIComponent(valueSplit[0])] = decodeURIComponent(valueSplit[1]);
            }
            responseData = responseDataNew;
          } else {
            responseData = decodeURIComponent(responseData);
          }
          const resObj = {'statusCode': res.statusCode, 'data': responseData};
          log('debug',
              'Blackrock HTTP Interface > Received Incoming HTTP Response.',
              {'response': resObj}, 'HTTP_RECEIVED_RESPONSE');
          executeHookFns('http', 'onIncomingResponse', resObj).then(function(myResOutput) {
            cb(null, {
              success: true, code: 4, message: 'Response Received Successfully',
              statusCode: myResOutput.statusCode, data: myResOutput.data,
            });
          }).catch(function(err) {
            cb(null, {
              success: true, code: 4, message: 'Response Received Successfully',
              statusCode: res.statusCode, data: responseData, err: err,
            });
          });
        });
      });
      reqObj.on('error', (error) => {
        cb({success: false, code: 5, message: 'Request Error', error: error}, null);
      });
      if (req.data) reqObj.write(req.data);
      reqObj.end();
    };
    executeHookFns('http', 'onOutgoingRequest', options).then(function(theOptions) {
      log('debug',
          'Blackrock HTTP Interface > Making Outgoing HTTP Request.',
          {'options': theOptions}, 'HTTP_SENDING_REQUEST');
      makeRequest(theOptions);
    }).catch(function(err) {
      log('debug',
          'Blackrock HTTP Interface > Error Making Outgoing HTTP Request.',
          {'err': err}, 'HTTP_ERR_SENDING_REQUEST');
      makeRequest(options);
    });
  };

  /**
   * Make GET HTTP Request
   * @memberof Server.Interfaces.HTTP.Client
   * @function
   * @param {string} url - Request URL
   * @param {function} cb - Callback Function
   */
  client.get = function HTTPClientGetRequest(url, cb) {
    myInterface.client.request({'url': url, 'headers': {}, 'method': 'GET', 'encoding': 'utf8'}, cb);
  };

  /**
   * Make POST HTTP Request
   * @memberof Server.Interfaces.HTTP.Client
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   */
  client.post = function HTTPClientPostRequest(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'POST', 'encoding': 'utf8'};
    if (data) {
      reqObj.data = data;
    }
    if (options && options.headers) {
      reqObj.headers = options.headers;
    }
    myInterface.client.request(reqObj, cb);
  };

  /**
   * Make PUT HTTP Request
   * @memberof Server.Interfaces.HTTP.Client
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   */
  client.put = function HTTPClientPutRequest(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'PUT', 'encoding': 'utf8'};
    if (data) {
      reqObj.data = data;
    }
    if (options && options.headers) {
      reqObj.headers = options.headers;
    }
    myInterface.client.request(reqObj, cb);
  };

  /**
   * Make DELETE HTTP Request
   * @memberof Server.Interfaces.HTTP.Client
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   */
  client.delete = function HTTPClientDeleteRequest(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'DELETE', 'encoding': 'utf8'};
    if (data) {
      reqObj.data = data;
    }
    if (options && options.headers) {
      reqObj.headers = options.headers;
    }
    myInterface.client.request(reqObj, cb);
  };
}();
