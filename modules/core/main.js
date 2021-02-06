!function CoreModuleWrapper() {
  let core; const modules = {interfaces: {}}; const globals = {}; const fs = require('fs');
  let log = function() {}; let config; let pkg = {}; const basePaths = {};
  const quickDelete = require('./base/delete.js');

  /**
   * Display Console Banner
   *
   * @private
   * @memberof Server.Modules.Core
   * @name displayConsoleBanner
   * @ignore
   * @function
   * @param {Server.Modules.Core} displayCore - Core Object
   *
   * @description
   * This is an internal method that is only available from within the Core module. It renders a welcome
   * banner to the console's stdout early on in server startup.
   *
   * @example
   * // Scope: Being executed from within Core Module Internals
   * displayConsoleBanner();
   * // Output: The console banner with the IndustrySwarm logo is rendered in to the console
   */
  const displayConsoleBanner = function CoreDisplayConsoleBanner(displayCore) {
    let alertLineOne = ''; let alertLineTwo = '';
    const currentDate = new Date(); const fullYear = currentDate.getFullYear();
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
 %  ,%% #%%%%%%%%%%%%%%%,*%%%     %&  %        Copyright ` + fullYear + `, Darren Smith.
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
   *
   * @private
   * @memberof Server.Modules.Core
   * @name calculateBasePathSet
   * @ignore
   * @function
   *
   * @description
   * This is an internal method that is only available from within the Core module. It calculates the initial set of
   * base paths that allow the system to orient itself as to where it's config resides as well as the folders that
   * hold the Apps and the Cache.
   *
   * @example
   * // Scope: Being executed from within Core Module Internals
   * calculateBasePathSet();
   * console.log('Base Path Set', basePaths);
   * // Output: 'Base Path Set , { apps: '/path/to/apps', config: '/path/to/config', cache: '/path/to/cache' }
   */
  const calculateBasePathSet = function CoreCalcBasePathSet() {
    let dirName = __dirname; dirName = dirName.split('/'); dirName.pop(); dirName.pop();
    basePaths.module = dirName.join('/'); dirName = basePaths.module.split('/'); dirName.pop(); dirName.pop(); dirName = dirName.join('/');
    basePaths.apps = ''; basePaths.config = ''; basePaths.cache = ''; basePaths.root = basePaths.module;
    if (fs.existsSync(dirName + '/apps')) {
      basePaths.apps = dirName + '/apps';
      basePaths.root = dirName;
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
   *
   * @private
   * @memberof Server.Modules.Core
   * @name loadBaseClass
   * @ignore
   * @function
   * @return {Server.Modules.Core.Base} Base - Base Class
   *
   * @description
   * This is an internal method that is only available from within the Core module. This method imports the Base Class,
   * from which all other first-party classes within the system are derived. The base classes most primitive structure
   * is the Augment Class Inheritance Library. On top of this we have added a fully featured Event Emitter object and
   * attached a couple of libraries, including - RxJS (The Reactive Extensions) with a few custom operators and support
   * methods, and the Day.JS Date/Time Management Library.
   *
   * @example
   * // Scope: Being executed from within Core Module Internals
   * const Base = loadBase();
   * console.log('Base Class', Base);
   * // Output: 'Base Class , Base()'
   */
  const loadBase = function CoreLoadBase() {
    let Base;
    try {
      Base = require('./base/index.js');
    } catch (err) {
      console.log(err);
      let currentDate = new Date();
      currentDate = currentDate.toISOString();
      console.log(currentDate +
        '(fatal) Core > Missing Critical System File (./base/index.js) - Terminating');
      process.exit();
    }
    return Base;
  };
  const Base = loadBase();


  /**
   * Setup External Module Methods (Log)
   *
   * @private
   * @memberof Server.Modules.Core
   * @name setupExternalModuleMethods
   * @ignore
   * @function
   * @param {Server.Modules.Core} coreObj - Core Object
   *
   * @description
   * This is an internal method that is only accessible from within the Core module itself. It creates a faux
   * log method that checks whether the Logger Module is loaded every time it receives a log event, and if so -
   * proxies that log event through to the log method on the Logger Module. This is done so that we can ensure that
   * a log method exists as early on in application server startup as possible, simply disposing of log messages that
   * it receives before the Logger Module becomes available.
   *
   * @example
   * // Scope: Being executed from within Core Module Internals
   * console.log('Log Function', log);  // Output: Log Function, undefined
   * setupExternalModuleMethods(core);  // Run this method
   * console.log('Log Function', log);  // Output: Log Function, Function...
   */
  const setupExternalModuleMethods = function CoreSetupExtModMethods(coreObj) {
    log = function CoreLog(level, logMsg, attrObj, evtName) {
      // noinspection JSUnresolvedFunction
      const logger = coreObj.module('logger');
      if (logger && logger.log) logger.log(level, logMsg, attrObj, evtName);
    };
  };


  /**
   * Blackrock Core Module
   *
   * @public
   * @class Server.Modules.Core
   * @augments Server.Modules.Core.Base
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   *
   * @description This is the Core Module of the Blackrock Application Server.
   * It is responsible for loading all remaining modules and interfaces within Blackrock.
   * This module exports the core object (an instantiated version of the Core class
   * contained within) to the parent Server namespace. You do not need to instantiate this
   * module's class (by calling the constructor), as this is done automatically for you.
   *
   * @example
   * // Get Core Object (Calling Blackrock As A Dependency):
   * require('is-blackrock').init()
   *   .then(function(core) {
   *     const log = core.module('logger).log;
   *     log('debug', 'My App - The Status of Core is ' + core.status, {}, 'CORE_STATUS');
   *     // Output: 'The Status of Core is Active' (if server has finished initialising)
   *   });
   *
   * @example
   * // Get Core Object (From App Controller):
   * const ctrl = function() {};
   * ctrl.get = function(req, res) {
   *   const log = req.core.module('logger).log;
   *   log('debug', 'My App - The Status of Core is ' + core.status, {}, 'CORE_STATUS');
   *   // Output: 'The Status of Core is Active' (if server has finished initialising)
   * }
   */
  let corePrototype = {
    constructor: function CoreModule() {
      if(core) return;
      this.status = 'Inactive';
      this.reason = '';
      this.stopActivation = true;
    },

    /**
     * Void Method
     *
     * @public
     * @memberof Server.Modules.Core
     * @name void
     * @function
     *
     * @description
     * This method does not do anything. It exists in order to provide a work-around for when some method must be
     * called on the core application server instance, but you do not actually need the method to do anything or to
     * return a result.
     *
     * @example
     * // Voiding (Calling Blackrock As A Dependency):
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     core.void();
     *     // Output: Does Nothing. I mean... What did you expect?
     *   });
     *
     * @example
     * // Voiding (From App Controller):
     * const ctrl = function() {};
     * ctrl.get = function(req, res) {
     *   req.core.void();
     *   // Output: Yep. Still does nothing,
     * }
     */
    void: function CoreModuleVoid() {},

    /**
     * Initialise Core Module
     *
     * @public
     * @memberof Server.Modules.Core
     * @name init
     * @function
     *
     * @description
     * This method initialises the application server. It is called automatically when you are running the server
     * in stand-alone mode. If you are running the server as a dependency for another application, then you must
     * call this method on the object returned by require in order to start the server. The server will remain in
     * an inactive state up until you call this method.
     *
     * @param {object} initialConfig - Initial Configuration Data
     * @param {object} initialConfig.silent - True disables console logging (when embedding in your own app), Else False
     * @param {object} initialConfig.test - True enables test mode, Else False
     * @param {object} initialConfig.config - Configuration Block. See {@tutorial server-configuration}
     * @param {function} callbackFn - The Callback Function
     * @return {Server.Modules.Core} core - The Core Module
     *
     * @example
     * // Initialise the Application Server (Not Available to App Controllers):
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     console.log(core.status);
     *     // Output: 'Active' (if server has finished initialising)
     *   });
     */
    init: function CoreInit(initialConfig, callbackFn) {
      const self = this;
      // eslint-disable-next-line no-undef
      const myPromise = new Promise(function CoreInitPromise(resolve, reject) {
        const resolvePromise = function CoreInitResolvePromise() {
          if (callbackFn && typeof callbackFn === 'function') callbackFn(self);
          if (self.status === 'Error') reject(self.reason);
          else if (self.status === 'Active') resolve(self);
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
          if (callbackFn && typeof callbackFn === 'function') callbackFn(self);
          const interval = setInterval(function CoreInitPromiseInterval() {
            if (self.status === 'Error') {
              clearInterval(interval);
              reject(self.reason);
            } else if (self.status === 'Active') {
              clearInterval(interval);
              resolve(self);
            }
          }, 10);
          return;
        }
        self.status = 'Preboot'; pkg.name = 'Blackrock'; pkg.version = '0.00';
        // noinspection JSUnresolvedVariable
        if (initialConfig && initialConfig.silent) self.globals.set('silent', 'true');
        // noinspection JSUnresolvedVariable
        if (initialConfig && initialConfig.test) self.globals.set('test', 'true');
        if (!initialConfig || !initialConfig.config) {
          try {
            config = require(basePaths.config);
          } catch (err) {
            self.status = 'Error';
            self.reason = 'No config provided';
          }
        }
        if (!initialConfig && !config) {
          try {
            config = require(basePaths.module + '/../../config/config.json');     // Legacy Config Filename
          } catch (err) {
            self.status = 'Error';
            self.reason = 'No config provided';
          }
        } else if (initialConfig && initialConfig.config) config = initialConfig.config;
        // noinspection JSUnresolvedVariable
        if (!initialConfig || !initialConfig.package) {
          try {
            pkg = require(basePaths.root + '/package.json');
          } catch (err) {
            self.status = 'Error';
            self.reason = 'No package provided';
          }
        } else if (initialConfig.package) pkg = initialConfig.package;
        if (!config) {
          if (fs.existsSync('/etc/is-blackrock.json')) {
            self.status = 'Preboot'; self.reason = '';
            basePaths.config = '/etc/is-blackrock.json';
            try {
              config = require('/etc/is-blackrock.json');
            } catch(err) {
              self.status = 'Error'; self.reason += 'Malformed JSON in the Config File';
            }
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
        if (config && (!basePaths.apps || !basePaths.cache)) {
          if (config && config.core && config.core.locations &&
            config.core.locations.apps && fs.existsSync(config.core.locations.apps)) {
            basePaths.apps = config.core.locations.apps;
          }
          if (config && config.core && config.core.locations &&
            config.core.locations.cache && fs.existsSync(config.core.locations.cache)) {
            basePaths.cache = config.core.locations.cache;
          }
        }
        if (!basePaths || !basePaths.module || !basePaths.root ||
          !basePaths.apps || !basePaths.cache || !basePaths.config) {
          if(!self.reason) self.status = 'Error'; self.reason = 'Could not establish valid base paths';
        }
        if (config && !config.core) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No core module section in config provided';
        }
        if (config && config.core && !config.core.modules) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No modules listed in config';
        }
        // noinspection JSUnresolvedVariable
        if (config && config.core && !config.core.startupModules) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No startup modules listed in config';
        }
        if (config && config.core && !config.core.timeouts) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No timeouts listed in config';
        }
        // noinspection JSUnresolvedVariable
        if (config && config.core && config.core.timeouts && !config.core.timeouts.loadDependencies) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No loadDependencies timeout listed in config';
        }
        // noinspection JSUnresolvedVariable
        if (config && config.core && config.core.timeouts && !config.core.timeouts.closeModules) {
          if(!self.reason) self.status = 'Error'; self.reason = 'No closeModules timeout listed in config';
        }
        modules.core = self;
        // noinspection JSUnresolvedVariable
        if ((initialConfig && !initialConfig.silent) || !initialConfig) displayConsoleBanner(self);
        if (self.status !== 'Preboot' || self.status === 'Error') {
          resolvePromise(); return;
        }
        self.status = 'Starting';
        setupExternalModuleMethods(self);
        // noinspection JSUnresolvedVariable
        if (config && config.core && config.core.startupModules && config.core.startupModules.length > 0) {
          for (let i = 0; i < config.core.startupModules.length; i++) {
            self.module.load('module', config.core.startupModules[i]);
          }
        } else {
          self.shutdown('No Startup Modules Defined'); return;
        }
        self.on('CORE_LOAD_DEPENDENCIES', function CoreLoadDepCb() {
          if (process.stdin.isTTY) {
            const stdin = process.openStdin();
            stdin.setRawMode(true);
            stdin.setEncoding('utf8');
            stdin.on('data', function CoreLoadDepCbStdInDataIn(chunk) {
              if (chunk === 'e') self.shutdown('User Terminated Server');
            });
          }
          const fs = require('fs');
          fs.readdirSync(basePaths.module + '/modules').forEach(function CoreLoadModsReadDirCb(file) {
            if (!modules[file]) self.module.load('module', file);
          });
          fs.readdirSync(basePaths.module + '/interfaces').forEach(function CoreLoadInterfacesReadDirCb(file) {
            if (!modules.interfaces[file]) self.module.load('interface', file);
          });
          self.status = 'Finalising';
          core.emit('CORE_FINALISING');
        });
        let counter = 0; let timeout;
        // noinspection JSUnresolvedVariable
        if (config.core.timeouts.loadDependencies) timeout = config.core.timeouts.loadDependencies;
        else timeout = 5000;
        const interval = setInterval(function CoreDepLoadIntervalCb() {
          if (self.status === 'Finalising') {
            clearInterval(interval); self.startEventLoop(function CoreReqToStartEvtLoop() {
              resolvePromise();
            });
          }
          if (counter >= timeout) {
            log('error',
                'Core > Timed out initiating startup. Terminating application server.',
                {}, 'CORE_STARTUP_TIMEOUT');
            clearInterval(interval);
            self.shutdown('Timed Out Loading Dependencies');
          }
          counter += 50;
        }, 50);
        core.emit('CORE_LOAD_DEPENDENCIES');
      });
      if (!callbackFn) return myPromise;
      else {
        myPromise.then(function CoreInitCallPromiseThen(pRes) {}).catch(function CoreInitCallPromiseCatch(pErr) {});
        return self;
      }
    },

    /**
     * Return Configuration
     *
     * @public
     * @function cfg
     * @memberof Server.Modules.Core
     * @property {function} cfg.update - Updates the Configuration
     * @return {object} config - The Config Object. See {@tutorial server-configuration}
     *
     * @description
     * This method can be accessed when calling Blackrock As A Dependency, and also from within the app
     * controllers (if enabled in config: config['app-engine'].allow.cfg = true). It returns the application server's
     * current configuration state. This state, of course, is originally read from the config file on the filesystem
     * when the application server starts up. And can also be passed through or modified via the Init Object
     * (the first parameter that you pass to Blackrock's Init Method.
     *
     * @example
     * // Return Application Server Configuration Object (Calling Blackrock As A Dependency):
     * const initObject = { config: amendedConfigData}
     * require('is-blackrock').init(initObject)
     *   .then(function(core) {
     *     const log = req.core.module('logger').log;
     *     const config = core.cfg();
     *     log('debug', 'My App > Message - ' + config.core.banner, {}, 'MY_APP_SENDING_CONFIG_BANNER');
     *     // Output: 'Blackrock Application Server (Default)' (In Console)
     *   });
     *
     * @example
     * // Updates the live configuration of the application server:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const result = core.cfg.update({'test': 'value'});
     *     if(result) console.log('Updated');
     *     else console.log('Update Failed');
     *   });
     */
    cfg: function CoreGetCfg() {
      return config;
    },

    /**
     * Get Package JSON File
     *
     * @public
     * @memberof Server.Modules.Core
     * @name pkg
     * @function
     * @return {object} pkg - The Parsed Package File
     *
     * @description
     * This method returns a Javascript object that contains the parsed content of the package.json file. If the
     * server is running in stand-alone mode, then this will be the package.json file of the actual is-blackrock
     * module. Otherwise, it will be the package.json file of the host application that is accessing Blackrock
     * as a dependency.
     *
     * @example
     * // Return Application Server's Parsed Package.json file (calling a dependency):
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const log = core.module('logger).log
     *     const pkg = core.pkg();
     *     log('debug', 'My App > What's in the package? It's a - ' + pkg.name, {}, 'MY_APP_THE_PACKAGE');
     *     // Output: "Blackrock Application Server"
     *   });
     *
     * @example
     * // Return Application Server's Parsed Package.json file (From App Controller)
     * const ctrl = function() {};
     * ctrl.get = function(req, res) {
     *   const log = req,core.module('logger).log
     *   const pkg = req.core.pkg();
     *   log('debug', 'My App > What's in the package? It's a - ' + pkg.name, {}, 'MY_APP_THEIR_PACKAGE');
     *   // Output: "Blackrock Application Server". But take note - you must enable this within the server
     *   // config (config['app-engine].allow.pkg = true).
     * }
     */
    pkg: function CoreGetPkg() {
      return pkg;
    },

    /**
     * Exit Process (Undocumented)
     *
     * @public
     * @memberof Server.Modules.Core
     * @name exitProcess
     * @ignore
     * @function
     *
     * @description
     * This is an internal method that is only accessible within the Blackrock Module / Application Server Internals.
     * It renders 'Shutdown Complete' to the logs and immediately terminates the application server process. It does
     * not gracefully close anything down. It really must not be used. Instead, use core.shutdown()
     *
     * @example
     * // Scope: Being executed from within Core Module Internals
     * exitProcess();
     * // Output in Logs: '20201201 00:00:00 (shutdown) Shutdown Complete' (and process immediately terminates)
     */
    exitProcess: function CoreExitProcess() {
      const currentDate = new Date().toISOString();
      if (!core.globals.get('silent')) console.log(currentDate + ' (shutdown) Core > Shutdown Complete');
      process.exit();
    },

    /**
     * Fetch Base Path
     *
     * @public
     * @memberof Server.Modules.Core
     * @name fetchBasePath
     * @function
     * @param {string} type - The Base Path Type
     * @return {string} basePath - The Requested Base Path
     *
     * @description
     * This method can be used when accessing core where Blackrock is a dependency of your own project, and can also
     * be used from within a app controller (where enabled in config). It fetches whichever base path type you
     * specify by name when calling it. Options include - 'apps', 'module', 'config', 'cache', 'root'.
     *
     * @example
     * // Return Application Server Configuration Object (Calling Blackrock As A Dependency):
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const log = core.module('logger).log;
     *     const appBasePath = core.fetchBasePath('apps');
     *     log('debug', 'My App > App Base Path Is ' + appBasePath, {}, 'MY_APP_BASE_PATH');
     *     // Output: 'App Base Path Is /home/alice/my-local-swarm/apps' (In Console)
     *   });
     *
     * @example
     * // Return Application Server Configuration Object (From App Controller. In - Say, a Stand-Alone Setup):
     * const ctrl = function() {};
     * ctrl.get = function(req, res) {
     *   const log = req.core.module('logger).log;
     *   const appBasePath = req.core.fetchBasePath('apps');
     *   log('debug', 'My App > App Base Path Is ' + appBasePath, {}, 'MY_APP_BASE_PATH');
     *   // Output: 'App Base Path Is /opt/blackrock/apps' (In Console, Stand-Alone Application Server Mode)
     * }
     */
    fetchBasePath: function CoreFetchBasePath(type) {
      if (basePaths[type]) return basePaths[type];
      else return '';
    },

    /**
     * Globals Object
     *
     * @public
     * @memberof Server.Modules.Core
     * @property {function} globals.set - Sets global variable value
     * @property {function} globals.get - Gets global variable value
     *
     * @description
     * This object contains methods to get and set methods that are globally accessible across the
     * Application Server. It does NOT need to be instantiated and can/should not be called directly.
     * You can read more about the get method here - {@link Server.Modules.Core#globals.get}.
     * And the set method here - {@link Server.Modules.Core#globals.set}
     *
     * @example
     * // Set a global variable:
     * core.globals.set('test', 'value');     // Returns: true
     *
     * @example
     * // Get a global variable:
     * core.globals.get('test');              // Returns: 'value'
     */
    globals: {

      /**
       * Set Global Property
       *
       * @public
       * @alias globals.set
       * @memberof! Server.Modules.Core#
       * @function globals.set
       * @param {string} name - Global Property Name
       * @param {string|object|array} [value] - Global Property Value - Will clear current key if left out
       * @return {boolean} result - Set Result
       *
       * @description
       * This method allows you to set a global property. It must be enabled within the server configuration, in
       * "config['apps'].allow" to be accessed from within the context of an app. These properties (when set) are
       * shared across all apps running on the server. It is a global key-value store.
       *
       * @example
       * // For either 'Blackrock as a Dependency or from a App Controller:
       * console.log(core.globals.set('ping', 'pong!'));     // Returns: true
       */
      set: function CoreSetGlobal(name, value) {
        if (!name) return false;
        globals[name] = value; return true;
      },

      /**
       * Get Global Property
       *
       * @public
       * @alias globals.get
       * @memberof! Server.Modules.Core#
       * @function globals.get
       * @param {string} name - Global Property Name
       * @return {string|object|array} value - Global Property Value
       *
       * @description
       * This method allows you to get a global property. It must be enabled within the server configuration, in
       * "config['app-engine'].allow" to be accessed from within the context of an app. These properties (when set)
       * are shared across all apps running on the server. It is a global key-value store.
       *
       * @example
       * // For either 'Blackrock as a Dependency or from a App Controller:
       * console.log(core.globals.get('ping'));     // Returns: pong!
       */
      get: function CoreGetGlobal(name) {
        if (!globals[name]) return '';
        return globals[name];
      },
    },

    /**
     * Get Module Singleton
     *
     * @public
     * @memberof Server.Modules.Core
     * @function module
     * @property {function} module.count - Returns number of loaded modules and/or interfaces
     * @property {function} module.load - Loads a module and instantiates it's Singleton
     * @property {function} module.isLoaded - Waits until module loads and then fulfills a Promise
     * @property {function} module.closeAll - Closes all active modules
     * @param {string} name - Module Name
     * @param {string} [type] - Module Type (Leave blank for standard module, or enter 'interface' for an interface
     * @return {Server.Modules.Core.Module} module - The Requested Module
     *
     * @description
     * This method (when provided with a module name), returns the singleton for that module to the caller.
     * Module singletons are instantiated at server startup - with this being configurable within the server config.
     * Note: To use this method from an app controller, you must enable the modules you will have access to
     * within the server config, along with the method names within.
     * Eg; config['app-engine'].allow.modules[moduleName] = methodName   (See {@tutorial server-configuration})
     *
     * @example
     * // module() - Return the Module Singleton:
     * const logger = core.module('logger');
     * logger.log('debug', 'This is a test message');
     * // Output: 'This is a test message' will appear in the logs (incl. console if enabled)
     *
     * @example
     * // module.count() - Return a Count of Loaded Modules:
     * const moduleCount = core.module.count('modules');
     * log('debug', 'My App > How many modules are loaded? It's - ' + moduleCount, {}, 'MY_APP_COUNT_DEM_MODS');
     * // Output: 10 (or however many modules have been loaded)
     *
     * @example
     * // module.load() - Loads a module:
     * core.module.load('module', 'logger', function(err, loggerModule){
     *     loggerModule.log('debug', 'My App > Hello!', {}, 'LOADED_MOD');
     *     // Output: "My App > Hello!"
     * });
     *
     * @example
     *  // module.isLoaded() - Waits until module is loaded and then fulfills a Promise:
     *  core.module.isLoaded('cli').then(function IsLoadedPromiseThen(cliMod) {
     *    cliMod.register([
     *      {'cmd': 'drop-acid', 'params': 'mindset=happy', 'info': 'Takes you on a wild trip', 'fn': function (params) {
     *        core.emit('OH_SHIT_HE_DID_IT', {'command': 'start-trip', 'params': params});
     *      }},
     *    ]);
     *  }).catch(function IsLoadedPromiseFail(err) {
     *    log('error',
     *        'My App > He Failed. He's now in the psych ward',
     *        err, 'DROP_ACID_FAIL');
     *  });
     *
     * @example
     * // module.closeAll() - Scope is that it's being executed from within Core Module Internals
     * core.module.closeAll();
     * // Output in Logs: '20201201 00:00:00 (shutdown) All Modules Have Been Terminated'
     */
    module: function CoreGetMod(name, type) {
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
     * Is Server Ready?
     *
     * @memberof Server.Modules.Core
     * @name ready
     * @function
     * @param {function} callbackFn - Callback Function
     * @return {Promise} promise - A Promise
     *
     * @description
     * This method waits until the server becomes Active and then executes upon a Promise, providing the Core
     * Module / Application Server Singleton as the sole parameter within the Promise's Then function. If the server
     * is already active it will immediately resolve the promise.
     *
     * @example
     * // Check if server is ready (Only required when calling Blackrock as a dependency):
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     core.ready().then(function(newCore) {
     *       const log = newCore.module('logger).log
     *       log('debug', 'My App > Let's get ready to rumble!!!', {}, 'MY_APP_RUMBLING_ALL_OVER_THE_SHOP');
     *       // Output: "My App > Let's get ready to rumble!!!" (In Console)
     *     });
     *   });
     *
     */
    ready: function CoreReady(callbackFn) {
      const self = this;
      // eslint-disable-next-line no-undef
      const myPromise = new Promise(function CoreReadyPromiseCb(resolve, reject) {
        const timeout = 1000; let timer = 0;
        const interval = setInterval(function CoreReadyPromiseInterval() {
          if (self.status === 'Active') {
            clearInterval(interval);
            if (callbackFn && typeof callbackFn === 'function') callbackFn(null, self);
            resolve(self);
          }
          if (timer >= timeout) {
            clearInterval(interval);
            if (callbackFn && typeof callbackFn === 'function') callbackFn(self, null);
            reject(self.reason);
          }
          timer += 10;
        }, 10);
      });
      if (!callbackFn) {
        return myPromise;
      } else {
        myPromise.then(function CoreReadyPromiseThen(pRes) {}).catch(function CoreReadyPromiseCatch(pErr) {});
      }
    },

    /**
     * Shutdown Server
     *
     * @memberof Server.Modules.Core
     * @function shutdown
     * @param {string} shutdownMsg - Shutdown Message
     * @function
     *
     * @description
     * This method will trigger a system shutdown. It is always available from a parent application
     * (where Blackrock has been included as a dependency). It is only available from app code
     * (initialisation method or route handlers) if it is enabled within within the server configuration file:
     * config['app-engine'].allow.shutdown = true
     *
     * @example
     * // Shutdown the server:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     core.shutdown();
     *     // Note: The server will begin shutting down now...
     *   });
     */
    shutdown: function CoreShutdown(shutdownMsg) {
      const self = this;
      if (self.status === 'Shutting Down' || self.status === 'Terminated') return;
      console.log('Blackrock Core > Initiating System Shutdown (' + shutdownMsg + ').');
      self.status = 'Shutting Down';
      self.module.closeAll(function CoreCloseModsCb() {
        self.exitProcess();
      });
    },

    /**
     * Start Event Loop
     *
     * @memberof Server.Modules.Core
     * @name startEventLoop
     * @private
     * @ignore
     * @function
     * @param {function} cb - Callback Function
     * @return {boolean} result - Result (True | False)
     * @todo Add a confirmation screen if a console user clicks the 'e' key before triggering a shutdown
     *
     * @description
     * This method is internal to the Core Module and can only be executed from within it. It initiates the
     * Application Server Event Loop (effectively preventing the Server process from terminating until it is
     * explicitly shutdown. When Blackrock is being accessed from the command-line as a blocking process, you
     * can trigger the shutdown of the Application Server by clicking the letter 'e' on your keyboard.
     *
     * NOTE: There is no confirmation or warning - the server will immediately begin to shutdown and you will not
     * be able to prevent it from doing so. Keep note of this. Ideally, run the server on a VM or in Docker where you're
     * not dealing directly with the shell anyway - or as a system daemon - See the Daemon Module.
     *
     * @example
     * core.startEventLoop(function(err, res) {
     *   if(!err) console.log('Event Loop Started');
     * });
     */
    startEventLoop: function CoreStartEvtLoop(cb) {
      const self = this;
      if (self.status === 'Shutting Down' || self.status === 'Terminated' || self.status === 'Active') {
        if (cb)  cb({'error': 'Invalid State', 'state': self.status}, null);
      } else {
        setTimeout(function CoreStartLoopTimeout() {
          // noinspection JSIncompatibleTypesComparison
          if (!self.status === 'Shutting Down' && !self.status === 'Terminated' && !self.status === 'Active') {
            log('startup',
                'Blackrock Core > System Loaded, Event Loop Executing. Press \'e\' key to shutdown.',
                {}, 'CORE_SYSTEM_LOADED');
          }
        }, 1000);
        if (!self.stopActivation) self.status = 'Active';
        if (cb)  cb(null, {'success': true});
        setInterval(function CoreStartLoopInterval() {}, 1000);
      }
      return true;
    },

    /**
     * Get Core Proxy Instance
     *
     * @memberof Server.Modules.Core
     * @name getCoreProxy
     * @function
     *
     * @param {object} myConfig - Configuration Object
     * @param {boolean} [myConfig.cfg] - Make the cfg() method available? True | False
     * @param {boolean} [myConfig.pkg] - Make the pkg() method available? True | False
     * @param {boolean} [myConfig.fetchBasePath] - Make the fetchBasePath() method available? True | False
     * @param {boolean} [myConfig.shutdown] - Make the shutdown() method available? True | False
     * @param {boolean} [myConfig.globals] - Make the Core Globals Singleton available? True | False
     * @param {object} myConfig.modules - An object of modules to make available
     * @param {array} [myConfig.modules.cli] - An array of method names to enable for the CLI Module
     * @param {array} [myConfig.modules.daemon] - An array of method names to enable for the Daemon Module
     * @param {array} [myConfig.modules.errorhandler] - An array of method names to enable for the ErrorHandler Module
     * @param {array} [myConfig.modules.farm] - An array of method names to enable for the Farm Module
     * @param {array} [myConfig.modules.generator] - An array of method names to enable for the Generator Module
     * @param {array} [myConfig.modules.i18n] - An array of method names to enable for the i18n Module
     * @param {array} [myConfig.modules.installer] - An array of method names to enable for the Installer Module
     * @param {array} [myConfig.modules.jobs] - An array of method names to enable for the Jobs Module
     * @param {array} [myConfig.modules.logger] - An array of method names to enable for the Logger Module
     * @param {array} [myConfig.modules.router] - An array of method names to enable for the Router Module
     * @param {array} [myConfig.modules.sandbox] - An array of method names to enable for the Sandbox Module
     * @param {array} [myConfig.modules.utilities] - An array of method names to enable for the Utilities Module
     * @param {array} [myConfig.modules.validate] - An array of method names to enable for the Validate Module
     * @param {array} [myConfig.modules.http] - An array of method names to enable for the HTTP Interface
     * @param {array} [myConfig.modules.websockets] - An array of method names to enable for the WebSockets Module
     * @param {array} [myConfig.modules.axon] - An array of method names to enable for the Axon Module
     * @param {array} [myConfig.modules.nanomsg] - An array of method names to enable for the NanoMSG Module
     * @param {array} [myConfig.modules.ssh] - An array of method names to enable for the SSH Module
     * @param {array} [myConfig.modules.zeromq] - An array of method names to enable for the ZeroMQ Module
     * @param {Server.Modules.AppEngine.App} app - App Instance
     * @return {Server.Modules.Core.CoreProxy} coreProxyInstance - Core Proxy Instance
     *
     * @description
     * This method provides an instance of the CoreProxy Class that acts as a proxy between the Core Module Singleton
     * and app code, to ensure that the app only has limited access to the methods contained within the Core Module
     * This includes limited access to modules that are accessible via the child module() method and apps.
     * The method names defines within the myConfig[module] array can take one of three forms - a plain method name
     * (eg; "log"), a nested method name (eg; "csv.parse") or a method name with a constraint placed on the input
     * parameter (eg; "app(appName)").
     *
     * @example
     * const config = core.cfg();
     * const coreProxyInstance = core.getCoreProxy(config['app-engine'].allow);
     */
    getCoreProxy: function CoreGetCoreProxy(myConfig, app) {
      // noinspection JSValidateTypes,JSUnfilteredForInLoop
      /**
       * Blackrock Core Proxy Class
       *
       * @class Server.Modules.Core.CoreProxy
       * @augments Server.Modules.Core.Base
       *
       * @description
       * This is the Core Proxy Class. An instance of this class can be retrieved by calling
       * core.getCoreProxy() - passing in a Configuration Object describing what subset of the full Core
       * will be present within the CoreProxy, and the app Object for the app that the CoreProxy
       * will be provisioned to.
       *
       * @example
       * const config = core.cfg();
       * const coreProxyInstance = core.getCoreProxy(config['app-engine'].allow);
       */
      const CoreProxy = new Base().extend({
        constructor: function CoreProxy(cfg) {
          const self = this;

          /**
           * Optional Base Class
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name Base
           * @type {Server.Modules.Core.Base}
           */
          if (cfg.Base) self.Base = core.Base;

          /**
           * Optional Globals Singleton
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name globals
           * @type {Server.Modules.Core.globals}
           */
          if (cfg.globals) self.globals = core.globals;

          /**
           * Optional Shutdown() Method
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name shutdown
           * @function
           */
          if (cfg.shutdown) self.shutdown = core.shutdown;

          /**
           * Optional Cfg() Method
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name cfg
           * @function
           */
          if (cfg.cfg) self.cfg = core.cfg;

          /**
           * Optional Pkg() Method
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name pkg
           * @function
           */
          if (cfg.pkg) self.pkg = core.pkg;

          /**
           * Optional fetchBasePath() Method
           *
           * @memberof Server.Modules.Core.CoreProxy
           * @name fetchBasePath
           * @function
           */
          if (cfg.fetchBasePath) self.fetchBasePath = core.fetchBasePath;

          self.module()

          return self;
        },

        /**
         * Get Module Proxy
         *
         * @memberof Server.Modules.Core.CoreProxy
         * @name module
         * @function
         * @param {string} name - Module Name
         * @param {string} [myInterface=interface] - Set to 'interface' if requesting Interface, Else leave out
         * @return {Server.Modules.Core.Module|object} moduleProxyInstance - A proxy instance providing restricted access to the module
         *
         * @description
         * This method returns a Proxy Instance that provides configurable access to a module's methods.
         *
         * @example
         * const config = core.cfg();
         * const coreProxyInstance = core.getCoreProxy(config['app-engine'].allow);
         * const loggerModuleProxy = coreProxyInstance.module('logger');
         */
        module: function CoreProxyGetModule(name, myInterface) {
          let mods; let util = core.module('utilities');
          if (util.prop(config, 'app-engine.allow.modules')) mods = config['app-engine'].allow.modules;
          else mods = {};
          if (!mods) return {};
          const methods = mods[name]; const loadedMethods = {}; const fnNames = {};
          if (!methods) return {};
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
              if (fnNames[methodName] === 'appName') {
                const newApp = {}; const myApp = core.module(name, myInterface)[methodName](app);
                // eslint-disable-next-line guard-for-in
                for (const subMethod in myApp) {
                  // noinspection JSUnfilteredForInLoop
                  newApp[subMethod] = myApp[subMethod];
                }
                filteredMethods[methodName] = function CoreProxyModuleMethodHandler(appName) {
                  if (util.prop(config, 'app-engine.runtime.apps.allowExternalAppAccess') && appName) {
                    return core.module('app-engine').app(appName);
                  } else return newApp;
                };
              } else filteredMethods[methodName] = loadedMethods[methodName];
            }
            return filteredMethods;
          }
        },
      });
      return new CoreProxy(myConfig);
    }
  };

  /**
   * Get Module Count
   *
   * @public
   * @memberof Server.Modules.Core
   * @function module.count
   * @param {string} type - Module Type
   * @return {number} count - The Module Count
   *
   * @description
   * This is a simple method that tells you the number of modules or interfaces that are currently loaded.
   *
   * @example
   * // Return a Count of Loaded Modules (Calling a Dependency)
   * require('is-blackrock').init()
   *   .then(function(core) {
   *     const log = core.module('logger).log
   *     const moduleCount = core.module.count('modules');
   *     log('debug', 'My App > How many modules are loaded? It's - ' + moduleCount, {}, 'MY_APP_COUNT_DEM_MODS');
   *     // Output: 10 (or however many modules have been loaded)
   *   });
   *
   * @example
   * // Return the Module Singleton (From App Controller)
   * const ctrl = function() {};
   * ctrl.get = function(req, res) {
   *   const log = req,core.module('logger).log
   *   const moduleCount = req.core.module.count('modules');
   *   log('debug', 'My App > How many modules are loaded? It's - ' + moduleCount, {}, 'MY_APP_COUNT_DEM_MODS');
   *   // Output: 10 (or however many modules have been loaded). But take note - you must enable this within the server
   *   // config (config.appengine.allow.moduleCount = true).
   * }
   */
  corePrototype.module.count = function CoreCountMods(type) {
    if (type && type === 'interfaces') {
      return Object.keys(modules.interfaces).length;
    } else if (type && type === 'modules') {
      return Object.keys(modules).length - 1;
    } else {
      return 0;
    }
  };

  /**
   * Load Module
   *
   * @public
   * @memberof Server.Modules.Core
   * @function module.load
   * @param {string} type - Module Type
   * @param {string} moduleName - Module Name
   * @param {function} [cb] - Callback Function
   * @return {object} output - Method Response
   *
   * @description
   * This method can only be called when accessing Blackrock as a Dependency or from within the Application Server
   * internals. It's sole purpose is to load the module that is specified into memory and to notify the callback
   * function when this has been completed - passing it the singleton for the module that was just loaded.
   *
   * @example
   * core.module.load('module', 'logger', function(err, loggerModule){
   *     loggerModule.log('debug', 'My App > Hello!', {}, 'LOADED_MOD');
   *     // Output: "My App > Hello!"
   * });
   */
  corePrototype.module.load = function CoreLoadMod(type, moduleName, cb) {
    if (core.status === 'Shutting Down' || core.status === 'Terminated') {
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
    if (moduleName.startsWith('.'))  return;
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
      log('debug', 'Core > ' + error.message, error.error, 'CORE_ERR_LOADING_MOD');
      if (cb) cb(error, null);
      return error;
    }
    const output = {success: true, message: '\'' + moduleName + '\' Module (Type: ' + type + ') Loaded Successfully'};
    if (type === 'module') output.module = modules[moduleName];
    if (type === 'interface') output.module = modules.interfaces[moduleName];
    log('debug', 'Core > ' + output.message, {}, 'CORE_MOD_LOADED');
    if (cb) cb(null, output);
    return output;
  };

  /**
   * Is Module Loaded?
   *
   * @public
   * @memberof Server.Modules.Core
   * @function module.isLoaded
   * @param {string} moduleName - Module Name
   * @param {function} [callbackFn] - Callback Function
   * @return {Promise} promise - Promise to Return
   * @todo Allow timeouts to be sourced from config for core.isLoaded
   *
   * @description
   * Calls callbackFn immediately, passing it the module singleton defined by moduleName where moduleName references a valid
   * module. Or if it cannot find the module, it waits until the module becomes available and calls callbackFn at that
   * point in time (with the requested module singleton).
   *
   * @example
   *  // Valid for when you're calling Blackrock as a dependency, or even as an app controller...
   *  core.module.isLoaded('cli').then(function IsLoadedPromiseThen(cliMod) {
   *    cliMod.register([
   *      {'cmd': 'drop-acid', 'params': 'mindset=happy', 'info': 'Takes you on a wild trip', 'fn': function (params) {
   *        core.emit('OH_SHIT_HE_DID_IT', {'command': 'start-trip', 'params': params});
   *      }},
   *    ]);
   *  }).catch(function IsLoadedPromiseFail(err) {
   *    log('error',
   *        'My App > He Failed. He's now in the psych ward',
   *        err, 'DROP_ACID_FAIL');
   *  });
   */
  corePrototype.module.isLoaded = function CoreIsModLoaded(moduleName, callbackFn) {
    // eslint-disable-next-line no-undef
    const myPromise = new Promise(function CoreIsModLoadedPromise(resolve, reject) {
      if (core.module(moduleName)) {
        if (callbackFn) callbackFn(null, core.module(moduleName));
        resolve(core.module(moduleName));
        return;
      }
      const timeout = 2000; let timer = 0;
      const interval = setInterval(function() {
        if (core.module(moduleName)) {
          clearInterval(interval);
          if (callbackFn) callbackFn(null, core.module(moduleName));
          resolve(core.module(moduleName));
        } else if (timer >= timeout) {
          clearInterval(interval);
          if (callbackFn) callbackFn({'error': 'Timed Out Checking That ' + moduleName + ' Was Loaded'}, null);
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('Timed Out Checking That ' + moduleName + ' Was Loaded');
        }
        timer += 1;
      }, 1);
    });
    if (!callbackFn) return myPromise;
    else myPromise.then(function CoreIsModLoadedPromiseThen(pRes) {}).catch(function CoreIsModLoadedPromiseCatch(pErr) {});
  };

  /**
   * Close Modules (Undocumented)
   *
   * @public
   * @memberof Server.Modules.Core
   * @function module.closeAll
   * @ignore
   * @param {function} cb - Callback Function
   *
   * @description
   * This method can only be accessed when accessing Blackrock as a dependency or from within the application server
   * internals (through modules and interfaces). When you call this method, it immediately triggers a graceful closure
   * of all modules and interfaces. This is one of the first steps that is called when you call core.shutdown()
   *
   * @example
   * // Scope: Being executed from within Core Module Internals
   * core.module.closeAll();
   * // Output in Logs: '20201201 00:00:00 (shutdown) All Modules Have Been Terminated'
   */
  corePrototype.module.closeAll = function CoreCloseMods(cb) {
    log('shutdown', 'Core > Attempting to Close All Open Modules.', {}, 'CORE_CLOSING_MODULES');
    let modCount = 0; let stdModCount = 0; let interfaceModCount = 0; let counter = 0; let timeoutTimer = 0;
    let timeout;
    // noinspection JSUnresolvedVariable
    if (config.core.timeouts.closeModules) timeout = config.core.timeouts.closeModules;
    else timeout = 2000;
    stdModCount += Object.keys(modules).length;
    stdModCount = stdModCount - 1;
    interfaceModCount += Object.keys(modules.interfaces).length;
    modCount = stdModCount + interfaceModCount;
    const interval = setInterval(function CoreCloseModsIntervalCb() {
      if (counter >= (modCount - 1)) {
        log('shutdown',
            'Core > Modules All Closed Successfully ('+counter+'/'+(modCount - 1)+').',
            {module: 'core'}, 'CORE_MODS_CLOSED');
        clearInterval(interval);
        cb(null, {success: true, message: 'Modules All Closed Successfully'});
        return;
      }
      if (timeoutTimer > timeout) {
        log('shutdown',
            'Blackrock Core > Module Closure Timed Out ('+counter+'/'+(modCount - 1)+' Closed Successfully).',
            {module: 'core'}, 'CORE_TIMEOUT_CLOSING_MODS');
        clearInterval(interval);
        cb({message: 'Module Shutdown Timed Out'}, null);
        return;
      }
      timeoutTimer += 500;
    }, 500);
    process.nextTick(function CoreCloseModsNextTickCb() {
      core.on('module-shut-down', function CoreCloseModsOnModShutdownCb() {
        counter ++;
      });
      core.emit('shutdown', 'All Modules Have Been Terminated');
    });
  };

  /**
   * Update Server Configuration
   *
   * @memberof Server.Modules.Core
   * @function cfg.update
   * @param {object} cfg - Configuration Object
   * @return {boolean} result - Result of Configuration Update
   *
   * @description
   * This method updates the server's live Configuration Object with a new set of data, replacing the data that
   * existed prior to the update within the live Configuration Object. It can only be called from modules within
   * the Application Server, or where Blackrock is being used as a dependency.
   *
   * @example
   * // Updates the live configuration of the application server:
   * require('is-blackrock').init()
   *   .then(function(core) {
   *     const result = core.cfg.update({'test': 'value'});
   *     if(result) console.log('Updated');
   *     else console.log('Update Failed');
   *   });
   */
  corePrototype.cfg.update = function CoreUpdateCfg(cfg) {
    if (!cfg) return false;
    config = cfg;
    return true;
  };

  // noinspection JSValidateTypeså
  const Core = new Base().extend(corePrototype);


  /**
   * @class Server.Modules.Core.Module
   * @augments Server.Modules.Core
   * @param {string} name - The name of the module being instantiated
   *
   * @description
   * This class provides a base class for all modules to inherit from. It contains common methods that all
   * modules inherit. It is only accessible from within the Application Server, or where Blackrock is accessed
   * as a Dependency.
   *
   * @example
   * const superMod = new core.Mod('SuperMod');
   */
  const Mod = new Core().extend({

    /**
     * Module Constructor
     *
     * @memberof Server.Modules.Core.Module
     * @private
     * @ignore
     * @function
     * @param {string} name - Name of Module
     *
     * @description
     * This is the constructor for the Module Class. It takes one parameter - the module name.
     *
     * @example
     * const superMod = new core.Mod('SuperMod');
     */
    constructor: function Module(name) {
      const self = this;
      if (name) {
        self.name = name;
        self.uber.on('shutdown', function ModuleOnShutdownCb() {
          self.unload();
        });
      }
    },

    /**
     * Unload Module
     *
     * @memberof Server.Modules.Core.Module
     * @name unload
     * @private
     * @ignore
     * @function
     *
     * @description
     * This method (when called) will unload the module - causing it to 'self destruct'.
     *
     * @example
     * const superMod = new core.Mod('SuperMod');
     * superMod.unload();
     */
    unload: function ModuleUnload() {
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
   * This class provides a base class for all interfaces to inherit from. It contains common methods that all
   * interfaces inherit. It is only accessible from within the Application Server, or where Blackrock is accessed
   * as a Dependency.
   *
   * Interfaces allow Blackrock to "talk" in the language of difference communications protocols. Amongst these are
   * HTTP(S), WebSockets, Axon, NanoMSG, SSH and ZeroMQ. This gives you the freedom to design the best service
   * architecture for your business - whether that be a single monolith, or a collection of microservices - which
   * you may own all of, or may own a few - perhaps subscribing to cloud versions of some of these services (Identity
   * would be a good example).
   *
   * @example
   * const superInterface = new core.Mod('SuperInterface');
   */
  const Interface = new Mod().extend({

    /**
     * Interface Constructor
     *
     * @memberof Server.Modules.Core.Interface
     * @private
     * @ignore
     * @function
     * @param {string} name - Name of Module
     *
     * @description
     * This is the constructor for the Interface Class. It takes one parameter - the interface name.
     *
     * @example
     * const superInterface = new core.Mod('SuperInterface');
     */
    constructor: function Interface(name) {
      const self = this;
      self.name = name;
      self.uber.uber.on('shutdown', function InterfaceShutdownCb() {
        self.unload();
      });
    },

    /**
     * Instance Repository
     * @ignore
     */
    instances: {},

    /**
     * Start Interface Instances
     *
     * @memberof Server.Modules.Core.Interface
     * @name startInstances
     * @private
     * @ignore
     * @function
     *
     * @description
     * This method starts an interface's instances. It is an internal method that is normally only called from
     * within the Interface itself. The reason why we might want multiple instances of an interface active is
     * because Blackrock gives you the capability the launch more than one instance - where each listens to a
     * different port. This opens up all of the ports to you to use. Combined with the highly configurable Router
     * Module, you are able to route as many interface instances as you would like, listening on as many different
     * ports as you would like - with some being routed to the same app (like an HTTP + an SSH instance) and others
     * being routed to completely different apps running on the one Blackrock node.
     *
     * You could even drop a reverse proxy like haProxy (which has a great web UI when installed into the pfSense
     * firewall) in front of the Blackrock Server node and route different domains or even paths to the different
     * ports that are open, each pointing to a completely different app.
     *
     * @example
     * superInterface.startInstances();
     */
    startInstances: function InterfaceStartInstances() {
      const self = this;
      process.nextTick(function InterfaceStartInstancesNextTickCb() {
        const myName = self.name.toLowerCase();
        if (!core.cfg().interfaces || !core.cfg().interfaces[myName]) {
          log('debug',
              self.name + ' Interface > No interfaces defined in System Configuration File.',
              {name: self.name}, 'INTERFACE_NONE_DEFINED'); return;
        }
        if (!core.cfg().router || !core.cfg().router.instances) {
          log('error',
              self.name + ' Interface > Cannot start interface instances as there are no routers defined.',
              {name: self.name}, 'INTERFACE_NO_ROUTERS');
          return;
        }
        // eslint-disable-next-line guard-for-in
        for (const intfc in core.cfg().interfaces[myName]) {
          // noinspection JSUnfilteredForInLoop
          const cfg = core.cfg().interfaces[myName][intfc];
          // noinspection JSUnfilteredForInLoop
          if (self.instances[intfc]) {
            log('error',
                self.name +
                ' Interface > Attempting to load an interface instance that has already been loaded (' + intfc + ').',
                {name: self.name}, 'INTERFACE_INSTANCE_ALREADY_LOADED');
          } else if (!cfg.enabled || cfg.enabled !== true) {
            log('warning',
                self.name +
                // eslint-disable-next-line max-len
                ' Interface Module > Attempting to load an interface instance that is not enabled in the system configuration (' + intfc + ').',
                {name: self.name}, 'INTERFACE_INSTANCE_NOT_DEFINED');
          } else {
            // noinspection JSUnfilteredForInLoop
            self.startInstance(intfc);
          }
        }
      });
    },

    /**
     * Get List of Interface Instances
     *
     * @memberof Server.Modules.Core.Interface
     * @name list
     * @function
     * @return {array} instances - A List of Instances
     *
     * @description
     * This method returns a list of available instances for an interface.
     *
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
    list: function InterfaceListInstances() {
      const self = this;
      return Object.keys(self.instances);
    },

    /**
     * Get Interface Instance
     *
     * @memberof Server.Modules.Core.Interface
     * @name get
     * @function
     * @param {string} name - Instance Name
     * @return {object} instance - The Requested Instance
     *
     * @description
     * This method returns the requested instance from an interface.
     *
     * @example
     * // Returns an instance from an interface:
     * require('is-blackrock').init()
     *   .then(function(core) {
     *     const httpInterface = core.module('http', 'interface');
     *     const instance = httpInterface.get('default');
     *   });
     */
    get: function InterfaceGetInstance(name) {
      const self = this;
      if (!self.instances[name]) return false;
      else return self.instances[name];
    },

    /**
     * Unload Interface Instances
     *
     * @memberof Server.Modules.Core.Interface
     * @name unload
     * @private
     * @ignore
     * @function
     *
     * @description
     * This method calls the other Interface class method - closeInstances(). And then upon the success of this
     * method, it alerts the Application Server that the Interface has shutdown. And then it deletes itself.
     *
     * @example
     * const httpInterface = core.module('http', 'interface');
     * httpInterface.unload();
     * // The interface now shuts down and unloads itself
     */
    unload: function InterfaceUnload() {
      const self = this;
      self.closeInstances(function InterfaceUnloadCloseInstancesCb() {
        log('debug',
            self.name + ' Interface > Closing interface instances... Succeeded.',
            {name: self.name}, 'INTERFACE_INSTANCES_CLOSED');
        self.uber.emit('module-shut-down', self.name);
        quickDelete(self);
      });
    },

    /**
     * Close Interface Instances
     *
     * @memberof Server.Modules.Core.Interface
     * @name closeInstances
     * @private
     * @ignore
     * @function
     * @param {function} cb - Callback Function
     *
     * @description
     * This method forces the interface to close all active instances that are running within it.
     *
     * @example
     * superInterface.closeInstances(function(err, res){
     *     if(res) console.log('All Instances Closed');
     * })
     */
    closeInstances: function InterfaceCloseInstances(cb) {
      let totalInterfaces = 0; let interfacesClosed = 0;
      totalInterfaces += Object.keys(this.instances).length;
      for (const name in this.instances) {
        if (this.instances[name].server && this.instances[name].server.close) {
          this.instances[name].server.close(function InterfaceCloseInstancesCloseCb(err) {
            if (!err) interfacesClosed ++;
          });
        }
      }
      let counter = 0; const timeout = 5000;
      const interval = setInterval(function InterfaceCloseInstancesTimeout() {
        if (interfacesClosed >= totalInterfaces) {
          clearInterval(interval);
          cb(null, {success: true}); return;
        }
        if (counter >= timeout) {
          clearInterval(interval);
          cb({success: false}, null); return;
        }
        counter += 500;
      }, 500);
    },

  });

  /**
   * Core Module Singleton
   *
   * @type Server.Modules.Core
   * @instance
   *
   * @description
   * This is the core module singleton that is exported as the sole variable from the Core Module's main.js file. Where
   * Blackrock is being accessed as a dependency - this is the interface through which the host application will
   * communicate with the Blackrock Application Server - passing instructions and listening to events.
   *
   * @example
   * // This example is from the perspective of a host application:
   * const blackrock = require('is-blackrock');
   * blackrock.init().then(function(core){
   *   console.log('Server Status - ' + core.status);
   * }).catch(function(err){
   *   console.log('ERROR!');
   * });
   */
  core = module.exports = new Core();

  /**
   * Base Class Pointer Within Core Object
   *
   * @type Server.Modules.Core.Base
   */
  core.Base = Base;

  /**
   * Core Class Pointer Within Core Object
   *
   * @type Server.Modules.Core
   */
  core.Core = Core;

  /**
   * Mod Class Pointer Within Core Object
   *
   * @type Server.Modules.Core.Module
   */
  core.Mod = Mod;

  /**
   * Interface Class Pointer Within Core Object
   *
   * @type Server.Modules.Core.Interface
   */
  core.Interface = Interface;

}();
