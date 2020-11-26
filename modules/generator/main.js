/*!
* Blackrock Generator Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function GeneratorWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable, fs = require("fs");







	/**
	 * ===============================
	 * Generator Initialisation Methods
	 * ===============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function GeneratorInit(coreObj){
		core = coreObj, mod = new core.Mod("Generator"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Generator > Initialising...", {}, "GENERATOR_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupGenerator();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Generator
	 */
	pipelines.setupGenerator = function GeneratorSetupPipeline(){
		return new core.Base().extend({
			constructor: function GeneratorSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function GeneratorSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function GeneratorSetupPipelinePipe() {
				log("debug", "Blackrock Generator > Server Initialisation Pipeline Created - Executing Now:", {}, "GENERATOR_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					streamFns.registerWithCLI,
					streamFns.listenToStart,
					streamFns.parseParamsAndCheckForService,
					streamFns.createNewServiceWithoutFile,
					streamFns.createNewServiceWithFile
					
				);
				stream1.subscribe(function GeneratorSetupPipelineSubscribe(res) {
					null;
				});
			}
		});
	};










	/**
	 * =====================================
	 * Generator Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Register With CLI
	 * @param {observable} source - The Source Observable
	 */
	streamFns.registerWithCLI = function GeneratorRegisterWithCLI(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Generator > [1] Generator registering with CLI...", {}, "GENERATOR_REGISTER_WITH_CLI");
					core.isLoaded("cli").then(function(cliMod) {
						cliMod.register([
							{"cmd": "create", "params": "[name] [file]", "info": "Create a new service", "fn": function(params) { core.emit("GENERATOR_INIT_GENERATOR", { "command": "create", "params": params }); }}
						]);
					}).catch(function(err) {
						log("error", "Blackrock Generator > Failed to register with CLI - CLI module not loaded", {}, "GENERATOR_CLI_MOD_NOT_LOADED");
					});
					observer.next(evt);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [2]) Listen to Start Endpoint
	 * @param {observable} source - The Source Observable
	 */
	streamFns.listenToStart = function GeneratorPipelineFnsListenToStart(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Generator > [2a] Listener created for 'GENERATOR_INIT_GENERATOR' event", {}, "GENERATOR_LISTENER_CREATED");
					core.on("GENERATOR_INIT_GENERATOR", function GeneratorPipelineFns1ListenToStartStartGeneratorCallback(genParams){
						core.stopActivation = true;
						log("debug", "Blackrock Generator > [2b] 'GENERATOR_INIT_GENERATOR' Event Received", {}, "GENERATOR_LISTENER_EVT_RECEIVED");
						evt.command = genParams.command;
						evt.params = genParams.params;
						observer.next(evt);
					});
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Parse Params And Check For Service
	 * @param {observable} source - The Source Observable
	 */
	streamFns.parseParamsAndCheckForService = function GeneratorPipelineFnsParseParamsAndCheckForService(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.command == "create") {
						log("debug", "Blackrock Generator > [3] Parsing parameters and checking for service...", {}, "GENERATOR_PARSE_PARAMS");
						const params = evt.params.trim().split(" ");
						var serviceName = "", serviceFile = "";
						const servicePath = core.fetchBasePath("services");
						if(params[0]) { serviceName = params[0]; }
						if(params[1]) { serviceFile = params[1]; }
						if(!serviceName) {
						    console.log("You must specify a service name (and optionally a definition file)");
						    process.exit();
						}
						if(fs.existsSync(servicePath + "/" + serviceName)) {
						    console.log("Service (" + serviceName + ") Already Exists");
						    process.exit();
						}
						evt.servicePath = servicePath;
						evt.serviceName = serviceName;
						evt.serviceFile = serviceFile;
						observer.next(evt);
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [4]) Create New Service Without File
	 * @param {observable} source - The Source Observable
	 */
	streamFns.createNewServiceWithoutFile = function GeneratorPipelineFnsCreateNewServiceWithoutFile(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {

					// If service definition file provided go to next stage of pipeline:
					if(evt.serviceFile) {
						observer.next(evt);
						return;
					}

					// Create Root and First-Level Folder Set:
					var filesWritten = 0;
					log("debug", "Blackrock Generator > [4] Creating new service without definition file...", {}, "GENERATOR_CREATING_SERVICE_NO_FILE");
					fs.mkdirSync(evt.servicePath + "/" + evt.serviceName);
					const rootFolders = ["controllers", "html", "lib", "locale", "models", "test", "views"];
					for (var i = 0; i < rootFolders.length; i++) {
						fs.mkdirSync(evt.servicePath + "/" + evt.serviceName + "/" + rootFolders[i]);
						if(rootFolders[i] != "controllers" && rootFolders[i] != "views") {
							fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + rootFolders[i] + "/stub.txt", "Insert your " + rootFolders[i] + " into this folder", function (err) {
							  if (err) throw err;
							  filesWritten ++;
							});
						}
					}

					// Create Service JSON File:
					var serviceDefinition = {
						"name": evt.serviceName,
						"host": "www." + evt.serviceName + ".local",
						"basePath": "",
						"active": true
					};
					const def = JSON.stringify(serviceDefinition);
					fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "service.json", def, function (err) {
					  if (err) throw err;
					  filesWritten ++;
					});

					// Create Root Controller File:
					const ctrlFile = createControllerFile("controllers", "[Author]", { "get": { "viewFile": "home.mustache" }});
					fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "controllers/controller.js", ctrlFile, function (err) {
					  if (err) throw err;
					  filesWritten ++;
					});

					// Create Root View File:
					const viewFile = `<h1>Welcome to Your Sample Site</h1>
<p>This is your new Blackrock Service. Customise it as you see fit.</p>
					`;
					fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "views/home.mustache", viewFile, function (err) {
					  if (err) throw err;
					  filesWritten ++;
					});

					// Listener With Timeout Feature:
					const timeout = 1000; var timer = 0;
					var interval = setInterval(function(){
						if(filesWritten >= 8) {
							clearInterval(interval);
							console.log("Service (" + evt.serviceName + ") Created Successfully");
							process.exit();
						} else if (timer >= timeout) {
							clearInterval(interval);
							console.log("Timed Out Creating Service (" + evt.serviceName + ")");
							process.exit();
						}
						timer += 10;
					}, 10);
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [5]) Create New Service With File
	 * @param {observable} source - The Source Observable
	 */
	streamFns.createNewServiceWithFile = function GeneratorPipelineFnsCreateNewServiceWithFile(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {

					// Setup:
					var totalFiles = 0;
					var filesWritten = 0;
					log("debug", "Blackrock Generator > [5] Creating new service with definition file...", {}, "GENERATOR_CREATING_SERVICE_WITH_FILE");
					
					// Load Service Definition File:
					try {
						var serviceFile = require(evt.serviceFile);
					} catch(err) {
						console.log("Invalid service definition file provided");
						process.exit();
					}

					// Create Root and First-Level Folder Set:
					fs.mkdirSync(evt.servicePath + "/" + evt.serviceName);
					totalFiles += 5;
					const rootFolders = ["controllers", "html", "lib", "locale", "models", "test", "views"];
					for (var i = 0; i < rootFolders.length; i++) {
						fs.mkdirSync(evt.servicePath + "/" + evt.serviceName + "/" + rootFolders[i]);
						if(rootFolders[i] != "controllers" && rootFolders[i] != "views") {
							fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + rootFolders[i] + "/stub.txt", "Insert your " + rootFolders[i] + " into this folder", function (err) {
							  if (err) throw err;
							  filesWritten ++;
							});
						}
					}

					// Set Service JSON File Standard Parameters:
					var serviceDefinition = { "name": evt.serviceName };
					if(serviceFile.host) { serviceDefinition.host = serviceFile.host; }
					else { serviceDefinition.host = "www." + evt.serviceName + ".local"; }
					if(serviceFile.basePath) { serviceDefinition.basePath = serviceFile.basePath; }
					else { serviceDefinition.basePath = ""; }
					if(serviceFile.active) { serviceDefinition.active = serviceFile.active; }
					else { serviceDefinition.active = true; }

					// Create Service JSON File:
					totalFiles += 1;
					const def = JSON.stringify(serviceDefinition);
					fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "service.json", def, function (err) {
					  if (err) throw err;
					  filesWritten ++;
					});

					// Get More Basic Parameters:
					if(serviceFile.author) { var author = serviceFile.author; }
					else { var author = "[Author]" }

					// Define Timer Function:
					var timerFn = function GeneratorTimerFn(){
						const timeout = 1000; var timer = 0;
						var interval = setInterval(function(){
							if(filesWritten >= totalFiles) {
								clearInterval(interval);
								console.log("Service (" + evt.serviceName + ") Created Successfully");
								process.exit();
							} else if (timer >= timeout) {
								clearInterval(interval);
								console.log("Timed Out Creating Service (" + evt.serviceName + ")");
								process.exit();
							}
							timer += 10;
						}, 10);
					}

					// Check if Routes Not Present:
					if(!serviceFile.routes) {

						// Create Root Controller File:
						totalFiles += 1;
						const ctrlFile = createControllerFile("controllers", "[Author]", { "get": { "viewFile": "home.mustache" }});
						fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "controllers/controller.js", ctrlFile, function (err) {
						  if (err) throw err;
						  filesWritten ++;
						});

						// Create Root View File:
						const viewFile = `<h1>Welcome to Your Sample Site</h1>
<p>This is your new Blackrock Service. Customise it as you see fit.</p>
						`;
						totalFiles += 1;
						fs.writeFile(evt.servicePath + "/" + evt.serviceName + "/" + "views/home.mustache", viewFile, function (err) {
						  if (err) throw err;
						  filesWritten ++;
						});

						// Run Timer Function:
						timerFn();
					}

					// Check If Routes ARE Present And Generate Them:
					if(serviceFile.route) {
						countRouteFiles(serviceFile.route, function(err1, res1){
							if(err1) {
								console.log("Error Counting Route Files For Service (" + evt.serviceName + ") - " + err1.message);
								process.exit();
							}
							totalFiles += res1.fileCount;
							generateRouteLevel(serviceFile.route, function(err2, res2){
								if(err2) {
									console.log("Error Generating Routes For Service (" + evt.serviceName + ") - " + res2.err);
									process.exit();
								}
								filesWritten += res2.fileCount;
							});
							timerFn();
						});
						
					}

				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}








	/**
	 * ===============
	 * UTILITY METHODS
	 * ===============
	 */

	/**
	 * (Internal > Utility Methods) Create New Service With File
	 * @param {observable} source - The Source Observable
	 */
	var createControllerFile = function GeneratorUtilitiesCreateCtrlFile(path, author, verbs){

		var addVerb = function GeneratorUtilitiesCreateCtrlFileAddVerb(verb, viewFile) {
			var fileContent = `
	/**
	 * ` + verb.toUpperCase() + `
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.` + verb + ` = function(req, res){
		var context = {};
		res.render("` + viewFile + `", context);
	}


			`;
			return fileContent
		}

		var currentDate = new Date();
		var fullYear = currentDate.getFullYear();
		var ctrlFile = `/*!
* ` + path + `/controller.js
*
* Copyright (c) ` + fullYear + ` ` + author + `
*/

;!function(undefined) {

	var ctrl = {};


		`;

		for(var verb in verbs) {
			ctrlFile += addVerb(verb, verbs[verb].viewFile);
		}

		ctrlFile += `
	/**
	 * (ENTRY POINT FOR EXECUTION)
	 */
	module.exports = ctrl;
	
}();
		`;

		return ctrlFile;
	}

	/**
	 * (Internal > Utility Methods) Count Route Files
	 * @param {observable} source - The Source Observable
	 */
	var countRouteFiles = function GeneratorUtilitiesCountRouteFiles(routeLevel, callbackFn){
		var countDeep = function GeneratorUtilitiesCountDeep() {
			
		}
	}

	/**
	 * (Internal > Utility Methods) Parse & Generate Route Level
	 * @param {observable} source - The Source Observable
	 */
	var generateRouteLevel = function GeneratorUtilitiesParseGenRouteLevel(routeLevel, callbackFn){
	}





	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();