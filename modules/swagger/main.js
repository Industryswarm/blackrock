/*!
* Blackrock Swagger (OpenAPI) Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function SwaggerWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ===============================
	 * Universe Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function SwaggerInit(coreObj){
		core = coreObj, mod = new core.Mod("Swagger"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Swagger > Initialising...", {}, "SWAGGER_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupSwagger();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Swagger
	 */
	pipelines.setupSwagger = function SwaggerSetupPipeline(){
		return new core.Base().extend({
			constructor: function SwaggerSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function SwaggerSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function SwaggerSetupPipelinePipe() {
				log("debug", "Blackrock Swagger > Server Initialisation Pipeline Created - Executing Now:", {}, "SWAGGER_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					streamFns.bindGetSwaggerJSON
					
				);
				stream1.subscribe(function SwaggerSetupPipelineSubscribe(res) {
					null;
				});
			}
		});
	};










	/**
	 * =====================================
	 * Swagger Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindGetSwaggerJSON = function SwaggerBindGetSwaggerJSON(evt){
		log("debug", "Blackrock Swagger > [1] Binding Fetch Swagger JSON Method", {}, "SWAGGER_BINDING_FETCH_JSON");
		mod.getJSON = function SwaggerGetSwaggerJSON(service, callbackFn) {
			var myPromise = new Promise(function(resolve, reject) {
				var json = {
					"swagger": "2.0",
					"info": {
						"description": core.services(service).cfg().description,
						"version": core.services(service).cfg().version,
						"title": core.services(service).cfg().name,
						"termsOfService": core.services(service).cfg().termsUrl,
						"contact": {
					  		"email": core.services(service).cfg().author.email
						},
						"license": {
					  		"name": core.services(service).cfg().license.name,
					  		"url": core.services(service).cfg().license.url
						}
					},
					"host": core.services(service).cfg().host,
					"basePath": core.services(service).cfg().basePath,
					"schemes": [
						"http",
						"https"
		  			],
		  			"paths": {}
				};
				if(core.cfg().interfaces.http.http.port != 80)
					json.host += ":" + core.cfg().interfaces.http.http.port;
				var routes = ismod.isnode.routes[ismod.isnode.services[service].host];
				for (var i = 0; i < routes.length; i++) {
					json.paths[routes[i].pattern] = {};
					if(routes[i].controller.get){
						json.paths[routes[i].pattern].get = {
							"summary": "Gets list or details of an object",
							"description": "",
							"consumes": [ "application/json" ],
							"produces": [ "application/json" ],
							"responses": {
								"200": {}
							}
						};
					}
					if(routes[i].controller.post){
						json.paths[routes[i].pattern].post = {
							"summary": "Creates a new object",
							"description": "",
							"consumes": [ "application/json" ],
							"produces": [ "application/json" ],
							"responses": {
								"200": {}
							}
						};
					}
					if(routes[i].controller.put){
						json.paths[routes[i].pattern].put = {
							"summary": "Updates an object",
							"description": "",
							"consumes": [ "application/json" ],
							"produces": [ "application/json" ],
							"responses": {
								"200": {}
							}
						};
					}
					if(routes[i].controller.delete){
						json.paths[routes[i].pattern].delete = {
							"summary": "Deletes an object",
							"description": "",
							"consumes": [ "application/json" ],
							"produces": [ "application/json" ],
							"responses": {
								"200": {}
							}
						};
					}
				}
				if(callbackFn) { callbackFn(null, json); }
				resolve(json);
			});
			if(!callbackFn) { return myPromise; } 
			else { 
				myPromise.then(function(pRes) { null; }).catch(function(pErr) { null; });
				return self; 
			}
		}
		return evt;
	}








	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();