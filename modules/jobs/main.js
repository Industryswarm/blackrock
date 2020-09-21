/*!
* ISNode Blackrock Jobs Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {







	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log, queue = [], recurring = {}, pipelines = {}, streamFns = {};








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
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupIntervals(evt); }),
					op.map(evt => { if(evt) return streamFns.processQueue(evt); }),
					streamFns.setupJobEndpoints,

					// Fires once per Job Endpoint Request:
					op.map(evt => { if(evt) return streamFns.addJobToQueue(evt); }),
					op.map(evt => { if(evt) return streamFns.removeJobFromQueue(evt); })
					
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
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Process Queue
	 * @param {object} evt - The Request Event
	 */
	streamFns.processQueue = function(evt){
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
						evt.action = "add", evt.input = { definition: definition, fn: fn, input: input }
						observer.next(evt);
					}
					var remove = function(id){
						evt.action = "remove", evt.input = { id: id }
						observer.next(evt);
					}
					evt.methods = {}, ismod.jobs = {};
					evt.methods.add = ismod.jobs.add = add;
					evt.methods.remove = ismod.jobs.remove = remove;
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
				recurring[evt.input.definition.id] = setInterval(function(){
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
	 * (Internal) Export Module
	 */
	module.exports = init;
}();