!function RouterWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Router Module
   *
   * @public
   * @class Server.Modules.Router
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Router} module - The Router Module Singleton
   *
   * @description This is the Router Module of the Blackrock Application Server.
   * It is responsible for accepting incoming requests from any of the interfaces
   * and then routing these requests on to the relevant app + controller. It
   * then routes the response back from the controller to the originating interface.
   *
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function RouterModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Router'); o.log = core.module('logger').log;
    o.log('debug', 'Router > Initialising...', {module: mod.name}, 'MODULE_INIT');
    o.routerCount = 0; o.routers = {};
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipelines) Pipeline to Create Routers
   *
   * @private
   * @memberof Server.Modules.Router
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function RouterCreatePipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.createRouterPrototype,
        pipelines.init.attachExternalMethods,
        pipelines.init.createRouters,

        // Fires once per router on server initialisation:
        pipelines.init.initRouter,
        pipelines.init.setupReturnErrorMethod,
        pipelines.init.setupRouteMethod,
        pipelines.init.setupListenerMethod,

        // Fires once per incoming request for each router:
        pipelines.init.determineNewRequestRoute,
        pipelines.init.buildRequestObject,
        pipelines.init.buildResponseObject,
        pipelines.init.logAnalyticsNotificationForRequest,
        pipelines.init.prepareResponseListener,
        pipelines.init.routeRequestToController

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Create Router Prototype
   *
   * @private
   * @memberof Server.Modules.Router
   * @function createRouterPrototype
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.createRouterPrototype = function RouterIPLCreateRouterPrototype(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      // noinspection JSValidateTypes
      /**
       * Router Prototype
       *
       * @public
       * @class Server.Modules.Router.router
       * @augments Server.Modules.Core.Module
       *
       * @description
       * This is the Router Class. It is used to generate new Routers.
       *
       * @example
       * Tbc...
       */
      evt.Router = new core.Mod().extend({
        constructor: function RouterIPLRouterConstructor() {},
      });
      o.log('debug', 'Router > [1] Router Prototype Created',
          {module: mod.name}, 'ROUTER_PROTOTYPE_CREATED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Attach External Methods to Module
   *
   * @private
   * @memberof Server.Modules.Router
   * @function attachExternalMethods
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.attachExternalMethods = function RouterIPLAttachExternalMethods(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterIPLAttachExternalMethodsOp(observer, evt) {
      /**
       * Return Router List
       *
       * @public
       * @memberof Server.Modules.Router
       * @function list
       * @return {array} Array of Routers
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.list = function RouterGetInstanceList() {
        return Object.keys(o.routers);
      };
      /**
       * Return Specific Router
       *
       * @public
       * @memberof Server.Modules.Router
       * @function get
       * @return {string} name - Router Name
       * @return {Server.Modules.Router.router} Router Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.get = function RouterGetInstance(name) {
        if (o.routers[name]) {
          return o.routers[name];
        }
      };
      /**
       * Return Count
       *
       * @public
       * @memberof Server.Modules.Router
       * @function count
       * @return {number} Number of Active Routers
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.count = function RouterCountInstances() {
        return o.routerCount;
      };
      evt.mod = mod;
      o.log('debug',
          'Router > [2] External Methods \'get\' and \'count\' Attached to This Module',
          {module: mod.name}, 'ROUTER_BOUND_GET_COUNT');
      observer.next(evt);
    }, source);
  };

  // noinspection JSUnfilteredForInLoop
  /**
   * (Internal > Stream  Methods [3] - Operator) Create Routers
   *
   * @private
   * @memberof Server.Modules.Router
   * @function createRouters
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.createRouters = function RouterIPLLCreateRouters(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterIPLLCreateRoutersOp(observer, evt) {
      o.log('debug', 'Router > [3] Creating Routers...');
      if (core.cfg().router.instances) {
        for (const instance in core.cfg().router.instances) {
          // noinspection JSUnfilteredForInLoop
          if (core.cfg().router.instances[instance].apps && core.cfg().router.instances[instance].interfaces) {
            evt.instanceName = instance; observer.next(evt); o.routerCount ++;
          } else {
            o.log('fatal',
                'Router > [3a] One or more routers are misconfigured. ' +
                'Terminating application server...',
                {module: mod.name}, 'ROUTER_MISCONFIGURED');
            core.shutdown('Router: One or more routers are misconfigured');
          }
        }
      } else {
        o.log('fatal',
            'Router > [3a] No routers configured. Terminating application server...',
            {module: mod.name}, 'ROUTER_NO_ROUTERS');
        core.shutdown('Router: No routers configured');
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Initialise Router
   *
   * @private
   * @memberof Server.Modules.Router
   * @function initRouter
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.initRouter = function RouterModuleInitRouter(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (!mod.new) {
        /**
         * Create New Router
         *
         * @public
         * @memberof Server.Modules.Router
         * @function new
         * @param {string} name - Router Name
         * @return {Server.Modules.Router.router} router - Router
         *
         * @description
         * Tbc...
         *
         * @example
         * Tbc...
         */
        mod.new = function RouterModuleNewRouter(name) {
          o.routers[name] = new evt.Router();
          evt.routers = o.routers;
          observer.next(evt);
          o.log('debug',
              'Blackrock Router Module > [4] New Router (' + name + ') Instantiated',
              {module: mod.name}, 'ROUTER_NEW_ROUTER_INIT');
          return o.routers[name];
        };
      }
      const name = evt.instanceName;
      const routerCfg = core.cfg().router.instances[name];
      mod.new(name, routerCfg);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Return Error Method
   *
   *
   * @private
   * @memberof Server.Modules.Router
   * @function setupReturnErrorMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupReturnErrorMethod = function RouterSetupReturnErrFn(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterSetupReturnErrFnOp(observer, evt) {
      evt.ReturnError = function RouterSetupReturnError(msgObject, message, statusCode) {
        const msg = {
          'module': 'Router',
          'type': msgObject.type,
          'interface': msgObject.interface,
          'msgId': msgObject.msgId,
          'sessionId': msgObject.sessionId,
          'state': 'outgoing',
          'directional': msgObject.directional,
          'response': {
            'body': {'message': message},
            'message': message,
            'statusCode': statusCode,
          },
        };
        o.log('debug',
            'Router > Error ' + statusCode + ': Sending message ' + msgObject.msgId + ' back to originating interface',
            {module: mod.name, msg: msg}, 'ROUTER_RES_TO_INTERFACE');
        if (msgObject.sessionId) {
          core.module(msgObject.type, 'interface')
              .get(msgObject.interface).emit('outgoing.' + msgObject.sessionId, msg);
        } else {
          core.module(msgObject.type, 'interface')
              .get(msgObject.interface).emit('outgoing.' + msgObject.msgId, msg);
        }
      };
      o.log('debug',
          'Router > [3b] \'ReturnError\' Method Attached To This Router',
          {module: mod.name}, 'ROUTER_RETURN_ERROR_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Setup Route Method
   *
   * @private
   * @memberof Server.Modules.Router
   * @function setupRouteMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupRouteMethod = function RouterSetupRouteFn(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterSetupRouteFnOp(observer, evt) {
      /**
       * Router Route Method
       *
       * @public
       * @memberof Server.Modules.Router.router
       * @function route
       * @param {string} hostname - Hostname
       * @param {string} url - URL
       * @param {function} cb - Callback Function
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      o.routers[evt.instanceName].route = evt.Route = function RouterRoute(hostname, url, cb) {
        core.module('app-engine').search({
          hostname: hostname,
          url: url,
          apps: core.cfg().router.instances[evt.instanceName].apps,
        }, cb);
      };
      o.log('debug', 'Blackrock Router > [3c] \'Route\' Method Attached To This Router',
          {module: mod.name}, 'ROUTER_ROUTE_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [7] - Operator) Setup Listener Method
   *
   * @private
   * @memberof Server.Modules.Router
   * @function setupListenerMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupListenerMethod = function RouterSetupListenerFn(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterSetupListenerFn(observer, evt) {
      /**
       * Router Incoming (Listener) Method
       *
       * @public
       * @memberof Server.Modules.Router.router
       * @function incoming
       * @param {object} msg - Router Message
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      o.routers[evt.instanceName].incoming = evt.Listener = function RouterListener(msg) {
        const message = {};
        message.parentEvent = evt;
        message.routerMsg = msg;
        observer.next(message);
      };
      o.log('debug',
          'Router > [3d] \'Listener\' Method Attached To This Router (Accessible via \'get\')',
          {module: mod.name}, 'ROUTER_LISTENER_BOUND');
    }, source);
  };

  /**
   * (Internal > Stream Methods [1]) Determine New Request Route
   *
   * @private
   * @memberof Server.Modules.Router
   * @function determineNewRequestRoute
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.determineNewRequestRoute = function RouterDetermineNewReqRoute(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterDetermineNewReqRouteOp(observer, evt) {
      o.log('debug', 'Router > Received Incoming Request:',
          {module: mod.name, message: evt.routerMsg}, 'ROUTER_RECEIVED_REQUEST');
      evt.startTime = core.module('utilities').system.getStartTime();
      evt.routerInternals = {};
      evt.routerInternals.verb = evt.routerMsg.request.verb.toLowerCase();
      // eslint-disable-next-line new-cap
      evt.parentEvent.Route(evt.routerMsg.request.host, evt.routerMsg.request.path,
          function RouterDetermineNewReqRouteCb(routeResult) {
            evt.routerInternals.route = routeResult;
            if (!evt.routerInternals.route || !evt.routerInternals.route.match.controller) {
              // eslint-disable-next-line new-cap
              evt.parentEvent.ReturnError(evt.routerMsg, 'Page Not Found', 404);
              o.log('warning',
                  'Router > [1] Could not resolve endpoint - 404 - ' +
                  evt.routerMsg.msgId, {module: mod.name, messageId: evt.routerMsg.msgId}, 'ROUTER_404');
            } else {
              evt.routerInternals.controller = evt.routerInternals.route.match.controller;
              o.log('debug',
                  'Router > [1] Found Route for ' +
                  evt.routerMsg.request.host + evt.routerMsg.request.path,
                  {module: mod.name}, 'ROUTER_FOUND_ROUTE');
              observer.next(evt);
            }
          });
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Build Request Object
   *
   * @private
   * @memberof Server.Modules.Router
   * @function buildRequestObject
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.buildRequestObject = function RouterBuildReObject(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterBuildReObjectOp(observer, evt) {
      let util = core.module('utilities'); let coreProxy; let myConfig = core.cfg();
      if (util.prop(myConfig, 'app-engine.allow')) {
        coreProxy = core.getCoreProxy(myConfig['app-engine'].allow, evt.routerInternals.route.match.app);
      }  else coreProxy = {};
      const Req = require('./_support/req');
      evt.routerInternals.req = new Req;
      evt.routerInternals.req.init(coreProxy, {
        msgId: evt.routerMsg.msgId,
        type: evt.routerMsg.type,
        interface: evt.routerMsg.interface,
        router: evt.parentEvent.instanceName,
        path: evt.routerMsg.request.path,
        host: evt.routerMsg.request.host,
        headers: evt.routerMsg.request.headers,
        port: evt.routerMsg.request.port,
        query: evt.routerMsg.request.query,
        params: evt.routerInternals.route.param,
        cookies: evt.routerMsg.request.cookies,
        ip: evt.routerMsg.request.ip,
        ipv6: evt.routerMsg.request.ipv6,
        verb: evt.routerMsg.request.verb,
        secure: evt.routerMsg.request.secure,
        app: core.module('app-engine').app(evt.routerInternals.route.match.app),
        appName: evt.routerInternals.route.match.app,
        body: evt.routerMsg.request.body,
        internal: evt.routerMsg.request.internal,
        log: o.log,
      });
      o.log('debug', 'Router > [2] Built Request Object',
          {module: mod.name}, 'ROUTER_REQ_OBJ_BUILT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Build Response Object
   *
   * @private
   * @memberof Server.Modules.Router
   * @function buildResponseObject
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.buildResponseObject = function RouterBuildResObject(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterBuildResObjectOp(observer, evt) {
      const Res = require('./_support/res');
      evt.routerInternals.res = new Res;
      evt.routerInternals.res.init(core, {
        msgId: evt.routerMsg.msgId,
        app: evt.routerInternals.route.match.app,
        type: evt.routerMsg.type,
        interface: evt.routerMsg.interface,
        router: evt.parentEvent.instanceName,
      });
      o.log('debug', 'Router > [3] Built Response Object',
          {module: mod.name}, 'ROUTER_RES_OBJ_BUILT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Log Analytics Notification With Logger
   *
   * @private
   * @memberof Server.Modules.Router
   * @function logAnalyticsNotificationForRequest
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.logAnalyticsNotificationForRequest = function RouterLogReqAnalyticsNote(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterLogReqAnalyticsNoteOp(observer, evt) {
      o.log('debug', 'Router > [4] Logging Analytics Notification',
          {module: mod.name}, 'ROUTER_LOGGING_ANALYTICS_NOTE');
      let reqSize = '';
      const reqProps = ["host", "port", "path", "query", "headers", "cookies", "body"];
      for (let i = 0; i < reqProps.length - 1; i++) {
        reqSize += JSON.stringify(evt.routerMsg.request[reqProps[i]]) || '';
      }
      reqSize = reqSize.length;
      const analyticsObject = {
        'msgs': {'reqSize': reqSize, 'avgMemUsed': core.module('utilities').system.getMemoryUse()},
      };
      core.module('utilities').system.getCpuLoad(function RouterGetCpuLoadReqCallback(load) {
        analyticsObject.msgs.avgCpuLoad = load;
        core.module('logger').analytics.log(analyticsObject);
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Prepare Response Listener
   *
   * @private
   * @memberof Server.Modules.Router
   * @function prepareResponseListener
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.prepareResponseListener = function RouterPrepareResListener(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterPrepareResListenerOp(observer, evt) {
      evt.routerInternals.responseListener = function RouterResListener(msg) {
        o.log('debug',
            'Router > [7] Received response from controller - ' +
            'Routing back to original interface. Message ID: ' +
            msg.msgId, {module: mod.name, message: msg}, 'ROUTER_RES_FROM_CTRL');
        let resSize = (JSON.stringify(msg.response.body) || '') +
            (JSON.stringify(msg.response.headers) || '') +
            (JSON.stringify(msg.response.cookies) || '');
        resSize = resSize.length;
        if (msg.view) {
          const fs = require('fs'); const stats = fs.statSync(core.fetchBasePath('apps') +
              '/' + msg.app + '/views/' + msg.view);
          resSize += stats['size'];
        }
        const endTime = core.module('utilities').system.getEndTime(evt.startTime);
        const analyticsObject = {
          'msgs': {
            'resSize': resSize,
            'avgMemUsed': core.module('utilities').system.getMemoryUse(),
            'avgProcessingTime': endTime,
          },
        };
        core.module('utilities').system.getCpuLoad(function RouterGetCpuLoadResCallback(load) {
          analyticsObject.msgs.avgCpuLoad = load;
          core.module('logger').analytics.log(analyticsObject);
        });
        if (msg.type === 'apps') core.module('app-engine').emit('outgoing.' + msg.msgId, msg);
        else {
          core.module(msg.type, 'interface').get(msg.interface).emit('outgoing.' + msg.msgId, msg);
        }
        o.routers[evt.parentEvent.instanceName]
            .removeListener('router.' + msg.msgId, evt.routerInternals.responseListener);
      };
      o.routers[evt.parentEvent.instanceName].on('router.' + evt.routerMsg.msgId, evt.routerInternals.responseListener);
      o.log('debug',
          'Router > [5] Attached Response Listener (Specific to this Router Message) To This Router',
          {module: mod.name}, 'ROUTER_ATTACHED_RES_LISTENER');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Route Request To Controller
   *
   * @private
   * @memberof Server.Modules.Router
   * @function routeRequestToController
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.routeRequestToController = function RouterRouteReqToCtrl(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function RouterRouteReqToCtrlOp(observer, evt) {
      const verbs = ['get', 'post', 'put', 'delete', 'update', 'patch', 'head', 'options', 'trace'];
      if (evt.routerMsg.request.verb && evt.routerInternals.controller &&
          evt.routerInternals.controller[evt.routerInternals.verb] && verbs.includes(evt.routerInternals.verb)) {
        const app = core.module('app-engine').app(evt.routerInternals.route.match.app);
        if (app.middleware.count() === 0) {
          o.log('debug',
              'Router > [6] Routing This Request To The Target Controller Without Middleware',
              {module: mod.name}, 'ROUTER_ROUTED_TO_CTRL_NO_MW');
          evt.routerInternals.controller[evt.routerInternals.verb](evt.routerInternals.req, evt.routerInternals.res);
        } else {
          o.log('debug',
              'Router > [6] Routing This Request To The Target Controller With Middleware',
              {module: mod.name}, 'ROUTER_ROUTED_TO_CTRL_MW');
          app.middleware(evt.routerInternals.req,
              evt.routerInternals.res, evt.routerInternals.controller[evt.routerInternals.verb]);
        }
      } else {
        o.log('error',
            'Router > [6] Controller Function Cannot Be Found - ' +
            JSON.stringify(evt.routerInternals.controller), evt.routerMsg, 'ROUTER_INVALID_CTRL_FN');
        // eslint-disable-next-line new-cap
        evt.parentEvent.ReturnError(evt.routerMsg, 'Internal Server Error', 500);
      }
      observer.next(evt);
    }, source);
  };
}();
