/*!
* Blackrock Identity Module
*
* Supports interfacing your Blackrock applications with the
* IndustrySwarm Identity Server (Self-Hosted or Cloud)
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function IdentityWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * ===============================
	 * Identity Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function IdentityInit(coreObj){
		core = coreObj, mod = new core.Mod("Identity"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Identity > Initialising...", {}, "IDENTITY_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupIdentity();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Identity
	 */
	pipelines.setupIdentity = function IdentitySetupPipeline(){
		return new core.Base().extend({
			constructor: function IdentitySetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function IdentitySetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function IdentitySetupPipelinePipe() {
				log("debug", "Blackrock Identity > Server Initialisation Pipeline Created - Executing Now:", {}, "IDENTITY_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.fetchSettings(evt); }),
					op.map(evt => { if(evt) return streamFns.setupStatus(evt); }),
					op.map(evt => { if(evt) return streamFns.setupBuildAuthorizeUri(evt); })
					
				);
				stream1.subscribe(function IdentitySetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Identity Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Fetch Settings
	 * @param {object} evt - The Request Event
	 */
	streamFns.fetchSettings = function IdentityFetchSettings(evt){
		evt.settings = core.globals.get("settings");
		log("debug", "Blackrock Identity > [1] Settings Fetched", {}, "IDENTITY_SETTINGS_FETCHED");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Setup Status Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupStatus = function IdentitySetupStatus(evt){
		mod.status = function IdentityStatus(inputObject, cb){
			var httpClient = core.module("http", "interface").client;
			if(!evt.settings["IDENTITY_BASE_URI"]) {
				cb({
					success: false,
					code: "STATUS_MISSING_SETTINGS",
					message: "Unable to retrieve the Identity Provider's Base URI."
				}, null);
				return;
			}
			httpClient.get(settings["IDENTITY_BASE_URI"] + "/api/v1/status", function IdentityStatusCallback(httpErr, httpRes) {
				if(!httpRes || !httpRes.data.success) {
					cb({
						success: false,
						code: "IDENTITY_SERVICE_DOWN",
						message: "The identity service is currently down."
					}, null);
					return;						
				} else {
					cb(null, {
						success: true,
						code: "IDENTITY_SERVICE_UP",
						message: "The identity service is currently up."
					});
					return;							
				}
			});
		}
		log("debug", "Blackrock Identity > [2] 'status' Method Is Now Setup", {}, "IDENTITY_STATUS_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Build Authorize Uri Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupBuildAuthorizeUri = function IdentitySetupBuildAuthorizeUri(evt){
		mod.buildAuthorizeUri = function IdentityBuildAuthorizeUri(inputObject, cb){
			var scope = inputObject.scope;
			scope = encodeURIComponent(scope);
			var responseType = "code";
			var state = core.module("utilities").randomString(18);
			if(!evt.settings["IDENTITY_BASE_URI"] || !evt.settings["IDENTITY_CLIENT_ID"] || !evt.settings["IDENTITY_REDIRECT_URI"]) {
				cb({
					success: false,
					code: "BUILDAUTH_MISSING_SETTINGS",
					message: "Unable to retrieve the Identity Provider's Base URI, Client ID or this application's redirect URI."
				}, null);
				return;					
			}
			var identityRedirectUri = encodeURIComponent(settings["IDENTITY_REDIRECT_URI"]);
			var authUri = "";
			authUri += evt.settings["IDENTITY_BASE_URI"] + "/web/authorize?";
			authUri += "client_id=" + evt.settings["IDENTITY_CLIENT_ID"] + "&";
			authUri += "response_type=" + responseType + "&";
			authUri += "redirect_uri=" + identityRedirectUri + "&";
			authUri += "scope=" + scope + "&";
			authUri += "state=" + state;
			var headers = {"Content-Type": "application/x-www-form-urlencoded"};
			cb(null, {
				success: true,
				code: "AUTH_URI_GENERATED",
				message: "Authentication URI Generated Successfully.",
				result: {
					uri: authUri,
					clientId: settings["IDENTITY_CLIENT_ID"],
					responseType: responseType,
					redirectUriEncoded: identityRedirectUri,
					scopeEncoded: scope,
					state: state
				}
			});
		}
		log("debug", "Blackrock Identity > [3] 'buildAuthorizeUri' Method Is Now Setup", {}, "IDENTITY_BUILD_AUTH_BOUND");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [x]) x
	 * @param {object} evt - The Request Event
	 */
	/*streamFns.setupX = function IdentitySetupX(evt){
		mod.X = function IdentityX(inputObject, cb){
			return;
		}
		log("debug", "Blackrock Identity > [x] 'X' Method Is Now Setup");
		return evt;
	}*/

	/**
	 * (Internal > Stream Methods [x]) x
	 * @param {object} evt - The Request Event
	 */
	/*streamFns.setupX = function(evt){
		mod.X = function(inputObject, cb){
		}
		log("debug", "Blackrock Identity > [x] 'X' Method Is Now Setup");
		return evt;
	}*/

	/**
	 * (Internal > Stream Methods [x]) x
	 * @param {object} evt - The Request Event
	 */
	/*streamFns.setupX = function(evt){
		mod.X = function(inputObject, cb){
		}
		log("debug", "Blackrock Identity > [x] 'X' Method Is Now Setup");
		return evt;
	}*/

	/**
	 * (Internal > Stream Methods [x]) x
	 * @param {object} evt - The Request Event
	 */
	/*streamFns.setupX = function(evt){
		mod.X = function(inputObject, cb){
		}
		log("debug", "Blackrock Identity > [x] 'X' Method Is Now Setup");
		return evt;
	}*/

	/**
	 * (Internal > Stream Methods [x]) x
	 * @param {object} evt - The Request Event
	 */
	/*streamFns.setupX = function(evt){
		mod.X = function(inputObject, cb){
		}
		log("debug", "Blackrock Identity > [x] 'X' Method Is Now Setup");
		return evt;
	}*/










	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();