!function CoreModuleWrapper() {
  let core = {}; const modules = {interfaces: {}}; const globals = {}; const fs = require('fs');
  let log; let config; let pkg; const basePaths = {};

  /**
   * Display Console Banner
   * @memberof Server.Modules.Core
   * @private
   * @ignore
   * @function
   * @param {Server.Modules.Core} displayCore - Core Object
   */
  const displayConsoleBanner = function CoreModuleDisplayConsoleBanner(displayCore) {
    let alertLineOne = ''; let alertLineTwo = '';
    if (displayCore.status === 'Error') {
      alertLineOne = 'Error Initialising:'; alertLineTwo = displayCore.reason;
    }
    console.log(`\n\n\n
================================================================================================

                    *                   
              ,%%      ,%#              
          &%    /%%%%%%#    %%          
      %%    #%%%%%%%%%%%%%(     #%,     
  %%     %%%%%%%%%%%%%%%%           /%  
 %        %%%%%%%%%%%%%%%             %        IndustrySwarm
 %       #%%%%%%%%%%%%%%%%            %        Blackrock Application Server
 %  ,%% #%%%%%%%%%%%%%%%,*%%%     %&  %        Copyright 2020, Darren Smith.
 %  ,%%% %%%%%%%%%%%%# %%%%%%%%%%%%&  % 
 %  ,%%%%.%%%%%%%%# %%%%%%%%%%%%%%%&  %        Server Name:
 %  ,%%%%    (%% %%%%%%%%%%%%%%%%%%&  %        ` + pkg.name + ` v` + pkg.version + `
 %  ,%%         %%%%%%%%%%%%%%%%%%%&  % 
 ##  %           %%%%%%%%%%%%%%%%%%  .%        ` + alertLineOne + `
   %%           %%%%%%%%%%%%%%%    &%          ` + alertLineTwo + `
       %%     %%%%%%%%%%%%.    %%       
           .%#    %%%%    ,%(           
                %%    %%                 

------------------------------------------------------------------------------------------------\n
  `);
  };


  /**
   * Calculate Base Path Set
   * @memberof Server.Modules.Core
   * @private
   * @ignore
   * @function
   */
  const calculateBasePathSet = function CoreModuleCalculateBasePathSet() {
    let dirName = __dirname;
    dirName = dirName.split('/');
    dirName.pop(); dirName.pop();
    basePaths.module = dirName.join('/');
    dirName = basePaths.module.split('/');
    dirName.pop(); dirName.pop();
    dirName = dirName.join('/');
    basePaths.services = '';
    basePaths.config = '';
    basePaths.cache = '';
    basePaths.root = basePaths.module;
    if (fs.existsSync(dirName + '/services')) {
      basePaths.services = dirName + '/services'; basePaths.root = dirName;
    }
    if (fs.existsSync(dirName + '/config/is-blackrock.json')) {
      basePaths.config = dirName + '/config/is-blackrock.json';
    }
    if (fs.existsSync(dirName + '/cache')) {
      basePaths.cache = dirName + '/cache';
    }
  };
  calculateBasePathSet();


  /**
   * Import Base Class Into Module
   * @memberof Server.Modules.Core
   * @private
   * @ignore
   * @function
   * @return {object} Base - Base Class
   */
  const loadBaseClass = function CoreModuleLoadBaseClass() {
    let Base;
    try {
      Base = require('./_support/index.js');
    } catch (err) {
      console.log(err);
      let currentDate = new Date();
      currentDate = currentDate.toISOString();
      console.log(currentDate +
        '(fatal) Blackrock Core > Missing Critical System File (./_support/base) - Terminating');
      process.exit();
    }
    return Base;
  };
  const Base = loadBaseClass();


  /**
   * Setup External Module Methods (Log)
   * @memberof Server.Modules.Core
   * @private
   * @ignore
   * @function
   * @param {Server.Modules.Core} core - Core Object
   */
  const setupExternalModuleMethods = function CoreModuleSetupExtModMethods(core) {
    log = function CoreLog(level, logMsg, attrObj, evtName) {
      const logger = core.module('logger');
      if (logger && logger.log) {
        logger.log(level, logMsg, attrObj, evtName);
      }
    };
  };


  /**
   * Blackrock Core Module
   * @class Server.Modules.Core
   *
   * @description This is the Core Module of the Blackrock Application Server.
   * It is responsible for loading all remaining modules and interfaces within Blackrock.
   * This module exports the core object (an instantiated version of the Core class
   * contained within) to the parent Server namespace. You do not need to instantiate this
   * module's class (by calling the constructor), as this is done automatically for you.
   *
   * @example
   * // Get Core Object:
   * require('is-blackrock').init()
   *   .then(function(core) {
   *     console.log(core.status);
   *     // Output: 'Active' (if server has finished initialising)
   *   });
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2020 Darren Smith
   * @license Licensed under the LGPL license.
   */
  const Core = new Base().extend({
    constructor: function CoreModuleConstructor() {
      this.status = 'Inactive';
      this.reason = '';
      this.stopActivation = true;
    },

    /**
     * Void Method
     * @memberof Server.Modules.Core
     * @function
     *
     * @description
     * This method does not do anything. It exists in order to provide a work-around for when some method must be
     * called on the core application server instance, but you do not actually need the method to do anything or to
     * return a result.
     */
    void: function CoreModuleVoid() {},

    /**
     * Initialise Core Module
     * @memberof Server.Modules.Core
     * @function
     *
     * @description
     * This method initialises the application server. It is called automatically when you are running the server
     * in stand-alone mode. If you are running the server as a dependency for another application, then you must
     * call this method on the object returned by require in order to start the server. The server will remain in
     * an inactive state up until you call this method.
     *
     * @param {object} initialConfig - Initial Configuration Data
     * @param {object} initialConfig.config - Configuration Block. See {@tutorial server-configuration}
     * @param {function} callbackFn - The Callback Function
     * @return {Server.Modules.Core} core - The Core Module
     *
     * @example
     * // Initialise the Application Server:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     console.log(core.status);
     *     // Output: 'Active' (if server has finished initialising)
     *   });
     */
    init: function CoreModuleInit(initialConfig, callbackFn) {
      const self = this;
      // eslint-disable-next-line no-undef
      const myPromise = new Promise(function(resolve, reject) {
        const resolvePromise = function CoreModuleResolvePromise() {
          if (callbackFn && typeof callbackFn === 'function') {
            callbackFn(self);
          }
          if (self.status === 'Error') {
            reject(self);
          } else if (self.status === 'Active') {
            resolve(self);
          }
          setTimeout(function() {
            const welcomeMsg = {
              'welcome': 'Blackrock Application Server',
              'name': pkg.name,
              'version': pkg.version,
              'status': self.status,
              'reason': self.reason,
            };
            core.emit('log', welcomeMsg);
            core.emit('Blackrock Core', welcomeMsg);
            core.emit('CORE_WELCOME', welcomeMsg);
          }, 10);
        };
        if (self.status !== 'Inactive') {
          if (callbackFn && typeof callbackFn === 'function') {
            callbackFn(self);
          }
          const interval = setInterval(function() {
            if (self.status === 'Error') {
              clearInterval(interval);
              reject(self);
            } else if (self.status === 'Active') {
              clearInterval(interval);
              resolve(self);
            }
          }, 10);
          return;
        }
        self.status = 'Preboot';
        if (initialConfig && initialConfig.silent) {
          self.globals.set('silent', 'true');
        }
        if (initialConfig && initialConfig.test) {
          self.globals.set('test', 'true');
        }
        if (!initialConfig || !initialConfig.config) {
          try {
            config = require(basePaths.config);
          } catch (err) {
            self.status = 'Error'; self.reason = 'No config provided';
          }
        }
        if (!initialConfig && !config) {
          try {
            config = require(basePaths.module + '/../../config/config.json');
          } catch (err) {
            self.status = 'Error'; self.reason = 'No config provided';
          }
        } else if (initialConfig && initialConfig.config) {
          config = initialConfig.config;
        }
        if (!initialConfig || !initialConfig.package) {
          try {
            pkg = require(basePaths.root + '/package.json');
          } catch (err) {
            self.status = 'Error'; self.reason = 'No package provided';
          }
        } else if (initialConfig.package) {
          pkg = initialConfig.package;
        }
        if (!config) {
          if (fs.existsSync('/etc/is-blackrock.json')) {
            self.status = 'Inactive'; self.reason = '';
            basePaths.config = '/etc/is-blackrock.json';
            config = require('/etc/is-blackrock.json');
          } else {
            config = require(basePaths.module + '/_definitions/config-templates/is-blackrock-default.json');
            basePaths.config = '/_definitions/config-templates/is-blackrock-default.json';
            const canWrite = function CanWrite(path, callback) {
              fs.access(path, fs.W_OK, function(err) {
                callback(null, !err);
              });
            };
            canWrite('/etc', function(err, isWritable) {
              if (!isWritable) {
                console.log('(error) No config file available, Please run again with sudo to copy a default across\n');
              } else {
                fs.createReadStream(
                    basePaths.module + '/_definitions/config-templates/is-blackrock-default.json'
                        .pipe(fs.createWriteStream('/etc/is-blackrock.json')));
              }
            });
          }
        }
        if (config && (!basePaths.services || !basePaths.cache)) {
          if (config && config.core && config.core.locations &&
            config.core.locations.services && fs.existsSync(config.core.locations.services)) {
            basePaths.services = config.core.locations.services;
          }
          if (config && config.core && config.core.locations &&
            config.core.locations.cache && fs.existsSync(config.core.locations.cache)) {
            basePaths.cache = config.core.locations.cache;
          }
        }
        if (!basePaths || !basePaths.module || !basePaths.root ||
          !basePaths.services || !basePaths.cache || !basePaths.config) {
          self.status = 'Error'; self.reason = 'Could not establish valid base paths';
        }
        if (config && !config.core) {
          self.status = 'Error'; self.reason = 'No core module section in config provided';
        }
        if (config && config.core && !config.core.modules) {
          self.status = 'Error'; self.reason = 'No modules listed in config';
        }
        if (config && config.core && !config.core.startupModules) {
          self.status = 'Error'; self.reason = 'No startup modules listed in config';
        }
        if (config && config.core && !config.core.timeouts) {
          self.status = 'Error'; self.reason = 'No timeouts listed in config';
        }
        if (config && config.core && config.core.timeouts && !config.core.timeouts.loadDependencies) {
          self.status = 'Error'; self.reason = 'No loadDependencies timeout listed in config';
        }
        if (config && config.core && config.core.timeouts && !config.core.timeouts.closeModules) {
          self.status = 'Error'; self.reason = 'No closeModules timeout listed in config';
        }
        modules.core = self;
        if (!pkg) {
          pkg.name = 'Unknown'; pkg.version = 'Unknown';
        }
        if ((initialConfig && !initialConfig.silent) || !initialConfig) {
          displayConsoleBanner(self);
        }
        if (self.status !== 'Preboot' || self.status === 'Error') {
          resolvePromise(); return;
        }
        self.status = 'Starting';
        setupExternalModuleMethods(self);
        if (config && config.core && config.core.startupModules && config.core.startupModules.length > 0) {
          for (let i = 0; i < config.core.startupModules.length; i++) {
            self.loadModule('module', config.core.startupModules[i]);
          }
        } else {
          self.shutdown(); return;
        }
        self.on('CORE_LOAD_DEPENDENCIES', function CoreModuleLoadDependenciesCallback() {
          if (process.stdin.isTTY) {
            const stdin = process.openStdin();
            stdin.setRawMode(true);
            stdin.setEncoding('utf8');
            stdin.on('data', function(chunk) {
              if (chunk === 'e') {
                self.shutdown();
              }
            });
          }
          const fs = require('fs');
          fs.readdirSync(basePaths.module + '/modules').forEach(function CoreModuleLoadModsReadDirCb(file) {
            if (!modules[file]) {
              self.loadModule('module', file);
            }
          });
          fs.readdirSync(basePaths.module + '/interfaces').forEach(function CoreModuleLoadInterfacesReadDirCb(file) {
            if (!modules.interfaces[file]) {
              self.loadModule('interface', file);
            }
          });
          self.status = 'Finalising';
          core.emit('CORE_FINALISING');
        });
        let counter = 0;
        let timeout;
        if (config.core.timeouts.loadDependencies) {
          timeout = config.core.timeouts.loadDependencies;
        } else {
          timeout = 5000;
        }
        const interval = setInterval(function CoreModuleDependencyLoadIntervalCallback() {
          if (self.status === 'Finalising') {
            clearInterval(interval); self.startEventLoop(function() {
              resolvePromise();
            });
          }
          if (counter >= timeout) {
            log('error',
                'Blackrock Core > Timed out initiating startup. Terminating application server.',
                {}, 'CORE_STARTUP_TIMEOUT');
            clearInterval(interval);
            self.shutdown();
          }
          counter += 500;
        }, 500);
        core.emit('CORE_LOAD_DEPENDENCIES');
      });
      if (!callbackFn) {
        return myPromise;
      } else {
        myPromise.then(function(pRes) {}).catch(function(pErr) {});
        return self;
      }
    },

    /**
     * Return Configuration
     * @memberof Server.Modules.Core
     * @function
     * @return {object} config - The Config Object. See {@tutorial server-configuration}
     * @example
     * // Return Application Server Configuration Object:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const config = core.cfg();
     *     console.log(config.core.banner);
     *     // Output: 'Blackrock Application Server (Default)'
     *   });
     */
    cfg: function CoreModuleGetCfg() {
      return config;
    },

    /**
     * Close Modules
     * @memberof Server.Modules.Core
     * @private
     * @ignore
     * @function
     * @param {function} cb - Callback Function
     */
    closeModules: function CoreModuleCloseMods(cb) {
      const self = this;
      log('shutdown', 'Blackrock Core > Attempting to Close All Open Modules.', {}, 'CORE_CLOSING_MODULES');
      let modCount = 0; let stdModCount = 0; let interfaceModCount = 0; let counter = 0; let timeoutTimer = 0;
      let timeout;
      if (config.core.timeouts.closeModules) {
        timeout = config.core.timeouts.closeModules;
      } else {
        timeout = 2000;
      }
      stdModCount += Object.keys(modules).length;
      stdModCount = stdModCount - 1;
      interfaceModCount += Object.keys(modules.interfaces).length;
      modCount = stdModCount + interfaceModCount;
      const interval = setInterval(function CoreModuleCloseModsIntervalCb() {
        if (counter >= (modCount - 1)) {
          log('shutdown',
              'Blackrock Core > Modules All Closed Successfully ('+counter+'/'+(modCount - 1)+').',
              {}, 'CORE_MODS_CLOSED');
          clearInterval(interval);
          cb(null, {success: true, message: 'Modules All Closed Successfully'});
          return;
        }
        if (timeoutTimer > timeout) {
          log('shutdown',
              'Blackrock Core > Module Closure Timed Out ('+counter+'/'+(modCount - 1)+' Closed Successfully).',
              {}, 'CORE_TIMEOUT_CLOSING_MODS');
          clearInterval(interval);
          cb({message: 'Module Shutdown Timed Out'}, null);
          return;
        }
        timeoutTimer += 500;
      }, 500);
      process.nextTick(function CoreModuleCloseModsNextTickCb() {
        self.on('module-shut-down', function CoreModuleCloseModsOnModShutdownCb() {
          counter ++;
        });
        self.emit('shutdown', 'All Modules Have Been Terminated');
      });
    },

    /**
     * Exit Process
     * @memberof Server.Modules.Core
     * @private
     * @ignore
     * @function
     */
    exitProcess: function CoreModuleExitProcess() {
      const currentDate = new Date().toISOString();
      if (!core.globals.get('silent')) {
        console.log(currentDate + ' (shutdown) Blackrock Core > Shutdown Complete');
      }
      process.exit();
    },

    /**
     * Fetch Base Path
     * @memberof Server.Modules.Core
     * @function
     * @param {string} type - The Base Path Type
     * @return {string} basePath - The Requested Base Path
     */
    fetchBasePath: function CoreModuleFetchBasePath(type) {
      if (basePaths[type]) {
        return basePaths[type];
      } else {
        return '';
      }
    },

    /**
     * @class Server.Modules.Core.Globals
     * @hideconstructor
     *
     * @description
     * This is the "globals" object on the Core module. It can be accessed via "core.globals.[method]". It does
     * NOT need to be instantiated, so there is no need to use the class constructor that is shown within these
     * documents.
     */
    globals: {

      /**
       * Set Global Property
       * @memberof Server.Modules.Core.Globals
       * @function
       *
       * @description
       * This method allows you to set a global property. It must be enabled within the server configuration, in
       * "services.allow" to be accessed from within the context of a service. These properties (when set) are shared
       * across all services running on the server. It is a global key-value store.
       *
       * @param {string} name - Global Property Name
       * @param {string} value - Global Property Value
       * @return {boolean} result - Set Result
       */
      set: function CoreModuleSetGlobal(name, value) {
        if (!name) {
          return false;
        } globals[name] = value; return true;
      },

      /**
       * Get Global Property
       * @memberof Server.Modules.Core.Globals
       * @function
       *
       * @description
       * This method allows you to get a global property. It must be enabled within the server configuration, in
       * "services.allow" to be accessed from within the context of a service. These properties (when set) are shared
       * across all services running on the server. It is a global key-value store.
       *
       * @param {string} name - Global Property Name
       * @return {string} value - Global Property Value
       */
      get: function CoreGetGlobal(name) {
        if (!globals[name]) {
          return;
        } return globals[name];
      },
    },

    /**
     * Is Loaded?
     * @memberof Server.Modules.Core
     * @function
     * @param {string} module - Module Name
     * @param {function} [callbackFn] - Callback Function
     * @return {Promise} promise - Promise to Return
     */
    isLoaded: function CoreModuleIsModLoaded(module, callbackFn) {
      const self = this;
      // eslint-disable-next-line no-undef
      const myPromise = new Promise(function(resolve, reject) {
        if (self.module(module)) {
          if (callbackFn) {
            callbackFn(null, self.module(module));
          }
          resolve(self.module(module));
          return;
        }
        const timeout = 1;
        let timer = 0;
        const interval = setInterval(function() {
          if (self.module(module)) {
            clearInterval(interval);
            if (callbackFn) {
              callbackFn(null, self.module(module));
            }
            resolve(self.module(module));
            return;
          } else if (timer >= timeout) {
            clearInterval(interval);
            if (callbackFn) {
              callbackFn({'error': 'Timed Out'}, null);
            }
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({'error': 'Timed Out'});
            return;
          }
          timer += 1;
        }, 1);
      });
      if (!callbackFn) {
        return myPromise;
      } else {
        myPromise.then(function(pRes) {}).catch(function(pErr) {});
      }
    },

    /**
     * Load Module
     * @memberof Server.Modules.Core
     * @function
     * @param {string} type - Module Type
     * @param {string} moduleName - Module Name
     * @param {function} [cb] - Callback Function
     * @return {object} output - Method Response
     */
    loadModule: function CoreModuleLoadMod(type, moduleName, cb) {
      const self = this;
      if (self.status === 'Shutting Down' || self.status === 'Terminated') {
        return;
      }
      if (type === 'module' && config.core.modules && config.core.modules.length > 0 &&
          !config.core.modules.includes(moduleName)) {
        return;
      }
      if (type === 'interface' && config.core.interfaces && config.core.interfaces.length > 0 &&
          !config.core.interfaces.includes(moduleName)) {
        return;
      }
      if (moduleName.startsWith('.')) {
        return;
      }
      try {
        if (type === 'module') {
          modules[moduleName] = require(basePaths.module + '/' + type + 's/' + moduleName + '/main.js')(core);
        } else if (type === 'interface') {
          modules.interfaces[moduleName] = require(
              basePaths.module + '/' + type + 's/' + moduleName + '/main.js')(core);
        }
      } catch (err) {
        const error = {success: false, message: 'Error Loading \'' +
            moduleName + '\' Module (Type: ' + type + ')', error: err};
        log('debug', 'Blackrock Core > ' + error.message, error.error, 'CORE_ERR_LOADING_MOD');
        if (cb) {
          cb(error, null);
        }
        return error;
      }
      const output = {success: true, message: '\'' + moduleName + '\' Module (Type: ' + type + ') Loaded Successfully'};
      if (type === 'module') {
        output.module = modules[moduleName];
      }
      if (type === 'interface') {
        output.module = modules.interfaces[moduleName];
      }
      log('debug', 'Blackrock Core > ' + output.message, {}, 'CORE_MOD_LOADED');
      if (cb) {
        cb(null, output);
      }
      return output;
    },

    /**
     * Get Module Instance
     * @memberof Server.Modules.Core
     * @function
     * @param {string} name - Module Name
     * @param {string} [type] - Module Type
     * @return {Server.Modules.Core.Module} module - The Requested Module
     * @example
     * // Return a Module Instance
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const logger = core.module('logger');
     *     logger.log('debug', 'This is a test message');
     *     // Output: 'This is a test message' will appear in the logs (incl. console if enabled)
     *   });
     */
    module: function CoreModuleGetMod(name, type) {
      if (type && type === 'interface') {
        if (modules.interfaces[name]) {
          return modules.interfaces[name];
        }
      } else if (name !== 'interface') {
        if (modules[name]) {
          return modules[name];
        }
      }
    },

    /**
     * Get Module Count
     * @memberof Server.Modules.Core
     * @function
     * @param {string} type - Module Type
     * @return {number} count - The Module Count
     * @example
     * // Return a Count of Loaded Modules:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const moduleCount = core.moduleCount('modules');
     *     console.log(moduleCount);
     *     // Output: 10 (or however many modules have been loaded)
     *   });
     */
    moduleCount: function CoreModuleCountMods(type) {
      if (type && type === 'interfaces') {
        return Object.keys(modules.interfaces).length;
      } else if (type && type === 'modules') {
        return Object.keys(modules).length - 1;
      } else {
        return 0;
      }
    },

    /**
     * Get Package JSON File
     * @memberof Server.Modules.Core
     * @function
     * @return {object} pkg - The Parsed Package File
     * @example
     * // Return Application Server's Parsed Package.json file:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const pkg = core.pkg();
     *     console.log(pkg.name);
     *     // Output: "Blackrock Application Server"
     *   });
     */
    pkg: function CoreModuleGetPkg() {
      return pkg;
    },

    /**
     * Is Server Ready?
     * @memberof Server.Modules.Core
     * @function
     * @param {function} callbackFn - Callback Function
     * @return {Promise} promise - A Promise
     * @example
     * // Check if server is ready:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     core.ready().then(function(newCore) {
     *       console.log('Status - ' + newCore.status);
     *       // Output: "Active"
     *     });
     *   });
     */
    ready: function CoreModuleReady(callbackFn) {
      const self = this;
      // eslint-disable-next-line no-undef
      const myPromise = new Promise(function(resolve, reject) {
        const timeout = 1000; let timer = 0;
        const interval = setInterval(function() {
          if (self.status === 'Active') {
            clearInterval(interval);
            if (callbackFn && typeof callbackFn === 'function') {
              callbackFn(null, self);
            }
            resolve(self);
          }
          if (timer >= timeout) {
            clearInterval(interval);
            if (callbackFn && typeof callbackFn === 'function') {
              callbackFn(self, null);
            }
            reject(self);
          }
          timer += 10;
        }, 10);
      });
      if (!callbackFn) {
        return myPromise;
      } else {
        myPromise.then(function(pRes) {}).catch(function(pErr) {});
      }
    },

    /**
     * Shutdown Server
     * @memberof Server.Modules.Core
     * @function
     *
     * @description
     * This method will shutdown the server. It is always available from a parent application
     * (where Blackrock has been included as a dependency). It is only available from a service
     * (initialisation method or route handlers) if it is enabled within "services.allow" within
     * the server configuration file.
     *
     * @example
     * // Shutdown the server:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     core.shutdown();
     *     // Note: The server will begin shutting down now...
     *   });
     */
    shutdown: function CoreModuleShutdown() {
      const self = this;
      if (self.status === 'Shutting Down' || self.status === 'Terminated') {
        return;
      }
      log('shutdown', 'Blackrock Core > Initiating System Shutdown.', {}, 'CORE_INIT_SHUTDOWN');
      self.status = 'Shutting Down';
      self.closeModules(function CoreModuleCloseModsCb() {
        self.exitProcess();
      });
    },

    /**
     * Start Event Loop
     * @memberof Server.Modules.Core
     * @private
     * @ignore
     * @function
     * @param {function} cb - Callback Function
     */
    startEventLoop: function CoreModuleStartEvtLoop(cb) {
      const self = this;
      if (self.status === 'Shutting Down' || self.status === 'Terminated' || self.status === 'Active') {
        if (cb) {
          cb({'error': 'Invalid State', 'state': self.status}, null);
        }
      } else {
        setTimeout(function CoreModuleStartLoopTimeout() {
          // noinspection JSIncompatibleTypesComparison
          if (!self.status === 'Shutting Down' && !self.status === 'Terminated' && !self.status === 'Active') {
            log('startup',
                'Blackrock Core > System Loaded, Event Loop Executing. Press \'e\' key to shutdown.',
                {}, 'CORE_SYSTEM_LOADED');
          }
        }, 1000);
        if (!self.stopActivation) {
          self.status = 'Active';
        }
        if (cb) {
          cb(null, {'success': true});
        }
        setInterval(function CoreModuleStartLoopInterval() {}, 1000);
      }
    },

    /**
     * Update Server Configuration
     * @memberof Server.Modules.Core
     * @function
     * @param {object} cfg - Configuration Object
     * @return {bool} result - Result of Configuration Update
     * @example
     * // Updates the live configuration of the application server:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const result = core.updateConfig({'test': 'value'});
     *     console.log(result);
     *     // Output: true
     *   });
     */
    updateConfig: function CoreModuleUpdateConfig(cfg) {
      if (!cfg) {
        return false;
      }
      config = cfg;
      return true;
    },

  });


  /**
   * Delete Proxy Method
   * @memberof Server.Modules.Core
   * @private
   * @ignore
   * @function
   * @param {object} obj - Object to Delete
   */
  const quickDelete = function CoreModuleQuickDelete(obj) {
    // eslint-disable-next-line no-delete-var
    delete obj;
  };


  /**
   * @class Server.Modules.Core.Module
   * @augments Server.Modules.Core
   * @param {string} name - The name of the module being instantiated
   *
   * @description
   * This is the Module class, which provides a base class for all modules to inherit from.
   */
  const Mod = new Core().extend({

    /**
     * Module Constructor
     * @memberof Server.Modules.Core.Module
     * @private
     * @ignore
     * @function
     * @param {string} name - Name of Module
     */
    constructor: function CoreModuleModConstructor(name) {
      const self = this;
      if (name) {
        self.name = name;
        self.uber.on('shutdown', function CoreModuleModConstructorOnShutdownCb() {
          self.unload();
        });
      }
    },

    /**
     * Unload Module
     * @memberof Server.Modules.Core.Module
     * @private
     * @ignore
     * @function
     */
    unload: function CoreModuleUnloadMod() {
      const self = this;
      log('debug', self.name + ' Module > Module Unloaded', {}, 'CORE_MOD_UNLOADED');
      self.uber.emit('module-shut-down', self.name);
      quickDelete(self);
    },

  });


  /**
   * @class Server.Modules.Core.Interface
   * @augments Server.Modules.Core.Module
   * @param {string} name - The name of the interface being instantiated
   *
   * @description
   * This is the Interface class, which provides a base class for all interfaces to inherit from.
   */
  const Interface = new Mod().extend({

    /**
     * Interface Constructor
     * @memberof Server.Modules.Core.Interface
     * @private
     * @ignore
     * @function
     * @param {string} name - Name of Module
     */
    constructor: function CoreModuleInterfaceConstructor(name) {
      const self = this;
      self.name = name;
      self.uber.uber.on('shutdown', function() {
        self.unload();
      });
    },

    /**
     * Close Interfaces
     * @memberof Server.Modules.Core.Interface
     * @private
     * @ignore
     * @function
     * @param {function} cb - Callback Function
     */
    closeInterfaces: function CoreModuleInterfaceCloseInterfaces(cb) {
      let totalInterfaces = 0; let interfacesClosed = 0;
      totalInterfaces += Object.keys(this.instances).length;
      for (const name in this.instances) {
        if (this.instances[name].server && this.instances[name].server.close) {
          this.instances[name].server.close(function(err) {
            if (!err) {
              interfacesClosed ++;
            }
          });
        }
      }
      let counter = 0; const timeout = 5000;
      const interval = setInterval(function CoreModuleInterfaceCloseTimeout() {
        if (interfacesClosed >= totalInterfaces) {
          clearInterval(interval); cb(true); return;
        }
        if (counter >= timeout) {
          clearInterval(interval); cb(false); return;
        }
        counter += 500;
      }, 500);
    },

    /**
     * Get Interface Instance
     * @memberof Server.Modules.Core.Interface
     * @function
     * @param {string} name - Instance Name
     * @return {object} instance - The Requested Instance
     * @example
     * // Returns an instance from an interface:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const httpInterface = core.module('http', 'interface');
     *     const instance = httpInterface.get('default');
     *   });
     */
    get: function CoreModuleInterfaceGetInstance(name) {
      const self = this;
      if (!self.instances[name]) {
        return false;
      } else {
        return self.instances[name];
      }
    },

    instances: {},

    /**
     * Get List of Interface Instances
     * @memberof Server.Modules.Core.Interface
     * @function
     * @return {array} instances - A List of Instances
     * @example
     * // Returns a list of interface instances:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const httpInterface = core.module('http', 'interface');
     *     const instanceList = httpInterface.list();
     *     console.log(instanceList)
     *     // Output: ['instance1', 'instance2', 'instance3']
     *   });
     */
    list: function CoreModuleInterfaceListInstances() {
      const self = this;
      return Object.keys(self.instances);
    },

    /**
     * Start Interface Instances
     * @memberof Server.Modules.Core.Interface
     * @private
     * @ignore
     * @function
     */
    startInterfaces: function CoreModuleInterfaceStartInterfaces() {
      const self = this;
      process.nextTick(function CoreModuleInterfaceStartInterfacesNextTickCb() {
        const myName = self.name.toLowerCase();
        if (!core.cfg().interfaces || !core.cfg().interfaces[myName]) {
          log('debug',
              self.name + ' Interface Module > No Interfaces Defined in System Configuration File.',
              {}, 'CORE_ERR_START_INTERFACES_NONE_DEFINED'); return;
        }
        if (!core.cfg().router || !core.cfg().router.instances) {
          log('error',
              self.name + ' Interface Module > Cannot start interfaces as there are no routers defined.');
          return;
        }
        // eslint-disable-next-line guard-for-in
        for (const intfc in core.cfg().interfaces[myName]) {
          const cfg = core.cfg().interfaces[myName][intfc];
          if (self.instances[intfc]) {
            log('error',
                self.name +
                ' Interface Module > Attempting to load an interface that has already been loaded (' + intfc + ').',
                {}, 'CORE_ERR_START_INTERFACES_ALREADY_LOADED');
          } else if (!cfg.enabled || cfg.enabled !== true) {
            log('warning',
                self.name +
                // eslint-disable-next-line max-len
                ' Interface Module > Attempting to load an interface that is not enabled in the system configuration (' + intfc + ').',
                {}, 'CORE_ERR_START_INTERFACE_NOT_DEFINED');
          } else {
            self.startInterface(intfc);
          }
        }
      });
    },

    /**
     * Unload Interface Instances
     * @memberof Server.Modules.Core.Interface
     * @private
     * @ignore
     * @function
     */
    unload: function CoreModuleInterfaceUnload() {
      const self = this;
      self.closeInterfaces(function CoreModuleInterfaceUnloadCloseInterfacesCb() {
        log('debug',
            self.name + ' Interface > Closing interface instances... Succeeded.',
            {}, 'CORE_INTERFACES_CLOSED');
        self.uber.emit('module-shut-down', self.name);
        quickDelete(self);
      });
    },

  });

  /**
   * Core Module Instance
   * @memberof Server.Modules.Core
   * @type Server.Modules.Core
   * @instance
   */
  core = module.exports = new Core();

  /**
   * Base Class Pointer Within Core Object
   */
  core.Base = Base;

  /**
   * Core Class Pointer Within Core Object
   */
  core.Core = core.ISNode = Core;

  /**
   * Mod Class Pointer Within Core Object
   */
  core.ISMod = core.Mod = Mod;

  /**
   * Interface Class Pointer Within Core Object
   */
  core.ISInterface = core.Interface = Interface;
}();
