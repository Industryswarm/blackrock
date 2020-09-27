/*!
* ISNode Blackrock Jobs Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {







	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log, queue = [], recurring = {}, pipelines = {}, streamFns = {}, recurringFns = {};








	/**
	 * ===========================
	 * Jobs Initialisation Methods
	 * ===========================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Jobs"), ismod.log = log = isnode.module("logger").log;
		log("debug", "Blackrock Jobs > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var ISPipeline = pipelines.setupJobs();
		new ISPipeline({}).pipe();
		return ismod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Error Handler
	 */
	pipelines.setupJobs = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
				log("debug", "Blackrock Jobs > Server Initialisation Pipeline Created - Executing Now:");
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
				stream1.subscribe(function(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =========================================
	 * Error Handler Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =========================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Intervals
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupIntervals = function(evt){
		if(isnode.cfg().jobs && isnode.cfg().jobs.queue && isnode.cfg().jobs.queue.interval) { evt.interval = isnode.cfg().jobs.queue.interval; }
		else { evt.interval = 500; }
		if(isnode.cfg().jobs && isnode.cfg().jobs.queue && isnode.cfg().jobs.queue.jobsPerInterval) { evt.jobsPerInterval = isnode.cfg().jobs.queue.jobsPerInterval; }
		else { evt.jobsPerInterval = 5; }
		log("debug", "Blackrock Jobs > [1] Set Up The Intervals");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Process Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.processQueue = function(evt){
		log("debug", "Blackrock Jobs > [2] Created 'Process Queue' Method w/ Indefinite Interval. Processing Queue Now...");
		var iterateThroughQueue = function() {
			setInterval(function(){
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
	streamFns.setupJobEndpoints = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					var add = function(definition, fn, input){
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
					var remove = function(id){
						var msg = { 
							action: "remove",
							input: {
								id: id
							}
						}
						observer.next(msg);
					}
					var execute = function(id){
						var msg = {
							action: "execute",
							input: {
								id: id
							}
						}
						observer.next(msg);
					}
					evt.methods = {}, ismod.jobs = {};
					evt.methods.add = ismod.jobs.add = ismod.add = add;
					evt.methods.remove = ismod.jobs.remove = ismod.remove = remove;
					evt.methods.execute = ismod.jobs.execute = ismod.execute = execute;
					log("debug", "Blackrock Jobs > [3] Setup the Jobs Module Endpoint Methods - 'add' and 'remove'");
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
	streamFns.addJobToQueue = function(evt){
		if(evt.action == "add") {
			if(isnode.cfg().jobs && (isnode.cfg().jobs.enabled != true || !isnode.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Add Job But Module Not Enabled", evt.input.definition);
				return false;
			}
			if(!evt.input.definition) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Definition Object Not Set", evt.input.definition);
				return false;
			}
			if(evt.input.definition && !evt.input.definition.id) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Job ID Not Set", evt.input.definition);
				return false;
			}
			if(evt.input.definition && !evt.input.definition.name) {
				log("error", "Blackrock Jobs > Attempted to Add Job But Job Name Not Set", evt.input.definition);
				return false;
			}			
			if (evt.input.definition && evt.input.definition.type == "queue") {
				queue.push({definition: evt.input.definition, fn: evt.input.fn, input: evt.input.input});
				log("debug", "Blackrock Jobs > Job #"+evt.input.definition.id+" ("+evt.input.definition.name+") Queued Successfully", evt.input.definition);
				return true;
			} else if (evt.input.definition && evt.input.definition.type == "recurring") {
				if(!evt.input.definition.delay){
					log("error", "Blackrock Jobs > Attempted to Add Recurring Job But Delay Not Set", evt.input.definition);
					return false;
				}
				recurringFns[evt.input.definition.id] = {
					fn: evt.input.fn,
					input: evt.input.input
				}
				recurring[evt.input.definition.id] = setInterval(function(){
					if(evt.input.definition.local == true || (evt.input.definition.local == false && isnode.module("farm").isJobServer() == true))
						evt.input.fn(evt.input.input);
				}, evt.input.definition.delay)
				log("debug", "Blackrock Jobs > Recurring Job #" + evt.input.definition.id+" (" + evt.input.definition.name + ") Queued Successfully", evt.input.definition);
				return true;
			} else if (evt.input.definition && evt.input.definition.type == "schedule") {
				log("error", "Blackrock Jobs > Unsupported Definition Type", evt.input.definition);
				return false;
			} else {
				log("error", "Blackrock Jobs > Unsupported Definition Type", evt.input.definition);
				return false;
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Remove Job From Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.removeJobFromQueue = function(evt){
		if(evt.action == "remove") {
			var found = false;
			if(isnode.cfg().jobs && (isnode.cfg().jobs.enabled != true || !isnode.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Remove Job But Jobs Module Not Enabled");
				return;
			}
			if(recurring[id]){
				clearInterval(recurring[id]);
				delete recurring[id];
				delete recurringFns[id];
				found = true;
				log("debug", "Blackrock Jobs > Job #" + id + " removed from recurring queue successfully");
			} else {
				for (var i = 0; i < queue.length; i++) {
					if(queue[i].definition.id == id) {
						delete queue[i];
						found = true;
						log("debug", "Blackrock Jobs > Job #" + id + " removed from queue successfully");
					}
				}
			}
			if(!found)
				log("error", "Blackrock Jobs > Could not find and remove Job #" + id);
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Execute Job
	 */
	streamFns.executeJob = function(evt){
		if(evt.action == "execute") {
			if(isnode.cfg().jobs && (isnode.cfg().jobs.enabled != true || !isnode.cfg().jobs.enabled)){
				log("error", "Blackrock Jobs > Attempted to Execute Job But Jobs Module Not Enabled");
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