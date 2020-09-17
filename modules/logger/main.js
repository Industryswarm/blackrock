/*!
* ISNode Blackrock Logger Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {






	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, fileStream, sinks = {}, log, pipelines = {}, utils = {}, streamFns = {}, lib, rx, op, Observable;







	/**
	 * =============================
	 * Logger Initialisation Methods
	 * =============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Logger"), ismod.log = log = isnode.module("logger").log;
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var ISPipeline = pipelines.setupLogger();
		new ISPipeline({}).pipe();
		ismod.unload = function(){
			log("debug","Logger Module > Closing any open logging connections and shutting down.");
			if(fileStream){ delete fileStream; isnode.emit("module-shut-down", "Logger"); } 
			else { isnode.emit("module-shut-down", "Logger"); }
		}
		return ismod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Logger
	 */
	pipelines.setupLogger = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupFileStream(evt); }),
					op.map(evt => { if(evt) return streamFns.detectAvailableSinks(evt); }),
					streamFns.setupLogEndpoint,

					// Fires once per Log Event (Request) following server initialisation:
					op.map(evt => { if(evt) return streamFns.sendToConsole(evt); }),
					op.map(evt => { if(evt) return streamFns.sendToFile(evt); }),
					op.map(evt => { if(evt) return streamFns.sendToElasticSearch(evt); })
					
				);
				stream1.subscribe(function(res) {
					//console.log(res);
				});
			}
		});
	};










	/**
	 * =====================================
	 * Logger Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup File Stream
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupFileStream = function(evt){
		if(isnode.cfg().logger.sinks.file && isnode.cfg().logger.sinks.file.enabled == true){
			var fs = require("fs");
			if(isnode.cfg().logger.sinks.file.location)
				var location = isnode.cfg().logger.sinks.file.location;
			else
				var location = "./isnode.log";
			if (fs.existsSync(location)) {
			    fileStream = fs.createWriteStream(location, {flags:'a'});
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Detect Available Sinks
	 * @param {object} evt - The Request Event
	 */
	streamFns.detectAvailableSinks = function(evt){
		evt.sinks = {};
		if(isnode.cfg().logger.enabled == true){
			if(isnode.cfg().logger.sinks.console && isnode.cfg().logger.sinks.console.enabled == true){ evt.sinks.console = true; }
			if(isnode.cfg().logger.sinks.file && isnode.cfg().logger.sinks.file.enabled == true && fileStream){ evt.sinks.file = true; }
			if(isnode.cfg().logger.sinks.elasticsearch && isnode.cfg().logger.sinks.elasticsearch.enabled == true){ evt.sinks.elasticsearch = true; }
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Log Endpoint
	 * @param {observable} source - The Source Observable
	 */
	streamFns.setupLogEndpoint = function(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log = function(level, logMsg, attrObj){
						for(var sink in evt.sinks) { 
							evt.activeSink = sink;
							evt.logEvent = {
								"level": level,
								"logMsg": logMsg,
								"attrObj": attrObj
							}
							observer.next(evt);
						}
					}
					evt.log = ismod.log = log;
				},
				error(error) { observer.error(error); },
				/*complete() { observer.complete(); }*/
			});
			return () => subscription.unsubscribe();
		});
	}









	/**
	 * ==================================
	 * Logger Stream Processing Functions
	 * (Fires Once For Each Log Event)
	 * ==================================
	 */

	/**
	 * (Internal > Stream Methods [4]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToConsole = function(evt){
		var level = evt.logEvent.level, logMsg = evt.logEvent.logMsg, attrObj = evt.logEvent.attrObj;
		if(evt.activeSink == "console") {
			var currentDate = new Date();
			currentDate = currentDate.toISOString();
			if(isnode.cfg().logger.levels.includes(level)){
				console.log(currentDate + " (" + level + ") " + logMsg + "\n");
				if(attrObj && isnode.cfg().logger.logMetadataObjects)
					console.log(attrObj);
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToFile = function(evt){
		var level = evt.logEvent.level, logMsg = evt.logEvent.logMsg, attrObj = evt.logEvent.attrObj;
		if(evt.activeSink == "file") {
			var currentDate = new Date();
			currentDate = currentDate.toISOString();
			if(isnode.cfg().logger.levels.includes(level)){
				fileStream.write(currentDate + " (" + level  +") " + logMsg + "\n\n");
				if(attrObj && isnode.cfg().logger.logMetadataObjects == true)
					fileStream.write(attrObj);
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToElasticSearch = function(evt){
		var level = evt.logEvent.level, logMsg = evt.logEvent.logMsg, attrObj = evt.logEvent.attrObj;
		if(evt.activeSink == "elasticsearch") {
			var httpModule = isnode.module("http", "interface");
			if(!httpModule) { return; }
			var client = httpModule.client;
			var currentDate = new Date();
			currentDate = currentDate.toISOString();
			var indexBucket = currentDate.split("T");
			indexBucket = indexBucket[0];
			var index = isnode.cfg().logger.sinks.elasticsearch["base_index"] + "-" + indexBucket;
			var baseUri = isnode.cfg().logger.sinks.elasticsearch["base_uri"];
			if(isnode.cfg().logger.levels.includes(level)){
				var body = {
					"timestamp": currentDate,
					"level": level,
					"message": logMsg,
					"attributes": attrObj
				}
				if(attrObj && isnode.cfg().logger.logMetadataObjects == true) {
					body.attributes = attrObj;
				}
				client.request({
					"url": baseUri + "/" + index + "/_doc/",
					"method": "POST",
					"headers": {"Content-Type": "application/json" },
					"encoding": "utf8",
					"data": body
				}, function(httpErr, httpRes) { 
					return;
				});
			}
		}
		return evt;
	}








	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();