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
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable, ismod.crypto = {};
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
					op.map(evt => { if(evt) return streamFns.setupXML(evt); })
					
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
		return evt;
	}






	/**
	 * Export Module
	 */
	module.exports = init;
}();