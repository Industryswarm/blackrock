/*!
* ISNode Blackrock Logger Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, fileStream, sinks = {};

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Logger"), ismod.log = log;
		ismod.unload = function(){
			ismod.log("debug","Logger Module > Closing any open logging connections and shutting down.");
			if(fileStream){ delete fileStream; isnode.emit("module-shut-down", "Logger"); } 
			else { isnode.emit("module-shut-down", "Logger"); }
		}
		setup();
		return ismod;
	}

	/**
	 * (Internal) Setup the module
	 */
	var setup = function(){
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
		return;
	}

	/**
	 * (External) Logs a message - sending them to all registered log bins
	 * @param {string} level - Defines severity of log message (info, internal-msg, incoming-msg, outgoing-msg, warning, error, fatal)
	 * @param {string} logMsg - Free text log message
	 * @param {object} attrObj - A JSON object containing meta-data attributes about the logged event
	 */
	var log = function(level, logMsg, attrObj){
		if(isnode.cfg().logger.enabled == true){
			if(isnode.cfg().logger.sinks.console && isnode.cfg().logger.sinks.console.enabled == true){
				sinks.console(level, logMsg, attrObj);
			}
			if(isnode.cfg().logger.sinks.file && isnode.cfg().logger.sinks.file.enabled == true && fileStream){
				sinks.file(level, logMsg, attrObj);
			}
			/*if(isnode.cfg().logger.sinks.elasticsearch && isnode.cfg().logger.sinks.elasticsearch.enabled == true){
				sinks.elasticsearch(level, logMsg, attrObj);
			}*/
		}
	}

	/**
	 * (Internal) Logs message to console sink
	 * @param {string} level - Defines severity of log message (info, internal-msg, incoming-msg, outgoing-msg, warning, error, fatal)
	 * @param {string} logMsg - Free text log message
	 * @param {object} attrObj - A JSON object containing meta-data attributes about the logged event
	 */
	sinks.console = function(level,logMsg,attrObj){
		var currentDate = new Date();
		currentDate = currentDate.toISOString();
		if(isnode.cfg().logger.levels.includes(level)){
			console.log(currentDate + " (" + level + ") " + logMsg + "\n");
			if(attrObj && isnode.cfg().logger.logMetadataObjects == true)
				console.log(attrObj);
		}
	}

	/**
	 * (Internal) Logs message to file sink
	 * @param {string} level - Defines severity of log message (info, internal-msg, incoming-msg, outgoing-msg, warning, error, fatal)
	 * @param {string} logMsg - Free text log message
	 * @param {object} attrObj - A JSON object containing meta-data attributes about the logged event
	 */
	sinks.file = function(level,logMsg,attrObj){
		var currentDate = new Date();
		currentDate = currentDate.toISOString();
		if(isnode.cfg().logger.levels.includes(level)){
			fileStream.write(currentDate + " (" + level  +") " + logMsg + "\n\n");
			if(attrObj && isnode.cfg().logger.logMetadataObjects == true)
				fileStream.write(attrObj);
		}
	}

	/**
	 * (Internal) Logs message to ElasticSearch sink
	 * @param {string} level - Defines severity of log message (info, internal-msg, incoming-msg, outgoing-msg, warning, error, fatal)
	 * @param {string} logMsg - Free text log message
	 * @param {object} attrObj - A JSON object containing meta-data attributes about the logged event
	 */
	sinks.elasticsearch = function(level,logMsg,attrObj) {
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

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();