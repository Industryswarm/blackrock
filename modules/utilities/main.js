/*!
* ISNode Blackrock Utilities Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	//var EventEmitter2 = require('./eventemitter2.js').EventEmitter2;
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnodeObj - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Utilities"), log = isnode.module("logger").log;
		ismod.uuid4 = uuid4;
		ismod.isJSON = isJSON;
		ismod.randomString = randomString;
		ismod.objectLength = objectLength;
		ismod.getCurrentDateInISO = getCurrentDateInISO;
		ismod.validateString = validateString;
		ismod.cloneObject = cloneObject;
		ismod.modules = { load: modules.load };
		ismod.csv = { parse: csv.parse };
		ismod.crypto = {
			encrypt: crypto.encrypt,
			decrypt: crypto.decrypt
		},
		ismod.xml = xml;
		return ismod;
	}

	/**
	 * (External) Generates a UUID4 string (eg; "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx")
	 * @param {object} isnodeObj - The parent isnode object
	 */
	var uuid4 = function () {
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

	/**
	 * (External) Check if input is a JSON string or object
	 * @param {string/object} input - JSON String or Object
	 */
	var isJSON = function(input){
		if(input !== null && typeof input === 'object'){
			return "json_object";
		}
		try {
		   var json = JSON.parse(input);
		   return "json_string";
		} catch(e) {
		   return "string";
		}
	}

	/**
	 * (External) Generates a random alphanumeric string of provided length
	 * @param {integer} length - Length of string to generate
	 */
	var randomString = function (length) {
  		var text = "";
  		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  		for (var i = 0; i < length; i++)
    		text += possible.charAt(Math.floor(Math.random() * possible.length));
  		return text;
	}

	/**
	 * (External) Returns the number of properties/objects/functions within a JS object
	 * @param {object} object - The JS object to calculate the length of
	 */
	var objectLength = function (object) {
	    var length = 0;
	    for( var key in object ) {
	        if( object.hasOwnProperty(key) ) {
	            ++length;
	        }
	    }
	    return length;
	};

	/**
	 * (External) Gets current date string in ISO format
	 */
	var getCurrentDateInISO = function () {
		var currentDate = new Date();
		currentDate = currentDate.toISOString();
		return currentDate;
	};

	/**
	 * (External) Validate String
	 */
	var validateString = function (text, validator) {
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

	/**
	 * (External) Deep clones an object
	 * @param {object} src - Object to clone
	 */
	var cloneObject = function (src) {
		var target = {};
		for (var prop in src) {
			if (src.hasOwnProperty(prop)) {
			  target[prop] = src[prop];
			}
		}
		return target;
	}

	/**
	 * (External) Load Module
	 * @param {object} src - Object to clone
	 */
	var modules = {};
	modules.load = function (name) {
		return require(name + ".js");
	}

	/**
	 * (External) Parses CSV (in string format - already imported in from a file) in to a Javascript object which is returned
	 * @param {string} inputString - String of raw text data in CSV format
	 * @param {object} options - Options object. Can set options.delimiter to something other than a comma
	 * @param {function} cb - Callback function
	 */
	var csv = {};
	csv.parse = function(inputString, options, cb) {
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
	}

	/**
	 * (External) Symmetric Encryption of Text String, Given Key
	 * @param {string} text - String of text to encrypt
	 * @param {string} key - RSA key to use to encrypt the string
	 * @param {string} encoding - Encoding for output. Supports - 'buffer', 'binary', 'hex' or 'base64'.
	 */
	var crypto = {};
	crypto.encrypt = function(text, key, encoding){
		var NodeRSA = require('./support/node-rsa');
		var key = new NodeRSA(key);
		var encrypted = key.encrypt(text, encoding);
		return encrypted;
	}

	/**
	 * (External) Symmetric Decryption of Text String, Given Key
	 * @param {string} text - String of text to decrypt
	 * @param {string} key - RSA key to use to decrypt the string
	 * @param {string} encoding - Encoding for output. Supports - 'buffer', 'json' or 'utf8'
	 */
	crypto.decrypt = function(text, key, encoding){
		var NodeRSA = require('./support/node-rsa');
		var key = new NodeRSA(key);
		var decrypted = key.decrypt(text, encoding);
		return decrypted;
	}

	/**
	 * (External) XML Parsing Library
	 * https://github.com/NaturalIntelligence/fast-xml-parser
	 */
	var xml = require("./support/xml/parser.js");

	/**
	 * Export Module
	 */
	module.exports = init;
}();