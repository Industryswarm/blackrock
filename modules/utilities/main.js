/*!
* ISNode Blackrock Utilities Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {








	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable, modules = {}, csv = {}, crypto = {};










	/**
	 * ================================
	 * Utilities Initialisation Methods
	 * ================================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnodeObj - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Utilities"), log = isnode.module("logger").log;
		isnode.on("updateLogFn", function(){ log = isnode.module("logger").log });
		log("debug", "Blackrock Utilities > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable, ismod.crypto = {}, ismod.system = {};
		var ISPipeline = pipelines.setupUtilities();
		new ISPipeline({}).pipe();
		return ismod;
	}









	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */

	/**
	 * (Internal > Pipeline [1]) Setup Utilities
	 */
	pipelines.setupUtilities = function(){
		return new isnode.ISNode().extend({
			constructor: function(evt) { this.evt = evt; },
			callback: function(cb) { return cb(this.evt); },
			pipe: function() {
				log("debug", "Blackrock Utilities > Server Initialisation Pipeline Created - Executing Now:");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.setupBase(evt); }),
					op.map(evt => { if(evt) return streamFns.setupUuid4(evt); }),
					op.map(evt => { if(evt) return streamFns.setupIsJSON(evt); }),
					op.map(evt => { if(evt) return streamFns.setupRandomString(evt); }),
					op.map(evt => { if(evt) return streamFns.setupObjectLength(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetCurrentDateInISO(evt); }),
					op.map(evt => { if(evt) return streamFns.setupValidateString(evt); }),
					op.map(evt => { if(evt) return streamFns.setupCloneObject(evt); }),
					op.map(evt => { if(evt) return streamFns.setupLoadModule(evt); }),
					op.map(evt => { if(evt) return streamFns.setupCsvParse(evt); }),
					op.map(evt => { if(evt) return streamFns.setupEncrypt(evt); }),
					op.map(evt => { if(evt) return streamFns.setupDecrypt(evt); }),
					op.map(evt => { if(evt) return streamFns.setupXML(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetMemoryUse(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetCpuLoad(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetStartTime(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetEndTime(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetObjectMemoryUsage(evt); }),
					op.map(evt => { if(evt) return streamFns.setupSimplify(evt); })
				);
				stream1.subscribe(function(res) {
					//console.log(res);
				});
			}
		});
	};








	/**
	 * =====================================
	 * Utilities Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Base
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupBase = function(evt){
		ismod.crypto = crypto;
		ismod.modules = modules;
		ismod.csv = csv;
		log("debug", "Blackrock Utilities > [1] Base Object Schema Initialised");
		return { 
			methods: {
				crypto: crypto,
				modules: modules,
				csv: csv
			} 
		}
	}

	/**
	 * (Internal > Stream Methods [2]) Setup UUID4 Utility Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupUuid4 = function(evt){
		ismod.uuid4 = evt.methods.uuid4 = function () {
			var uuid = '', ii;
			for (ii = 0; ii < 32; ii += 1) {
			  switch (ii) {
			  case 8:
			  case 20:
			    uuid += '-';
			    uuid += (Math.random() * 16 | 0).toString(16);
			    break;
			  case 12:
			    uuid += '-';
			    uuid += '4';
			    break;
			  case 16:
			    uuid += '-';
			    uuid += (Math.random() * 4 | 8).toString(16);
			    break;
			  default:
			    uuid += (Math.random() * 16 | 0).toString(16);
			  }
			}
			return uuid;
		};
		log("debug", "Blackrock Utilities > [2] 'uuid4' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup Is JSON Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupIsJSON = function(evt){
		ismod.isJSON = evt.methods.isJSON = function (input) {
			if(input !== null && typeof input === 'object'){
				return "json_object";
			}
			try {
			   var json = JSON.parse(input);
			   return "json_string";
			} catch(e) {
			   return "string";
			}
		};
		log("debug", "Blackrock Utilities > [3] 'isJSON' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Setup Random String Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupRandomString = function(evt){
		ismod.randomString = evt.methods.randomString = function (length) {
	  		var text = "";
	  		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	  		for (var i = 0; i < length; i++)
	    		text += possible.charAt(Math.floor(Math.random() * possible.length));
	  		return text;
		};
		log("debug", "Blackrock Utilities > [4] 'randomString' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Setup Object Length Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupObjectLength = function(evt){
		ismod.objectLength = evt.methods.objectLength = function (object) {
		    var length = 0;
		    for( var key in object ) {
		        if( object.hasOwnProperty(key) ) {
		            ++length;
		        }
		    }
		    return length;
		};
		log("debug", "Blackrock Utilities > [5] 'objectLength' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Setup Get Current Date in ISO Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetCurrentDateInISO = function(evt){
		ismod.getCurrentDateInISO = evt.methods.getCurrentDateInISO = function () {
			var currentDate = new Date();
			currentDate = currentDate.toISOString();
			return currentDate;
		};
		log("debug", "Blackrock Utilities > [6] 'getCurrentDateInISO' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Setup Get Current Date in ISO Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupValidateString = function(evt){
		ismod.validateString = evt.methods.validateString = function (text, validator) {
			if(!validator)
				return false;
			if(!text)
				return true;
			if (validator.whitelist) {
				var textArray = text.split('');
				var whitelistArray = validator.whitelist;
				whitelistArray = whitelistArray.split('');
				var result = true;
				for (var i = 0; i < textArray.length; i++) {
					if(!whitelistArray.includes(textArray[i]))
						result = false;
				}
				return result;
			} else if (validator.regex) {
				return validator.regex.test(text);
			} else if (validator.email) {
				if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)){
					var result = true;
					var textArray = text.split('');
					var whitelist = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-_@ ";
					var whitelistArray = whitelist.split('');
					for (var i = 0; i < textArray.length; i++) {
						if(!whitelistArray.includes(textArray[i]))
							result = false;
					}
					return result;
				} else {
					return false;
				}
			} else {
				return false;
			}
		};
		log("debug", "Blackrock Utilities > [7] 'validateString' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Setup Clone Object Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupCloneObject = function(evt){
		ismod.cloneObject = evt.methods.cloneObject = function (src) {
			var target = {};
			for (var prop in src) {
				if (src.hasOwnProperty(prop)) {
				  target[prop] = src[prop];
				}
			}
			return target;
		};
		log("debug", "Blackrock Utilities > [8] 'cloneObject' Method Attached To This Module");
		return evt;
	}


	/**
	 * (Internal > Stream Methods [9]) Setup Load Module Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupLoadModule = function(evt){
		ismod.modules.loadModule = evt.methods.modules.loadModule = function (name) {
			return require(name + ".js");
		};
		log("debug", "Blackrock Utilities > [9] 'loadModule' Method Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [10]) Setup Parse CSV Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupCsvParse = function(evt) {

		/**
		 * (Method) Parses CSV (in string format - already imported in from a file) in to a Javascript object which is returned
		 * @param {string} inputString - String of raw text data in CSV format
		 * @param {object} options - Options object. Can set options.delimiter to something other than a comma
		 * @param {function} cb - Callback function
		 */
		ismod.csv.parse = evt.methods.csv.parse = function (inputString, options, cb) {
			try {
				if(!inputString || !(typeof inputString === 'string' || inputString instanceof String)){
					var error = { message: "Input string not provided or not in string format" };
					if(cb){ cb(error, null) };
					return;
				}
				if(!cb || !(typeof(cb) === 'function')){
					return;			
				}

				if(!options || !options.delimiter){
					var delimiter = ",";
				} else if (options.delimiter) {
					var delimiter = options.delimiter;
				} else {
					var delimiter = ",";
				}

				if(!options || !options.header){
					var header = false;
				} else if (options.header == true){
					var header = true
				} else {
					var header = false;
				}

				if(!header) {
					var lines = inputString.split("\n");
					for (var i = 0; i < lines.length; i++) {
						lines[i] = lines[i].split(delimiter);
					}
					var output = {
						success: true,
						message: "CSV String Parsed And Output Returned",
						output: lines
					}
					cb(null, output);
					return;
				} else {
					var lines = inputString.split("\n");
					var headers_array = lines.shift();
					headers_array = headers_array.split(delimiter);
					for (var i = 0; i < headers_array.length; i++) {
						headers_array[i] = headers_array[i].replace("\r", "");
					}
					var new_lines = [];
					for (var i = 0; i < lines.length; i++) {
						line = lines[i].split(delimiter);
						var lineObject = {};
						for (var j = 0; j < line.length; j++) {
							line[j] = line[j].replace("\r", "");
							lineObject[headers_array[j]] = line[j];
						}
						new_lines.push(lineObject);
					}
					var output = {
						success: true,
						message: "CSV String Parsed And Output Returned",
						output: new_lines
					}
					cb(null, output);
					return;
				}
			} catch (err) {
				if(cb) { cb(err, null); };
				return;
			}
		};
		log("debug", "Blackrock Utilities > [10] 'parse' Method Attached To 'csv' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [11]) Setup Crypto Encrypt Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupEncrypt = function(evt){

		/**
		 * (Method) Symmetric Encryption of Text String, Given Key
		 * @param {string} text - String of text to encrypt
		 * @param {string} key - RSA key to use to encrypt the string
		 * @param {string} encoding - Encoding for output. Supports - 'buffer', 'binary', 'hex' or 'base64'.
		 */
		ismod.crypto.encrypt = evt.methods.crypto.encrypt = function (text, key, encoding) {
			var NodeRSA = require('./support/node-rsa');
			var key = new NodeRSA(key);
			var encrypted = key.encrypt(text, encoding);
			return encrypted;
		};
		log("debug", "Blackrock Utilities > [11] 'encrypt' Method Attached To 'crypto' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [12]) Setup Crypto Decrypt Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupDecrypt = function(evt){

		/**
		 * (Method) Symmetric Decryption of Text String, Given Key
		 * @param {string} text - String of text to decrypt
		 * @param {string} key - RSA key to use to decrypt the string
		 * @param {string} encoding - Encoding for output. Supports - 'buffer', 'json' or 'utf8'
		 */
		ismod.crypto.decrypt = evt.methods.crypto.decrypt = function (text, key, encoding) {
			var NodeRSA = require('./support/node-rsa');
			var key = new NodeRSA(key);
			var decrypted = key.decrypt(text, encoding);
			return decrypted;
		};
		log("debug", "Blackrock Utilities > [12] 'decrypt' Method Attached To 'crypto' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [13]) Setup XML Parsing Library
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupXML = function(evt){

		/**
		 * (External) XML Parsing Library
		 * https://github.com/NaturalIntelligence/fast-xml-parser
		 */
		ismod.xml = evt.methods.xml = require("./support/xml/parser.js");
		log("debug", "Blackrock Utilities > [13] XML Parser Library Attached To This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [14]) Setup Get Memory Use Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetMemoryUse = function(evt){
		ismod.system.getMemoryUse = function (type) {
			const used = process.memoryUsage();
			if(type && used[type]) {
				return used[type];
			} else {
				var memoryUse = 0;
				for (let key in used) { memoryUse += used[key] }
				return memoryUse;
			}
		};
		log("debug", "Blackrock Utilities > [14] 'getMemoryUse' Method Attached To 'system' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [15]) Setup Get CPU Load Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetCpuLoad = function(evt){
		ismod.system.getCpuLoad = function (cb) {
			var os = require("os");
			function cpuAverage() {
			  var totalIdle = 0, totalTick = 0;
			  var cpus = os.cpus();
			  for(var i = 0, len = cpus.length; i < len; i++) {
			    var cpu = cpus[i];
			    for(type in cpu.times) {
			      totalTick += cpu.times[type];
			    }     
			    totalIdle += cpu.times.idle;
			  }
			  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
			}
			var startMeasure = cpuAverage();
			setTimeout(function() { 
			  var endMeasure = cpuAverage();
			  var idleDifference = endMeasure.idle - startMeasure.idle;
			  var totalDifference = endMeasure.total - startMeasure.total;
			  var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
			  cb(percentageCPU);
			}, 100);
			return;
		};
		log("debug", "Blackrock Utilities > [15] 'getCpuLoad' Method Attached To 'system' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [16]) Setup Get Start Time
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetStartTime = function(evt){
		ismod.system.getStartTime = function () {
			return process.hrtime();
		};
		log("debug", "Blackrock Utilities > [16] 'getStartTime' Method Attached To 'system' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [17]) Setup Get End Time
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetEndTime = function(evt){
		ismod.system.getEndTime = function (start) {
		    var precision = 3;
		    var elapsed = process.hrtime(start)[1] / 1000000;
		    var end = process.hrtime(start)[0];
		    var ms = elapsed.toFixed(precision) / 1000;
		    end += ms;
		    start = process.hrtime();
		    return end;
		};
		log("debug", "Blackrock Utilities > [17] 'getEndTime' Method Attached To 'system' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [18]) Setup Get Object Memory Usage
	 * @param {object} evt - The Request Event
	 *
	 * Derived From: sizeof.js
	 * A function to calculate the approximate memory usage of objects
	 * Created by Kate Morley - http://code.iamkate.com/
	 * http://creativecommons.org/publicdomain/zero/1.0/legalcode
	 */
	streamFns.setupGetObjectMemoryUsage = function(evt){
		ismod.system.getObjectMemoryUsage = function (object) {
			var objects = [object];
			var size = 0;
			for (var index = 0; index < objects.length; index ++){
				switch (typeof objects[index]){
				  case 'boolean': size += 4; break;
				  case 'number': size += 8; break;
				  case 'string': size += 2 * objects[index].length; break;
				  case 'object':
				    if (Object.prototype.toString.call(objects[index]) != '[object Array]'){
				      for (var key in objects[index]) size += 2 * key.length;
				    }
				    for (var key in objects[index]){
				      var processed = false;
				      for (var search = 0; search < objects.length; search ++){
				        if (objects[search] === objects[index][key]){
				          processed = true;
				          break;
				        }
				      }
				      if (!processed) objects.push(objects[index][key]);
				    }
				}
			}
			return size;
		};
		log("debug", "Blackrock Utilities > [18] 'getObjectMemoryUsage' Method Attached To 'system' Object On This Module");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [19]) Setup Simplify Methods
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupSimplify = function(evt){

		// https://www.reddit.com/r/javascript/comments/9zhvuw/is_there_a_better_way_to_check_for_nested_object/
		ismod.isUndefined = function UtilsSimplifyIsUndefined(value) {  return typeof value === 'undefined'; }
		ismod.isNull = function UtilsSimplifyIsNull(value) { return value === null; }
		ismod.isNil = function UtilsSimplifyIsNil(value) { return ismod.isUndefined(value) || ismod.isNull(value); }
		ismod.path = function UtilsSimplifyPath(object, keys) {
		  return keys.reduce((object, key) => {
		    let value;
		    return ismod.isNil(object) || ismod.isNil(value = object[key]) ? null : value;
		  }, object);
		}
		ismod.prop = function UtilsSimplifyProp(object, key) { return ismod.path(object, key.split('.')); }
		ismod.assign = function UtilsSimplifyAssign(obj, keyPath, value) {
		   lastKeyIndex = keyPath.length-1;
		   for (var i = 0; i < lastKeyIndex; ++ i) {
		     key = keyPath[i];
		     if (!(key in obj)){
		       obj[key] = {}
		     }
		     obj = obj[key];
		   }
		   obj[keyPath[lastKeyIndex]] = value;
		}
		log("debug", "Blackrock Utilities > [19] Setup Simplify Coding Methods");

		return evt;
	}








	/**
	 * Export Module
	 */
	module.exports = init;
}();