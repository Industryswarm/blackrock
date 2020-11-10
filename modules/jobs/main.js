/*!
* Blackrock Jobs Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function JobsWrapper(undefined) {







	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, queue = [], recurring = {}, pipelines = {}, streamFns = {}, recurringFns = {};








	/**
	 * ===========================
	 * Jobs Initialisation Methods
	 * ===========================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function JobsInit(coreObj){
		core = coreObj, mod = new core.Mod("Jobs"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Jobs > Initialising...", {}, "JOBS_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupJobs();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Error Handler
	 */
	pipelines.setupJobs = function JobsSetupPipeline(){
		return new core.Base().extend({
			constructor: function JobsSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function JobsSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function JobsSetupPipelinePipe() {
				log("debug", "Blackrock Jobs > Server Initialisation Pipeline Created - Executing Now:", {}, "JOBS_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupIntervals(evt); }),
					op.map(evt => { if(evt) return streamFns.processQueue(evt); }),
					streamFns.setupJobEndpoints,

					// Fires once per Job Endpoint Request:
					op.map(evt => { if(evt) return streamFns.addJobToQueue(evt); }),
					op.map(evt => { if(evt) return streamFns.removeJobFromQueue(evt); }),
					op.map(evt => { if(evt) return streamFns.executeJob(evt); })
					
				);
				stream1.subscribe(function JobsSetupPipelineSubscribe(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =========================================
	 * Jobs Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =========================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Intervals
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupIntervals = function JobsSetupIntervals(evt){
		if(core.cfg().jobs && core.cfg().jobs.queue && core.cfg().jobs.queue.interval) { evt.interval = core.cfg().jobs.queue.interval; }
		else { evt.interval = 500; }
		if(core.cfg().jobs && core.cfg().jobs.queue && core.cfg().jobs.queue.jobsPerInterval) { evt.jobsPerInterval = core.cfg().jobs.queue.jobsPerInterval; }
		else { evt.jobsPerInterval = 5; }
		log("debug", "Blackrock Jobs > [1] Set Up The Intervals", {}, "JOBS_SETUP_INTERVALS");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Process Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.processQueue = function JobsProcessQueue(evt){
		log("debug", "Blackrock Jobs > [2] Created 'Process Queue' Method w/ Indefinite Interval. Processing Queue Now...", {}, "JOBS_CREATED_QUEUE");
		var iterateThroughQueue = function JobsIterateThroughQueue() {
			setInterval(function JobsIterateThroughQueueInterval(){
				if(queue.length > 0) {
					for (var i = 0; i < evt.jobsPerInterval; i++) {
						var queueItem = queue.shift();
						if(queueItem && queueItem.fn && queueItem.input) { queueItem.fn(queueItem.input); }
						else if (queueItem && queueItem.fn && !queueItem.input) { queueItem.fn(); }
					}
				}
			}, evt.interval);
		}();
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Add & Remove Job Endpoints
	 * @param {observable} source - The Source Observable
	 */
	streamFns.setupJobEndpoints = function JobsSetupJobEndpoints(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					var add = function JobsAddJob(definition, fn, input){
						var msg = { 
							action: "add",
							input: {
								definition: definition, 
								fn: fn, 
								input: input 
							}
						}
						observer.next(msg);
					}
					var remove = function JobsRemoveJob(id){
						var msg = { 
							action: "remove",
							input: {
								id: id
							}
						}
						observer.next(msg);
					}
					var execute = function JobsExecuteJob(id){
						var msg = {
							action: "execute",
							input: {
								id: id
							}
						}
						observer.next(msg);
					}
					evt.methods = {}, mod.jobs = {};
					evt.methods.add = mod.jobs.add = mod.add = add;
					evt.methods.remove = mod.jobs.remove = mod.remove = remove;
					evt.methods.execute = mod.jobs.execute = mod.execute = execute;
					log("debug", "Blackrock Jobs > [3] Setup the Jobs Module Endpoint Methods - 'add' and 'remove'", {}, "JOBS_ADD_REMOVE_BOUND");
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [4]) Add Job to Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.addJobToQueue = function JobsAddJobToQueue(evt){
		if(evt.action == "add") {
			if(core.cfg().jobs && (core.cfg().jobs.enabled != true || !core.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Add Job But Module Not Enabled", evt.input.definition, "JOBS_ERR_ADD_MOD_DISABLED");
				return false;
			}
			if(!evt.input.definition) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Definition Object Not Set", evt.input.definition, "JOBS_ERR_ADD_DEF_INVALID");
				return false;
			}
			if(evt.input.definition && !evt.input.definition.id) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Job ID Not Set", evt.input.definition, "JOBS_ERR_ADD_ID_NOT_SET");
				return false;
			}
			if(evt.input.definition && !evt.input.definition.name) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Job Name Not Set", evt.input.definition, "JOBS_ERR_ADD_NAME_NOT_SET");
				return false;
			}			
			if (evt.input.definition && evt.input.definition.type == "queue") {
				queue.push({definition: evt.input.definition, fn: evt.input.fn, input: evt.input.input});
				log("debug", "Blackrock Jobs > Job #"+evt.input.definition.id+" ("+evt.input.definition.name+") Queued Successfully", evt.input.definition, "JOBS_SINGLE_ADD_SUCCESSFUL");
				return true;
			} else if (evt.input.definition && evt.input.definition.type == "recurring") {
				if(!evt.input.definition.delay){
					log("error", "Blackrock Jobs > Attempted to Add Recurring Job But Delay Not Set", evt.input.definition, "JOBS_ERR_ADD_RECCURING_DELAY_NOT_SET");
					return false;
				}
				recurringFns[evt.input.definition.id] = {
					fn: evt.input.fn,
					input: evt.input.input
				}
				recurring[evt.input.definition.id] = setInterval(function JobsRecurringJobInterval(){
					if(evt.input.definition.local == true || (evt.input.definition.local == false && core.module("farm").isJobServer() == true))
						evt.input.fn(evt.input.input);
				}, evt.input.definition.delay)
				log("debug", "Blackrock Jobs > Recurring Job #" + evt.input.definition.id+" (" + evt.input.definition.name + ") Queued Successfully", evt.input.definition, "JOBS_RECURRING_ADD_SUCCESSFUL");
				return true;
			} else if (evt.input.definition && evt.input.definition.type == "schedule") {
				log("error", "Blackrock Jobs > Unsupported Definition Type", evt.input.definition, "JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED");
				return false;
			} else {
				log("error", "Blackrock Jobs > Unsupported Definition Type", evt.input.definition, "JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED");
				return false;
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Remove Job From Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.removeJobFromQueue = function JobsRemoveJobFromQueue(evt){
		if(evt.action == "remove") {
			var found = false;
			if(core.cfg().jobs && (core.cfg().jobs.enabled != true || !core.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Remove Job But Jobs Module Not Enabled", {}, "JOBS_ERR_REMOVE_MOD_DISABLED");
				return;
			}
			if(recurring[id]){
				clearInterval(recurring[id]);
				delete recurring[id];
				delete recurringFns[id];
				found = true;
				log("debug", "Blackrock Jobs > Job #" + id + " removed from recurring queue successfully", {}, "JOBS_RECURRING_REMOVE_SUCCESSFUL");
			} else {
				for (var i = 0; i < queue.length; i++) {
					if(queue[i].definition.id == id) {
						delete queue[i];
						found = true;
						log("debug", "Blackrock Jobs > Job #" + id + " removed from queue successfully", {}, "JOBS_SINGLE_REMOVE_SUCCESSFUL");
					}
				}
			}
			if(!found)
				log("error", "Blackrock Jobs > Could not find and remove Job #" + id, {}, "JOBS_REMOVE_ERR_INVALID_JOB_ID");
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Execute Job
	 */
	streamFns.executeJob = function JobsExecuteJob(evt){
		if(evt.action == "execute") {
			if(core.cfg().jobs && (core.cfg().jobs.enabled != true || !core.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Execute Job But Jobs Module Not Enabled", "JOBS_ERR_EXEC_MOD_DISABLED");
				return;
			}
			var fnInfo = recurringFns[evt.input.id];
			fnInfo.fn(fnInfo.input);
		}
		return evt;
	}








	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();