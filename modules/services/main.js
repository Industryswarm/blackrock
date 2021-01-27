!function ServicesModuleWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function ServicesModuleEndWith(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  let core; let mod; let Service; let log; const services = {}; let config; let util; let lib;
  const loadMessages = {}; const pipelines = {}; const streamFns = {}; let rx;


  /**
   * Blackrock Services Module
   *
   * @class Server.Modules.Services
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Services} module - The Services Module
   *
   * @description This is the Services Module of the Blackrock Application Server.
   * It loads all services and the controllers and other files within them and manages
   * access to all of these files - in tandem with the Router Module - from any
   * Interface. It also exposes a Swagger 2.0 Compliant API Definition file for each
   * of your services (can be toggled on/off in config), which can easily be paired up
   * with SwaggerUI in your service's html folder for quick and easy documentation and
   * testing.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ServicesModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Services');
    core.isLoaded('utilities').then(function(utilMod) {
      util = utilMod;
    });
    log = core.module('logger').log; config = core.cfg();
    log('debug', 'Blackrock Services Module > Initialising...', {}, 'SERVICES_INIT');
    lib = core.lib; rx = lib.rxjs;
    Service = new core.Mod().extend({constructor: function ServicesModuleServiceConstructor() {}});
    process.nextTick(function() {
      const Pipeline = pipelines.setupServicesPipeline();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * ======================
   * Event Stream Pipelines
   * ======================
   */


  /**
   * (Internal > Pipeline [1]) Setup Services Pipeline
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupServicesPipeline = function ServicesModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function ServicesModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function ServicesModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function ServicesModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Services Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'SERVICES_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.bindUnloadMethod,
            streamFns.bindSearchMethod,
            streamFns.bindServiceEndpoint,
            streamFns.bindSupportMethods,
            streamFns.loadServices,

            // Fires once per loaded service:
            streamFns.fetchControllerNames,
            streamFns.preProcessControllers,
            streamFns.removeInvalidControllers,
            streamFns.setBasePathCtrl,
            streamFns.waitThenExposeServiceDef,
            streamFns.generateControllerEvents,

            // Fires once per controller within each loaded service:
            streamFns.loadControllerFiles,
            streamFns.setBasePathAndPattern,
            streamFns.checkIfWildcardPath,
            streamFns.buildRoutesObject,
            streamFns.findRouters,
            streamFns.setGetFn,
            streamFns.buildServiceRoutes

        ).subscribe();
      },
    });
  };


  /**
   * (Internal > Pipeline [2]) Run Search Pipeline
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.runSearchPipeline = function ServicesModuleRunSearchPipeline() {
    return new core.Base().extend({
      constructor: function ServicesModuleRunSearchPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function ServicesModuleRunSearchPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function ServicesModuleRunSearchPipelinePipe(cb) {
        let responseComplete = false;
        this.evt.responseComplete = responseComplete;
        log('debug',
            'Blackrock Services Module > Route Search Query Pipeline Created - Executing Now:',
            {}, 'SERVICES_EXEC_ROUTE_SEARCH_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once per service route search query:
            streamFns.parseSearchObject,
            streamFns.setupHosts,
            streamFns.generateServiceEvents,
            streamFns.initSearchForService,
            streamFns.iterateOverRoutes,
            streamFns.checkAndMatch

        ).subscribe(function ServicesModuleRunSearchPipelineSubscribe(evt) {
          if (!responseComplete) {
            responseComplete = true; cb(evt.result);
          }
        });
      },
    });
  };


  /**
   * =====================================
   * Services Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Bind Unload Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindUnloadMethod = function ServicesModuleBindUnloadMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.unload = function ServicesModuleUnload() {
        const closeControllers = function ServicesModuleCloseControllers(cb) {
          let ctrlCount = 0; let counter = 0;
          if (services) {
            for (const service in services) {
              if (services[service].routes && services[service].routes.length > 0) {
                ctrlCount += services[service].routes.length;
              }
            }
          }
          if (ctrlCount === 0) {
            cb(); return;
          }
          for (const service in services) {
            if (services[service].routes && services[service].routes.length > 0) {
              for (let i = 0; i < services[service].routes.length; i++) {
                const route = services[service].routes[i];
                if (!route.controller.shutdown || !(route.controller.shutdown instanceof Function)) {
                  log('debug_deep',
                      'Blackrock Services > Attempting to shutdown controller (' + route.pattern + ') for service ' +
                      services[service].cfg.name + '  but no shutdown interface exists.', {},
                      'SERVICES_SHUTDOWN_CTRL_NO_INT');
                  counter ++;
                } else {
                  log('debug_deep',
                      'Blackrock Services > Attempting to shutdown controller (' + route.pattern + ') for service ' +
                      services[service].cfg.name + ', waiting for controller response...',
                      {}, 'SERVICES_SHUTDOWN_CTRL_WAITING');
                  route.controller.shutdown(function ServicesModuleUnloadShutdownCallback() {
                    log('debug',
                        'Controller ' + route.pattern + ' for service ' + services[service].cfg.name +
                        ' shutdown successful.', {}, 'SERVICES_SHUTDOWN_CTRL_SUCCESS');
                    counter ++;
                  });
                }
              }
            }
          }
          const timeout = 5000; let timeoutTimer = 0;
          const interval = setInterval(function ServicesCloseControllersTimeout() {
            if (counter >= ctrlCount) {
              log('shutdown',
                  'Blackrock Services > Controllers all shutdown where possible.',
                  {}, 'SERVICES_SHUTDOWN_CTRL_COMPLETE'); clearInterval(interval); cb(); return;
            }
            if (timeoutTimer > timeout) {
              log('shutdown',
                  'Blackrock Services > Controller shutdown timed out.',
                  {}, 'SERVICES_SHUTDOWN_CTRL_TIMEOUT'); clearInterval(interval); cb(); return;
            }
            timeoutTimer += 500;
          }, 500);
        };
        closeControllers(function ServicesCloseControllersCallback() {
          core.emit('module-shut-down', 'Services');
        });
      };
      log('debug', 'Blackrock Services > [1] Attached \'unload\' Method To This Module', {}, 'SERVICES_UNLOAD_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Bind Search Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindSearchMethod = function ServicesBindSearchMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
         * (External) Searches for a Controller
         *
         * @param {object} searchObj - Search Definition Object
         * @param {function} cb - Callback Function
         * @example
         * {
         *   services: ["service1", "service2"],
         *   hostname: "localhost",
         *   url: "/web/users/1"
         * }
         */
      mod.search = function ServicesSearch(searchObj, cb) {
        const ISPipeline = pipelines.runSearchPipeline();
        new ISPipeline({'searchObj': searchObj}).pipe(function(result) {
          cb(result);
        });
      };
      log('debug', 'Blackrock Services > [2] Attached \'search\' Method To This Module', {}, 'SERVICES_SEARCH_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Bind Service Endpoint
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindServiceEndpoint = function ServicesBindServiceEndpoint(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * (Internal) Middleware Router
       * @param {object} req - Request Object
       * @param {object} res - Response Object
       */
      evt.MiddlewareRouter = new core.Base().extend({
        constructor: function ServicesMiddlewareRouterConstructor() {
          const self = this;
          self.myRouter = function(req, res, handler) {
            let stackCounter = 0;
            const innerRouter = function(req, res, handler) {
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
          self.myRouter.use = function ServicesMiddlewareRouterUse(fn) {
            self.myRouter.stack.push(fn); return true;
          };
          self.myRouter.count = function ServicesMiddlewareRouterCount() {
            return self.myRouter.stack.length;
          };
        },
      });

      /**
       * (External) Gets A Service Object (By Name)
       * @param {string} name - Service Name
       * @return {object} serviceObj - Service Object
       */
      mod.service = function ServicesService(name) {
        if (!name) return;
        const generateServiceObject = function ServicesGenerateServiceObject() {
          if (!services[name]) return;
          const service = {};
          service.cfg = function ServicesServiceCfg() {
            return services[name].cfg;
          };
          service.models = {};
          service.models.get = function ServicesServiceGetModel(mod) {
            return services[name].models[mod];
          };
          service.models.add = function ServicesServiceAddModel(modName, modObj) {
            if (!name || !modName || !modObj) return false;
            if (!services[name].models) services[name].models = {};
            services[name].models[modName] = modObj;
            return true;
          };
          service.url = {};
          service.url.get = function ServicesServiceGetUrl(path, options) {
            let protocol; let port; let basePath; let portString;
            if (options && options.protocol)protocol = options.protocol.toLowerCase();
            if (options && options.port) port = options.port;
            const host = services[name].cfg.host;
            if (services[name].cfg.basePath) basePath = services[name].cfg.basePath;
            else if (core.cfg().core && core.cfg().core.basePath) basePath = core.cfg().core.basePath;
            else basePath = '';
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
          service.vars = {};
          service.vars.get = function ServicesServiceGetVar(key) {
            return services[name].vars[key];
          };
          service.vars.set = function ServicesServiceSetVar(key, val) {
            services[name].vars[key] = val;
            return true;
          };
          service.middleware = services[name].middleware;
          service.use = service.middleware.use;
          if (services[name].obj) {
            service.routes = {};
            for (const objName in services[name].obj) {
              if (!service.routes[objName] && objName) {
                service.routes[objName] = services[name].obj[objName];
              }
            }
          }
          if (config.services.runtime.controllers.allowLoad === true) {
            service.loadController = function ServicesServiceLoadCtrl(path, ctrl) {
              if (!path || !(typeof path === 'string' || path instanceof String)) return false;
              if ((typeof ctrl !== 'object' && ctrl === null) || !ctrl) return false;
              if (!services[name]) return false;
              services[name].map[path] = services[name].routes.push({
                path: '',
                pattern: path,
                controller: ctrl,
                service: name,
              }) - 1;
              return true;
            };
          }
          if (config.services.runtime.controllers.allowUnload === true) {
            service.unloadController = function ServicesServiceUnloadCtrl(path) {
              if (services[name].routes[services[name].map[path]]) {
                delete services[name].routes[services[name].map[path]];
                delete services[name].map[path];
                return true;
              } else return false;
            };
          }
          return service;
        };
        return generateServiceObject();
      };
      log('debug',
          'Blackrock Services > [3] Setup & Attached \'service\' Method To This Module (incl. Setting Up Middleware)',
          {}, 'SERVICES_SERVICE_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Bind Support Methods
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindSupportMethods = function ServicesBindSupportMethods(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Services > [4] Binding Support Methods', {}, 'SERVICES_SUPPORT_FNS_BOUND');
      mod.serviceStats = function ServicesServiceStats(name) {
        const stats = {};
        stats.servicesRouteCount = 0;
        if (!name) {
          stats.servicesCount = Object.keys(services).length;
          if (core.module('utilities')) {
            stats.servicesMemoryUse = core.module('utilities').system.getObjectMemoryUsage(services);
          }
        } else {
          if (services[name]) {
            stats.servicesCount = 1;
            if (core.module('utilities')) {
              stats.servicesMemoryUse = core.module('utilities').system.getObjectMemoryUsage(services[name]);
            }
          } else {
            stats.servicesCount = 0;
            stats.servicesMemoryUse = 0;
          }
        }
        stats.services = {};
        for (const service in services) {
          if ((name && service === name) || !name) {
            stats.services[service] = {};
            if (core.module('utilities')) {
              stats.services[service].serviceMemoryUse =
                core.module('utilities').system.getObjectMemoryUsage(services[service]);
            }
            if (services[service].routes) {
              stats.services[service].serviceRouteCount = services[service].routes.length;
              stats.servicesRouteCount += services[service].routes.length;
            }
          }
        }
        return stats;
      };
      mod.list = function ServicesServiceList() {
        return Object.keys(services);
      };
      if (config.services.runtime.services.allowUnload === true) {
        mod.unload = function ServicesUnloadService(name) {
          if (services[name]) {
            delete services[name];
            return true;
          } else return false;
        };
      }
      if (config.services.runtime.services.allowLoad === true) {
        mod.reload = function ServicesReloadService(name) {
          if (services[name]) {
            delete services[name];
            mod.loadService(name);
            return true;
          } else return false;
        };
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Load Services
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.loadServices = function ServicesLoadServices(source) {
    return lib.rxOperator(function(observer, evt) {
      log('startup', 'Blackrock Services > [5] Enumerating and loading services...', {}, 'SERVICES_ENUM_SERVICES');
      const loadService = function ServicesLoadService(serviceName, serviceCfg, group) {
        // eslint-disable-next-line no-undef
        return new Promise(function(resolve, reject) {
          let serviceExistsInFilesystem = false;
          let serviceIsRemote = false;
          let serviceGroupName;
          if (group && require('fs').existsSync(core.fetchBasePath('services') + '/' +
            group + '/' + serviceName + '/service.json') === true) {
            serviceExistsInFilesystem = true;
            serviceGroupName = group;
          } else if (!group && require('fs').existsSync(core.fetchBasePath('services') +
            '/' + serviceName + '/service.json') === true) {
            serviceExistsInFilesystem = true;
          } else if (serviceName.includes('.')) serviceIsRemote = true;
          if (!serviceExistsInFilesystem && !serviceIsRemote && !serviceCfg) {
            log('startup',
                'Blackrock Services > [5a] Failed to load service (' +
              serviceName + ') - Invalid Service', {}, 'SERVICES_INVALID_SERVICE');
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({'message': 'Invalid Service'});
            return false;
          }
          const setupService = function ServicesSetupService(srvName, srvFilesystem, srvRemote, srvCfg, srvGroup) {
            if (srvCfg.active) {
              log('startup',
                  'Blackrock Services > [5a] Loading ' + serviceName + ' service...',
                  {}, 'SERVICES_LOADING_SERVICE');
              services[serviceName] = new Service();
              services[serviceName].cfg = srvCfg;
              services[serviceName].routes = [];
              services[serviceName].map = {};
              services[serviceName].orphans = {};
              services[serviceName].vars = {};
              const middlewareRouter = new evt.MiddlewareRouter();
              services[serviceName].middleware = middlewareRouter.myRouter;
              if (srvRemote) services[serviceName].remote = true;
              if (srvFilesystem || srvRemote) {
                const event = {service: serviceName};
                if (srvGroup) event.srvGroup = srvGroup;
                if (srvRemote) event.remotePaths = srvRemote.paths;
                if (srvFilesystem) event.filesystemService = true;
                process.nextTick(function ServicesLoadServicesNextTickCallback() {
                  observer.next(event);
                });
              }
              resolve(mod.service(serviceName));
            } else {
              // eslint-disable-next-line prefer-promise-reject-errors
              reject({'message': 'Service Inactive'});
            }
          };
          if (!serviceCfg && serviceExistsInFilesystem && serviceGroupName) {
            serviceCfg = require(core.fetchBasePath('services') + '/' +
              serviceGroupName + '/' + serviceName + '/service.json');
            serviceCfg.servicePath = core.fetchBasePath('services') + '/' + serviceGroupName + '/' + serviceName;
            setupService(serviceName, true, false, serviceCfg, serviceGroupName);
          } else if (!serviceCfg && serviceExistsInFilesystem && !serviceGroupName) {
            serviceCfg = require(core.fetchBasePath('services') + '/' + serviceName + '/service.json');
            serviceCfg.servicePath = core.fetchBasePath('services') + '/' + serviceName;
            setupService(serviceName, true, false, serviceCfg);
          } else if (!serviceCfg && !serviceExistsInFilesystem && serviceIsRemote) {
            core.module('http', 'interface').client.get(serviceName + '/service.json', function(err, res) {
              if (err) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject({'message': 'Remote Service Invalid', 'err': err});
                return;
              }
              serviceCfg = {
                'name': res.data.info.title,
                'host': res.data.host,
                'basePath': res.data.basePath,
                'active': true,
                'exposeDefinition': false,
              };
              setupService(serviceName, false, res.data, serviceCfg);
            });
          } else {
            setupService(serviceName, false, false, serviceCfg);
          }
        });
      };
      if (config.services.runtime.services.allowLoad === true) {
        mod.load = loadService;
      }
      const loadServicesFromFilesystem = function ServicesLoadFromFilesystem(srvBasePath, srvGroup) {
        if (require('fs').existsSync(srvBasePath) && require('fs').lstatSync(srvBasePath).isDirectory()) {
          require('fs').readdirSync(srvBasePath).forEach(
              function ServicesLoadServicesReadDirCallback(file) {
                if (require('fs').existsSync(srvBasePath + '/' + file + '/service.json') === true) {
                  loadService(file, null, srvGroup).then(function(srv) {
                  }).catch(function() {});
                } else if (file !== '.DS_Store') {
                  let newFile;
                  if (srvGroup) newFile = srvGroup + '/' + file;
                  else newFile = file;
                  loadServicesFromFilesystem(srvBasePath + '/' + file, newFile);
                }
              });
        }
      };
      loadServicesFromFilesystem(core.fetchBasePath('services'));
    }, source);
  };


  /**
   * =====================================
   * Services Stream Processing Functions
   * (Fires Once Per Loaded Service)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [6]) Fetch Controller Names
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.fetchControllerNames = function ServicesFetchCtrlNames(source) {
    return lib.rxOperator(function(observer, evt) {
      log('startup',
          'Blackrock Services > [6] Building routes for ' + evt.service + ' service.',
          {}, 'SERVICES_BUILDING_ROUTES');
      if (services[evt.service].routes[0]) {
        log('startup',
            'Blackrock Services > [6a] Service Routes for ' + evt.service + ' Have Already Been Built',
            {}, 'SERVICES_ROUTES_ALREADY_BUILT');
        return;
      }
      if (((services[evt.service].cfg.routing && services[evt.service].cfg.routing === 'auto') ||
        !services[evt.service].cfg.routing) && evt.filesystemService) {
        let pathToWalk;
        if (evt.srvGroup) {
          pathToWalk = core.fetchBasePath('services') + '/' + evt.srvGroup + '/' + evt.service + '/controllers';
        } else {
          pathToWalk = core.fetchBasePath('services') + '/' + evt.service + '/controllers';
        }
        require('./_support/filewalker.js')(pathToWalk, function ServicesFetchCtrlNamesFilewalkerCallback(err, data) {
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
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.preProcessControllers = function ServicesPreProcessCtrl(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Services > [7] Controllers Are Being Pre-Processed (' + evt.service + ')',
          {}, 'SERVICES_CTRLS_PREPROCESSED');
      if (evt.fileWalkerErr) throw evt.fileWalkerErr;
      evt.dataPreProcess = evt.data;
      if (!evt.data && !evt.remotePaths) {
        return {success: false, message: 'No controllers exist for the ' + evt.service + ' service.'};
      }
      if (evt.data) {
        evt.data = []; evt.basePath = [];
        for (let i = 0; i < evt.dataPreProcess.length; i++) {
          if (!evt.dataPreProcess[i].endsWith('.DS_Store')) evt.data.push(evt.dataPreProcess[i]);
          if (evt.dataPreProcess[i].endsWith('controller.js')) {
            evt.basePath.push(evt.dataPreProcess[i].substring(0, evt.dataPreProcess[i].length - 14));
          }
        }
        evt.basePath.sort(function ServicesPreProcessCtrlSortHandler(a, b) {
          return a.length - b.length || a.localeCompare(b);
        });
        evt.controllerBasePath = evt.basePath[0];
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Remove Invalid Controllers
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.removeInvalidControllers = function ServicesRemoveInvalidCtrl(source) {
    return lib.rxOperator(function(observer, evt) {
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
      log('debug',
          'Blackrock Services > [8] Invalid Controllers Have Been Removed (' + evt.service + ')',
          {}, 'SERVICES_INVALID_CTRLS_REMOVED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Set Base Path Controller
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setBasePathCtrl = function ServicesSetBasePathCtrl(source) {
    return lib.rxOperator(function(observer, evt) {
      if (services[evt.service].cfg.basePath) {
        const pathBits = services[evt.service].cfg.basePath.split('/');
        const pathBitsCount = pathBits.length;
        for (let i = 0; i < pathBitsCount - 1; i++) {
          let urlsPiece;
          if (i === 0 && pathBits[i] === '') urlsPiece = '/' + pathBits[0];
          else urlsPiece = '';
          for (let j = 1; j <= i; j++) {
            urlsPiece += '/' + pathBits[j];
          }
          const ctrl = {
            'get': function ServicesBasePathCtrlGet(req, res) {
              res.redirect(services[evt.service].cfg.basePath);
            },
          };
          services[evt.service].map[urlsPiece] = services[evt.service].routes.push({
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
            service: evt.service,
          }) - 1;
        }
      }
      log('debug',
          'Blackrock Services > [9] Have Set Base Path Controller & Service Routes',
          {}, 'SERVICES_BASE_PATH_CTRL_SET');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9.5]) Wait Then Expose Service Definition
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.waitThenExposeServiceDef = function ServicesWaitThenExposeServiceDef(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Services > [9.5] Waiting for Routes To Be Built Then Exposing Service Definition Endpoint',
          {}, 'SERVICES_WAIT_EXPOSE_DEF');
      services[evt.service].loadedCtrlCount = 0;
      services[evt.service].totalCtrlCount = 0;
      if (evt.data) {
        for (let i = 0; i < evt.data.length; i++) {
          if (evt.data[i]) services[evt.service].totalCtrlCount ++;
        }
      }
      if (evt.remotePaths) {
        for (let i = 0; i < evt.remotePaths.length; i++) {
          if (evt.remotePaths[i]) services[evt.service].totalCtrlCount ++;
        }
      }
      let timer = 0; const timeout = 5000;
      const interval = setInterval(function() {
        if (services[evt.service].loadedCtrlCount >= services[evt.service].totalCtrlCount) {
          clearInterval(interval);
          const ctrl = {
            'get': function ServicesSrvDefCtrlGet(req, res) {
              if (services[evt.service].cfg.exposeDefinition === true) {
                const json = {
                  'swagger': '2.0',
                  'info': {
                    'title': services[evt.service].cfg.name,
                    'description': services[evt.service].cfg.description,
                    'version': services[evt.service].cfg.version,
                    'termsOfService': services[evt.service].cfg.termsUrl,
                    'contact': {},
                    'license': {},
                  },
                  'host': services[evt.service].cfg.host,
                  'basePath': services[evt.service].cfg.basePath,
                  'schemes': [
                    'http',
                    'https',
                  ],
                  'paths': {},
                };
                if (services[evt.service].cfg.license) {
                  json.info.license.name = services[evt.service].cfg.license.name;
                  json.info.license.url = services[evt.service].cfg.license.url;
                }
                if (services[evt.service].cfg.author) {
                  json.info.contact.email = services[evt.service].cfg.author.email;
                }
                if (core.cfg().interfaces.http.http.port !== 80) {
                  json.host += ':' + core.cfg().interfaces.http.http.port;
                }
                const routes = services[evt.service].routes;
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
          const pattern = '/service.json';
          services[evt.service].map[pattern] = services[evt.service].routes.push({
            path: '',
            pattern: pattern,
            controller: ctrl,
            metadata: {
              'get': {
                'openapi': {
                  'summary': 'Service Definition Endpoint',
                  'description': 'Service Definition Endpoint (Swagger/OpenAPI Compliant)',
                  'produces': ['application/json'],
                  'tags': ['API'],
                  'responses': {
                    '200': {},
                  },
                },
              },
            },
            service: evt.service,
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
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.generateControllerEvents = function ServicesGenerateCtrlEvents(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Services > [10] Controller Events Being Generated', {}, 'SERVICES_CTRL_EVTS_GEN');
      if (evt.data) {
        for (let i = 0; i < evt.data.length; i++) {
          if (evt.data[i]) {
            services[evt.service].loadedCtrlCount ++;
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
   * ===================================================
   * Services Stream Processing Functions
   * (Fires Once Per Controller For Each Loaded Service)
   * ===================================================
   */

  /**
   * (Internal > Stream Methods [11]) Load Controller Files in to Memory
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.loadControllerFiles = function ServicesLoadCtrlFiles(source) {
    return lib.rxOperator(function(observer, evt) {
      let type; let typeString;
      if (config.services.sandbox.default === true) {
        type = 'sandbox'; typeString = 'Via Sandbox';
      } else {
        type = 'require'; typeString = 'Direct';
      }
      if (!loadMessages['1-10']) {
        loadMessages['1-10'] = true;
        log('debug',
            'Blackrock Services > [11] Loading Controller Files In To Memory (' + typeString + ')',
            {}, 'SERVICES_CTRL_FILES_LOADING');
      }
      const fs = require('fs');
      if (evt.path && fs.existsSync(evt.path)) {
        const prepareRestrictedCore = function ServicesPrepareRestrictedCore(event) {
          const srv = event.service;
          if (event.controller.init && typeof event.controller.init === 'function') {
            if (event.controller.init.length >= 1) {
              const RestrictedCore = new core.Base().extend({

                // Permutation of this RestrictedCore Object is Dictated By Config:
                constructor: function ServicesRestrictedCoreConstructor(cfg) {
                  const self = this;
                  if (cfg.Base) self.Base = core.Base;
                  if (cfg.globals) self.globals = core.globals;
                  if (cfg.shutdown) self.shutdown = core.shutdown;
                  if (cfg.cfg) self.cfg = core.cfg;
                  if (cfg.pkg) self.pkg = core.pkg;
                  if (cfg.fetchBasePath) self.fetchBasePath = core.fetchBasePath;
                  if (cfg.getCurrentService) {
                    self.getCurrentService = function() {
                      return srv;
                    };
                  }
                  return self;
                },

                // Config Governs Which Modules & Methods Within Are Available to The Controller:
                module: function ServicesRestrictedCoreGetModule(name, myInterface) {
                  let mods;
                  if (util.prop(config, 'services.allow.modules')) mods = config.services.allow.modules;
                  else mods = {};
                  if (!mods) return;
                  const methods = mods[name]; const loadedMethods = {}; const fnNames = {};
                  if (!methods) return;
                  for (let i = 0; i < methods.length; i++) {
                    if (core.module(name, myInterface) && core.module(name, myInterface)[methods[i]]) {
                      loadedMethods[methods[i]] = core.module(name, myInterface)[methods[i]];
                    } else if (core.module(name, myInterface) && methods[i].includes('.')) {
                      const methodSplit = methods[i].split('.');
                      util.assign(loadedMethods, methodSplit, util.prop(core.module(name, myInterface), methods[i]));
                    } else if (core.module(name, myInterface) && methods[i].includes('(')) {
                      const splitOne = methods[i].split('('); const splitTwo = splitOne[1].split(')');
                      const methodName = splitOne[0]; const fnName = splitTwo[0];
                      loadedMethods[methodName] = util.prop(core.module(name, myInterface), methods[i]);
                      fnNames[methodName] = fnName;
                    }
                  }
                  if (loadedMethods && !fnNames) return loadedMethods;
                  else {
                    const filteredMethods = loadedMethods;
                    for (const methodName in loadedMethods) {
                      if (fnNames[methodName] === 'serviceName') {
                        const newService = {}; const myService = core.module(name, myInterface)[methodName](srv);
                        // eslint-disable-next-line guard-for-in
                        for (const subMethod in myService) {
                          newService[subMethod] = myService[subMethod];
                        }
                        filteredMethods[methodName] = function ServicesGetModuleAutoExecHandler(srvName) {
                          if (util.prop(config, 'services.runtime.services.allowExternalServiceAccess') && srvName) {
                            return mod.service(srvName);
                          } else return newService;
                        };
                      } else filteredMethods[methodName] = loadedMethods[methodName];
                    }
                    return filteredMethods;
                  }
                },
              });
              let restrictedCore;
              if (util.prop(config, 'services.allow')) restrictedCore = new RestrictedCore(config.services.allow);
              else restrictedCore = {};
              event.controller.init(restrictedCore);
            } else event.controller.init();
            observer.next(event);
          } else observer.next(event);
        };
        if (type === 'sandbox') {
          const event = evt;
          core.module('sandbox').execute({'file': evt.path, 'i': evt.i, 'service': evt.service},
              function ServicesSandboxExecCallback(obj) {
                event.controller = obj.ctrl;
                event.path = obj.file;
                event.i = obj.i;
                event.service = obj.service;
                prepareRestrictedCore(event);
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
          prepareRestrictedCore(evt);
        }
      } else {
        evt.controller = {};
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [12]) Set Base Path & Pattern
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setBasePathAndPattern = function ServicesSetBasePathAndPattern(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!loadMessages['1-11']) {
        loadMessages['1-11'] = true;
        log('debug',
            'Blackrock Services > [12] Base Path & Pattern Being Set Now',
            {}, 'SERVICES_BASE_PATH_PATTERN_SET');
      }
      if (!services[evt.service].cfg.basePath && core.cfg().core && core.cfg().core.basePath) {
        services[evt.service].cfg.basePath = core.cfg().core.basePath;
      }
      if (services[evt.service].cfg.basePath) evt.pattern = '' + services[evt.service].cfg.basePath + evt.data[evt.i];
      else evt.pattern = '' + evt.data[evt.i];
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Check If Wildcard Path
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.checkIfWildcardPath = function ServicesCheckIfWildcardPath(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.pattern.endsWith('{*}')) {
        const parentPattern = evt.pattern.slice(0, -3);
        if (!services[evt.service].map[parentPattern] &&
            !services[evt.service].routes[services[evt.service].map[parentPattern]]) {
          services[evt.service].orphans[parentPattern] = true;
        }
        if (!services[evt.service].routes[services[evt.service].map[parentPattern]]) {
          services[evt.service].routes[services[evt.service].map[parentPattern]] = {};
        }
        if (services[evt.service].routes[services[evt.service].map[parentPattern]]) {
          services[evt.service].routes[services[evt.service].map[parentPattern]].wildcard = true; evt.pattern = null;
        }
        if (services[evt.service].map[parentPattern]) {
          services[evt.service].routes[services[evt.service].map[parentPattern]].wildcard = true; evt.pattern = null;
        }
      }
      if (!loadMessages['1-12']) {
        loadMessages['1-12'] = true;
        log('debug', 'Blackrock Services > [13] Checked If Wildcard Path', {}, 'SERVICES_WILDCARD_PATH_CHECKED');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [14]) Build Routes Object
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.buildRoutesObject = function ServicesBuildRoutesObject(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.pattern) {
        const routeObject = {
          path: evt.path,
          pattern: evt.pattern,
          controller: evt.controller,
          metadata: evt.metadata,
          service: evt.service,
        };
        if (services[evt.service].orphans[evt.pattern]) routeObject.wildcard = true;
        services[evt.service].map[evt.pattern] = services[evt.service].routes.push(routeObject) - 1;
        evt.routeObject = routeObject;
      }
      if (!loadMessages['1-13']) {
        loadMessages['1-13'] = true;
        log('debug', 'Blackrock Services > [14] Routes Added To Routes Object', {}, 'SERVICES_BUILT_ROUTES_OBJ');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [15]) Find & Set Routers
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.findRouters = function ServicesFindRouters(source) {
    return lib.rxOperator(function(observer, evt) {
      const routers = [];
      for (const routerName in config.router.instances) {
        if (config.router.instances[routerName].interfaces &&
          config.router.instances[routerName].interfaces.includes('*') &&
          config.router.instances[routerName].services &&
          (config.router.instances[routerName].services.includes('*') ||
          config.router.instances[routerName].services.includes(evt.service))) {
          routers.push(core.module('router').get(routerName));
        }
      }
      if (routers[0]) evt.router = routers[0];
      else evt.router = null;
      observer.next(evt);
      if (!loadMessages['1-14']) {
        loadMessages['1-14'] = true;
        log('debug', 'Blackrock Services > [15] Finding & Setting Router', {}, 'SERVICES_FIND_ROUTERS');
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [16]) Set GetFn Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * */
  streamFns.setGetFn = function ServicesSetGetFn(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.pattern) {
        evt.splitPattern = evt.routeObject.pattern.split('/');
        if (!services[evt.service].obj) {
          services[evt.service].obj = {'params': {}};
        }
        evt.srvPointer = evt.origSrvPointer = services[evt.service].obj;
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
              if (tag && tag.startsWith('{')) theTag = tag.substring(1, tag.length - 1);
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
                  this[cur].path = this[cur].path.replace('{' + param + '}', this[cur].params[param]);
                }
                this[cur].host = core.module('services').service(evt.service).cfg().host;
                const msgId = core.module('utilities').uuid4();
                const theMessage = {
                  'type': 'services', 'msgId': msgId, 'state': 'incoming', 'directional': 'request/response',
                  'request': {
                    'path': this[cur].path, 'host': this[cur].host, 'query': inputObj.query,
                    'headers': inputObj.headers, 'params': this[cur].params, 'internal': inputObj.internal,
                    'verb': inputObj.method, 'body': inputObj.body, 'cookies': inputObj.cookies,
                  },
                };
                const responseListener = function ServicesRouteRequestResponseListener(msg) {
                  log('debug',
                      'Blackrock Services > Received Incoming Request From Router:',
                      msg, 'SERVICES_RECEIVED_REQUEST');
                  mod.removeListener('outgoing.' + msg.msgId, responseListener);
                  if (callbackFn) {
                    callbackFn(null, msg.response);
                  }
                };
                mod.on('outgoing.' + theMessage.msgId, responseListener);
                evt.router.incoming(theMessage);
              }
            }
          };
        };
      }
      observer.next(evt);
      if (!loadMessages['1-15']) {
        loadMessages['1-15'] = true;
        log('debug', 'Blackrock Services > [16] Setting GetFn Method', {}, 'SERVICES_SET_GET_FN');
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [17]) Build Service Routes
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.buildServiceRoutes = function ServicesBuildServiceRoutes(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.pattern) {
        let pattern = '';
        for (let i = 0; i < evt.splitPattern.length; i++) {
          let current = evt.splitPattern[i];
          if (i !== 0) {
            pattern = pattern + '/' + current;
            const parent = evt.srvPointer;
            if (evt.srvPointer && current && !evt.srvPointer[current]) {
              if (!current) current = '';
              evt.srvPointer[current] = evt.getFn(parent, current, pattern);
            }
            if (evt.srvPointer[current]) evt.srvPointer = evt.srvPointer[current];
          }
        }
      }
      services[evt.service].loadedCtrlCount ++;
      observer.next(evt);
      if (!loadMessages['1-16']) {
        loadMessages['1-16'] = true;
        log('debug', 'Blackrock Services > [17] Building Service Routes', {}, 'SERVICES_BUILD_SERVICE_ROUTES');
      }
    }, source);
  };


  /**
   * =====================================
   * Services Stream Processing Functions
   * (Fires Once Per Route Search)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Parse Search Object
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.parseSearchObject = function ServicesParseSearchObject(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!evt.searchObj) {
        evt.searchComplete = true;
      } else if (evt.searchObj.hostname && evt.searchObj.url && !evt.searchObj.services) {
        evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url;
      } else if (evt.searchObj.hostname && evt.searchObj.url && evt.searchObj.services) {
        if (evt.searchObj.services.includes('*')) {
          evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url;
        } else {
          evt.hostname = evt.searchObj.hostname; evt.url = evt.searchObj.url; evt.services = evt.searchObj.services;
        }
      } else evt.searchComplete = true;
      log('debug', 'Blackrock Services > [1] Search object has been parsed', {}, 'SERVICES_SEARCH_OBJ_PARSED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Setup Hosts
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupHosts = function ServicesSetupHosts(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.results = []; evt.hosts = [];
      for (const sv in services) {
        if (!services[sv].cfg.host && core.cfg().core && core.cfg().core.host) {
          services[sv].cfg.host = core.cfg().core.host;
          evt.hosts.push(services[sv].cfg.host);
        }
      }
      log('debug', 'Blackrock Services > [2] Hosts Have Been Setup', {}, 'SERVICES_HOSTS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Generate Service Events
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.generateServiceEvents = function ServicesGenerateServiceEvents(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Services > [3] Generating Service Events...', {}, 'SERVICES_GEN_SRV_EVTS');
      const hostname = evt.hostname; const url = evt.url;
      const eServices = evt.services; const hosts = evt.hosts; let evt2 = {};
      // eslint-disable-next-line guard-for-in
      for (const service in services) {
        evt2 = {hostname: hostname, url: url, services: eServices, hosts: hosts};
        if (hostname === services[service].cfg.host) {
          evt2.srv = service; break;
        } else if (services[service].cfg.host === '*' && !evt.hosts.includes(hostname)) {
          evt2.srv = service; break;
        }
      }
      if (evt2.srv) observer.next(evt2);
      else observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Initialise The Search For This Service
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.initSearchForService = function ServicesInitSearchForService(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!services[evt.srv]) {
        observer.next(evt); return;
      }
      evt.urlParts = evt.url.split('/');
      evt.param = {}; evt.currentRoute = null; evt.override = false; evt.routes = {};
      evt.routes[services[evt.srv].cfg.host] = services[evt.srv].routes;
      evt.directMatch = false; evt.wildcardSet = null;
      if (evt.routes[evt.hostname]) evt.host = evt.hostname;
      else if (evt.routes['*'] && !evt.routes[evt.hostname] && services[evt.srv].cfg.host === '*') {
        evt.host = '*';
      }
      log('debug',
          'Blackrock Services > [4] Search has been initialised for this service (' + evt.srv + ')',
          {}, 'SERVICES_SEARCH_INIT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Iterate Over Routes
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.iterateOverRoutes = function ServicesIterateOverRoutes(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!evt) observer.next({});
      log('debug', 'Blackrock Services > [5] Iterating Over Service Routes', {}, 'SERVICES_ITERATING_OVER_ROUTES');
      if (!evt || !evt.routes || !evt.routes[evt.host]) observer.next(evt);
      const processIteration = function ServicesProcessIteration(index) {
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
          evt.routes[evt.host][0] && evt.routes[evt.host][0].service) {
          evt.currentRoute = {service: evt.routes[evt.host][0].service};
        }
        if (evt.host === '*' && evt.currentRoute) evt.currentRoute.matchType = 'wildcard';
        else if (evt.currentRoute) evt.currentRoute.matchType = 'direct';
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Check Overrides & Match
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.checkAndMatch = function ServicesCheckAndMatch(source) {
    return lib.rxOperator(function(observer, evt) {
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
      log('debug',
          'Blackrock Services > [6] Overrides and matches have been checked',
          {}, 'SERVICES_OVERRIDES_CHECKED_AND_MATCHED');
      observer.next(evt);
    }, source);
  };
}();
