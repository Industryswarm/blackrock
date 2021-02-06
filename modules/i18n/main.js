!function i18nModuleWrapper() {
  let core; let mod; const pipelines = function() {}; let o = {};

  /**
   * Blackrock i18n Module
   *
   * @public
   * @class Server.Modules.i18n
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.i18n} module - The i18n Module Singleton
   *
   * @description This is the i18n Module of the Blackrock Application Server.
   * It provides industry standard internationalisation and localisation support.
   *
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function i18nModule(coreObj) {
    if (mod) return mod;
    core = coreObj; o.log = core.module('logger').log; mod = new core.Mod('i18n');
    o.log('debug', 'i18n > Initialising...', {module: mod.name}, 'I18N_INIT');
    o.i18nLib = require('./_support/i18next.js'); o.appInstances = {};
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };

  /**
   * (Internal > Pipeline [1]) Setup i18n Module
   *
   * @private
   * @memberof Server.Modules.i18n
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function i18nSetupPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.bindi18nMethods,
        pipelines.init.createAppInstances,
        pipelines.init.loadi18nResources,
        pipelines.init.bindTranslator

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Bind i18n Methods
   *
   * @private
   * @memberof Server.Modules.i18n
   * @function bindi18nMethods
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
  pipelines.init.bindi18nMethods = function i18nIPLBindi18nMethods(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      /**
       * Initialise i18n
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function init
       * @param {object} options - Options Object
       * @param {function} callback - Callback Function
       * @return {function} t - The t Function
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.init = function i18nExtInit(options, callback) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.init(options, callback);
      };

      /**
       * Translate Text
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function t
       * @param {string} key - Lookup Key for Translation
       * @return {string} translation - The translated text
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.t = function i18nExtT(key) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.t(key);
      };

      /**
       * Use (To be defined)
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function use
       * @param {*} module - To be defined
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.use = function i18nExtUse(module) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.use(module);
      };

      /**
       * Exists (To be defined)
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function exists
       * @param {string} key - Translation Lookup Key
       * @param {object} options - Options Object
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.exists = function i18nExtExists(key, options) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.exists(key, options);
      };

      /**
       * Get Fixed Translation (To be defined)
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function getFixedT
       * @param {*} lng - To be defined
       * @param {*} ns - To be defined
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getFixedT = function i18nExtGetFixedT(lng, ns) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.getFixedT(lng, ns);
      };

      /**
       * Change Language
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function changeLanguage
       * @param {string} lng - Language to Change To
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.changeLanguage = function i18nExtChangeLanguage(lng, callback) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.changeLanguage(lng, callback);
      };

      /**
       * Load Namespaces
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function loadNamespaces
       * @param {string|array} ns - Namespace(s) to Load
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.loadNamespaces = function i18nExtLoadNamespaces(ns, callback) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.loadNamespaces(ns, callback);
      };

      /**
       * Load Languages
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function loadLanguages
       * @param {string|array} lngs - Namespace(s) to Load
       * @param {function} callback - Callback Function
       * @return {*} output - True for Success, False for Failure
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.loadLanguages = function i18nExtLoadLanguages(lngs, callback) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.loadLanguages(lngs, callback);
      };

      /**
       * Reload Resources
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function reloadResources
       * @return {*} output - True for Success, False for Failure
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.reloadResources = function i18nExtReloadResources() {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.reloadResources();
      };

      /**
       * Set Default Namespace
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function setDefaultNamespace
       * @param {string} ns - Namespace to Set as Default
       * @return {*} output - True for Success, False for Failure
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.setDefaultNamespace = function i18nExtSetDefaultNamespace(ns) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.setDefaultNamespace(ns);
      };

      /**
       * Dir (To be Defined)
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function dir
       * @param {string} lng - Language
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.dir = function i18nExtDir(lng) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.dir(lng);
      };

      /**
       * Format (To be Defined)
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function format
       * @param {*} data - To be defined
       * @param {*} format - To be defined
       * @param {string} lng - Language
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.format = function i18nExtFormat(data, format, lng) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.format(data, format, lng);
      };

      /**
       * Creates and Returns a New i18n Instance
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function createInstance
       * @param {object} options - Options Object
       * @param {function} callback - Callback Function
       * @return {object} t - Translation App Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.createInstance = function i18nExtCreateInstance(options, callback) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.createInstance(options, callback);
      };

      /**
       * Clones an i18n Instance
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function cloneInstance
       * @param {object} options - Options Object
       * @return {object} t - Translation App Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.cloneInstance = function i18nExtCloneInstance(options) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.cloneInstance(options);
      };

      /**
       * Listen for Event and Execute Function
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function on
       * @param {string} name - Event Name
       * @param {function} myFn - Function to Execute
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.on = function i18nExtOn(name, myFn) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.on(name, myFn);
      };

      /**
       * Remove Listener from Function
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function off
       * @param {string} name - Event Name
       * @param {function} myFn - Function to Remove Listener From
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.off = function i18nExtOff(name, myFn) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.off(name, myFn);
      };

      /**
       * Get Resource
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function getResource
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {string} key - Translation Key
       * @param {object} options - Options Object
       * @return {object} resource - Resource Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getResource = function i18nExtGetResource(lng, ns, key, options) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.getResource(lng, ns, key, options);
      };

      /**
       * Add Resource
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function addResource
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {string} key - Translation Key
       * @param {string} value - Translation Value (for this key)
       * @param {object} options - Options Object
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.addResource = function i18nExtAddResource(lng, ns, key, value, options) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.addResource(lng, ns, key, value, options);
      };

      /**
       * Add Resources
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function addResources
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {array} resources - Array of Resources
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.addResources = function i18nExtAddResources(lng, ns, resources) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.addResources(lng, ns, resources);
      };

      /**
       * Add Resource Bundle
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function addResourceBundle
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @param {array} resources - Array of Resources
       * @param {boolean} deep - To be defined
       * @param {boolean} overwrite - To be defined
       * @return {*} output - To be defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.addResourceBundle = function i18nExtAddResBundle(lng, ns, resources, deep, overwrite) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.addResourceBundle(lng, ns, resources, deep, overwrite);
      };

      /**
       * Has Resource Bundle
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function hasResourceBundle
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {boolean} result - True if the namespace has the specified language, else False
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.hasResourceBundle = function i18nExtHasResBundle(lng, ns) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.hasResourceBundle(lng, ns);
      };

      /**
       * Get Data By Language
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function getDataByLanguage
       * @param {string} lng - Language
       * @return {*} data - To be Defined
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getDataByLanguage = function i18nExtGetDataByLang(lng) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.getDataByLanguage(lng);
      };

      /**
       * Get Resource Bundle
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function getResourceBundle
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {object} resourceBundle - Requested Resource Bundle
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getResourceBundle = function i18nExtGetResBundle(lng, ns) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.getResourceBundle(lng, ns);
      };

      /**
       * Remove Resource Bundle
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function removeResourceBundle
       * @param {string} lng - Language
       * @param {string} ns - Namespace
       * @return {boolean} result - True if Successful, else False
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.removeResourceBundle = function i18nExtRemoveResBundle(lng, ns) {
        // noinspection JSUnresolvedFunction
        return o.i18nLib.removeResourceBundle(lng, ns);
      };

      /**
       * Create App Instances
       *
       * @public
       * @memberof Server.Modules.i18n
       * @function createAppInstances
       * @param {array} apps - Array of App Names
       * @param {function} cb - Callback Function
       *
       * @description
       * Creates an i18n translation instance for each of the specified Blackrock apps
       *
       * @example
       * Tbc...
       */
      mod.createAppInstances = function i18nExtCreateSrvInst(apps, cb) {
        const appsCount = apps.length; let appInstancesCreated = 0;
        for (let i = 0; i < apps.length; i++) {
          o.appInstances[apps[i]] = mod.createInstance({fallbackLng: 'en', debug: false},
              function i18nExtCreateSrvInstCb() {
            appInstancesCreated ++;
          });
        }
        const interval = setInterval(function i18nExtCreateSrvInstIntervalCb() {
          if (appInstancesCreated >= appsCount) {
            clearInterval(interval); cb(null, {'success': true});
          }
        }, 10);
      };

      o.log('debug', 'i18n > [1] i18n Methods Bound',
          {module: mod.name}, 'I18N_METHODS_BOUND');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Create App Instances
   *
   * @private
   * @memberof Server.Modules.i18n
   * @function createAppInstances
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
  pipelines.init.createAppInstances = function i18nModuleCreateAppInst(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function i18nModuleCreateAppInstOp(observer, evt) {
      let appList;
      const createTheAppInstances = function i18nModuleCreateTheAppInstances() {
        mod.createAppInstances(appList, function i18nModuleCreateAppInstCbOne() {
          o.log('debug', 'i18n > [2] Created App Instances...',
              {module: mod.name}, 'I18N_CREATED_APP_INST');
          observer.next(evt);
        });
      };
      try {
        // noinspection JSUnresolvedFunction
        appList = core.module('app-engine').appList();
        createTheAppInstances();
      } catch (err) {
        core.on('APPS_BUILT_ROUTES_OBJ', function i18nModuleCreateAppInstOnEvt() {
          setTimeout(function i18nModuleCreateAppInstTimeout() {
            // noinspection JSUnresolvedFunction
            appList = core.module('app-engine').appList();
            createTheAppInstances();
          }, 100);
        });
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Load i18n Resources
   *
   * @private
   * @memberof Server.Modules.i18n
   * @function loadi18nResources
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
  pipelines.init.loadi18nResources = function i18nLoadi18nResources(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function i18nLoadi18nResourcesOp(observer, evt) {
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
      o.log('debug', 'i18n > [3] Loading i18n Resources...',
          {module: mod.name}, 'I18N_RESOURCES_LOADING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Load i18n Resources & Bind Translator
   *
   * @private
   * @memberof Server.Modules.i18n
   * @function bindTranslator
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
  pipelines.init.bindTranslator = function i18nBindTranslator(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function i18nBindTranslatorOp(observer, evt) {
      let http;
      const addHook = function i18nBindTranslatorOpAddHook() {
        http.hook.add('*', 'onOutgoingResponsePostRender', function i18nBindTranslatorOpAddHookInner(input, cb) {
          const $ = http.cheerio.load(input);
          $('*[i18n]').each(function i18nBindTranslatorOpEach() {
            let innerText = $(this).text();
            innerText = mod.t(innerText, {lng: 'fr'});
            $(this).text(innerText);
            $(this).removeAttr('i18n');
          });
          cb($.html());
        });
        o.log('debug',
            'i18n > [4] i18n Translator Bound to HTTP Interface Module',
            {module: mod.name}, 'I18N_TRANSLATOR_BOUND');
      };
      if (core.module('http', 'interface')) {
        http = core.module('http', 'interface');
        addHook();
      } else {
        const onHttpFn = function i18nBindTranslatorOpOnHttpFn() {
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
