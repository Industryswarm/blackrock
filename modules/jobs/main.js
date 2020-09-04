/*!
* ISNode Blackrock Jobs Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log, queue = [], recurring = {}, jobs = {};

	/**
	 * (Constructor) Initialises The Module
	 *
	 * @param {object} isnodeObj - The Parent ISNode Object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Jobs"), log = isnode.module("logger").log;
		if(isnode.cfg().jobs && isnode.cfg().jobs.enabled == true) { processQueue(); }
		ismod.jobs = jobs;
		return ismod;
	}

	/**
	 * (External) Add New Job
	 *
	 * @param {object} definition - The Job Definition Object (child strings of "id", "name" and "type")
	 * @param {function} fn - The Job Function to Execute
	 * @param {object} input - Input Object for Job Function
	 */
	jobs.add = function(definition, fn, input){
		if(isnode.cfg().jobs && (isnode.cfg().jobs.enabled != true || !isnode.cfg().jobs.enabled)){
			log("error", "Jobs Module > Attempted to Add Job But Module Not Enabled", definition);
			return false;
		}
		if(!definition) {
			log("error", "Jobs Module > Attempted to Add Job But Definition Object Not Set", definition);
			return false;
		}
		if(definition && !definition.id) {
			log("error", "Jobs Module > Attempted to Add Job But Job ID Not Set", definition);
			return false;
		}
		if(definition && !definition.name) {
			log("error", "Jobs Module > Attempted to Add Job But Job Name Not Set", definition);
			return false;
		}
		if (definition && definition.type == "queue") {
			queue.push({definition: definition, fn: fn, input: input});
			log("debug", "Jobs Module > Job #"+definition.id+" ("+definition.name+") Queued Successfully", definition);
			return true;
		} else if (definition && definition.type == "recurring") {
			if(!definition.delay){
				log("error", "Jobs Module > Attempted to Add Recurring Job But Delay Not Set", definition);
				return false;
			}
			recurring[definition.id] = setInterval(function(){
				fn(input);
			}, definition.delay)
			log("debug", "Jobs Module > Recurring Job #"+definition.id+" ("+definition.name+") Queued Successfully", definition);
			return true;
		} else if (definition && definition.type == "schedule") {
			log("error", "Jobs Module > Unsupported Definition Type", definition);
			return false;
		} else {
			log("error", "Jobs Module > Unsupported Definition Type", definition);
			return false;
		}
	}

	/**
	 * (External) Remove Existing Job
	 *
	 * @param {string} id - ID of job to remove
	 */
	jobs.remove = function(id){
		if(isnode.cfg().jobs && (isnode.cfg().jobs.enabled != true || !isnode.cfg().jobs.enabled)){
			log("error", "Jobs Module > Attempted to Remove Job But Module Not Enabled", definition);
			return false;
		}
		if(recurring[id]){
			clearInterval(recurring[id]);
			delete recurring[recId];
			log("debug", "Jobs Module > Job #" + id + " removed from recurring queue successfully", definition);
			return true;
		} else {
			for (var i = 0; i < queue.length; i++) {
				if(queue[i].definition.id == id) {
					delete queue[i];
					log("debug", "Jobs Module > Job #" + id + " removed from queue successfully", definition);
					return true;
				}
			}
		}
		log("error", "Jobs Module > Could not find and remove Job #" + id);
		return false;
	}

	/**
	 * (Internal) Process Queue
	 */
	var processQueue = function(){
		if(isnode.cfg().jobs && isnode.cfg().jobs.queue && isnode.cfg().jobs.queue.interval)
			var interval = isnode.cfg().jobs.queue.interval;
		else
			var interval = 500; // Default Interval Value
		if(isnode.cfg().jobs && isnode.cfg().jobs.queue && isnode.cfg().jobs.queue.jobsPerInterval)
			var jobsPerInterval = isnode.cfg().jobs.queue.jobsPerInterval;
		else
			var jobsPerInterval = 5; // Default Interval Value		
		setInterval(function(){
			if(queue.length > 0) {
				for (var i = 0; i < jobsPerInterval; i++) {
					var queueItem = queue.shift();
					if(queueItem && queueItem.fn && queueItem.input)
						queueItem.fn(queueItem.input);
					else if (queueItem && queueItem.fn && !queueItem.input)
						queueItem.fn();
				}
			}
		}, interval);
		return;
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();