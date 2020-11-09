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
		log("debug", "Blackrock i18n > Initialising...");
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
				log("debug", "Blackrock i18n > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.bindi18nMethods(evt); }),
					op.map(evt => { if(evt) return streamFns.loadi18nForServices(evt); })
					
				);
				stream1.subscribe(function i18nSetupPipelineSubscribe(res) {
					//console.log(res);
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
	 * (Internal > Stream Methods [1]) Fetch Settings
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindi18nMethods = function i18nBindi18nMethods(evt){

		// Primary API Methods:
		mod.init = function(options, callback) { return i18nLib.init(options, callback); }
		mod.t = function(key) { return i18nLib.t(key); }
		mod.use = function(module) { return i18nLib.use(module); }
		mod.exists = function(key, options) { return i18nLib.exists(key, options); }
		mod.getFixedT = function(lng, ns) { return i18nLib.getFixedT(lng, ns); }
		mod.changeLanguage = function(lng, callback) { return i18nLib.changeLanguage(lng, callback); }
		mod.loadNamespaces = function(ns, callback) { return i18nLib.loadNamespaces(ns, callback); }
		mod.loadLanguages = function(lngs, callback) { return i18nLib.loadLanguages(lngs, callback); }
		mod.reloadResources = function() { return i18nLib.reloadResources(); }
		mod.setDefaultNamespace = function(ns) { return i18nLib.setDefaultNamespace(ns); }
		mod.dir = function(lng) { return i18nLib.dir(lng); }
		mod.format = function(data, format, lng) { return i18nLib.format(data, format, lng); }
		mod.createInstance = function(options, callback) { return i18nLib.createInstance(options, callback); }
		mod.cloneInstance = function(options) { return i18nLib.cloneInstance(options); }
		mod.on = function(name, myFn) { return i18nLib.on(name, myFn); }
		mod.off = function(name, myFn) { return i18nLib.off(name, myFn); }

		// Resource Handling API Methods:
		mod.getResource = function(lng, ns, key, options) { return i18nLib.getResource(lng, ns, key, options); }
		mod.addResource = function(lng, ns, key, value, options) { return i18nLib.addResource(lng, ns, key, value, options); }
		mod.addResources = function(lng, ns, resources) { return i18nLib.addResources(lng, ns, resources); }
		mod.addResourceBundle = function(lng, ns, resources, deep, overwrite) { return i18nLib.addResourceBundle(lng, ns, resources, deep, overwrite); }
		mod.hasResourceBundle = function(lng, ns) { return i18nLib.hasResourceBundle(lng, ns); }
		mod.getDataByLanguage = function(lng) { return i18nLib.getDataByLanguage(lng); }
		mod.getResourceBundle = function(lng, ns) { return i18nLib.getResourceBundle(lng, ns); }
		mod.removeResourceBundle = function(lng, ns) { return i18nLib.removeResourceBundle(lng, ns); }

		log("debug", "Blackrock i18n > [1] i18n Methods Bound");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [1]) Fetch Settings
	 * @param {object} evt - The Request Event
	 */
	streamFns.loadi18nForServices = function i18nLoadi18nForServices(evt){
		log("debug", "Blackrock i18n > [2] i18n Loaded For Services");
		return evt;
	}







	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();