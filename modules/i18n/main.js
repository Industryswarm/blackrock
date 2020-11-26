/*!
* Blackrock i18n Module
*
* Supports internationalisation and localisastion
* for Blackrock Services
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function i18nWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable, i18nLib;
	var basePath = __dirname + "/../../../../", serviceInstances = {};







	/**
	 * ===========================
	 * i18n Initialisation Methods
	 * ===========================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function i18nInit(coreObj){
		core = coreObj, log = core.module("logger").log;
		log("debug", "Blackrock i18n > Initialising...", {}, "I18N_INIT");
		mod = new core.Mod("i18n")
		i18nLib = require("./support/i18next.js");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupi18n();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup i18n
	 */
	pipelines.setupi18n = function i18nSetupPipeline(){
		return new core.Base().extend({
			constructor: function i18nSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function i18nSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function i18nSetupPipelinePipe() {
				log("debug", "Blackrock i18n > Server Initialisation Pipeline Created - Executing Now:", {}, "I18N_EXEC_INIT_PIPEINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.bindi18nMethods(evt); }),
					streamFns.createServiceInstances,
					op.map(evt => { if(evt) return streamFns.loadi18nResources(evt); }),
					op.map(evt => { if(evt) return streamFns.bindTranslator(evt); })
					
				);
				stream1.subscribe(function i18nSetupPipelineSubscribe(res) {
					null;
				});
			}
		});
	};










	/**
	 * =====================================
	 * i18n Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Bind i18n Methods
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindi18nMethods = function i18nBindi18nMethods(evt){

		// Primary API Methods:
		mod.init = function i18nExtInit(options, callback) { return i18nLib.init(options, callback); }
		mod.t = function i18nExtT(key) { return i18nLib.t(key); }
		mod.use = function i18nExtUse(module) { return i18nLib.use(module); }
		mod.exists = function i18nExtExists(key, options) { return i18nLib.exists(key, options); }
		mod.getFixedT = function i18nExtGetFixedT(lng, ns) { return i18nLib.getFixedT(lng, ns); }
		mod.changeLanguage = function i18nExtChangeLanguage(lng, callback) { return i18nLib.changeLanguage(lng, callback); }
		mod.loadNamespaces = function i18nExtLoadNamespaces(ns, callback) { return i18nLib.loadNamespaces(ns, callback); }
		mod.loadLanguages = function i18nExtLoadLanguages(lngs, callback) { return i18nLib.loadLanguages(lngs, callback); }
		mod.reloadResources = function i18nExtReloadResources() { return i18nLib.reloadResources(); }
		mod.setDefaultNamespace = function i18nExtSetDefaultNamespace(ns) { return i18nLib.setDefaultNamespace(ns); }
		mod.dir = function i18nExtDir(lng) { return i18nLib.dir(lng); }
		mod.format = function i18nExtFormat(data, format, lng) { return i18nLib.format(data, format, lng); }
		mod.createInstance = function i18nExtCreateInstance(options, callback) { return i18nLib.createInstance(options, callback); }
		mod.cloneInstance = function i18nExtCloneInstance(options) { return i18nLib.cloneInstance(options); }
		mod.on = function i18nExtOn(name, myFn) { return i18nLib.on(name, myFn); }
		mod.off = function i18nExtOff(name, myFn) { return i18nLib.off(name, myFn); }

		// Resource Handling API Methods:
		mod.getResource = function i18nExtGetResource(lng, ns, key, options) { return i18nLib.getResource(lng, ns, key, options); }
		mod.addResource = function i18nExtAddResource(lng, ns, key, value, options) { return i18nLib.addResource(lng, ns, key, value, options); }
		mod.addResources = function i18nExtAddResources(lng, ns, resources) { return i18nLib.addResources(lng, ns, resources); }
		mod.addResourceBundle = function i18nExtAddResourceBundle(lng, ns, resources, deep, overwrite) { return i18nLib.addResourceBundle(lng, ns, resources, deep, overwrite); }
		mod.hasResourceBundle = function i18nExtHasResourceBundle(lng, ns) { return i18nLib.hasResourceBundle(lng, ns); }
		mod.getDataByLanguage = function i18nExtGetDataByLanguage(lng) { return i18nLib.getDataByLanguage(lng); }
		mod.getResourceBundle = function i18nExtGetResourceBundle(lng, ns) { return i18nLib.getResourceBundle(lng, ns); }
		mod.removeResourceBundle = function i18nExtRemoveResourceBundle(lng, ns) { return i18nLib.removeResourceBundle(lng, ns); }

		// Custom Methods:
		mod.createServiceInstances = function i18nExtCreateServiceInstances(services, cb) {
			var servicesCount = services.length, serviceInstancesCreated = 0;
			for (var i = 0; i < services.length; i++) {
				serviceInstances[services[i]] = mod.createInstance({ fallbackLng: 'en', debug: false }, function(err, t) { serviceInstancesCreated ++; });
			}
			var interval = setInterval(function(){
				if(serviceInstancesCreated >= servicesCount) {
					clearInterval(interval); cb(null, { "success": true });
				}
			}, 10);
		}

		log("debug", "Blackrock i18n > [1] i18n Methods Bound", {}, "I18N_METHODS_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Create Service Instances
	 * @param {object} evt - The Request Event
	 */
	streamFns.createServiceInstances = function i18nCreateServiceInstances(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					var serviceList;
					var createTheServiceInstances = function i18nCreateTheServiceInstances() {
						mod.createServiceInstances(serviceList, function(err, res) {
							log("debug", "Blackrock i18n > [2] Created Service Instances...", {}, "I18N_CREATED_SRV_INST");
							observer.next(evt);
						});
					}
					try { serviceList = core.module("services").serviceList(); createTheServiceInstances(); } 
					catch(err) {
						core.on("SERVICES_BUILT_ROUTES_OBJ", function(sEvt) {
							setTimeout(function(){ serviceList = core.module("services").serviceList(); createTheServiceInstances(); }, 100);
						});			
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [2]) Load i18n Resources
	 * @param {object} evt - The Request Event
	 */
	streamFns.loadi18nResources = function i18nLoadi18nResources(evt){
		mod.init({
		  lng: 'es',
		  debug: false,
		  resources: {
		    en: {
		      translation: {
		        "IndustrySwarm Identity": "IndustrySwarm Identity"
		      }
		    },
		    fr: {
		      translation: {
		        "IndustrySwarm Identity": "Frenchy French French"
		      }
		    },
		    es: {
		      translation: {
		        "IndustrySwarm Identity": "Espanional"
		      }
		    },
		    to: {
		      translation: {
		        "IndustrySwarm Identity": "TONGGGGA"
		      }
		    }
		  }
		});
		log("debug", "Blackrock i18n > [3] Loading i18n Resources...", {}, "I18N_RESOURCES_LOADING");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Load i18n Resources & Bind Translator
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindTranslator = function i18nBindTranslator(evt){
		var http;
		if(core.module("http", "interface")){ 
			http = core.module("http", "interface"); 
			addHook();
		} else { 
			var onHttpFn = function i18nOnHttpFn(coreEvt) {
				core.off("Blackrock HTTP Interface", onHttpFn);
				http = core.module("http", "interface"); 
				addHook();
			}
			core.on("Blackrock HTTP Interface", onHttpFn);
		}
		var addHook = function i18nAddHook(){
			http.hook.add("*", "onOutgoingResponsePostRender", function(input, cb) {
				const $ = http.cheerio.load(input);
				$('*[i18n]').each(function( index ) {
					var innerText = $(this).text();
					innerText = mod.t(innerText, {lng: "fr"});
					$(this).text(innerText);
					$(this).removeAttr("i18n");
				});
				cb($.html());
			});
			log("debug", "Blackrock i18n > [4] i18n Translator Bound to HTTP Interface Module", {}, "I18N_TRANSLATOR_BOUND");
		}
		return evt;
	}







	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();