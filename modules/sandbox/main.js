/*!
* Blackrock Sandbox Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function SandboxWrapper(undefined) {








	/** Setup Global Variables for this Module */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable, basePath = __dirname + "/../..";










	/**
	 * ==============================
	 * Sandbox Initialisation Methods
	 * ==============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function SandboxInit(coreObj){
		core = coreObj, mod = new core.Mod("Sandbox"), log = core.module("logger").log;
		log("debug", "Blackrock Sandbox > Initialising...");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupSandbox();
		new Pipeline({}).pipe();
		return mod;
	}









	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */

	/**
	 * (Internal > Pipeline [1]) Setup Sandbox
	 */
	pipelines.setupSandbox = function SandboxSetupPipeline(){
		return new core.Base().extend({
			constructor: function SandboxSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function SandboxSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function SandboxSetupPipelinePipe() {
				log("debug_deep", "Blackrock Sandbox > Setup Sandbox Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.importLibraries(evt); }),
					streamFns.setupEndpoint,

					// Fires once per call to Execute Code on this Module:
					op.map(evt => { if(evt) return streamFns.createVM(evt); }),
					streamFns.getCode,
					streamFns.executeCode
					
				);
				stream1.subscribe(function SandboxSetupPipelineSubscribe(evt) {
					null;
				});
			}
		});
	};








	/**
	 * =====================================
	 * Sandbox Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Import Libraries
	 * @param {object} evt - The Request Event
	 */
	streamFns.importLibraries = function SandboxImportLibraries(evt){
		const { NodeVM } = require('./support/lib/main.js');
		evt.NodeVM = NodeVM;
		log("debug_deep", "Blackrock Sandbox > [1] Libraries Imported.");
		return evt;
	}

	/**
	 * (Internal > Stream  Methods [2] - Operator) Setup Code Execution Endpoint
	 */
	streamFns.setupEndpoint = function SandboxSetupEndpoint(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					evt.Execute = function SandboxExecute(options, cb) { 
						log("debug_deep", "Blackrock Sandbox > [3] Call Received to Execute Code", {options: options});
						var message = { 
							parentEvent: evt,
							options: options,
							cb: cb
						};
						observer.next(message); 
					}
					log("debug_deep", "Blackrock Sandbox > [2] Code Execution Endpoint Attached To This Module");
					mod.execute = evt.Execute;
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Create VM
	 * @param {object} evt - The Request Event
	 */
	streamFns.createVM = function SandboxCreateVM(evt){
		evt.vm = new evt.parentEvent.NodeVM({
		    console: 'inherit',
		    sandbox: {},
		    require: {
		        external: true,
		        builtin: ['fs', 'path', 'dgram'],
		        mock: {
		            fs: {
		                readFileSync() { return 'Nice try!'; }
		            }
		        }
		    }
		});
		log("debug_deep", "Blackrock Sandbox > [4] VM Created");
		return evt;
	}

	/**
	 * (Internal > Stream  Methods [4] - Operator) Get Code
	 */
	streamFns.getCode = function SandboxGetCode(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(evt.options.file) {
						var fs = require('fs');
						try { 
							var options = evt.options, cb = evt.cb, parentEvent = evt.parentEvent, vm = evt.vm;
							fs.readFile(evt.options.file, function SandboxGetCodeReadFileCallback(err, data) {
								var event = {
									options: options,
									cb: cb,
									parentEvent: parentEvent,
									vm: vm
								}
							    if(err) throw(err);
								event.options.code = "" + data;
								observer.next(event); 
								log("debug_deep", "Blackrock Sandbox > [4] Code Read From File"); 
							});
						} catch(e) { 
							observer.next(evt); 
							log("error", "Blackrock Sandbox > [4] Error Attempting to Read Code From File"); 
						}
					} else {
						observer.next(evt); 
						log("debug_deep", "Blackrock Sandbox > [4] No Need to Read Code From File - Provided Directly"); 						
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream  Methods [5] - Operator) Execute Code
	 */
	streamFns.executeCode = function SandboxExecuteCode(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					evt.ctrl = ObjectInSandbox = evt.vm.run(evt.options.code, basePath + "/modules/sandbox/main.js");
					evt.cb({ctrl: evt.ctrl, file: evt.options.file, i: evt.options.i});
					observer.next(evt);
					log("debug_deep", "Blackrock Sandbox > [5] Code Executed"); 
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}










	/**
	 * Export Module
	 */
	module.exports = init;
}();