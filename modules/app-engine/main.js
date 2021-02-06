!function AppEngineWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function AppEngineEndWith(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  let core; let mod; let o = {}; const pipelines = function() {};

  /* let Service; let log; const services = {}; let config; let util; const loadMessages = {}; */


  /**
   * Blackrock AppEngine Module
   *
   * @public
   * @class Server.Modules.AppEngine
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.AppEngine} module - The AppEngine Module Singleton
   *
   * @description This is the AppEngine Module of the Blackrock Application Server.
   * It loads all apps and the controllers and other files within them and manages
   * access to all of these files - in tandem with the Router Module - from any
   * Interface. It also exposes a Swagger 2.0 Compliant API Definition file for each
   * of your apps (can be toggled on/off in config), which can easily be paired up
   * with SwaggerUI in your app's html folder for quick and easy documentation and
   * testing.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function AppEngineModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('AppEngine');
    // noinspection JSUnresolvedFunction
    core.module.isLoaded('utilities').then(function AppEngineModuleIsUtilLoadedThen(utilMod) {
      o.util = utilMod;
    }).catch(function AppEngineModuleIsUtilLoadedCatch(err) {
      core.shutdown('' + JSON.parse(err));
    });
    o.log = core.module('logger').log; o.config = core.cfg();
    o.apps = {}; o.loadMessages = {};
    o.log('debug', 'AppEngine > Initialising...',
        {module: mod.name}, 'MODULE_INIT');
    o.App = new core.Mod().extend({constructor: function AppEngineAppBuilder() {}});
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Initialisation Pipeline
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function AppEngineInitPipeline() {
        // noinspection JSUnresolvedFunction
        core.lib.rxPipeline({}).pipe(

            // Fires once on server initialisation:
            pipelines.init.bindUnloadMethod,
            pipelines.init.bindSearchMethod,
            pipelines.init.bindAppEndpoint,
            pipelines.init.bindSupportMethods,
            pipelines.init.loadApps,

            // Fires once per loaded app:
            pipelines.init.fetchControllerNames,
            pipelines.init.preProcessControllers,
            pipelines.init.removeInvalidControllers,
            pipelines.init.setBasePathCtrl,
            pipelines.init.waitThenExposeAppDef,
            pipelines.init.generateControllerEvents,

            // Fires once per controller within each loaded app:
            pipelines.init.loadControllerFiles,
            pipelines.init.setBasePathAndPattern,
            pipelines.init.checkIfWildcardPath,
            pipelines.init.buildRoutesObject,
            pipelines.init.findRouters,
            pipelines.init.setGetFn,
            pipelines.init.buildAppRoutes

        ).subscribe();
  };


  /**
   * (Internal > Pipeline [2]) Search Pipeline
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.search = function AppEngineSearchPipeline(event, cb) {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline(event).pipe(

        // Fires once per app route search query:
        pipelines.search.parseSearchObject,
        pipelines.search.setupHosts,
        pipelines.search.generateAppEvents,
        pipelines.search.initSearchForApp,
        pipelines.search.iterateOverRoutes,
        pipelines.search.checkAndMatch

    ).subscribe(function AppEngineSPLSubscribe(result) {
      cb(result);
    });
  };


  /**
   * (Internal > Stream Methods [1]) Bind Unload Method
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.bindUnloadMethod
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
  pipelines.init.bindUnloadMethod = function AppEngineIPLBindUnloadMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBindUnloadMethod(observer, evt) {
      /**
       * Unload The AppEngine Module
       *
       * @private
       * @memberof Server.Modules.AppEngine
       * @function unload
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.unload = function AppEngineUnload() {
        const closeControllers = function AppEngineUnloadCloseCtrl(cb) {
          let ctrlCount = 0; let counter = 0;
          if (o.apps) {
            for (const app in o.apps) {
              // noinspection JSUnfilteredForInLoop
              if (o.apps[app].routes && o.apps[app].routes.length > 0) {
                // noinspection JSUnfilteredForInLoop
                ctrlCount += o.apps[app].routes.length;
              }
            }
          }
          if (ctrlCount === 0) {
            cb();
            return;
          }
          for (const app in o.apps) {
            // noinspection JSUnfilteredForInLoop
            if (o.apps[app].routes && o.apps[app].routes.length > 0) {
              // noinspection JSUnfilteredForInLoop
              for (let i = 0; i < o.apps[app].routes.length; i++) {
                // noinspection JSUnfilteredForInLoop
                const route = o.apps[app].routes[i];
                if (!route.controller.shutdown || !(route.controller.shutdown instanceof Function)) {
                  // noinspection JSUnfilteredForInLoop
                  o.log('debug_deep',
                      'AppEngine > Attempting to shutdown controller (' + route.pattern + ') for the app ' +
                      o.apps[app].cfg.name + '  but no shutdown interface exists.', {module: mod.name},
                      'APPENGINE_SHUTDOWN_CTRL_NO_INT');
                  counter ++;
                } else {
                  // noinspection JSUnfilteredForInLoop
                  o.log('debug_deep',
                      'AppEngine > Attempting to shutdown controller (' + route.pattern + ') for app ' +
                      o.apps[app].cfg.name + ', waiting for controller response...',
                      {module: mod.name}, 'APPENGINE_SHUTDOWN_CTRL_WAITING');
                  route.controller.shutdown(function AppEngineUnloadShutdownCb() {
                    // noinspection JSUnfilteredForInLoop
                    o.log('debug',
                        'AppEngine > Controller ' + route.pattern + ' for app ' + o.apps[app].cfg.name +
                        ' shutdown successful.', {module: mod.name}, 'APPENGINE_SHUTDOWN_CTRL_SUCCESS');
                    counter ++;
                  });
                }
              }
            }
          }
          const timeout = 5000; let timeoutTimer = 0;
          const interval = setInterval(function AppEngineUnloadCloseCtrlTimeout() {
            if (counter >= ctrlCount) {
              o.log('shutdown',
                  'AppEngine > Controllers all shutdown where possible.',
                  {module: mod.name}, 'APPENGINE_SHUTDOWN_CTRL_COMPLETE');
              clearInterval(interval);
              cb();
              return;
            }
            if (timeoutTimer > timeout) {
              o.log('shutdown',
                  'AppEngine > Controller shutdown timed out.',
                  {module: mod.name}, 'APPENGINE_SHUTDOWN_CTRL_TIMEOUT');
              clearInterval(interval);
              cb();
              return;
            }
            timeoutTimer += 500;
          }, 500);
        };
        closeControllers(function AppEngineUnloadCloseCtrlCb() {
          core.emit('module-shut-down', 'AppEngine');
        });
      };
      o.log('debug', 'AppEngine > [1] Attached \'unload\' Method To This Module',
          {module: mod.name}, 'APPENGINE_UNLOAD_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Bind Search Method
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.bindSearchMethod
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
  pipelines.init.bindSearchMethod = function AppEngineIPLBindSearch(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBindSearchOp(observer, evt) {
      /**
       * (External) Searches for a Controller
       *
       * @public
       * @memberof Server.Modules.AppEngine
       * @function search
       * @param {object} searchObj - Search Definition Object
       * @param {function} cb - Callback Function
       *
       * @description
       * Tbc...
       *
       * @example
       * {
       *   apps: ["app1", "app2"],
       *   hostname: "localhost",
       *   url: "/web/users/1"
       * }
       */
      mod.search = function AppEngineIPLBindSearchSearch(searchObj, cb) {
        pipelines.search({'searchObj': searchObj}, function(evt) {
          cb(evt.result);
        });
      };
      o.log('debug', 'AppEngine > [2] Attached \'search\' Method To This Module',
          {module: mod.name}, 'APPENGINE_SEARCH_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Bind App Endpoint
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.bindAppEndpoint
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
  pipelines.init.bindAppEndpoint = function AppEngineIPLBindAppEP(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBindAppEPOp(observer, evt) {
      // noinspection JSValidateTypes
      /**
       * (Internal) Middleware Router
       *
       * @private
       * @memberof Server.Modules.AppEngine
       * @function MiddlewareRouter
       * @ignore
       * @param {object} req - Request Object
       * @param {object} res - Response Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      evt.MiddlewareRouter = new core.Base().extend({
        constructor: function AppEngineIPLMiddlewareRouter() {
          const self = this;
          self.myRouter = function(req, res, handler) {
            let stackCounter = 0;
            const innerRouter = function AppEngineIPLMiddlewareInnerRouter(req, res, handler) {
              if (self.myRouter.stack[stackCounter]) {
                self.myRouter.stack[stackCounter](req, res, function() {
                  stackCounter++;
                  if (self.myRouter.stack[stackCounter]) {
                    innerRouter(req, res, handler);
                  } else {
                    handler(req, res);
                    stackCounter = 0;
                  }
                });
              } else {
                handler(req, res);
                stackCounter = 0;
              }
            };
            return innerRouter(req, res, handler);
          };
          self.myRouter.stack = [];
          self.myRouter.use = function AppEngineIPLMiddlewareRouterUse(fn) {
            self.myRouter.stack.push(fn); return true;
          };
          self.myRouter.count = function AppEngineIPLMiddlewareRouterCount() {
            return self.myRouter.stack.length;
          };
        },
      });

      // noinspection JSUnfilteredForInLoop
      /**
       * (External) Access App Instance
       *
       * @public
       * @class Server.Modules.AppEngine.app
       * @memberof Server.Modules.AppEngine
       * @param {string} name - App Name
       * @return {Server.Modules.AppEngine.app | Object} appObj - App Instance
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.app = function AppEngineGetApp(name) {
        if (!name) return {};
        const generateAppObject = function AppEngineGenerateAppObject() {
          if (!o.apps[name]) return;
          const app = function() {};
          /**
           * (External) Get App Config
           *
           * @public
           * @memberof Server.Modules.AppEngine.app
           * @name cfg
           * @function
           * @return {object} config - Config Object
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.cfg = function AppEngineAppCfg() {
            return o.apps[name].cfg;
          };
          /**
           * (External) App Models Object
           *
           * @public
           * @class Server.Modules.AppEngine.app.models
           * @memberof Server.Modules.AppEngine.app
           * @name models
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.models = function() {};
          /**
           * (External) Get App Model
           *
           * @public
           * @memberof Server.Modules.AppEngine.app.models
           * @name get
           * @function
           * @param {object} modelName - Model
           * @return {object} modelObject - App Model
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.models.get = function AppEngineAppGetModel(modelName) {
            return o.apps[name].models[modelName];
          };
          /**
           * (External) Add App Model
           *
           * @public
           * @memberof Server.Modules.AppEngine.app.models
           * @name add
           * @function
           * @param {object} modelName - Model
           * @param {object} modelObject - App Model
           * @return {boolean} result - Result (True | False)
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.models.add = function AppEngineAppAddModel(modelName, modelObject) {
            if (!name || !modelName || !modelObject) return false;
            if (!o.apps[name].models) o.apps[name].models = {};
            o.apps[name].models[modelName] = modelObject;
            return true;
          };
          /**
           * (External) App URL Object
           *
           * @public
           * @class Server.Modules.AppEngine.app.url
           * @memberof Server.Modules.AppEngine.app
           * @name url
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.url = {};
          /**
           * (External) Get App URL
           *
           * @public
           * @memberof Server.Modules.AppEngine.app.url
           * @name get
           * @function
           * @param {string} path - Path
           * @param {object} options - App Model
           * @return {string} url - URL to App
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.url.get = function AppEngineAppGetUrl(path, options) {
            let protocol; let port; let basePath; let portString;
            if (options && options.protocol)protocol = options.protocol.toLowerCase();
            if (options && options.port) port = options.port;
            const host = o.apps[name].cfg.host;
            if (o.apps[name].cfg.basePath) basePath = o.apps[name].cfg.basePath;
            else if (core.cfg().core && core.cfg().core.basePath) basePath = core.cfg().core.basePath;
            else basePath = '';
            // noinspection JSUnresolvedVariable
            if (options && options.full === true) {
              if (!protocol) protocol = 'http';
              if (protocol === 'http' && port && port !== 80 && port !== 0) portString = ':' + port;
              else if (protocol === 'https' && port && port !== 443 && port !== 0) portString = ':' + port;
              else portString = '';
              return protocol + '://' + host + portString + basePath + path;
            } else {
              return basePath + path;
            }
          };
          /**
           * (External) App Variables Object
           *
           * @public
           * @class Server.Modules.AppEngine.app.vars
           * @memberof Server.Modules.AppEngine.app
           * @name vars
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.vars = function() {};
          /**
           * (External) Get App Variable
           *
           * @public
           * @memberof Server.Modules.AppEngine.app.vars
           * @name get
           * @function
           * @param {string} key - App Variable Key
           * @return {*} value - App Variable Value
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.vars.get = function AppEngineAppGetVar(key) {
            return o.apps[name].vars[key];
          };
          /**
           * (External) Set App Variable
           *
           * @public
           * @memberof Server.Modules.AppEngine.app.vars
           * @name set
           * @function
           * @param {string} key - App Variable Key
           * @param {object} value - App Variable Value
           * @return {boolean} result - Result of Value Update
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.vars.set = function AppEngineAppSetVar(key, value) {
            o.apps[name].vars[key] = value;
            return true;
          };
          /**
           * (Undocumented) App Middleware
           *
           * @private
           * @memberof Server.Modules.AppEngine.app
           * @name middleware
           * @ignore
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          const middleware = app.middleware = o.apps[name].middleware;
          /**
           * (External) Use Middleware
           *
           * @public
           * @memberof Server.Modules.AppEngine.app
           * @name use
           * @function
           * @param {function} middleware - Middleware Function
           *
           * @description
           * Tbc...
           *
           * @example
           * Tbc...
           */
          app.use = middleware.use;
          if (o.apps[name].obj) {
            /**
             * (External) App Routes Object
             *
             * @public
             * @memberof Server.Modules.AppEngine.app
             * @name routes
             * @function
             *
             * @description
             * Tbc...
             *
             * @example
             * Tbc...
             */
            app.routes = function() {};
            for (const objName in o.apps[name].obj) {
              // noinspection JSUnfilteredForInLoop
              if (!app.routes[objName] && objName) {
                // noinspection JSUnfilteredForInLoop
                app.routes[objName] = o.apps[name].obj[objName];
              }
            }
          }
          // noinspection JSUnresolvedVariable
          if (o.config['app-engine'].runtime.controllers.allowLoad === true) {
            /**
             * (External) Load App Controller
             *
             * @public
             * @memberof Server.Modules.AppEngine.app
             * @name loadController
             * @function
             * @param {string} path - Path to App Controller to Load
             * @param {object} ctrl - App Controller to Load
             * @return {boolean} result - Result of Loading Controller (True | False)
             *
             * @description
             * Tbc...
             *
             * @example
             * Tbc...
             */
            app.loadController = function AppEngineAppLoadCtrl(path, ctrl) {
              if (!path || !(typeof path === 'string' || path instanceof String)) return false;
              if ((typeof ctrl !== 'object' && ctrl === null) || !ctrl) return false;
              if (!o.apps[name]) return false;
              o.apps[name].map[path] = o.apps[name].routes.push({
                path: '',
                pattern: path,
                controller: ctrl,
                app: name,
              }) - 1;
              return true;
            };
          }
          // noinspection JSUnresolvedVariable
          if (o.config['app-engine'].runtime.controllers.allowUnload === true) {
            /**
             * (External) Unload App Controller
             *
             * @public
             * @memberof Server.Modules.AppEngine.app
             * @name unloadController
             * @function
             * @param {string} path - Path to App Controller to Load
             * @return {boolean} result - Result of Unloading Controller (True | False)
             *
             * @description
             * Tbc...
             *
             * @example
             * Tbc...
             */
            app.unloadController = function AppEngineAppUnloadCtrl(path) {
              if (o.apps[name].routes[o.apps[name].map[path]]) {
                delete o.apps[name].routes[o.apps[name].map[path]];
                delete o.apps[name].map[path];
                return true;
              } else return false;
            };
          }
          return app;
        };
        return generateAppObject();
      };
      o.log('debug',
          'AppEngine > [3] Setup & Attached \'app\' Method To This Module (incl. Setting Up Middleware)',
          {module: mod.name}, 'APPENGINE_APP_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Bind Support Methods
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.bindSupportMethods
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
  pipelines.init.bindSupportMethods = function AppEngineIPLBindSupportFns(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBindSupportFnsOp(observer, evt) {
      o.log('debug', 'AppEngine > [4] Binding Support Methods',
          {module: mod.name}, 'APPENGINE_SUPPORT_FNS_BOUND');
      /**
       * (External) Gets An App Object (By Name)
       *
       * @public
       * @memberof Server.Modules.AppEngine
       * @name appStats
       * @function
       * @param {string} name - App Name
       * @return {object} appStatsObj - App Stats Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.appStats = function AppEngineAppStats(name) {
        const stats = {};
        stats.appsRouteCount = 0;
        if (!name) {
          stats.appsCount = Object.keys(o.apps).length;
          if (core.module('utilities')) {
            stats.appsMemoryUse = core.module('utilities').system.getObjectMemoryUsage(o.apps);
          }
        } else {
          if (o.apps[name]) {
            stats.appsCount = 1;
            if (core.module('utilities')) {
              stats.appsMemoryUse = core.module('utilities').system.getObjectMemoryUsage(o.apps[name]);
            }
          } else {
            stats.appsCount = 0;
            stats.appsMemoryUse = 0;
          }
        }
        stats.apps = {};
        // noinspection JSUnfilteredForInLoop
        for (const app in o.apps) {
          if ((name && app === name) || !name) {
            // noinspection JSUnfilteredForInLoop
            stats.apps[app] = {};
            if (core.module('utilities')) {
              // noinspection JSUnfilteredForInLoop
              stats.apps[app].appMemoryUse =
                core.module('utilities').system.getObjectMemoryUsage(o.apps[app]);
            }
            // noinspection JSUnfilteredForInLoop
            if (o.apps[app].routes) {
              // noinspection JSUnfilteredForInLoop
              stats.apps[app].appRouteCount = o.apps[app].routes.length;
              // noinspection JSUnfilteredForInLoop
              stats.appsRouteCount += o.apps[app].routes.length;
            }
          }
        }
        return stats;
      };
      /**
       * (External) Returns a List of Loaded App Names
       *
       * @public
       * @memberof Server.Modules.AppEngine
       * @name list
       * @function
       * @return {array} apps - List of App Names
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.list = function AppEngineIPLAppList() {
        return Object.keys(o.apps);
      };
      // noinspection JSUnresolvedVariable
      if (o.config['app-engine'].runtime.apps.allowUnload === true) {
        /**
         * (External) Unload App
         *
         * @public
         * @memberof Server.Modules.AppEngine
         * @name unloadApp
         * @function
         * @param {string} name - App Name to Unload
         * @return {boolean} result - Result of Unload
         *
         * @description
         * Tbc...
         *
         * @example
         * Tbc...
         */
        mod.unloadApp = function AppEngineIPLUnloadApp(name) {
          if (o.apps[name]) {
            delete o.apps[name];
            return true;
          } else return false;
        };
      }
      // noinspection JSUnresolvedVariable
      if (o.config['app-engine'].runtime.apps.allowLoad === true) {
        /**
         * (External) Reload App
         *
         * @public
         * @memberof Server.Modules.AppEngine
         * @name reloadApp
         * @function
         * @param {string} name - App Name to Reload
         * @return {boolean} result - Result of Reload
         *
         * @description
         * Tbc...
         *
         * @example
         * Tbc...
         */
        mod.reloadApp = function AppEngineReloadApp(name) {
          if (o.apps[name]) {
            delete o.apps[name];
            // noinspection JSUnresolvedFunction
            mod.load(name).then(function(app){}).catch(function(err){});
            return true;
          } else return false;
        };
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Load Apps
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.loadApps
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
  pipelines.init.loadApps = function AppEngineIPLLoadApps(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLLoadAppsOp(observer, evt) {
      o.log('startup', 'AppEngine > [5] Enumerating and loading apps...',
          {}, 'APPENGINE_ENUM_APPS');
      /**
       * (External > Load App Method
       *
       * @public
       * @memberof Server.Modules.AppEngine
       * @function load
       * @param {string} appName - The Name of the App to Load
       * @param {object} [appCfg] - The App Configuration Object
       * @param {string} [group] - The Relative Path Of The Filesystem Group The App Is In
       * @return {Promise} Promise - Promise That Must Be Listened To (Then + Catch)
       *
       * @todo Allow loadApp() method to load apps from remote URLs and from specific paths
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      const loadApp = function AppEngineIPLLoadApp(appName, appCfg, group) {
        // eslint-disable-next-line no-undef
        return new Promise(function(resolve, reject) {
          let appExistsInFilesystem = false; let appIsRemote = false; let appGroupName;
          if (group && require('fs').existsSync(core.fetchBasePath('apps') + '/' +
            group + '/' + appName + '/app.json') === true) {
            appExistsInFilesystem = true;
            appGroupName = group;
          } else if (!group && require('fs').existsSync(core.fetchBasePath('apps') +
            '/' + appName + '/app.json') === true) {
            appExistsInFilesystem = true;
          } else if (appName.includes('.')) appIsRemote = true;
          if (!appExistsInFilesystem && !appIsRemote && !appCfg) {
            o.log('startup',
                'AppEngine > [5a] Failed to load app (' + appName + ') - Invalid App',
                {module: mod.name, app: appName}, 'APPENGINE_INVALID_APP');
            // eslint-disable-next-line prefer-promise-reject-errors
            reject('Invalid App (' + appName + ')');
            return false;
          }
          const setupApp = function AppEngineIPLSetupApp(appName, appFilesystem, appRemote, appConfig, appGroup) {
            if (appConfig.active) {
              o.log('startup',
                  'AppEngine > [5a] Loading ' + appName + ' app...',
                  {module: mod.name, app: appName}, 'APPENGINE_LOADING_APP');
              o.apps[appName] = new mod.app();
              o.apps[appName].cfg = appConfig;
              o.apps[appName].routes = [];
              o.apps[appName].map = {};
              o.apps[appName].orphans = {};
              o.apps[appName].vars = {};
              const middlewareRouter = new evt.MiddlewareRouter();
              // noinspection JSUnresolvedVariable
              o.apps[appName].middleware = middlewareRouter.myRouter;
              if (appRemote) o.apps[appName].remote = true;
              if (appFilesystem || appRemote) {
                const event = {app: appName};
                if (appGroup) event.appGroup = appGroup;
                if (appRemote) event.remotePaths = appRemote.paths;
                if (appFilesystem) event.filesystemApp = true;
                process.nextTick(function AppEngineIPLLoadAppsNextTickCb() {
                  observer.next(event);
                });
              }
              resolve(mod.app(appName));
            } else {
              // eslint-disable-next-line prefer-promise-reject-errors
              reject({'message': 'App Inactive'});
            }
          };
          if (!appCfg && appExistsInFilesystem && appGroupName) {
            appCfg = require(core.fetchBasePath('apps') + '/' +
              appGroupName + '/' + appName + '/app.json');
            appCfg.appPath = core.fetchBasePath('apps') + '/' + appGroupName + '/' + appName;
            setupApp(appName, true, false, appCfg, appGroupName);
          } else if (!appCfg && appExistsInFilesystem && !appGroupName) {
            appCfg = require(core.fetchBasePath('apps') + '/' + appName + '/app.json');
            appCfg.appPath = core.fetchBasePath('apps') + '/' + appName;
            setupApp(appName, true, false, appCfg);
          } else if (!appCfg && !appExistsInFilesystem && appIsRemote) {
            core.module('http', 'interface').client.get(appName + '/app.json', function(err, res) {
              if (err) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject({'message': 'Remote App Invalid', 'err': err});
                return;
              }
              appCfg = {
                'name': res.data.info.title,
                'host': res.data.host,
                'basePath': res.data.basePath,
                'active': true,
                'exposeDefinition': false,
              };
              setupApp(appName, false, res.data, appCfg);
            });
          } else {
            setupApp(appName, false, false, appCfg);
          }
        });
      };
      // noinspection JSUnresolvedVariable
      if (o.config['app-engine'].runtime.apps.allowLoad === true) {
        mod.load = loadApp;
      }
      const loadAppsFromFilesystem = function AppEngineIPLLoadFromFS(appBasePath, appGroup) {
        if (require('fs').existsSync(appBasePath) && require('fs').lstatSync(appBasePath).isDirectory()) {
          require('fs').readdirSync(appBasePath).forEach(
              function AppEngineIPLLoadAppReadDirCb(file) {
                if (require('fs').existsSync(appBasePath + '/' + file + '/app.json') === true) {
                  loadApp(file, null, appGroup).then(function(app) {
                  }).catch(function() {});
                } else if (file !== '.DS_Store') {
                  let newFile;
                  if (appGroup) newFile = appGroup + '/' + file;
                  else newFile = file;
                  loadAppsFromFilesystem(appBasePath + '/' + file, newFile);
                }
              });
        }
      };
      loadAppsFromFilesystem(core.fetchBasePath('apps'));
    }, source);
  };


  /**
   * (Internal > Stream Methods [6]) Fetch Controller Names
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.fetchControllerNames
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
  pipelines.init.fetchControllerNames = function AppEngineIPLFetchCtrlNames(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLFetchCtrlNamesOp(observer, evt) {
      o.log('startup',
          'AppEngine > [6] Building routes for ' + evt.app + ' app.',
          {module: mod.name}, 'APPENGINE_BUILDING_ROUTES');
      if (o.apps[evt.app].routes[0]) {
        o.log('startup',
            'AppEngine > [6a] App Routes for ' + evt.app + ' Have Already Been Built',
            {module: mod.name}, 'APPENGINE_ROUTES_ALREADY_BUILT');
        return;
      }
      // noinspection JSUnresolvedVariable
      if (((o.apps[evt.app].cfg.routing && o.apps[evt.app].cfg.routing === 'auto') ||
        !o.apps[evt.app].cfg.routing) && evt.filesystemApp) {
        let pathToWalk;
        if (evt.appGroup) {
          pathToWalk = core.fetchBasePath('apps') + '/' + evt.appGroup + '/' + evt.app + '/controllers';
        } else {
          pathToWalk = core.fetchBasePath('apps') + '/' + evt.app + '/controllers';
        }
        require('./_support/filewalker.js')(pathToWalk, function AppEngineIPLFetchCtrlNamesFilewalkerCb(err, data) {
          evt.fileWalkerErr = err;
          evt.data = data;
          observer.next(evt);
        });
      }
      if (evt.remotePaths) observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Pre-Process Controllers
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.preProcessControllers
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
  pipelines.init.preProcessControllers = function AppEngineIPLPreProcessCtrl(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLPreProcessCtrlOp(observer, evt) {
      o.log('debug',
          'AppEngine > [7] Controllers Are Being Pre-Processed (' + evt.app + ')',
          {module: mod.name}, 'APPENGINE_CTRLS_PREPROCESSED');
      if (evt.fileWalkerErr) throw evt.fileWalkerErr;
      evt.dataPreProcess = evt.data;
      if (!evt.data && !evt.remotePaths) {
        return {success: false, message: 'No controllers exist for the ' + evt.app + ' app.'};
      }
      if (evt.data) {
        evt.data = []; evt.basePath = [];
        for (let i = 0; i < evt.dataPreProcess.length; i++) {
          if (!evt.dataPreProcess[i].endsWith('.DS_Store')) evt.data.push(evt.dataPreProcess[i]);
          if (evt.dataPreProcess[i].endsWith('controller.js')) {
            evt.basePath.push(evt.dataPreProcess[i].substring(0, evt.dataPreProcess[i].length - 14));
          }
        }
        evt.basePath.sort(function AppEngineIPLPreProcessCtrlSortHandler(a, b) {
          return a.length - b.length || a.localeCompare(b);
        });
        evt.controllerBasePath = evt.basePath[0];
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Remove Invalid Controllers
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.removeInvalidControllers
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
  pipelines.init.removeInvalidControllers = function AppEngineIPLRemoveInvalidCtrl(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLRemoveInvalidCtrlOp(observer, evt) {
      if (evt.data) {
        for (let i = 0; i < evt.data.length; i++) {
          evt.data[i] = evt.data[i].replace(evt.controllerBasePath, '');
          if (evt.data[i].endsWith('controller.js') && evt.data[i] !== '/controller.js') {
            delete evt.data[i];
          } else if (evt.data[i].endsWith('controller.js') && evt.data[i] === '/controller.js') {
            evt.data[i] = '/';
          }
        }
      }
      o.log('debug',
          'AppEngine > [8] Invalid Controllers Have Been Removed (' + evt.app + ')',
          {module: mod.name}, 'APPENGINE_INVALID_CTRLS_REMOVED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Set Base Path Controller
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.setBasePathCtrl
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
  pipelines.init.setBasePathCtrl = function AppEngineIPLSetBasePathCtrl(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLSetBasePathCtrlOp(observer, evt) {
      if (o.apps[evt.app].cfg.basePath) {
        const pathBits = o.apps[evt.app].cfg.basePath.split('/');
        const pathBitsCount = pathBits.length;
        for (let i = 0; i < pathBitsCount - 1; i++) {
          let urlsPiece;
          if (i === 0 && pathBits[i] === '') urlsPiece = '/' + pathBits[0];
          else urlsPiece = '';
          for (let j = 1; j <= i; j++) {
            urlsPiece += '/' + pathBits[j];
          }
          const ctrl = {
            'get': function AppEngineIPLBasePathCtrlGet(req, res) {
              res.redirect(o.apps[evt.app].cfg.basePath);
            },
          };
          o.apps[evt.app].map[urlsPiece] = o.apps[evt.app].routes.push({
            path: '',
            pattern: urlsPiece,
            controller: ctrl,
            metadata: {
              'get': {
                'openapi': {
                  'summary': 'Root Redirect',
                  'description': 'Root Redirect for Base Path Controller',
                  'responses': {
                    '302': {},
                  },
                },
              },
            },
            app: evt.app,
          }) - 1;
        }
      }
      o.log('debug',
          'AppEngine > [9] Have Set Base Path Controller & App Routes',
          {module: mod.name}, 'APPENGINE_BASE_PATH_CTRL_SET');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9.5]) Wait Then Expose App Definition
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.waitThenExposeAppDef
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
  pipelines.init.waitThenExposeAppDef = function AppEngineIPLWaitThenExposeAppDef(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLWaitThenExposeAppDefOp(observer, evt) {
      o.log('debug',
          'AppEngine > [9.5] Waiting for Routes To Be Built Then Exposing App Definition Endpoint',
          {module: mod.name}, 'APPENGINE_WAIT_EXPOSE_DEF');
      o.apps[evt.app].loadedCtrlCount = 0;
      o.apps[evt.app].totalCtrlCount = 0;
      if (evt.data) {
        for (let i = 0; i < evt.data.length; i++) {
          if (evt.data[i]) o.apps[evt.app].totalCtrlCount ++;
        }
      }
      if (evt.remotePaths) {
        for (let i = 0; i < evt.remotePaths.length; i++) {
          if (evt.remotePaths[i]) o.apps[evt.app].totalCtrlCount ++;
        }
      }
      let timer = 0; const timeout = 5000;
      const interval = setInterval(function AppEngineIPLWaitThenExposeIntervalCb() {
        if (o.apps[evt.app].loadedCtrlCount >= o.apps[evt.app].totalCtrlCount) {
          clearInterval(interval);
          const ctrl = {
            'get': function AppEngineIPLAppDefCtrlGet(req, res) {
              if (o.apps[evt.app].cfg.exposeDefinition === true) {
                // noinspection JSUnresolvedVariable
                const json = {
                  'swagger': '2.0',
                  'info': {
                    'title': o.apps[evt.app].cfg.name,
                    'description': o.apps[evt.app].cfg.description,
                    'version': o.apps[evt.app].cfg.version,
                    'app': o.apps[evt.app].cfg.termsUrl,
                    'contact': {},
                    'license': {},
                  },
                  'host': o.apps[evt.app].cfg.host,
                  'basePath': o.apps[evt.app].cfg.basePath,
                  'schemes': [
                    'http',
                    'https',
                  ],
                  'paths': {},
                };
                if (o.apps[evt.app].cfg.license) {
                  json.info.license.name = o.apps[evt.app].cfg.license.name;
                  json.info.license.url = o.apps[evt.app].cfg.license.url;
                }
                // noinspection JSUnresolvedVariable
                if (o.apps[evt.app].cfg.author) {
                  // noinspection JSUnresolvedVariable
                  json.info.contact.email = o.apps[evt.app].cfg.author.email;
                }
                // noinspection JSUnresolvedVariable
                if (core.cfg().interfaces.http.http.port !== 80) {
                  // noinspection JSUnresolvedVariable
                  json.host += ':' + core.cfg().interfaces.http.http.port;
                }
                const routes = o.apps[evt.app].routes;
                for (let i = 0; i < routes.length; i++) {
                  json.paths[routes[i].pattern] = {};
                  if (routes[i].controller.get && (!routes[i].metadata ||
                    !routes[i].metadata.get || !routes[i].metadata.get.openapi)) {
                    json.paths[routes[i].pattern].get = {
                      'summary': 'Gets list or details of an object',
                      'description': '',
                      'responses': {
                        '200': {},
                      },
                    };
                  } else if (routes[i].controller.get && routes[i].metadata &&
                    routes[i].metadata.get && routes[i].metadata.get.openapi) {
                    // noinspection JSUnresolvedVariable
                    if (!routes[i].metadata.get.general || !routes[i].metadata.get.general.hide ||
                      routes[i].metadata.get.general.hide !== true) {
                      json.paths[routes[i].pattern].get = routes[i].metadata.get.openapi;
                    }
                  }
                  if (routes[i].controller.post && (!routes[i].metadata ||
                    !routes[i].metadata.post || !routes[i].metadata.post.openapi)) {
                    json.paths[routes[i].pattern].post = {
                      'summary': 'Creates a new object',
                      'description': '',
                      'responses': {
                        '200': {},
                      },
                    };
                  } else if (routes[i].controller.post && routes[i].metadata &&
                    routes[i].metadata.post && routes[i].metadata.post.openapi) {
                    // noinspection JSUnresolvedVariable
                    if (!routes[i].metadata.post.general || !routes[i].metadata.post.general.hide ||
                      routes[i].metadata.post.general.hide !== true) {
                      json.paths[routes[i].pattern].post = routes[i].metadata.post.openapi;
                    }
                  }
                  if (routes[i].controller.put && (!routes[i].metadata ||
                    !routes[i].metadata.put || !routes[i].metadata.put.openapi)) {
                    json.paths[routes[i].pattern].put = {
                      'summary': 'Updates an object',
                      'description': '',
                      'responses': {
                        '200': {},
                      },
                    };
                  } else if (routes[i].controller.put && routes[i].metadata &&
                    routes[i].metadata.put && routes[i].metadata.put.openapi) {
                    // noinspection JSUnresolvedVariable
                    if (!routes[i].metadata.put.general || !routes[i].metadata.put.general.hide ||
                      routes[i].metadata.put.general.hide !== true) {
                      json.paths[routes[i].pattern].put = routes[i].metadata.put.openapi;
                    }
                  }
                  if (routes[i].controller.delete && (!routes[i].metadata ||
                    !routes[i].metadata.delete || !routes[i].metadata.delete.openapi)) {
                    json.paths[routes[i].pattern].delete = {
                      'summary': 'Deletes an object',
                      'description': '',
                      'responses': {
                        '200': {},
                      },
                    };
                  } else if (routes[i].controller.delete && routes[i].metadata &&
                    routes[i].metadata.delete && routes[i].metadata.delete.openapi) {
                    // noinspection JSUnresolvedVariable
                    if (!routes[i].metadata.delete.general || !routes[i].metadata.delete.general.hide ||
                      routes[i].metadata.delete.general.hide !== true) {
                      json.paths[routes[i].pattern].delete = routes[i].metadata.delete.openapi;
                    }
                  }
                  if (Object.keys(json.paths[routes[i].pattern]).length === 0) {
                    delete json.paths[routes[i].pattern];
                  }
                }
                res.send(json);
              } else {
                res.send({});
              }
            },
          };
          const pattern = '/app.json';
          o.apps[evt.app].map[pattern] = o.apps[evt.app].routes.push({
            path: '',
            pattern: pattern,
            controller: ctrl,
            metadata: {
              'get': {
                'openapi': {
                  'summary': 'App Definition Endpoint',
                  'description': 'App Definition Endpoint (Swagger/OpenAPI Compliant)',
                  'produces': ['application/json'],
                  'tags': ['API'],
                  'responses': {
                    '200': {},
                  },
                },
              },
            },
            app: evt.app,
          }) - 1;
        }
        if (timer >= timeout) clearInterval(interval);
        timer += 10;
      }, 10);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [10]) Generate Controller Events
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.generateControllerEvents
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
  pipelines.init.generateControllerEvents = function AppEngineIPLGenerateCtrlEvts(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLGenerateCtrlEvtsOp(observer, evt) {
      o.log('debug', 'AppEngine > [10] Controller Events Being Generated',
          {module: mod.name}, 'APPENGINE_CTRL_EVTS_GEN');
      if (evt.data) {
        for (let i = 0; i < evt.data.length; i++) {
          if (evt.data[i]) {
            o.apps[evt.app].loadedCtrlCount ++;
            evt.path = evt.controllerBasePath + evt.data[i] + '/controller.js';
            evt.path = evt.path.replace('//', '/');
            evt.i = i;
            observer.next(evt);
          }
        }
      } else if (evt.remotePaths) {
        for (let i = 0; i < evt.remotePaths.length; i++) {
          evt.i = i;
        }
      }
    }, source);
  };


  /**
   * (Internal > Stream Methods [11]) Load Controller Files in to Memory
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.loadControllerFiles
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
  pipelines.init.loadControllerFiles = function AppEngineIPLLoadCtrlFiles(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLLoadCtrlFilesOp(observer, evt) {
      let type; let typeString;
      if (o.config['app-engine'].sandbox.default === true) {
        type = 'sandbox';
        typeString = 'Via Sandbox';
      } else {
        type = 'require';
        typeString = 'Direct';
      }
      if (!o.loadMessages['1-10']) {
        o.loadMessages['1-10'] = true;
        o.log('debug',
            'AppEngine > [11] Loading Controller Files In To Memory (' + typeString + ')',
            {module: mod.name}, 'APPENGINE_CTRL_FILES_LOADING');
      }
      const fs = require('fs');
      if (evt.path && fs.existsSync(evt.path)) {
        const prepareCoreProxy = function AppEngineIPLPrepCoreProxy(event) {
          const app = event.app;
          if (event.controller.init && typeof event.controller.init === 'function') {
            if (event.controller.init.length >= 1) {
              let coreProxy;
              /* if (o.util.prop(o.config, 'app-engine.allow')) */ coreProxy = core.getCoreProxy(o.config['app-engine'].allow, app);
              /* else coreProxy = {}; */
              event.controller.init(coreProxy);
            } else event.controller.init();
            observer.next(event);
          } else observer.next(event);
        };
        if (type === 'sandbox') {
          const event = evt;
          core.module('sandbox').execute({'file': evt.path, 'i': evt.i, 'app': evt.app},
              function AppEngineIPLSandboxExecCb(obj) {
                event.controller = obj.ctrl;
                event.path = obj.file;
                event.i = obj.i;
                event.app = obj.app;
                prepareCoreProxy(event);
                observer.next(event);
              });
        } else {
          evt.controller = require(evt.path);
          const metaDataPath = evt.path.slice(0, -13) + 'metadata.json';
          if (fs.existsSync(metaDataPath)) {
            try {
              evt.metadata = require(metaDataPath);
            } catch (err) {
              evt.metadata = null;
            }
          } else evt.metadata = null;
          prepareCoreProxy(evt);
        }
      } else {
        evt.controller = {};
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [12]) Set Base Path & Pattern
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.setBasePathAndPattern
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
  pipelines.init.setBasePathAndPattern = function AppEngineIPLSetBasePathAndPattern(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLSetBasePathAndPatternOp(observer, evt) {
      if (!o.loadMessages['1-11']) {
        o.loadMessages['1-11'] = true;
        o.log('debug',
            'AppEngine > [12] Base Path & Pattern Being Set Now',
            {module: mod.name}, 'APPENGINE_BASE_PATH_PATTERN_SET');
      }
      if (!o.apps[evt.app].cfg.basePath && core.cfg().core && core.cfg().core.basePath) {
        o.apps[evt.app].cfg.basePath = core.cfg().core.basePath;
      }
      if (o.apps[evt.app].cfg.basePath) evt.pattern = '' + o.apps[evt.app].cfg.basePath + evt.data[evt.i];
      else evt.pattern = '' + evt.data[evt.i];
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Check If Wildcard Path
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.checkIfWildcardPath
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
  pipelines.init.checkIfWildcardPath = function AppEngineIPLCheckIfWildcardPath(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLCheckIfWildcardPathOp(observer, evt) {
      if (evt.pattern.endsWith('{*}')) {
        const parentPattern = evt.pattern.slice(0, -3);
        if (!o.apps[evt.app].map[parentPattern] &&
            !o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]]) {
          o.apps[evt.app].orphans[parentPattern] = true;
        }
        if (!o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]]) {
          o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]] = {};
        }
        if (o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]]) {
          o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]].wildcard = true; evt.pattern = null;
        }
        if (o.apps[evt.app].map[parentPattern]) {
          o.apps[evt.app].routes[o.apps[evt.app].map[parentPattern]].wildcard = true; evt.pattern = null;
        }
      }
      if (!o.loadMessages['1-12']) {
        o.loadMessages['1-12'] = true;
        o.log('debug', 'AppEngine > [13] Checked If Wildcard Path',
            {module: mod.name}, 'APPENGINE_WILDCARD_PATH_CHECKED');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [14]) Build Routes Object
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.buildRoutesObject
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
  pipelines.init.buildRoutesObject = function AppEngineIPLBuildRoutesObj(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBuildRoutesObjOp(observer, evt) {
      if (evt.pattern) {
        const routeObject = {
          path: evt.path,
          pattern: evt.pattern,
          controller: evt.controller,
          metadata: evt.metadata,
          app: evt.app,
        };
        if (o.apps[evt.app].orphans[evt.pattern]) routeObject.wildcard = true;
        o.apps[evt.app].map[evt.pattern] = o.apps[evt.app].routes.push(routeObject) - 1;
        evt.routeObject = routeObject;
      }
      if (!o.loadMessages['1-13']) {
        o.loadMessages['1-13'] = true;
        o.log('debug', 'AppEngine > [14] Routes Added To Routes Object',
            {module: mod.name}, 'APPENGINE_BUILT_ROUTES_OBJ');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [15]) Find & Set Routers
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.findRouters
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
  pipelines.init.findRouters = function AppEngineIPLFindRouters(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLFindRoutersOp(observer, evt) {
      const routers = [];
      for (const routerName in o.config.router.instances) {
        // noinspection JSUnfilteredForInLoop
        if (o.config.router.instances[routerName].interfaces &&
          o.config.router.instances[routerName].interfaces.includes('*') &&
          o.config.router.instances[routerName].apps &&
          (o.config.router.instances[routerName].apps.includes('*') ||
          o.config.router.instances[routerName].apps.includes(evt.app))) {
          // noinspection JSUnfilteredForInLoop
          routers.push(core.module('router').get(routerName));
        }
      }
      if (routers[0]) evt.router = routers[0];
      else evt.router = null;
      observer.next(evt);
      if (!o.loadMessages['1-14']) {
        o.loadMessages['1-14'] = true;
        o.log('debug', 'AppEngine > [15] Finding & Setting Router',
            {module: mod.name}, 'APPENGINE_FIND_ROUTERS');
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [16]) Set GetFn Method
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.setGetFn
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   * */
  pipelines.init.setGetFn = function AppEngineIPLSetGetFn(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLSetGetFnOp(observer, evt) {
      if (evt.pattern) {
        evt.splitPattern = evt.routeObject.pattern.split('/');
        if (!o.apps[evt.app].obj) o.apps[evt.app].obj = {'params': {}};
        evt.appPointer = evt.origAppPointer = o.apps[evt.app].obj;
        evt.getFn = function(par, cur, pat) {
          return function(a, b, c) {
            if (par.params) this[cur].params = par.params;
            else this[cur].params = {};
            let theTag;
            this[cur].pattern = pat;
            if (cur && cur.startsWith('{')) {
              if (!a) a = '';
              const param = cur.substring(1, cur.length - 1);
              this[cur].params[param] = a;
              this[cur].thisName = par.thisName;
              this[cur].pattern += this.pattern;
            } else this[cur].thisName = cur;
            this[cur].parent = par;
            for (const tag in par[cur]) {
              // noinspection JSUnfilteredForInLoop
              if (tag && tag.startsWith('{')) {
                // noinspection JSUnfilteredForInLoop
                theTag = tag.substring(1, tag.length - 1);
              }
            }
            if (theTag && (typeof a === 'string' || typeof a === 'number') && !b && !c) {
              return this[cur]['{' + theTag + '}'](a);
            } else if (!theTag && (typeof a === 'string' || typeof a === 'number') && !b && !c) {
              return this[cur];
            } else if (!a && !b && !c) {
              return this[cur];
            } else {
              let inputObj;
              if (typeof a === 'object' && a !== null) inputObj = a;
              else if (typeof b === 'object' && b !== null) inputObj = b;
              let callbackFn;
              if (typeof b === 'function') callbackFn = b;
              else if (typeof c === 'function') callbackFn = c;
              if (evt.router) {
                this[cur].path = this[cur].pattern;
                // eslint-disable-next-line guard-for-in
                for (const param in this[cur].params) {
                  // noinspection JSUnfilteredForInLoop
                  this[cur].path = this[cur].path.replace('{' + param + '}', this[cur].params[param]);
                }
                this[cur].host = core.module('app-engine').app(evt.app).cfg().host;
                const msgId = core.module('utilities').uuid4();
                const theMessage = {
                  'type': 'apps', 'msgId': msgId, 'state': 'incoming', 'directional': 'request/response',
                  'request': {
                    'path': this[cur].path, 'host': this[cur].host, 'query': inputObj.query,
                    'headers': inputObj.headers, 'params': this[cur].params, 'internal': inputObj.internal,
                    'verb': inputObj.method, 'body': inputObj.body, 'cookies': inputObj.cookies,
                  },
                };
                const responseListener = function AppEngineIPLRouteReqResListener(msg) {
                  o.log('debug',
                      'AppEngine > Received Incoming Request From Router:',
                      {module: mod.name, message: msg}, 'APPENGINE_RECEIVED_REQ');
                  mod.removeListener('outgoing.' + msg.msgId, responseListener);
                  if (callbackFn) callbackFn(null, msg.response);
                };
                mod.on('outgoing.' + theMessage.msgId, responseListener);
                evt.router.incoming(theMessage);
              }
            }
          };
        };
      }
      observer.next(evt);
      if (!o.loadMessages['1-15']) {
        o.loadMessages['1-15'] = true;
        o.log('debug', 'AppEngine > [16] Setting GetFn Method',
            {module: mod.name}, 'APPENGINE_SET_GET_FN');
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [17]) Build App Routes
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.init.buildAppRoutes
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
  pipelines.init.buildAppRoutes = function AppEngineIPLBuildAppRoutes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineIPLBuildAppRoutesOp(observer, evt) {
      if (evt.pattern) {
        let pattern = '';
        for (let i = 0; i < evt.splitPattern.length; i++) {
          let current = evt.splitPattern[i];
          if (i !== 0) {
            pattern = pattern + '/' + current;
            const parent = evt.appPointer;
            if (evt.appPointer && current && !evt.appPointer[current]) {
              if (!current) current = '';
              evt.appPointer[current] = evt.getFn(parent, current, pattern);
            }
            if (evt.appPointer[current]) evt.appPointer = evt.appPointer[current];
          }
        }
      }
      o.apps[evt.app].loadedCtrlCount ++;
      observer.next(evt);
      if (!o.loadMessages['1-16']) {
        o.loadMessages['1-16'] = true;
        o.log('debug', 'AppEngine > [17] Building app Routes',
            {module: mod.name}, 'APPENGINE_BUILD_APP_ROUTES');
      }
    }, source);
  };


  /**
   * (Internal > Stream Methods [1]) Parse Search Object
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.parseSearchObject
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
  pipelines.search.parseSearchObject = function AppEngineSPLParseSearchObj(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLParseSearchObjOp(observer, evt) {
      if (!evt.searchObj) {
        evt.searchComplete = true;
      } else if (evt.searchObj.hostname && evt.searchObj.url && !evt.searchObj.apps) {
        evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url;
      } else if (evt.searchObj.hostname && evt.searchObj.url && evt.searchObj.apps) {
        if (evt.searchObj.apps.includes('*')) {
          evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url;
        } else {
          evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url; evt.apps = evt.searchObj.apps;
        }
      } else evt.searchComplete = true;
      o.log('debug', 'AppEngine > [1] Search object has been parsed',
          {module: mod.name}, 'APPENGINE_SEARCH_OBJ_PARSED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Setup Hosts
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.setupHosts
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
  pipelines.search.setupHosts = function AppEngineSPLSetupHosts(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLSetupHostsOp(observer, evt) {
      evt.results = []; evt.hosts = [];
      for (const app in o.apps) {
        // noinspection JSUnfilteredForInLoop
        if (!o.apps[app].cfg.host && core.cfg().core && core.cfg().core.host) {
          // noinspection JSUnfilteredForInLoop
          o.apps[app].cfg.host = core.cfg().core.host;
          // noinspection JSUnfilteredForInLoop
          evt.hosts.push(o.apps[app].cfg.host);
        }
      }
      o.log('debug', 'AppEngine > [2] Hosts Have Been Setup',
          {module: mod.name}, 'APPENGINE_HOSTS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Generate App Events
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.generateAppEvents
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
  pipelines.search.generateAppEvents = function AppEngineSPLGenAppEvts(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLGenAppEvtsOp(observer, evt) {
      o.log('debug', 'AppEngine > [3] Generating App Events...',
          {module: mod.name}, 'APPENGINE_GEN_APP_EVTS');
      const hostname = evt.hostname; const url = evt.url;
      const eApps = evt.apps; const hosts = evt.hosts; let evt2 = {};
      // eslint-disable-next-line guard-for-in
      for (const app in o.apps) {
        evt2 = {hostname: hostname, url: url, apps: eApps, hosts: hosts};
        // noinspection JSUnfilteredForInLoop
        if (hostname === o.apps[app].cfg.host) {
          evt2.app = app;
          break;
        } else { // noinspection JSUnfilteredForInLoop
          if (o.apps[app].cfg.host === '*' && !evt.hosts.includes(hostname)) {
            evt2.app = app;
            break;
          }
        }
      }
      if (evt2.app) observer.next(evt2);
      else observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Initialise The Search For This App
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.initSearchForApp
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
  pipelines.search.initSearchForApp = function AppEngineSPLInitSearchForApp(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLInitSearchForAppOp(observer, evt) {
      if (!o.apps[evt.app]) {
        observer.next(evt);
        return;
      }
      evt.urlParts = evt.url.split('/');
      evt.param = {}; evt.currentRoute = null; evt.override = false; evt.routes = {};
      evt.routes[o.apps[evt.app].cfg.host] = o.apps[evt.app].routes;
      evt.directMatch = false; evt.wildcardSet = null;
      if (evt.routes[evt.hostname]) evt.host = evt.hostname;
      else if (evt.routes['*'] && !evt.routes[evt.hostname] && o.apps[evt.app].cfg.host === '*') {
        evt.host = '*';
      }
      o.log('debug',
          'AppEngine > [4] Search has been initialised for this app (' + evt.app + ')',
          {module: mod.name}, 'APPENGINE_SEARCH_INIT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Iterate Over Routes
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.iterateOverRoutes
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
  pipelines.search.iterateOverRoutes = function AppEngineSPLIterateOverRoutes(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLIterateOverRoutesOp(observer, evt) {
      if (!evt) observer.next({});
      o.log('debug', 'AppEngine > [5] Iterating Over App Routes',
          {module: mod.name}, 'APPENGINE_ITERATING_OVER_ROUTES');
      if (!evt || !evt.routes || !evt.routes[evt.host]) observer.next(evt);
      const processIteration = function AppEngineSPLIterateOverRoutesProcess(index) {
        evt.match = true;
        const patternSplit = evt.routes[evt.host][index].pattern.split('/');
        if (evt.urlParts.length === patternSplit.length ||
          (evt.url.startsWith(evt.routes[evt.host][index].pattern) && evt.routes[evt.host][index].wildcard)) {
          if (evt.routes[evt.host][index].wildcard) evt.wildcardSet = {'host': evt.host, 'index': index};
          if (evt.url === evt.routes[evt.host][index].pattern) {
            evt.directMatch = true;
            evt.override = evt.routes[evt.host][index];
            if (evt.host === '*') evt.override.matchType = 'wildcard';
            else evt.override.matchType = 'direct';
          }
          if (!evt.directMatch) {
            const patternReplaced = evt.routes[evt.host][index].pattern.replace(/{.*}/, '{}');
            const patternReplacedSplit = patternReplaced.split('/');
            if (evt.urlParts.length === patternReplacedSplit.length) {
              let patternReplacedMatch = true;
              for (let i = 0; i < evt.urlParts.length; i++) {
                if (evt.urlParts[i] !== patternReplacedSplit[i] && patternReplacedSplit[i] !== '{}') {
                  patternReplacedMatch = false;
                }
              }
              if (patternReplacedMatch) {
                evt.override = evt.routes[evt.host][index];
                if (evt.host === '*') evt.override.matchType = 'wildcard';
                else evt.override.matchType = 'direct';
              }
            }
          }
          for (let i = 0, l = evt.urlParts.length; i < l; i++) {
            let workaround = false;
            if (!patternSplit[i]) {
              workaround = true;
              patternSplit[i] = '';
            }
            const reg = patternSplit[i].match(/{(.*)}/);
            if (reg) evt.param[reg[1]] = evt.urlParts[i];
            else {
              if (patternSplit[i] !== evt.urlParts[i] && !evt.wildcardSet) {
                evt.match = false; break;
              }
            }
          }
        } else {
          if (!evt.currentRoute) evt.match = false;
        }
        if (evt.match === true && !evt.currentRoute && !evt.override) {
          evt.currentRoute = evt.routes[evt.host][index];
          if (evt.host === '*') evt.currentRoute.matchType = 'wildcard';
          else evt.currentRoute.matchType = 'direct';
        }
      };
      let index; let total;
      if (evt && evt.routes && evt.routes[evt.host]) {
        for (index = 0, total = evt.routes[evt.host].length; index < total; index++) {
          processIteration(index);
        }
      }
      if (evt && !evt.match) {
        evt.match = true;
        if (evt.wildcardSet && evt.routes[evt.wildcardSet[evt.host]] &&
          evt.routes[evt.wildcardSet[evt.host]][evt.wildcardSet[index]]) {
          evt.currentRoute = evt.routes[evt.wildcardSet[evt.host]][evt.wildcardSet[index]];
        } else if (evt && evt.routes && evt.routes[evt.host] &&
          evt.routes[evt.host][0] && evt.routes[evt.host][0].app) {
          evt.currentRoute = {app: evt.routes[evt.host][0].app};
        }
        if (evt.host === '*' && evt.currentRoute) evt.currentRoute.matchType = 'wildcard';
        else if (evt.currentRoute) evt.currentRoute.matchType = 'direct';
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Check Overrides & Match
   *
   * @private
   * @memberof Server.Modules.AppEngine
   * @function pipelines.search.checkAndMatch
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
  pipelines.search.checkAndMatch = function AppEngineSPLCheckAndMatch(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function AppEngineSPLCheckAndMatchOp(observer, evt) {
      if (!evt.results) evt.results = [];
      if (evt.override) evt.currentRoute = evt.override;
      if (evt.match && evt.currentRoute) evt.results.push({match: evt.currentRoute, param: evt.param});
      if (evt.results.length !== 1) {
        const intermediateResults = [];
        for (let i = 0; i < evt.results.length; i++) {
          if (evt.results[i].match.matchType === 'direct') intermediateResults.push(evt.results[i]);
        }
        if (intermediateResults && intermediateResults.length === 1) {
          evt.results = intermediateResults;
          evt.result = evt.results[0];
        } else evt.result = false;
      } else evt.result = evt.results[0];
      o.log('debug',
          'AppEngine > [6] Overrides and matches have been checked',
          {module: mod.name}, 'APPENGINE_OVERRIDES_CHECKED_AND_MATCHED');
      observer.next(evt);
    }, source);
  };
}();
