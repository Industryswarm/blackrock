!function HTTPInterfaceWrapper() {
  let core; let myInterface; let o = {}; const pipelines = function() {}; o.utils = {};
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  /**
   * HTTP Interface
   *
   * @public
   * @class Server.Interfaces.HTTP
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.HTTP} interface - The HTTP Interface Singleton
   *
   * @todo Allow view templating engine to be configured from within config file (mustache, handlebars and hogan)
   * @todo Replace formidable with a proprietary solution
   * @todo Replace Cheerio functionality with Utilities Module Transform Library (proprietary)
   * @todo Remove/fix the quickDelete function
   *
   * @description This is the HTTP Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the HTTP and HTTPS protocols.
   *
   * @example
   * const httpInterfaceSingleton = core.module('http', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function HTTPInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('HTTP'); o.log = core.module('logger').log;
    o.config = core.cfg(); o.quickDelete = require('./_support/delete.js');
    o.mustache = require('./_support/template-engines/mustache.js'); o.formidable = require('./_support/formidable');
    o.cheerio = require('./_support/cheerio.js'); o.instances = []; o.viewCache = {};
    o.log('debug', 'HTTP Interface > Initialising...',
        {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.client = o.client; myInterface.startInstance = startInstance; myInterface.hook = o.hook;
    myInterface.cheerio = o.cheerio; myInterface.formidable = o.formidable; myInterface.mustache = o.mustache;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });
    return myInterface;
  };

  /**
   * Start HTTP Interface Instance
   *
   * @public
   * @memberof Server.Interfaces.HTTP
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the HTTP Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const httpInterfaceSingleton = core.module('htp', 'interface');
   * httpInterfaceSingleton.startInstance('default');
   */
  const startInstance = function HTTPStartInstance(name) {
    const self = this; const cfg = o.config.interfaces.http[name];
    const port = parseInt(process.env.PORT || cfg.port); let protocol;
    // noinspection JSUnresolvedVariable
    if (cfg.ssl === true) protocol = 'HTTPS';
    else protocol = 'HTTP';
    o.log('startup',
        'HTTP Interface > Attempting to start ' + protocol + ' interface (' + name + ') on port ' + port + '.',
        {interface: myInterface.name, instance: name, protocol: protocol, port: port}, 'INTERFACE_STARTING');
    const routers = [];
    for (const routerName in o.config.router.instances) {
      // noinspection JSUnfilteredForInLoop
      if (o.config.router.instances[routerName].interfaces &&
        (o.config.router.instances[routerName].interfaces.includes('*') ||
            o.config.router.instances[routerName].interfaces.includes(name))) {
        // noinspection JSUnfilteredForInLoop
        routers.push(core.module('router').get(routerName));
      }
    }
    if (routers.length <= 0) {
      o.log('error',
          'HTTP Interface > Cannot start ' + protocol + ' interface (' + name + ') on port ' +
          cfg.port + ' as it is not mapped to any routers.',
          {interface: myInterface.name, instance: name, protocol: protocol, port: port}, 'INTERFACE_ERR_NO_ROUTER_MAP');
      return;
    }
    o.utils.isPortTaken(port, function HTTPIsPortTakenHandler(err, result) {
      let inst;
      if (result !== false) {
        o.log('error',
            'HTTP Interface > Cannot load HTTP interface (' + name + ') as the defined port (' +
            port + ') is already in use.',
            {interface: myInterface.name, instance: name, protocol: protocol, port: port}, 'INTERFACE_ERR_PORT_IN_USE');
        return;
      }
      // noinspection JSUnresolvedVariable
      if (cfg.ssl && (!cfg.key || !cfg.cert)) {
        o.log('error',
            'HTTP Interface > Cannot load SSL interface as either the key or cert has not been defined (' + name + ').',
            {interface: myInterface.name, instance: name,
              protocol: protocol, port: port, message: 'NO_SSL_CERT'}, 'INTERFACE_ERR_GENERAL');
        return;
      }
      let httpLib;
      try {
        // noinspection JSUnresolvedVariable
        if (cfg.ssl) httpLib = 'https';
        else httpLib = 'http';
        // noinspection JSValidateTypes
        o.instances[name] = inst = self.instances[name] = new core.Base().extend({});
        inst.listening = false;
        inst.port = port;
        inst.hooks = {
          onIncomingRequest: {}, onOutgoingResponsePostRender: {}, onOutgoingRequest: {}, onIncomingResponse: {},
        };
        inst.hookIdDirectory = {};
        const serverLib = require('./_support/' + httpLib);
        // noinspection JSUnresolvedVariable
        if (cfg.ssl) {
          inst.server = serverLib(cfg.key, cfg.cert);
        } else {
          inst.server = serverLib();
        }
      } catch (err) {
        o.log('error',
            'HTTP Interface > Error instantiating ' + httpLib.toUpperCase() + ' interface (' + name + ').',
            {message: 'CANNOT_START_INSTANCE', error: err, interface: myInterface.name,
              instance: name, protocol: protocol, port: port}, 'INTERFACE_ERR_GENERAL');
        if (inst) o.quickDelete(inst);
        return;
      }
      inst.server.on('request', function HTTPPrimaryReqHandler(request, response) {
        const myMsg = {
          httpVersion: request.httpVersion,
          host: request.headers.host,
          verb: request.method,
          url: request.url,
          headers: request.headers,
        };
        o.log('debug',
            'HTTP Interface > Received Incoming Request - ' + request.headers.host + request.url,
            {
              request: myMsg, interface: myInterface.name, instance: name,
              protocol: protocol, port: port, host: request.headers.host, path: request.url
            }, 'INTERFACE_NEW_REQ');
        request.interface = name;
        for (let i = 0; i < routers.length; i++) {
          request.router = routers[i];
          request.secure = protocol === 'HTTPS';
          o.executeHookFns(name, 'onIncomingRequest', request).then(function HTTPExecHookFnsPromiseThen(output) {
            pipelines.processRequestStream({req: output, res: response});
          }).catch(function HTTPExecHookFnsPromiseCatch(output) {
            pipelines.processRequestStream({req: output, res: response});
          });
        }
      });
      inst.server.listen(port, function HTTPListenHandler() {
        o.log('startup',
            'HTTP Interface > ' + httpLib.toUpperCase() + ' Interface (' +
            name + ') started successfully on port ' + cfg.port,
            {interface: myInterface.name, instance: name, protocol: protocol, port: port}, 'INTERFACE_STARTED');
        inst.listening = true;
      });
      myInterface.instances = o.instances;
    });
  };

  /**
   * HTTP Hook Singleton
   *
   * @public
   * @class Server.Interfaces.HTTP.Hook
   * @hideconstructor
   *
   * @description
   * This is the HTTP Hook Singleton. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.hook.method". This
   * class contains methods that allow you to hook in to HTTP requests and responses, and execute
   * intermediate functions on the content of these messages.
   *
   * @example
   * const hook = o.hook;
   */
  o.hook = function HTTPHook() {};


  /**
   * Add Hook Function
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Hook
   * @name add
   * @function
   * @param {string|array} names - Array or String Containing Interface Name(s)
   * @param {string} hookType - Type of Hook
   * @param {function} hookFn - Hook Function
   * @return {Promise} promise - Promise
   *
   * @description
   * This method (Add Hook) allows apps to register a hook function that intercepts the
   * HTTP messages at one of four supported stages (as defined by the hookType parameter).
   * The possible values for the hookType parameter, each representing a distinct stage of the
   * HTTP handling lifecycle, are - onIncomingRequest, onOutgoingResponsePostRender,
   * onOutgoingRequest and onIncomingResponse.
   *
   * @example
   * const http = core.module('http', 'interface');
   * http.hook.add('*', 'onOutgoingResponsePostRender', function(input, cb) {
   *   const output = '<h1>THIS HTML WILL BE INJECTED INTO THE TOP OF EVERY PAGE' + input;
   *   cb(output);
   * }).then(function(addResult) {
   *     const hookId = addResult.hookId
   *     console.log(hookId);
   *     // OUTPUT: "12345-1234-12345-1234"
   * });
   */
  o.hook.add = function HTTPAddHook(names, hookType, hookFn) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      let uniqueId;
      let hookCount = 0; const hooksSet = [];
      const addNow = function(inst, hook, fn) {
        uniqueId = core.module('utilities').uuid4();
        inst.hooks[o.hook][uniqueId] = fn;
        inst.hookIdDirectory[uniqueId] = o.hook;
        hooksSet.push(uniqueId);
      };
      if (Array.isArray(names)) {
        hookCount = names.length;
        for (const name in names) {
          // noinspection JSUnfilteredForInLoop
          if (o.instances && o.instances[name]) {
            // noinspection JSUnfilteredForInLoop
            addNow(o.instances[name], hookType, hookFn);
          }
        }
      } else if (names === '*') {
        hookCount = o.instances.length;
        // eslint-disable-next-line guard-for-in
        for (const name in o.instances) {
          // noinspection JSUnfilteredForInLoop
          addNow(o.instances[name], hookType, hookFn);
        }
      } else if (o.instances && o.instances[names]) {
        hookCount = 1;
        addNow(o.instances[names], hookType, hookFn);
      } else {
        o.log('debug',
            'HTTP Interface > Failed to Add New Hooks',
            {interface: myInterface.name, names: names, type: hookType}, 'HTTP_FAILED_TO_ADD_HOOKS');
        // eslint-disable-next-line prefer-promise-reject-errors
        reject('No Valid Hook Targets Defined');
        return;
      }
      const interval = setInterval(function() {
        if (hooksSet.length >= hookCount) {
          clearInterval(interval);
          o.log('debug',
              'HTTP Interface > New Hooks Added',
              {interface: myInterface.name, names: names, type: hookType, hooks: hooksSet}, 'HTTP_HOOKS_ADDED');
          resolve({result: 'Hooked Added Successfully', hookId: uniqueId});
        }
      }, 10);
    });
  };

  /**
   * Remove Defined Hook Function
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Hook
   * @name remove
   * @function
   * @param {string} hookId - The Hook UUID to Remove
   * @return {boolean} result - True | False
   *
   * @description
   * This method (the Remove Hook Method) does exactly what its name implies. It removes
   * a hook that was added via the Add Hook method from the HTTP processing pipelines, so
   * that the message is no longer intercepted by THAT particular hook function. Of courses,
   * multiple hooks may have been added, and therefore others may remain.
   *
   * @example
   * const http = core.module('http', 'interface');
   * http.hook.remove('12345-1234-12345-1234');
   */
  o.hook.remove = function HTTPRemoveHook(hookId) {
    for (const name in o.instances) {
      // noinspection JSUnfilteredForInLoop
      if (o.instances[name].hookIdDirectory[hookId]) {
        // noinspection JSUnfilteredForInLoop
        if (o.instances[name].hooks[o.instances[name].hookIdDirectory[hookId]] &&
            o.instances[name].hooks[o.instances[name].hookIdDirectory[hookId]][hookId]) {
          // noinspection JSUnfilteredForInLoop
          delete o.instances[name].hookIdDirectory[hookId];
          // noinspection JSUnfilteredForInLoop
          delete o.instances[name].hooks[o.instances[name].hookIdDirectory[hookId]][hookId];
        }
      }
    }
    o.log('debug', 'HTTP Interface > Hook Removed',
        {interface: myInterface.name, id: hookId}, 'HTTP_HOOK_REMOVED');
    return true;
  };

  /**
   * Execute Hook Functions
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name executeHookFns
   * @function
   * @ignore
   * @param {string} name - Name
   * @param {string} type - Type
   * @param {*} input - Input
   * @return {Promise} promise - Promise
   *
   * @description
   * This method (the Execute Hooks Method) is a private method that is called at key stages of the
   * HTTP processing pipelines. Upon this method being called - the HTTP Module will check the Hook
   * Directory to see if any hooks have been registered (added), and if so it will execute the
   * associated function for each hook - passing it the HTTP message. And then, once the hook
   * function has performed business logic and altered the HTTP message, it will call a callback
   * function with the amended HTTP message, which then continues on through the pipeline.
   *
   * @example
   * o.executeHookFns(msg.interface, 'onOutgoingResponsePostRender', result).then(function(output) {
   *   response.end(output);
   * }).catch(function(err) {
   *   response.end(result);
   * });
   */
  o.executeHookFns = function HTTPExecuteHooks(name, type, input) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      Object.keys(o.instances[name].hooks[type]).length;
      const hookStack = [];
      // eslint-disable-next-line guard-for-in
      for (const hookId in o.instances[name].hooks[type]) {
        // noinspection JSUnfilteredForInLoop
        hookStack.push(o.instances[name].hooks[type][hookId]);
      }
      const executeNow = function HTTPExecuteHooksInnerFn(newInput) {
        if (!o.instances[name]) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('Invalid Instance');
        }
        const types = ['onIncomingRequest', 'onOutgoingResponsePostRender', 'onOutgoingRequest', 'onIncomingResponse'];
        if (!types.includes(type)) {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('Invalid Type');
        }
        if (hookStack.length > 0) {
          const hookFn = hookStack.pop();
          hookFn(newInput, function(output) {
            executeNow(output);
          });
        } else {
          o.log('debug',
              'HTTP Interface > Hooks Executed',
              {interface: myInterface.name, name: name, type: type}, 'HTTP_HOOK_EXECUTED');
          resolve(newInput);
        }
      };
      executeNow(input);
    });
  };


  /**
   * Pipelines: [1] Request Processing Pipeline
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream
   * @function
   * @ignore
   * @return {object} pipeline - The Pipeline Object
   *
   * @description
   * This is the Request Processing Pipeline.
   * It processes the Incoming Request Stream [HTTP/S].
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   [Pipeline Step 1],
   *   [Pipeline Step 2],
   *   [Pipeline Step 3],
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream = function HTTPProcessReqStreamPipeline(evt) {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline(evt).pipe(

        // Run this pipeline for every incoming request:
        pipelines.processRequestStream.checkErrors,
        pipelines.processRequestStream.determineContentType,
        pipelines.processRequestStream.parseMultiPart,
        pipelines.processRequestStream.parseNonMultiPart,
        pipelines.processRequestStream.processRequestData,
        pipelines.processRequestStream.parseCookies,
        pipelines.processRequestStream.processHostPathAndQuery,
        pipelines.processRequestStream.fetchIPAddresses,
        pipelines.processRequestStream.isRequestSecure,
        pipelines.processRequestStream.prepareRequestMessage,
        pipelines.processRequestStream.fixTrailingSlash,
        pipelines.processRequestStream.lookupRequestRoute,
        pipelines.processRequestStream.pipeFilesystemFiles,
        pipelines.processRequestStream.routeRequest

    ).subscribe();
  };

  /**
   * Pipelines: Processes the Outgoing Response Stream [HTTP/S]
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream
   * @function
   * @ignore
   * @return {object} pipeline - The Pipeline Object
   *
   * @description
   * This is the Response Processing Pipeline.
   * It processes the Outgoing Response Stream [HTTP/S].
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   [Pipeline Step 1],
   *   [Pipeline Step 2],
   *   [Pipeline Step 3],
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream = function HTTPProcessResponseStreamPipeline(evt) {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline(evt).pipe(

        pipelines.processResponseStream.preventDuplicateResponses,
        pipelines.processResponseStream.setStatusCookiesAndHeaders,
        pipelines.processResponseStream.checkAndFinaliseLocationRequest,
        pipelines.processResponseStream.checkAndFinaliseResponseWithoutView,
        pipelines.processResponseStream.checkAndFinaliseFileResponse,
        pipelines.processResponseStream.checkAndSetMIMEType,
        pipelines.processResponseStream.detectViewType,
        pipelines.processResponseStream.processObjectViewResponse,
        pipelines.processResponseStream.processFileViewResponse

    ).subscribe();
  };


  /**
   * Request Stream Processing Methods:
   */

  /**
   * Request Stream Method [1]: Check HTTP Request For Errors
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.checkErrors
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that checks for errors within the incoming request
   * stream, and also attaches a listener to the response object that is triggered if any
   * errors occur during the response.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.checkErrors,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.checkErrors = function HTTPCheckErrors(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBindSearchOp(observer, evt) {
      evt.res.resReturned = false;
      evt.req.on('error', (err) => {
        o.log('error', 'HTTP Interface > Error processing incoming request',
            {interface: myInterface.name, error: err}, 'HTTP_REQ_ERR_PROCESS_REQ');
        evt.res.statusCode = 400; evt.res.end(); evt.res.resReturned = true;
      });
      evt.res.on('error', (err) => {
        o.log('error', 'HTTP Interface > Error processing outgoing response',
            {interface: myInterface.name, error: err}, 'HTTP_REQ_ERR_PROCESS_RES');
      });
      o.log('debug', 'HTTP Interface > [1] Checked Request for Errors',
          {interface: myInterface.name}, 'HTTP_REQ_ERR_CHECK');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [2]: Determine Content-Type of Request Message
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.determineContentType
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that determines the content type of the
   * request message, including determining whether the request is multi-part or
   * not. If the request is determined to be a multi-part request, it adds a flag
   * to the event that is sent to the next pipeline function indicating this, so
   * that later functions can make decisions accordingly.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.determineContentType,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.determineContentType = function HTTPDetermineContentType(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPDetermineContentTypeOp(observer, evt) {
      const {headers} = evt.req;
      let contentType; let boundary; let multipart = false;
      // eslint-disable-next-line guard-for-in
      for (let header in headers) {
        // noinspection JSUnfilteredForInLoop
        header = header.toLowerCase();
        if (header === 'content-type') {
          // noinspection JSUnfilteredForInLoop
          contentType = headers[header];
        }
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
      o.log('debug', 'HTTP Interface > [2] Content Type Determined',
          {interface: myInterface.name}, 'HTTP_REQ_CONTENT_TYPE_DETERMINED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [3a]: Parses a multi-part http message
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.parseMultiPart
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that checks the multi-part flag that was set
   * against the event by the Request Pipeline determineContentType() function. If
   * it is true, this function processes the incoming multi-part request as a file upload,
   * storing the file in to the upload folder that is defined within the Application Server
   * config file. It then records the path to the file (and the fact that a file upload took
   * place) against the outgoing event, which eventually makes it's way to the App Controller
   * where further processing against or decisions relating to the file can be made.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.parseMultiPart,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.parseMultiPart = function HTTPParseMultiPart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPParseMultiPartOp(observer, evt) {
      if(evt.req.multipart) {
        const form = new o.formidable.IncomingForm();
        // noinspection JSUnresolvedVariable
        if (o.config.interfaces.http[evt.req.interface].fileUploadPath) {
          // noinspection JSUnresolvedVariable
          form.uploadDir = o.config.interfaces.http[evt.req.interface].fileUploadPath;
        } else {
          form.uploadDir = core.fetchBasePath('root') + './upload/';
        }
        // noinspection JSUnresolvedVariable
        if (o.config.interfaces.http[evt.req.interface].maxUploadFileSizeMb) {
          // noinspection JSUnresolvedVariable
          form.maxFileSize = o.config.interfaces.http[evt.req.interface].maxUploadFileSizeMb * 1024 * 1024;
        } else {
          form.maxFileSize = 50 * 1024 * 1024;
        }
        try {
          form.parse(evt.req, function HTTPParseMultiPartFormParser(err, fields, files) {
            const body = fields;
            body.files = files;
            body.error = err;
            evt.data = body;
            observer.next(evt);
          });
        } catch (err) {
          evt.data = {error: 'File Upload Size Was Too Large'};
          observer.next(evt);
        }
        o.log('debug',
            'HTTP Interface > [3] Parsed Multi-Part Request Message',
            {interface: myInterface.name}, 'HTTP_REQ_PARSED_MULTI_PART');
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Request Stream Method [3b]: Parses a non-multi-part http message
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.parseNonMultiPart
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that checks the multi-part flag that was set
   * against the event by the Request Pipeline determineContentType() function. If the
   * flag is false then it determines that the request is not a multi-part request and
   * combines each of the chunks of the incoming request body into a buffer. It then
   * attaches this buffer to the outgoing event where it continues down the request
   * pipeline and is subject to further processing before reaching the controller.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.parseNonMultiPart,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.parseNonMultiPart = function HTTPParseNonMultiPart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPParseNonMultiPartOp(observer, evt) {
      if(!evt.req.multipart) {
        const data = [];
        evt.req.on('data', (chunk) => {
          data.push(chunk);
        }).on('end', () => {
          evt.data = data;
          observer.next(evt);
        });
        o.log('debug',
            'HTTP Interface > [3] Parsed Non-Multi-Part Request Message',
            {interface: myInterface.name}, 'HTTP_REQ_PARSED_NON_MULTI_PART');
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Request Stream Method [4]: Process Request Data
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.processRequestData
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that checks to see whether any request body
   * data is present within the request message, and if so - converts the buffer, within
   * which the body data sits, to a string.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.processRequestData,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.processRequestData = function HTTPProcessRequestData(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPProcessRequestDataOp(observer, evt) {
      let data = evt.data;
      try {
        if (Buffer.from(data)) {
          data = Buffer.concat(data).toString();
        }
      } catch (err) {
        o.log('error', 'HTTP Interface > [4] Error Processing Request Data',
            {interface: myInterface.name, error: err}, 'ERR_PROC_REQ_DATA');
      }
      if (data && core.module('utilities').isJSON(data) === 'json_string') {
        data = JSON.parse(data);
      } else if (data && core.module('utilities').isJSON(data) !== 'json_object') {
        data = require('querystring').parse(data);
      }
      evt.data = data;
      o.log('debug', 'HTTP Interface > [4] Request Body Data Processed',
          {interface: myInterface.name}, 'HTTP_REQ_BODY_DATA_PROCESSED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [5]: Parses Cookies From Headers
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.parseCookies
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This is a Request Pipeline function that parses the request message for cookie headers,
   * and if it finds any then it extracts them and places them in to a cookies object that
   * is then attached to the request object that is passed through to the App Controller.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.parseCookies,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.parseCookies = function HTTPProcessCookies(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPProcessCookiesOp(observer, evt) {
      const list = {}; const rc = evt.req.headers.cookie;
      rc && rc.split(';').forEach(function( cookie ) {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
      });
      evt.req.cookieObject = list;
      o.log('debug', 'HTTP Interface > [5] Cookies Parsed',
          {interface: myInterface.name}, 'HTTP_REQ_COOKIES_PARSED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [6]: Parse Host, Path & Query From URL
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.processHostPathAndQuery
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method takes the incoming HTTP request and parses it to extract
   * the host(name) and path into two string variables, and the querystring
   * parameters in to an object (req.query[name]).
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.processHostPathAndQuery,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.processHostPathAndQuery = function HTTPProcessHostPathAndQuery(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPProcessHostPathAndQueryOp(observer, evt) {
      const url = evt.req.url; const headers = evt.req.headers;
      const splitPath = url.split('?'); evt.req.queryStringObject = {};
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
      evt.req.theHost = host; evt.req.thePort = port; evt.req.thePath = splitPath[0];
      o.log('debug', 'HTTP Interface > [6] Host Path & Query Processed',
          {interface: myInterface.name}, 'HTTP_REQ_PATH_QUERY_PROCESSED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [7]: Parse IP Addresses
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.fetchIPAddresses
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method parses the incoming HTTP request message in order to identify
   * and extract the IPv4 and IPv6 IP addresses. And then sets these values against
   * the corresponding request object variables.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.fetchIPAddresses,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.fetchIPAddresses = function HTTPFetchIPAddresses(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPFetchIPAddressesOp(observer, evt) {
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
      o.log('debug', 'HTTP Interface > [7] IP Addresses Processed',
          {interface: myInterface.name}, 'HTTP_REQ_IP_ADDR_PROCESSED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [8]: Parse Whether Request is Secure
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.isRequestSecure
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method parses the incoming HTTP request message in order to identify
   * and extract the SSL flag - which is an indication of whether the request has come
   * in via a secure protocol. This may mean that it came in via an HTTPS instance of
   * this interface directly, or it may mean that the initial leg of a request that
   * came in via a reverse proxy was SSL encrypted (HTTPS), but the second leg - from
   * the reverse proxy server to Blackrock may not have necessarily been SSL encrypted.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.isRequestSecure,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.isRequestSecure = function HTTPIsRequestSecure(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPIsRequestSecureOp(observer, evt) {
      const {headers} = evt.req; const request = evt.req;
      if (headers['X-Forwarded-Proto'] && headers['X-Forwarded-Proto'] === 'http') {
        evt.req.reqSecure = false;
      } else if (headers['X-Forwarded-Proto'] && headers['X-Forwarded-Proto'] === 'https') {
        evt.req.reqSecure = true;
      } else evt.req.reqSecure = request.secure;
      o.log('debug',
          'HTTP Interface > [8] Request SSL (Secure) Enabled Flag Processed',
          {interface: myInterface.name}, 'HTTP_REQ_SSL_FLAG_PROCESSED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [9]: Prepare Request Message
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.prepareRequestMessage
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method takes all of the request attributes that were parsed and extracted in
   * previous pipeline methods and compiles them in to a request message object that is compatible
   * with what the Router Module expects to see.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.prepareRequestMessage,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.prepareRequestMessage = function HTTPPrepareRequestMessage(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPPrepareRequestMessageOp(observer, evt) {
      const request = evt.req; const msgId = core.module('utilities').uuid4(); const {method} = request;
      evt.req.theMessage = {
        'type': 'http', 'interface': request.interface, 'msgId': msgId,
        'state': 'incoming', 'directional': 'request/response',
        'request': {
          'path': evt.req.thePath, 'host': evt.req.theHost, 'port': evt.req.thePort,
          'headers': request.headers, 'params': null, 'cookies': evt.req.cookieObject,
          'ip': evt.req.reqIpAddress, 'ipv6': evt.req.reqIpAddressV6, 'verb': method,
          'secure': evt.req.reqSecure, 'body': evt.data, 'query': evt.req.queryStringObject
        },
      };
      o.log('debug', 'HTTP Interface > [9] Request Message Prepared',
          {interface: myInterface.name}, 'HTTP_REQ_MSG_PREPARED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [10]: Fix Trailing Slash
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.fixTrailingSlash
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method fixes the trailing slash on the URL when the path is empty by
   * removing it from the path that is sent in via the request object to the Router Module.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.fixTrailingSlash,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.fixTrailingSlash = function HTTPFixTrailingSlash(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPFixTrailingSlashOp(observer, evt) {
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
      o.log('debug',
          'HTTP Interface > [10] Trailing Slash Fixed If Present',
          {interface: myInterface.name}, 'HTTP_REQ_TRAILING_SLASH_FIXED');
      observer.next(evt);
    }, source);
  };

  /**
   * Request Stream Method [11]: Lookup Request Route
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.lookupRequestRoute
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method calls the route() method on the Router Module - which searches
   * the local app directory (that was filled at Application Server startup) for the
   * hostname + path of the request. If it identifies that there is a controller that
   * has been configured to respond to that hostname + path combination, then it primes
   * subsequent pipeline methods. Similarly, it primes other methods if no controller is
   * found.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.lookupRequestRoute,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.lookupRequestRoute = function HTTPLookupRequestRoute(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPLookupRequestRouteOp(observer, evt) {
      const request = evt.req; const {theMessage} = request;
      o.log('debug',
          'HTTP Interface > [11] Searching For Request Route',
          {interface: myInterface.name}, 'HTTP_REQ_SEARCHING_FOR_ROUTE');
      request.router.route(theMessage.request.host, theMessage.request.path,
          function HTTPRouterRouteCallback(route) {
            if (route && route.match && route.match.app) {
              const basePath = core.module('app-engine').app(route.match.app).cfg().basePath;
              if (theMessage.request.path === basePath) {
                theMessage.request.path += '/';
              }
            }
            theMessage.request.params = route.param;
            let htmlPath;
            if (route && route.match && route.match.app) {
              const app = core.module('app-engine').app(route.match.app);
              let base;
              if (app.cfg().basePath) base = app.cfg().basePath;
              else base = '';
              if (theMessage.request.path.startsWith(base)) htmlPath = theMessage.request.path.slice(base.length);
              else htmlPath = theMessage.request.path;
            } else htmlPath = theMessage.request.path;
            evt.req.route = route;
            evt.req.htmlPath = htmlPath;
            observer.next(evt);
          });
    }, source);
  };

  /**
   * Request Stream Method [12]: Pipe (HTML) Filesystem Files
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.pipeFilesystemFiles
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * This pipeline method checks the filesystem (under 'html' within the app folder) to
   * see if there are any static files that exist within the same path location as is
   * described within the request message. If it identifies such a file, it pipes
   * that file directly through to the client which effectively results in this request
   * message exiting the remaining pipeline.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.pipeFilesystemFiles,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.pipeFilesystemFiles = function HTTPPipeFilesystemFiles(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPPipeFilesystemFilesOp(observer, evt) {
      const fs = require('fs'); const request = evt.req; const response = evt.res;
      const {route, htmlPath, theMessage} = request;
      if (!route || !route.match) {
        observer.next(evt);
        return;
      }
      const appPath = core.module('app-engine').app(route.match.app).cfg().appPath;
      let stats;
      try {
        stats = fs.lstatSync(appPath + '/html' + htmlPath);
      } catch (e) {
        stats = false;
      }
      let directPath = true;
      if (!stats || stats.isDirectory()) {
        try {
          stats = fs.lstatSync(appPath + '/html' + htmlPath + '/index.html');
          directPath = false;
        } catch (e) {
          stats = false;
        }
      }
      let pathToRead; let filename; let mimeType;
      if (stats && stats.isFile()) {
        if (directPath === true) {
          pathToRead = appPath + '/html' + htmlPath;
          filename = theMessage.request.path.split('/');
          mimeType = o.utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
        } else {
          pathToRead = appPath + '/html' + htmlPath + '/index.html';
          filename = [];
          filename[0] = 'index.html';
          mimeType = o.utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
        }
        if (!mimeType) mimeType = 'application/octet-stream';
        response.writeHead(200, {'Content-Type': mimeType});
        fs.createReadStream(pathToRead).pipe(response);
        evt.res.resReturned = true;
        o.log('debug',
            'HTTP Interface > [12] Filesystem file piped directly through',
            {interface: myInterface.name, file: theMessage.request.path,
              filename: filename, msgId: theMessage.msgId}, 'HTTP_REQ_FILE_PIPED');
      } else {
        o.log('debug',
            'HTTP Interface > [12] Requested File is Not a Filesystem File (would have piped if so)',
            {interface: myInterface.name}, 'HTTP_REQ_NO_FILE_PIPED');
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Request Stream Method [13]: Route Request via Router
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processRequestStream.routeRequest
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Assuming that a route was found in the lookupRequestRoute() pipeline method, and that no file
   * was discovered with the same hostname and path in the pipeFilesystemFiles() method, this
   * method will - (i) Setup a Response Listener; and then (ii) Send the request message through
   * to the Router Module to be routed on to the relevant controller. A timeout is set so that
   * if the response does not arrive within the period of time defined within
   * 'config.interfaces.http[instance].requestTimeout' in the Application Server config, then a
   * 504 Timeout response will be sent to the client, and the Response Listener will be closed.
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processRequestStream.routeRequest,
   *   ...
   * ).subscribe();
   */
  pipelines.processRequestStream.routeRequest = function HTTPRouteRequest(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPRouteRequestOp(observer, evt) {
      const request = evt.req; let resReturned = false;
      const responseListener = function HTTPRouteReqResListener(msg) {
        o.instances[request.interface].removeListener('outgoing.' + msg.msgId, responseListener);
        resReturned = true;
        pipelines.processResponseStream({'req': evt.req, 'res': evt.res, 'msg': msg});
      };
      o.instances[request.interface].on('outgoing.' + request.theMessage.msgId, responseListener);
      const timeout = o.config.interfaces.http[request.interface].requestTimeout; let timer = 0;
      const interval = setInterval(function HTTPRouteReqTimeoutHandler() {
        if (!resReturned && timer < timeout) {
          timer += 10;
        } else if (!resReturned && timer >= timeout) {
          evt.res.statusCode = 504;
          evt.res.setHeader('Content-Type', 'application/json');
          evt.res.end(JSON.stringify({'error': 'Request timed out'}));
          resReturned = true;
          clearInterval(interval);
          o.instances[request.interface].removeListener('outgoing.' + evt.req.theMessage.msgId, responseListener);
        } else if (resReturned) {
          clearInterval(interval);
        }
      }, 10);
      o.log('debug',
          'HTTP Interface > [13] Sending incoming message ' + request.theMessage.msgId +
          ' to router', {interface: myInterface.name, request: request.theMessage}, 'HTTP_REQ_SEND_TO_ROUTER');
      request.router.incoming(request.theMessage);
      observer.next(evt);
    }, source);
  };


  /**
   * Response Stream Processing Methods:
   */

  /**
   * Response Stream Method [1]: Prevent Duplicate Responses
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.preventDuplicateResponses
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.preventDuplicateResponses,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.preventDuplicateResponses = function HTTPPreventDuplicateRes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPPreventDuplicateResOp(observer, evt) {
     o.log('debug',
          'HTTP Interface > [1] Received response from router, Mitigating Against Duplicate Responses',
          {interface: myInterface.name, msgId: evt.msg.msgId}, 'HTTP_RES_STOP_DUP_RES');
      if (!evt.msg.interface || evt.res.resReturned) return;
      evt.res.resReturned = true;
      observer.next(evt);
    }, source);
  };

  /**
   * Response Stream Method [2]: Set Status Code, Cookies & Headers
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.setStatusCookiesAndHeaders
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.setStatusCookiesAndHeaders,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.setStatusCookiesAndHeaders = function HTTPSetStatusCookiesAndHeaders(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPSetStatusCookiesAndHeadersOp(observer, evt) {
      evt.res.statusCode = evt.msg.response.statusCode;
      if (evt.msg.response.cookies) {
        // eslint-disable-next-line guard-for-in
        for (const name in evt.msg.response.cookies) {
          // noinspection JSUnfilteredForInLoop
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
          // noinspection JSUnfilteredForInLoop
          evt.res.setHeader(header, evt.msg.response.headers[header]);
        }
      }
      o.log('debug',
          'HTTP Interface > [2] Status, Headers & Cookies Set Against the Response Message',
          {interface: myInterface.name}, 'HTTP_RES_STATUS_COOKIES_HEADERS_SET');
    observer.next(evt);
  }, source);
  };

  /**
   * Response Stream Method [3]: Check & Finalise Location Request
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.checkAndFinaliseLocationRequest
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.checkAndFinaliseLocationRequest,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.checkAndFinaliseLocationRequest = function HTTPCheckAndEndLocationReq(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPCheckAndEndLocationReqOp(observer, evt) {
      if (evt.msg.response.location) {
        evt.res.setHeader('Location', evt.msg.response.location);
        evt.res.end();
        o.log('debug',
            'HTTP Interface > [3] Checked If Redirect & Redirected Request',
            {interface: myInterface.name, location: evt.msg.response.location}, 'HTTP_RES_EXEC_REDIRECT');
      } else {
        o.log('debug', 'HTTP Interface > [3] Checked If Redirect & It Was Not',
            {interface: myInterface.name}, 'HTTP_RES_NOT_REDIRECT');
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Response Stream Method [4]: Check & Finalise JSON Response Without View
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.checkAndFinaliseResponseWithoutView
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.checkAndFinaliseResponseWithoutView,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.checkAndFinaliseResponseWithoutView = function HTTPCheckAndEndResNoView(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPCheckAndEndResNoViewOp(observer, evt) {
      if (!evt.msg.response.view && evt.msg.response.body) {
        evt.res.setHeader('Content-Type', 'application/json');
        evt.res.end(JSON.stringify(evt.msg.response.body));
        o.log('debug',
            'HTTP Interface > [4] Checked If No View & Finalised Response',
            {interface: myInterface.name}, 'HTTP_RES_SENT_JSON_RES');
      } else {
        o.log('debug', 'HTTP Interface > [4] Checked If No View But There Was One',
            {interface: myInterface.name}, 'HTTP_RES_FOUND_VIEW');
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Response Stream Method [5]: Check & Finalise File Response
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.checkAndFinaliseFileResponse
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.checkAndFinaliseFileResponse,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.checkAndFinaliseFileResponse = function HTTPCheckAndEndFileRes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPCheckAndEndFileResOp(observer, evt) {
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
          o.log('debug',
              'HTTP Interface > [5] Found File - Sending to client ',
              {interface: myInterface.name, file: pathToRead, msgId: evt.msg.msgId}, 'HTTP_RES_SENT_FILE_TO_CLIENT');
          const filename = pathToRead.split('/');
          let mimeType = o.utils.checkMIMEType(filename[filename.length - 1].split('.').pop());
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
          o.log('debug',
              'HTTP Interface > [5] Could Not Find File - Responding With Error',
              {interface: myInterface.name, file: evt.msg.response.file}, 'HTTP_RES_CANNOT_FIND_FILE');
          evt.res.setHeader('Content-Type', 'application/json');
          evt.res.end(JSON.stringify({error: 'Cannot Find File'}));
        }
      } else {
        o.log('debug',
            'HTTP Interface > [5] Checked If This Was a File Response But It Was Not',
            {interface: myInterface.name}, 'HTTP_RES_NOT_FILE_RES');
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Response Stream Method [6]: Check & Set MIME Type
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.checkAndSetMIMEType
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.checkAndSetMIMEType,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.checkAndSetMIMEType = function HTTPCheckAndSetMIMEType(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPCheckAndSetMIMETypeOp(observer, evt) {
      const urlSplit = evt.req.url.split('/');
      const filename = urlSplit[urlSplit.length - 1];
      const fileType = filename.split('.')[1];
      let mimeType = o.utils.checkMIMEType(fileType);
      if (!mimeType) mimeType = 'text/html';
      evt.res.setHeader('Content-Type', mimeType);
      o.log('debug',
          'HTTP Interface > [6] Checked & Set MIME Type for This Response',
          {interface: myInterface.name, mimeType: mimeType}, 'HTTP_RES_SET_MIME');
      observer.next(evt);
    }, source);
  };

  /**
   * Response Stream Method [7]: Detect View Type
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.detectViewType
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.detectViewType,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.detectViewType = function HTTPDetectViewType(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPDetectViewTypeOp(observer, evt) {
      if (typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) evt.msg.viewType = 'object';
      else evt.msg.viewType = 'file';
      o.log('debug',
          'HTTP Interface > [7] View Type Detected',
          {interface: myInterface.name, viewType: evt.msg.viewType}, 'HTTP_RES_VIEW_TYPE_DETECTED');
      observer.next(evt);
    }, source);
  };

  /**
   * Response Stream Method [8]: Process Object View Response
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.processObjectViewResponse
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.processObjectViewResponse,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.processObjectViewResponse = function HTTPProcessObjectViewRes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPDetectViewTypeOp(observer, evt) {
      if (evt && evt.msg.viewType === 'object') {
        const fs = require('fs');
        const appPath = core.module('app-engine').app(evt.msg.app).cfg().appPath;
        if (typeof evt.msg.response.view === 'object' && evt.msg.response.view !== null) {
          if (evt.msg.response.view.file) {
            try {
              fs.readFile(appPath + '/views/' + evt.msg.response.view.file, 'utf8',
                  function HTTPProcessObjectViewResponseReadFileCallback(err, htmlData) {
                    if (err) {
                      o.log('error',
                          'HTTP Interface > [8] ' + appPath + '/views/' +
                          evt.msg.response.view.file + ' view does not exist.',
                          {interface: myInterface.name, message: evt.msg, error: err}, 'HTTP_RES_ERR_VIEW_NOT_EXIST');
                      evt.res.setHeader('Content-Type', 'application/json');
                      evt.res.end(JSON.stringify(evt.msg.response.body));
                      evt.err = err;
                      observer.next(evt);
                      return;
                    }
                    o.log('debug',
                        'HTTP Interface > [8] Rendering Object-Type HTML View...',
                        {interface: myInterface.name}, 'HTTP_RES_RENDERING_OBJ_VIEW');
                    o.utils.renderView(evt.msg, evt.res, htmlData);
                  });
            } catch (err) {
              o.log('error',
                  'HTTP Interface > [8] View does not exist',
                  {
                    interface: myInterface.name,
                    view: evt.msg.response.view,
                    error: err
                  }, 'HTTP_RES_ERR_VIEW_NOT_EXIST');
              evt.res.setHeader('Content-Type', 'application/json');
              evt.res.end(JSON.stringify(evt.msg.response.body));
              evt.err = err;
              observer.next(evt);
            }
          } else if (evt.msg.response.view.html) {
            const htmlData = evt.msg.response.view.html;
            o.log('debug',
                'HTTP Interface > [8] Rendering Object-Type HTML View...',
                {interface: myInterface.name}, 'HTTP_RES_RENDERING_OBJ_VIEW');
            o.utils.renderView(evt.msg, evt.res, htmlData);
          } else {
            o.log('error',
                'HTTP Interface > [8] Error Loading View - Unknown Type.',
                {interface: myInterface.name}, 'HTTP_RES_ERR_LOADING_VIEW_UNKNOWN');
            evt.res.setHeader('Content-Type', 'application/json');
            evt.res.end(JSON.stringify(evt.msg.response.body));
            // eslint-disable-next-line prefer-promise-reject-errors
            evt.err = 'Error Loading View - Unknown Type';
            observer.next(evt);
          }
        } else {
          o.log('error',
              'HTTP Interface > [8] Skipped Method to Process Object View Response',
              {interface: myInterface.name}, 'HTTP_RES_NOT_OBJ_VIEW');
          observer.next(evt);
        }
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * Response Stream Method [9]: Process File View Response
   *
   * @private
   * @memberof Server.Interfaces.HTTP
   * @name pipelines.processResponseStream.processFileViewResponse
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Yet to be defined...
   *
   * @example
   * core.lib.rxPipeline({}).pipe(
   *   ...
   *   pipelines.processResponseStream.processFileViewResponse,
   *   ...
   * ).subscribe();
   */
  pipelines.processResponseStream.processFileViewResponse = function HTTPProcessFileViewRes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function HTTPDetectViewTypeOp(observer, evt) {
      if (evt && evt.msg.viewType !== 'object') {
        const fs = require('fs');
        const appPath = core.module('app-engine').app(evt.msg.app).cfg().appPath;
        const viewPath = appPath + '/views/' + evt.msg.response.view;
        evt.msg.appPath = appPath;
        if (o.viewCache[viewPath] && o.viewCache[viewPath].content) {
          o.log('debug', 'HTTP Interface > [9] Rendering File-Type View...',
              {interface: myInterface.name}, 'HTTP_RES_RENDERING_FILE_VIEW');
          o.utils.renderView(evt.msg, evt.res, o.viewCache[viewPath].content);
          observer.next(evt);
        } else {
          try {
            fs.readFile(viewPath, 'utf8',
                function HTTPProcFileViewResReadFileCb(err, htmlData) {
                  if (err) {
                    o.log('error',
                        'HTTP Interface > [9] View does not exist',
                        {interface: myInterface.name, view: evt.msg.response.view, error: err},
                        'HTTP_RES_ERR_FILE_VIEW_NOT_EXIST');
                    evt.res.setHeader('Content-Type', 'application/json');
                    evt.res.end(JSON.stringify(evt.msg.response.body));
                    return;
                  }
                  o.viewCache[viewPath] = {
                    content: htmlData,
                    expiry: 'TBC',
                  };
                  o.log('debug',
                      'HTTP Interface > [9] Rendering File-Type View...',
                      {interface: myInterface.name}, 'HTTP_RES_RENDERING_FILE_VIEW');
                  o.utils.renderView(evt.msg, evt.res, htmlData);
                });
          } catch (err) {
            o.log('error',
                'HTTP Interface > [9] View does not exist...',
                {
                  interface: myInterface.name, view: evt.msg.response.view,
                  error: err
                }, 'HTTP_RES_ERR_FILE_VIEW_NOT_EXIST');
            evt.res.setHeader('Content-Type', 'application/json');
            evt.res.end(JSON.stringify(evt.msg.response.body));
            observer.next(err);
          }
          observer.next(evt);
        }
      } else {
        observer.next(evt);
      }
    }, source);
  };


  /**
   * @private
   * @class Server.Interfaces.HTTP.Utils
   * @hideconstructor
   * @ignore
   *
   * @description
   * This is the Utilities class. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.utils.method".
   *
   * @example
   * const utils = o.utils;
   */
  o.utils = function() {};

  /**
   * Render View
   *
   * @private
   * @memberof Server.Interfaces.HTTP.Utils
   * @name renderView
   * @function
   * @ignore
   * @param {object} msg - Message Object
   * @param {object} response - Response Object
   * @param {string} htmlData - HTML Data Context
   *
   * @description
   * This is a Utility Function within the HTTP Module that takes the context object passed
   * through from the controller, and the view template that was specified within the res.render()
   * function within the controller and used the Mustache templating engine to inject the
   * context in to the view template. It also detects any partial view templates that are
   * referenced from within the primary view template, loads them and injects them back into
   * the primary view template, before finally sending the result as the response to the client.
   *
   * @example
   * o.utils.renderView(msg, response, htmlData);
   */
  o.utils.renderView = function HTTPRenderView(msg, response, htmlData) {
    const partials = {}; const regex = /{{>(.+)}}+/g; const found = htmlData.match(regex);
    if (found) {
      for (let i = 0; i < found.length; i++) {
        const frontRemoved = found[i].substring(4).slice(0, -2);
        try {
          partials[frontRemoved] = require('fs').readFileSync(msg.appPath +
            '/views/includes/' + frontRemoved + '.mustache', 'utf8');
        } catch (err) {
          o.log('error', 'HTTP Interface > Failed To Render View Whilst Processing Template Partials',
              {interface: myInterface.name, error: err}, 'VIEW_RENDER_FAILED_PARTIALS_ERR');
        }
      }
    }
    const result = o.mustache.render(htmlData, msg.response.body, partials);
    o.executeHookFns(msg.interface, 'onOutgoingResponsePostRender', result).then(function(output) {
      response.end(output);
      o.log('debug', 'HTTP Interface > [10] View Rendered Successfully',
          {interface: myInterface.name}, 'HTTP_RES_VIEW_RENDERED');
    }).catch(function(err) {
      response.end(result);
      o.log('debug', 'HTTP Interface > [10] View Rendered Successfully, Error Executing Hooks',
          {interface: myInterface.name, error: err}, 'HTTP_RES_VIEW_RENDERED');
    });
  };

  /**
   * Check If Port Is Taken
   *
   * @private
   * @memberof Server.Interfaces.HTTP.Utils
   * @name isPortTaken
   * @function
   * @ignore
   * @param {number} port - The port number to check
   * @param {function} cb - Callback function
   *
   * @description
   * This is a Utility Function that is used during initialisation of HTTP Module Instances,
   * in order to ensure that the port that they're about to begin listening on has not
   * been taken by another instance, interface or process.
   *
   * @example
   * o.utils.isPortTaken(80, function(err,res) {
   *     if(res === true) console.log('Port In Use');
   * });
   */
  o.utils.isPortTaken = function HTTPIsPortTaken(port, cb) {
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
   *
   * @private
   * @memberof Server.Interfaces.HTTP.Utils
   * @name checkMIMEType
   * @function
   * @ignore
   * @param {string} fileType - File Type
   * @return {string} mimeType - MIME Type
   *
   * @description
   * This is a Utility function that is used within the HTTP Module's Response Pipeline to
   * determine the MIME (Multipurpose Internet Mail Extensions) type of a file based
   * on it's file extension.
   *
   * @example
   * const mimeType = o.utils.checkMIMEType('png');
   * console.log('The MIME Type Of This File Is - ' + mimeType);
   * // Output: "The MIME Type Of This File Is - image/png"
   */
  o.utils.checkMIMEType = function HTTPCheckMIMEType(fileType) {
    const mimeTypes = {
      'jpeg': 'image/jpeg', 'jpg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
      'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css', 'csv': 'text/csv',
      'pdf': 'application/pdf', 'md': 'text/plain', 'txt': 'text/plain',
    };
    return mimeTypes[fileType];
  };


  /**
   * @public
   * @class Server.Interfaces.HTTP.Client
   * @hideconstructor
   *
   * @description
   * This is the HTTP Client class. It does not need to be instantiated, so you can safely ignore
   * the constructor. You can access methods on it in this way - "interface.client.method". This
   * class contains methods to make outgoing HTTP requests and receive responses from these requests.
   *
   * @example
   * const httpClient = req.core.module('http', 'interface').client;
   */
  o.client = function() {};

  /**
   * Make HTTP Request
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Client
   * @name request
   * @param {object} req - Request Object
   * @param {function} cb - Callback Function
   * @function
   *
   * @description
   * This method allows you to make an HTTP/S request to an endpoint, setting the verb to whatever
   * you would like, in addition to providing the URL to send the request to, an object containing
   * headers to accompany the request, a request body and setting the encoding type of the request.
   * All of this information describing the request that you wish to send is passed within a
   * Request Object to this method.
   *
   * @example
   * req.core.module('http', 'interface').client.request({
   *   "url": "https://www.google.com:8080/path1/path2?test=now",
   *   "headers": {
   *      "Content-Type": "application/json",
   *      "Content-Length": data.length
   *   },
   *   "method": "POST",
   *   "data": {"test": "value"},
   *   "encoding": "utf8"
   * }, function(err, res) {
   *    console.log(res);
   * });
   *
   */
  o.client.request = function HTTPClientRequest(req, cb) {
    if (!req.url) {
      cb({success: false, code: 1, message: 'URL Not Defined'}, null);
      return;
    }
    if (!req.method) {
      cb({success: false, code: 2, message: 'Method Not Defined'}, null);
      return;
    }
    let protocol;
    if (req.url.split('/')[0] === 'http:') protocol = 'http';
    else if (req.url.split('/')[0] === 'https:') protocol = 'https';
    else {
      cb({success: false, code: 3, message: 'Unknown Protocol'}, null);
      return;
    }
    const urlPieces = req.url.split('/');
    const httpLib = require(protocol);
    const hostname = urlPieces[2].split(':')[0];
    const port = urlPieces[2].split(':')[1];
    urlPieces.shift(); urlPieces.shift(); urlPieces.shift();
    const path = '/' + urlPieces.join('/').split('?')[0];
    const options = {'hostname': hostname, 'method': req.method};
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
    if (req.data && !options.headers['Content-Length']) {
      options.headers['Content-Length'] = Buffer.byteLength(req.data);
    }
    const makeRequest = function(theOptions) {
      const reqObj = httpLib.request(theOptions, function HTTPClientReqCallback(res) {
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
          } else responseData = decodeURIComponent(responseData);
          const resObj = {'statusCode': res.statusCode, 'data': responseData};
          o.log('debug',
              'HTTP Interface > Received Incoming HTTP Response.',
              {interface: myInterface.name, response: resObj}, 'HTTP_RECEIVED_RESPONSE');
          o.executeHookFns('http', 'onIncomingResponse', resObj).then(function(myResOutput) {
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
    o.executeHookFns('http', 'onOutgoingRequest', options).then(function(theOptions) {
      o.log('debug',
          'HTTP Interface > Making Outgoing HTTP Request.',
          {interface: myInterface.name, options: theOptions}, 'HTTP_SENDING_REQUEST');
      makeRequest(theOptions);
    }).catch(function(err) {
      o.log('debug',
          'HTTP Interface > Error Making Outgoing HTTP Request.',
          {interface: myInterface.name, error: err}, 'HTTP_ERR_SENDING_REQUEST');
      makeRequest(options);
    });
  };

  /**
   * Make GET HTTP Request
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Client
   * @name get
   * @function
   * @param {string} url - Request URL
   * @param {function} cb - Callback Function
   *
   * @description
   * This method allows you to make an HTTP/S request to an endpoint, with the verb of the
   * request set to GET. Such requests are commonly used to instruct a server to fetch one or
   * more objects from the server. You are also able to attach a request body and/or headers
   * to the request.
   *
   * @example
   * const httpClient = req.core.module('http', 'interface').client;
   * httpClient.get('https://www.restfulnights.com/api/v1/users', function(err, res) {
   *     if(res.statusCode == 200) {
   *         console.log('User List Retrieved Successfully');
   *     }
   * });
   */
  o.client.get = function HTTPClientGetRequest(url, cb) {
    myInterface.client.request({'url': url, 'headers': {}, 'method': 'GET', 'encoding': 'utf8'}, cb);
  };

  /**
   * Make POST HTTP Request
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Client
   * @name post
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   *
   * @description
   * This method allows you to make an HTTP/S request to an endpoint, with the verb of the
   * request set to POST. Such requests are commonly used to instruct a server to create
   * a new object on the server. You are also able to attach a request body and/or headers
   * to the request.
   *
   * @example
   * const httpClient = req.core.module('http', 'interface').client;
   * httpClient.post('https://www.restfulnights.com/api/v1/users', null, {email: 'john@gmail.com'}, function(err, res) {
   *     if(res.statusCode == 201) {
   *         console.log('User Created Successfully');
   *     }
   * });
   */
  o.client.post = function HTTPClientPostReq(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'POST', 'encoding': 'utf8'};
    if (data) reqObj.data = data;
    if (options && options.headers) reqObj.headers = options.headers;
    myInterface.client.request(reqObj, cb);
  };

  /**
   * Make PUT HTTP Request
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Client
   * @name put
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   *
   * @description
   * This method allows you to make an HTTP/S request to an endpoint, with the verb of the
   * request set to PUT. Such requests are commonly used to instruct a server to update
   * one or more properties on an object on the server. You are also able to attach a request
   * body and/or headers to the request.
   *
   * @example
   * const httpClient = req.core.module('http', 'interface').client;
   * httpClient.put('https://www.restfulnights.com/api/v1/users/101', {country: 'Australia'}, {}, function(err, res) {
   *     if(res.statusCode == 200) {
   *         console.log('User Updated Successfully');
   *     }
   * });
   */
  o.client.put = function HTTPClientPutReq(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'PUT', 'encoding': 'utf8'};
    if (data) reqObj.data = data;
    if (options && options.headers) reqObj.headers = options.headers;
    myInterface.client.request(reqObj, cb);
  };

  /**
   * Make DELETE HTTP Request
   *
   * @public
   * @memberof Server.Interfaces.HTTP.Client
   * @name delete
   * @function
   * @param {string} url - Request URL
   * @param {object} data - Request Body Data
   * @param {object} options - Options Object
   * @param {function} cb - Callback Function
   *
   * @description
   * This method allows you to make an HTTP/S request to an endpoint, with the verb of the
   * request set to DELETE. Such requests are commonly used to instruct a server to delete
   * an object from the server. You are also able to attach a request body and/or headers
   * to the request.
   *
   * @example
   * const httpClient = req.core.module('http', 'interface').client;
   * httpClient.delete('https://www.restfulnights.com/api/v1/users/101', null, {}, function(err, res) {
   *     if(res.statusCode == 200) {
   *         console.log('User Deleted Successfully');
   *     }
   * });
   */
  o.client.delete = function HTTPClientDeleteReq(url, data, options, cb) {
    const reqObj = {'url': url, 'headers': {}, 'method': 'DELETE', 'encoding': 'utf8'};
    if (data) reqObj.data = data;
    if (options && options.headers) reqObj.headers = options.headers;
    myInterface.client.request(reqObj, cb);
  };
}();
