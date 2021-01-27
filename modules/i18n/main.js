!function i18nModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {};
  let lib; let rx; let i18nLib; const serviceInstances = {};


  /**
   * Blackrock i18n Module
   *
   * @class Server.Modules.i18n
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.i18n} module - The i18n Module
   *
   * @description This is the i18n Module of the Blackrock Application Server.
   * It provides industry standard internationalisation and localisation support.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function i18nModuleConstructor(coreObj) {
    core = coreObj; log = core.module('logger').log;
    log('debug', 'Blackrock i18n Module > Initialising...', {}, 'I18N_INIT');
    mod = new core.Mod('i18n');
    i18nLib = require('./_support/i18next.js');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupi18nModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup i18n Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupi18nModule = function i18nModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function i18nModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function i18nModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function i18nModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock i18n Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'I18N_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        stream.pipe(

            // Fires once on server initialisation:
            streamFns.bindi18nMethods,
            streamFns.createServiceInstances,
            streamFns.loadi18nResources,
            streamFns.bindTranslator

        ).subscribe();
      },
    });
  };


  /**
   * i18n Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Bind i18n Methods
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindi18nMethods = function i18nModuleBindi18nMethods(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Initialise i18n
       * @memberof Server.Modules.i18n
       * @name init
       * @function
       * @param {object} options - Options Object
       * @param {function} callback - Callback Function
       * @return {function} t - The t Function
       */
      mod.init = function i18nModuleExtInit(options, callback) {
        return i18nLib.init(options, callback);
      };

      /**
       * Translate Text
       * @memberof Server.Modules.i18n
       * @name t
       * @function
       * @param {string} key - Lookup Key for Translation
       * @return {string} translation - The translated text
       */
      mod.t = function i18nModuleExtT(key) {
        return i18nLib.t(key);
      };

      /**
       * Use (To be defined)
       * @memberof Server.Modules.i18n
       * @name use
       * @function
       * @param {*} module - To be defined
       * @return {*} output - To be defined
       */
      mod.use = function i18nModuleExtUse(module) {
        return i18nLib.use(module);
      };

      /**
       * Exists (To be defined)
       * @memberof Server.Modules.i18n
       * @name exists
       * @function
       * @param {string} key - Translation Lookup Key
       * @param {object} options - Options Object
       * @return {*} output - To be defined
       */
      mod.exists = function i18nModuleExtExists(key, options) {
        return i18nLib.exists(key, options);
      };

      /**
       * Get Fixed Translation (To be defined)
       * @memberof Server.Modules.i18n
       * @name getFixedT
       * @function
       * @param {*} lng - To be defined
       * @param {*} ns - To be defined
       * @return {*} output - To be defined
       */
      mod.getFixedT = function i18nModuleExtGetFixedT(lng, ns) {
        return i18nLib.getFixedT(lng, ns);
      };

      /**
       * Change Language
       * @memberof Server.Modules.i18n
       * @name changeLanguage
       * @function
       * @param {string} lng - Language to Change To
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       */
      mod.changeLanguage = function i18nModuleExtChangeLanguage(lng, callback) {
        return i18nLib.changeLanguage(lng, callback);
      };

      /**
       * Load Namespaces
       * @memberof Server.Modules.i18n
       * @name loadNamespaces
       * @function
       * @param {string|array} ns - Namespace(s) to Load
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       */
      mod.loadNamespaces = function i18nModuleExtLoadNamespaces(ns, callback) {
        return i18nLib.loadNamespaces(ns, callback);
      };

      /**
       * Load Languages
       * @memberof Server.Modules.i18n
       * @name loadLanguages
       * @function
       * @param {string|array} lngs - Namespace(s) to Load
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       */
      mod.loadLanguages = function i18nModuleExtLoadLanguages(lngs, callback) {
        return i18nLib.loadLanguages(lngs, callback);
      };

      /**
       * Reload Resources
       * @memberof Server.Modules.i18n
       * @name reloadResources
       * @function
       * @return {*} output - True for Success, False for Failure
       */
      mod.reloadResources = function i18nModuleExtReloadResources() {
        return i18nLib.reloadResources();
      };

      /**
       * Set Default Namespace
       * @memberof Server.Modules.i18n
       * @name setDefaultNamespace
       * @function
       * @param {string} ns - Namespace to Set as Default
       * @return {*} output - True for Success, False for Failure
       */
      mod.setDefaultNamespace = function i18nModuleExtSetDefaultNamespace(ns) {
        return i18nLib.setDefaultNamespace(ns);
      };

      /**
       * Dir (To be Defined)
       * @memberof Server.Modules.i18n
       * @name dir
       * @function
       * @param {string} lng - Language
       * @return {*} output - To be defined
       */
      mod.dir = function i18nModuleExtDir(lng) {
        return i18nLib.dir(lng);
      };

      /**
       * Format (To be Defined)
       * @memberof Server.Modules.i18n
       * @name format
       * @function
       * @param {*} data - To be defined
       * @param {*} format - To be defined
       * @param {string} lng - Language
       * @return {*} output - To be defined
       */
      mod.format = function i18nModuleExtFormat(data, format, lng) {
        return i18nLib.format(data, format, lng);
      };

      /**
       * Creates and Returns a New i18n Instance
       * @memberof Server.Modules.i18n
       * @name createInstance
       * @function
       * @param {object} options - Options Object
       * @param {function} callback - Callback Function
       * @return {object} t - Translation Service Object
       */
      mod.createInstance = function i18nModuleExtCreateInstance(options, callback) {
        return i18nLib.createInstance(options, callback);
      };

      /**
       * Clones an i18n Instance
       * @memberof Server.Modules.i18n
       * @name cloneInstance
       * @function
       * @param {object} options - Options Object
       * @return {object} t - Translation Service Object
       */
      mod.cloneInstance = function i18nModuleExtCloneInstance(options) {
        return i18nLib.cloneInstance(options);
      };

      /**
       * Listen for Event and Execute Function
       * @memberof Server.Modules.i18n
       * @name on
       * @function
       * @param {string} name - Event Name
       * @param {function} myFn - Function to Execute
       * @return {*} output - To be defined
       */
      mod.on = function i18nModuleExtOn(name, myFn) {
        return i18nLib.on(name, myFn);
      };

      /**
       * Remove Listener from Function
       * @memberof Server.Modules.i18n
       * @name off
       * @function
       * @param {string} name - Event Name
       * @param {function} myFn - Function to Remove Listener From
       * @return {*} output - To be defined
       */
      mod.off = function i18nModuleExtOff(name, myFn) {
        return i18nLib.off(name, myFn);
      };

      /**
       * Get Resource
       * @memberof Server.Modules.i18n
       * @name getResource
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {string} key - Translation Key
       * @param {object} options - Options Object
       * @return {object} resource - Resource Object
       */
      mod.getResource = function i18nModuleExtGetResource(lng, ns, key, options) {
        return i18nLib.getResource(lng, ns, key, options);
      };

      /**
       * Add Resource
       * @memberof Server.Modules.i18n
       * @name addResource
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {string} key - Translation Key
       * @param {string} value - Translation Value (for this key)
       * @param {object} options - Options Object
       * @return {*} output - To be defined
       */
      mod.addResource = function i18nModuleExtAddResource(lng, ns, key, value, options) {
        return i18nLib.addResource(lng, ns, key, value, options);
      };

      /**
       * Add Resources
       * @memberof Server.Modules.i18n
       * @name addResources
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {array} resources - Array of Resources
       * @return {*} output - To be defined
       */
      mod.addResources = function i18nModuleExtAddResources(lng, ns, resources) {
        return i18nLib.addResources(lng, ns, resources);
      };

      /**
       * Add Resource Bundle
       * @memberof Server.Modules.i18n
       * @name addResourceBundle
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {array} resources - Array of Resources
       * @param {boolean} deep - To be defined
       * @param {boolean} overwrite - To be defined
       * @return {*} output - To be defined
       */
      mod.addResourceBundle = function i18nModuleExtAddResourceBundle(lng, ns, resources, deep, overwrite) {
        return i18nLib.addResourceBundle(lng, ns, resources, deep, overwrite);
      };

      /**
       * Has Resource Bundle
       * @memberof Server.Modules.i18n
       * @name hasResourceBundle
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {boolean} result - True if the namespace has the specified language, else False
       */
      mod.hasResourceBundle = function i18nModuleExtHasResourceBundle(lng, ns) {
        return i18nLib.hasResourceBundle(lng, ns);
      };

      /**
       * Get Data By Language
       * @memberof Server.Modules.i18n
       * @name getDataByLanguage
       * @function
       * @param {string} lng - Language
       * @return {*} data - To be Defined
       */
      mod.getDataByLanguage = function i18nModuleExtGetDataByLanguage(lng) {
        return i18nLib.getDataByLanguage(lng);
      };

      /**
       * Get Resource Bundle
       * @memberof Server.Modules.i18n
       * @name getResourceBundle
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {object} resourceBundle - Requested Resource Bundle
       */
      mod.getResourceBundle = function i18nModuleExtGetResourceBundle(lng, ns) {
        return i18nLib.getResourceBundle(lng, ns);
      };

      /**
       * Remove Resource Bundle
       * @memberof Server.Modules.i18n
       * @name removeResourceBundle
       * @function
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {boolean} result - True if Successful, else False
       */
      mod.removeResourceBundle = function i18nModuleExtRemoveResourceBundle(lng, ns) {
        return i18nLib.removeResourceBundle(lng, ns);
      };

      /**
       * Create Service Instances
       * @memberof Server.Modules.i18n
       * @name createServiceInstances
       * @function
       * @param {array} services - Array of Service Names
       * @param {function} cb - Callback Function
       *
       * @description
       * Creates an i18n translation instance for each of the specified Blackrock services
       */
      mod.createServiceInstances = function i18nModuleExtCreateServiceInstances(services, cb) {
        const servicesCount = services.length; let serviceInstancesCreated = 0;
        for (let i = 0; i < services.length; i++) {
          serviceInstances[services[i]] = mod.createInstance({fallbackLng: 'en', debug: false}, function() {
            serviceInstancesCreated ++;
          });
        }
        const interval = setInterval(function() {
          if (serviceInstancesCreated >= servicesCount) {
            clearInterval(interval); cb(null, {'success': true});
          }
        }, 10);
      };

      log('debug', 'Blackrock i18n Module > [1] i18n Methods Bound', {}, 'I18N_METHODS_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Create Service Instances
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createServiceInstances = function i18nModuleCreateServiceInstances(source) {
    return lib.rxOperator(function(observer, evt) {
      let serviceList;
      const createTheServiceInstances = function i18nModuleCreateTheServiceInstances() {
        mod.createServiceInstances(serviceList, function() {
          log('debug', 'Blackrock i18n Module > [2] Created Service Instances...', {}, 'I18N_CREATED_SRV_INST');
          observer.next(evt);
        });
      };
      try {
        serviceList = core.module('services').serviceList(); createTheServiceInstances();
      } catch (err) {
        core.on('SERVICES_BUILT_ROUTES_OBJ', function() {
          setTimeout(function() {
            serviceList = core.module('services').serviceList(); createTheServiceInstances();
          }, 100);
        });
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Load i18n Resources
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.loadi18nResources = function i18nModuleLoadi18nResources(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.init({
        lng: 'es',
        debug: false,
        resources: {
          en: {
            translation: {
              'IndustrySwarm Identity': 'IndustrySwarm Identity',
            },
          },
          fr: {
            translation: {
              'IndustrySwarm Identity': 'French French French',
            },
          },
          es: {
            translation: {
              'IndustrySwarm Identity': 'Espanional',
            },
          },
          to: {
            translation: {
              'IndustrySwarm Identity': 'TONGGGGA',
            },
          },
        },
      });
      log('debug', 'Blackrock i18n Module > [3] Loading i18n Resources...', {}, 'I18N_RESOURCES_LOADING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Load i18n Resources & Bind Translator
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindTranslator = function i18nModuleBindTranslator(source) {
    return lib.rxOperator(function(observer, evt) {
      let http;
      const addHook = function i18nModuleAddHook() {
        http.hook.add('*', 'onOutgoingResponsePostRender', function(input, cb) {
          const $ = http.cheerio.load(input);
          $('*[i18n]').each(function() {
            let innerText = $(this).text();
            innerText = mod.t(innerText, {lng: 'fr'});
            $(this).text(innerText);
            $(this).removeAttr('i18n');
          });
          cb($.html());
        });
        log('debug',
            'Blackrock i18n Module > [4] i18n Translator Bound to HTTP Interface Module',
            {}, 'I18N_TRANSLATOR_BOUND');
      };
      if (core.module('http', 'interface')) {
        http = core.module('http', 'interface');
        addHook();
      } else {
        const onHttpFn = function i18nModuleOnHttpFn() {
          core.off('Blackrock HTTP Interface', onHttpFn);
          http = core.module('http', 'interface');
          addHook();
        };
        core.on('Blackrock HTTP Interface', onHttpFn);
      }
      observer.next(evt);
    }, source);
  };
}();
