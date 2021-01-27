!function RouterWrapper() {
  let core; let mod; let log; const routers = {}; let routerCount = 0; const pipelines = {};
  const streamFns = {}; let lib; let rx;


  /**
   * Blackrock Router Module
   *
   * @class Server.Modules.Router
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Router} module - The Router Module
   *
   * @description This is the Router Module of the Blackrock Application Server.
   * It is responsible for accepting incoming requests from any of the interfaces
   * and then routing these requests on to the relevant service + controller. It
   * then routes the response back from the controller to the originating interface.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function RouterModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Router'); log = core.module('logger').log;
    log('debug', 'Blackrock Router Module > Initialising...', {}, 'ROUTER_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.createRouters();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * =====================
   * Event Stream Pipeline
   * =====================
   */


  /**
   * (Internal > Pipelines) Pipeline to Create Routers
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.createRouters = function RouterModuleCreatePipeline() {
    return new core.Base().extend({
      constructor: function RouterModuleCreatePipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function RouterModuleCreatePipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function RouterModuleCreatePipelinePipe() {
        log('debug',
            'Blackrock Router Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'ROUTER_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.createRouterPrototype,
            streamFns.attachExternalMethods,
            streamFns.createRouters,

            // Fires once per router on server initialisation:
            streamFns.initRouter,
            streamFns.setupReturnErrorMethod,
            streamFns.setupRouteMethod,
            streamFns.setupListenerMethod,

            // Fires once per incoming request for each router:
            streamFns.determineNewRequestRoute,
            streamFns.buildRequestObject,
            streamFns.buildResponseObject,
            streamFns.logAnalyticsNotificationForRequest,
            streamFns.prepareResponseListener,
            streamFns.routeRequestToController

        ).subscribe();
      },
    });
  };


  /**
   * =====================================
   * Router Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */


  /**
   * (Internal > Stream Methods [1]) Create Router Prototype
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createRouterPrototype = function RouterModuleCreateRouterPrototype(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.Router = new core.Mod().extend({
        constructor: function RouterModuleRouterConstructor() {},
      });
      log('debug', 'Blackrock Router Module > [1] Router Prototype Created', {}, 'ROUTER_PROTOTYPE_CREATED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Attach External Methods to Module
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.attachExternalMethods = function RouterModuleAttachExternalMethods(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.list = function RouterModuleGetInstanceList() {
        return Object.keys(routers);
      };
      mod.get = function RouterModuleGetInstance(name) {
        if (routers[name]) {
          return routers[name];
        }
      };
      mod.count = function RouterModuleCountInstances() {
        return routerCount;
      };
      evt.mod = mod;
      log('debug',
          'Blackrock Router Module > [2] External Methods \'get\' and \'count\' Attached to This Module',
          {}, 'ROUTER_BOUND_GET_COUNT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [3] - Operator) Create Routers
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createRouters = function RouterModuleCreateRouters(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Router Module > [3] Creating Routers...');
      if (core.cfg().router.instances) {
        for (const instance in core.cfg().router.instances) {
          if (core.cfg().router.instances[instance].services && core.cfg().router.instances[instance].interfaces) {
            evt.instanceName = instance; observer.next(evt); routerCount ++;
          } else {
            log('fatal',
                'Blackrock Router Module > [3a] One or more routers are misconfigured. ' +
                'Terminating application server...',
                {}, 'ROUTER_MISCONFIGURED'); core.shutdown();
          }
        }
      } else {
        log('fatal',
            'Blackrock Router Module > [3a] No routers configured. Terminating application server...',
            {}, 'ROUTER_NO_ROUTERS');
        core.shutdown();
      }
    }, source);
  };


  /**
   * ================================================
   * Router Stream Processing Functions
   * (Fires Once Per Router on Server Initialisation)
   * ================================================
   */


  /**
   * (Internal > Stream Methods [4]) Initialise Router
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.initRouter = function RouterModuleInitRouter(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!mod.new) {
        mod.new = function RouterModuleNewRouter(name) {
          routers[name] = new evt.Router();
          evt.routers = routers;
          observer.next(evt);
          log('debug',
              'Blackrock Router Module > [4] New Router (' + name + ') Instantiated',
              {}, 'ROUTER_NEW_ROUTER_INIT');
        };
      }
      const name = evt.instanceName;
      const routerCfg = core.cfg().router.instances[name];
      mod.new(name, routerCfg);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Return Error Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupReturnErrorMethod = function RouterSetupReturnErrorMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.ReturnError = function RouterReturnError(msgObject, message, statusCode) {
        const msg = {
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
        log('debug',
            'Blackrock Router > Sending message ' + msgObject.msgId + ' back to originating interface',
            msgObject, 'ROUTER_RES_TO_INTERFACE');
        if (msgObject.sessionId) {
          core.module(msgObject.type, 'interface')
              .get(msgObject.interface).emit('outgoing.' + msgObject.sessionId, msg);
        } else {
          core.module(msgObject.type, 'interface')
              .get(msgObject.interface).emit('outgoing.' + msgObject.msgId, msg);
        }
      };
      log('debug',
          'Blackrock Router > [3b] \'ReturnError\' Method Attached To This Router',
          {}, 'ROUTER_RETURN_ERROR_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Setup Route Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupRouteMethod = function RouterSetupRouteMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      routers[evt.instanceName].route = evt.Route = function RouterRoute(hostname, url, cb) {
        core.module('services').search({
          hostname: hostname,
          url: url,
          services: core.cfg().router.instances[evt.instanceName].services,
        }, cb);
      };
      log('debug', 'Blackrock Router > [3c] \'Route\' Method Attached To This Router', {}, 'ROUTER_ROUTE_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [7] - Operator) Setup Listener Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupListenerMethod = function RouterSetupListenerMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      routers[evt.instanceName].incoming = evt.Listener = function RouterListener(msg) {
        const message = {};
        message.parentEvent = evt;
        message.routerMsg = msg;
        observer.next(message);
      };
      log('debug',
          'Blackrock Router > [3d] \'Listener\' Method Attached To This Router (Accessible via \'get\')',
          {}, 'ROUTER_LISTENER_BOUND');
    }, source);
  };


  /**
   * ===========================================
   * Router Stream Processing Functions
   * (Fires Once Per Incoming Request to Router)
   * ===========================================
   */

  /**
   * (Internal > Stream Methods [1]) Determine New Request Route
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.determineNewRequestRoute = function RouterDetermineNewRequestRoute(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Router > Received Incoming Request:', evt.routerMsg, 'ROUTER_RECEIVED_REQUEST');
      evt.startTime = core.module('utilities').system.getStartTime();
      evt.routerInternals = {};
      evt.routerInternals.verb = evt.routerMsg.request.verb.toLowerCase();
      // eslint-disable-next-line new-cap
      evt.parentEvent.Route(evt.routerMsg.request.host, evt.routerMsg.request.path,
          function RouterDetermineNewRequestRouteCallback(routeResult) {
            evt.routerInternals.route = routeResult;
            if (!evt.routerInternals.route || !evt.routerInternals.route.match.controller) {
              // eslint-disable-next-line new-cap
              evt.parentEvent.ReturnError(evt.routerMsg, 'Page Not Found', 404);
              log('warning',
                  'Blackrock Router > [1] Could not resolve endpoint - 404 - ' +
                  evt.routerMsg.msgId, {}, 'ROUTER_404');
            } else {
              evt.routerInternals.controller = evt.routerInternals.route.match.controller;
              log('debug',
                  'Blackrock Router > [1] Found Route for ' +
                  evt.routerMsg.request.host + evt.routerMsg.request.path,
                  {}, 'ROUTER_FOUND_ROUTE');
              observer.next(evt);
            }
          });
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Build Request Object
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.buildRequestObject = function RouterBuildRequestObject(source) {
    return lib.rxOperator(function(observer, evt) {
      const Req = require('./_support/req');
      evt.routerInternals.req = new Req;
      evt.routerInternals.req.init(core, {
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
        service: core.module('services').service(evt.routerInternals.route.match.service),
        serviceName: evt.routerInternals.route.match.service,
        body: evt.routerMsg.request.body,
        internal: evt.routerMsg.request.internal,
        log: log,
      });
      log('debug', 'Blackrock Router > [2] Built Request Object', {}, 'ROUTER_REQ_OBJ_BUILT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Build Response Object
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.buildResponseObject = function RouterBuildResponseObject(source) {
    return lib.rxOperator(function(observer, evt) {
      const Res = require('./_support/res');
      evt.routerInternals.res = new Res;
      evt.routerInternals.res.init(core, {
        msgId: evt.routerMsg.msgId,
        service: evt.routerInternals.route.match.service,
        type: evt.routerMsg.type,
        interface: evt.routerMsg.interface,
        router: evt.parentEvent.instanceName,
      });
      log('debug', 'Blackrock Router > [3] Built Response Object', {}, 'ROUTER_RES_OBJ_BUILT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Log Analytics Notification With Logger
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.logAnalyticsNotificationForRequest = function RouterLogReqAnalyticsNotification(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Router > [4] Logging Analytics Notification', {}, 'ROUTER_LOGGING_ANALYTICS_NOTE');
      let reqSize = JSON.stringify(evt.routerMsg.request.verb) +
          JSON.stringify(evt.routerMsg.request.host) +
          JSON.stringify(evt.routerMsg.request.port) +
          JSON.stringify(evt.routerMsg.request.path) +
          JSON.stringify(evt.routerMsg.request.query) +
          JSON.stringify(evt.routerMsg.request.headers) +
          JSON.stringify(evt.routerMsg.request.cookies) +
          JSON.stringify(evt.routerMsg.request.body) || '';
      reqSize = reqSize.length;
      const analyticsObject = {
        'msgs': {
          'reqSize': reqSize,
          'avgMemUsed': core.module('utilities').system.getMemoryUse(),
        },
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
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.prepareResponseListener = function RouterPrepareResponseListener(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.routerInternals.responseListener = function RouterResponseListener(msg) {
        log('debug',
            'Blackrock Router > [7] Received response from controller - ' +
            'Routing back to original interface. Message ID: ' +
            msg.msgId, msg, 'ROUTER_RES_FROM_CTRL');
        let resSize = (JSON.stringify(msg.response.body) || '') +
            (JSON.stringify(msg.response.headers) || '') +
            (JSON.stringify(msg.response.cookies) || '');
        resSize = resSize.length;
        if (msg.view) {
          const fs = require('fs'); const stats = fs.statSync(core.fetchBasePath('services') +
              '/' + msg.service + '/views/' + msg.view);
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
        if (msg.type === 'services') {
          core.module('services').emit('outgoing.' + msg.msgId, msg);
        } else {
          core.module(msg.type, 'interface').get(msg.interface).emit('outgoing.' + msg.msgId, msg);
        }
        routers[evt.parentEvent.instanceName]
            .removeListener('router.' + msg.msgId, evt.routerInternals.responseListener);
      };
      routers[evt.parentEvent.instanceName].on('router.' + evt.routerMsg.msgId, evt.routerInternals.responseListener);
      log('debug',
          'Blackrock Router > [5] Attached Response Listener (Specific to this Router Message) To This Router',
          {}, 'ROUTER_ATTACHED_RES_LISTENER');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Route Request To Controller
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.routeRequestToController = function RouterRouteReqToCtrl(source) {
    return lib.rxOperator(function(observer, evt) {
      const verbs = ['get', 'post', 'put', 'delete', 'update', 'patch', 'head', 'options', 'trace'];
      if (evt.routerMsg.request.verb && evt.routerInternals.controller &&
          evt.routerInternals.controller[evt.routerInternals.verb] && verbs.includes(evt.routerInternals.verb)) {
        const service = core.module('services').service(evt.routerInternals.route.match.service);
        if (service.middleware.count() === 0) {
          log('debug',
              'Blackrock Router > [6] Routing This Request To The Target Controller Without Middleware',
              {}, 'ROUTER_ROUTED_TO_CTRL_NO_MW');
          evt.routerInternals.controller[evt.routerInternals.verb](evt.routerInternals.req, evt.routerInternals.res);
        } else {
          log('debug',
              'Blackrock Router > [6] Routing This Request To The Target Controller With Middleware',
              {}, 'ROUTER_ROUTED_TO_CTRL_MW');
          service.middleware(evt.routerInternals.req,
              evt.routerInternals.res, evt.routerInternals.controller[evt.routerInternals.verb]);
        }
      } else {
        log('error',
            'Blackrock Router > [6] Controller Function Cannot Be Found - ' +
            JSON.stringify(evt.routerInternals.controller), evt.routerMsg, 'ROUTER_INVALID_CTRL_FN');
        // eslint-disable-next-line new-cap
        evt.parentEvent.ReturnError(evt.routerMsg, 'Internal Server Error', 500);
      }
      observer.next(evt);
    }, source);
  };
}();
