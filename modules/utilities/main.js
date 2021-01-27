!function UtilitiesModuleWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function UtilitiesEndsWith(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;
  const modules = {}; const csv = {}; const crypto = {};


  /**
   * Blackrock Utilities Module
   *
   * @class Server.Modules.Utilities
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Utilities} module - The Utilities Module
   *
   * @description This is the Utilities Module of the Blackrock Application Server.
   * It provides a large selection of utilities to help fast-track development of
   * your next app or web service.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function UtilitiesModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Utilities'); log = core.module('logger').log;
    core.on('updateLogFn', function() {
      log = core.module('logger').log;
    });
    log('debug', 'Blackrock Utilities > Initialising...', {}, 'UTILITIES_INIT');
    lib = core.lib; rx = lib.rxjs; mod.crypto = {}; mod.system = {};
    process.nextTick(function() {
      const Pipeline = pipelines.setupUtilitiesModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /*
   * =====================
   * Event Stream Pipeline
   * =====================
   */

  /**
   * (Internal > Pipeline [1]) Setup Utilities Module
   * @private
   * @return {object} pipeline - The Pipeline Module
   */
  pipelines.setupUtilitiesModule = function UtilitiesModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function UtilitiesModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function UtilitiesModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function UtilitiesModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Utilities Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'UTILITIES_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.setupBase,
            streamFns.setupUuid4,
            streamFns.setupIsJSON,
            streamFns.setupRandomString,
            streamFns.setupObjectLength,
            streamFns.setupGetCurrentDateInISO,
            streamFns.setupValidateString,
            streamFns.setupCloneObject,
            streamFns.setupLoadModule,
            streamFns.setupCsvParse,
            streamFns.setupEncrypt,
            streamFns.setupDecrypt,
            streamFns.setupXML,
            streamFns.setupGetMemoryUse,
            streamFns.setupGetCpuLoad,
            streamFns.setupGetStartTime,
            streamFns.setupGetEndTime,
            streamFns.setupGetObjectMemoryUsage,
            streamFns.setupSimplify

        ).subscribe();
      },
    });
  };


  /*
   * =====================================
   * Utilities Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Setup Base
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupBase = function UtilitiesSetupBase(source) {
    return lib.rxOperator(function(observer) {
      mod.crypto = crypto;
      mod.modules = modules;
      mod.csv = csv;
      log('debug', 'Blackrock Utilities > [1] Base Object Schema Initialised', {}, 'UTILITIES_BASE_OBJ_SCHEMA_INIT');
      observer.next({
        methods: {
          crypto: crypto,
          modules: modules,
          csv: csv,
        },
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Setup UUID4 Utility Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupUuid4 = function UtilitiesModuleSetupUUID(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Generate UUID4 String
       * @name uuid4
       * @function
       * @memberof Server.Modules.Utilities
       * @return {string} uuid - Generated UUID4 String
       */
      // eslint-disable-next-line no-unused-vars
      mod.uuid4 = evt.methods.uuid4 = function UtilitiesModuleUUID() {
        let uuid = ''; let ii;
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
      log('debug', 'Blackrock Utilities > [2] \'uuid4\' Method Attached To This Module', {}, 'UTILITIES_BOUND_UUID4');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Setup Is JSON Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupIsJSON = function UtilitiesModuleSetupIsJSON(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Is JSON?
       * @memberof Server.Modules.Utilities
       * @name isJSON
       * @function
       * @param {string|object} input - JSON Data (in String or Object Form)
       * @return {string} result - Result of Query (json_string | json_object | string)
       */
      mod.isJSON = evt.methods.isJSON = function UtilitiesModuleIsJSON(input) {
        if (input !== null && typeof input === 'object') {
          return 'json_object';
        }
        try {
          JSON.parse(input);
          return 'json_string';
        } catch (e) {
          return 'string';
        }
      };
      log('debug',
          'Blackrock Utilities > [3] \'isJSON\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_IS_JSON');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Random String Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupRandomString = function UtilitiesModuleSetupRandomString(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Generate Random String
       * @memberof Server.Modules.Utilities
       * @name randomString
       * @function
       * @param {number} length - Length of Random String to Generate
       * @return {string} text - The generated random string
       */
      mod.randomString = evt.methods.randomString = function UtilitiesModuleRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      };
      log('debug',
          'Blackrock Utilities > [4] \'randomString\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_RANDOM_STRING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Object Length Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupObjectLength = function UtilitiesModuleSetupObjectLength(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Get Object Length
       * @memberof Server.Modules.Utilities
       * @name objectLength
       * @function
       * @param {object} object - The Javascript Object
       * @return {number} length - The size of the object (number of keys)
       */
      mod.objectLength = evt.methods.objectLength = function UtilitiesModuleObjectLength(object) {
        let length = 0;
        for ( const key in object ) {
          // eslint-disable-next-line no-prototype-builtins
          if ( object.hasOwnProperty(key) ) {
            ++length;
          }
        }
        return length;
      };
      log('debug',
          'Blackrock Utilities > [5] \'objectLength\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_OBJ_LENGTH');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Setup Get Current Date in ISO Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetCurrentDateInISO = function UtilitiesModuleSetupGetCurrentDateInISO(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.getCurrentDateInISO = evt.methods.getCurrentDateInISO = function UtilitiesModuleGetCurrentDateInISO() {
        let currentDate = new Date();
        currentDate = currentDate.toISOString();
        return currentDate;
      };
      log('debug',
          'Blackrock Utilities > [6] \'getCurrentDateInISO\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_GET_CURRENT_DATE_IN_ISO');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Setup Get Current Date in ISO Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupValidateString = function UtilitiesModuleSetupValidateString(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.validateString = evt.methods.validateString = function UtilitiesModuleValidateString(text, validator) {
        if (!validator) return false;
        if (!text) return true;
        if (validator.whitelist) {
          const textArray = text.split('');
          let whitelistArray = validator.whitelist;
          whitelistArray = whitelistArray.split('');
          let result = true;
          for (let i = 0; i < textArray.length; i++) {
            if (!whitelistArray.includes(textArray[i])) result = false;
          }
          return result;
        } else if (validator.regex) {
          return validator.regex.test(text);
        } else if (validator.email) {
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            let result = true;
            const textArray = text.split('');
            const whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-_@ ';
            const whitelistArray = whitelist.split('');
            for (let i = 0; i < textArray.length; i++) {
              if (!whitelistArray.includes(textArray[i])) {
                result = false;
              }
            }
            return result;
          } else return false;
        } else return false;
      };
      log('debug',
          'Blackrock Utilities > [7] \'validateString\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_VALIDATE_STRING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Setup Clone Object Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupCloneObject = function UtilitiesModuleSetupCloneObject(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.cloneObject = evt.methods.cloneObject = function UtilitiesModuleCloneObject(src) {
        const target = {};
        for (const prop in src) {
          // eslint-disable-next-line no-prototype-builtins
          if (src.hasOwnProperty(prop)) target[prop] = src[prop];
        }
        return target;
      };
      log('debug',
          'Blackrock Utilities > [8] \'cloneObject\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_CLONE_OBJ');
      observer.next(evt);
    }, source);
  };


  /**
   * (Internal > Stream Methods [9]) Setup Load Module Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupLoadModule = function UtilitiesModuleSetupLoadModule(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.modules.loadModule = evt.methods.modules.loadModule = function UtilitiesModuleLoadModule(name) {
        return require(name + '.js');
      };
      log('debug',
          'Blackrock Utilities > [9] \'loadModule\' Method Attached To This Module',
          {}, 'UTILITIES_BOUND_LOAD_MOD');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [10]) Setup Parse CSV Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupCsvParse = function UtilitiesModuleSetupCsvParse(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Parses CSV
       * @memberof Server.Modules.Utilities
       * @name parse
       * @function
       * @param {string} inputString - String of raw text data in CSV format
       * @param {object} options - Options object. Can set options.delimiter to something other than a comma
       * @param {function} cb - Callback function
       */
      mod.csv.parse = evt.methods.csv.parse = function UtilitiesModuleCsvParse(inputString, options, cb) {
        try {
          if (!inputString || !(typeof inputString === 'string' || inputString instanceof String)) {
            const error = {message: 'Input string not provided or not in string format'};
            if (cb) cb(error, null);
            return;
          }
          if (!cb || !(typeof(cb) === 'function')) return;
          let delimiter;
          if (!options || !options.delimiter) delimiter = ',';
          else if (options.delimiter) delimiter = options.delimiter;
          else delimiter = ',';
          let header;
          if (!options || !options.header) header = false;
          else header = options.header === true;
          let lines;
          if (!header) {
            lines = inputString.split('\n');
            for (let i = 0; i < lines.length; i++) {
              lines[i] = lines[i].split(delimiter);
            }
            const output = {
              success: true,
              message: 'CSV String Parsed And Output Returned',
              output: lines,
            };
            cb(null, output);
          } else {
            lines = inputString.split('\n');
            // eslint-disable-next-line camelcase
            let headers_array = lines.shift();
            // eslint-disable-next-line camelcase
            headers_array = headers_array.split(delimiter);
            for (let i = 0; i < headers_array.length; i++) {
              headers_array[i] = headers_array[i].replace('\r', '');
            }
            // eslint-disable-next-line camelcase
            const new_lines = [];
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].split(delimiter);
              const lineObject = {};
              for (let j = 0; j < line.length; j++) {
                line[j] = line[j].replace('\r', '');
                lineObject[headers_array[j]] = line[j];
              }
              new_lines.push(lineObject);
            }
            const output = {
              success: true,
              message: 'CSV String Parsed And Output Returned',
              output: new_lines,
            };
            cb(null, output);
          }
        } catch (err) {
          if (cb) cb(err, null);
        }
      };
      log('debug',
          'Blackrock Utilities > [10] \'parse\' Method Attached To \'csv\' Object On This Module',
          {}, 'UTILITIES_BOUND_CSV_PARSE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [11]) Setup Crypto Encrypt Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupEncrypt = function UtilitiesModuleSetupEncrypt(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Symmetric Encryption of Text String, Given Key
       * @memberof Server.Modules.Utilities
       * @name encrypt
       * @function
       * @param {string} text - String of text to encrypt
       * @param {string} key - RSA key to use to encrypt the string
       * @param {string} encoding - Encoding for output. Supports - 'buffer', 'binary', 'hex' or 'base64'.
       * @return {string} encrypted - Encrypted String
       */
      mod.crypto.encrypt = evt.methods.crypto.encrypt = function UtilitiesModuleEncrypt(text, key, encoding) {
        const NodeRSA = require('./_support/node-rsa');
        key = new NodeRSA(key);
        return key.encrypt(text, encoding);
      };
      log('debug',
          'Blackrock Utilities > [11] \'encrypt\' Method Attached To \'crypto\' Object On This Module',
          {}, 'UTILITIES_BOUND_CRYPTO_ENCRYPT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [12]) Setup Crypto Decrypt Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupDecrypt = function UtilitiesModuleSetupDecrypt(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
        * Symmetric Decryption of Text String, Given Key
        * @memberof Server.Modules.Utilities
        * @name decrypt
        * @function
        * @param {string} text - String of text to decrypt
        * @param {string} key - RSA key to use to decrypt the string
        * @param {string} encoding - Encoding for output. Supports - 'buffer', 'json' or 'utf8'
        * @return {string} decrypted - Decrypted string
        */
      mod.crypto.decrypt = evt.methods.crypto.decrypt = function UtilitiesModuleDecrypt(text, key, encoding) {
        const NodeRSA = require('./_support/node-rsa');
        key = new NodeRSA(key);
        return key.decrypt(text, encoding);
      };
      log('debug',
          'Blackrock Utilities > [12] \'decrypt\' Method Attached To \'crypto\' Object On This Module',
          {}, 'UTILITIES_BOUND_CRYPTO_DECRYPT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Setup XML Parsing Library
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @see https://github.com/NaturalIntelligence/fast-xml-parser
   */
  streamFns.setupXML = function UtilitiesModuleSetupXML(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.xml = evt.methods.xml = require('./_support/xml/parser.js');
      log('debug',
          'Blackrock Utilities > [13] XML Parser Library Attached To This Module',
          {}, 'UTILITIES_BOUND_XML_PARSER_LIB');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [14]) Setup Get Memory Use Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetMemoryUse = function UtilitiesModuleSetupGetMemoryUse(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.system.getMemoryUse = function UtilitiesModuleGetMemoryUse(type) {
        const used = process.memoryUsage();
        if (type && used[type]) {
          return used[type];
        } else {
          let memoryUse = 0;
          // eslint-disable-next-line guard-for-in
          for (const key in used) {
            memoryUse += used[key];
          }
          return memoryUse;
        }
      };
      log('debug',
          'Blackrock Utilities > [14] \'getMemoryUse\' Method Attached To \'system\' Object On This Module',
          {}, 'UTILITIES_BOUND_GET_MEM_USE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [15]) Setup Get CPU Load Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetCpuLoad = function UtilitiesModuleSetupGetCpuLoad(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.system.getCpuLoad = function UtilitiesModuleGetCpuLoad(cb) {
        const os = require('os');
        const cpuAverage = function UtilitiesModuleGetCpuLoadCpuAvgFn() {
          let totalIdle = 0; let totalTick = 0;
          const cpus = os.cpus();
          for (let i = 0, len = cpus.length; i < len; i++) {
            const cpu = cpus[i];
            // eslint-disable-next-line guard-for-in
            for (const type in cpu.times) {
              totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
          }
          return {idle: totalIdle / cpus.length, total: totalTick / cpus.length};
        };
        const startMeasure = cpuAverage();
        setTimeout(function UtilitiesModuleGetCpuLoadTimeout() {
          const endMeasure = cpuAverage();
          const idleDifference = endMeasure.idle - startMeasure.idle;
          const totalDifference = endMeasure.total - startMeasure.total;
          const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
          cb(percentageCPU);
        }, 100);
      };
      log('debug',
          'Blackrock Utilities > [15] \'getCpuLoad\' Method Attached To \'system\' Object On This Module',
          {}, 'UTILITIES_BOUND_GET_CPU_LOAD');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [16]) Setup Get Start Time
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetStartTime = function UtilitiesModuleSetupGetStartTime(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.system.getStartTime = function UtilitiesModuleGetStartTime() {
        return process.hrtime();
      };
      log('debug',
          'Blackrock Utilities > [16] \'getStartTime\' Method Attached To \'system\' Object On This Module',
          {}, 'UTILITIES_BOUND_GET_START_TIME');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [17]) Setup Get End Time
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetEndTime = function UtilitiesModuleSetupGetEndTime(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.system.getEndTime = function UtilitiesModuleGetEndTime(start) {
        const precision = 3;
        const elapsed = process.hrtime(start)[1] / 1000000;
        let end = process.hrtime(start)[0];
        const ms = elapsed.toFixed(precision) / 1000;
        end += ms;
        // start = process.hrtime();
        return end;
      };
      log('debug',
          'Blackrock Utilities > [17] \'getEndTime\' Method Attached To \'system\' Object On This Module',
          {}, 'UTILITIES_BOUND_GET_END_TIME');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [18]) Setup Get Object Memory Usage
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Derived From: sizeof.js
   * A function to calculate the approximate memory usage of objects
   * Created by Kate Morley - http://code.iamkate.com/
   * @see http://creativecommons.org/publicdomain/zero/1.0/legalcode
   */
  streamFns.setupGetObjectMemoryUsage = function UtilitiesModuleSetupGetObjectMemoryUsage(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.system.getObjectMemoryUsage = function UtilitiesModuleGetObjectMemoryUsage(object) {
        const objects = [object];
        let size = 0;
        for (let index = 0; index < objects.length; index ++) {
          switch (typeof objects[index]) {
            case 'boolean': size += 4; break;
            case 'number': size += 8; break;
            case 'string': size += 2 * objects[index].length; break;
            case 'object':
              if (Object.prototype.toString.call(objects[index]) !== '[object Array]') {
                // eslint-disable-next-line guard-for-in
                for (const key in objects[index]) size += 2 * key.length;
              }
              // eslint-disable-next-line guard-for-in
              for (const key in objects[index]) {
                let processed = false;
                for (let search = 0; search < objects.length; search ++) {
                  if (objects[search] === objects[index][key]) {
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
      log('debug',
          'Blackrock Utilities > [18] \'getObjectMemoryUsage\' Method Attached To \'system\' Object On This Module',
          {}, 'UTILITIES_BOUND_GET_OBJ_MEM_USE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [19]) Setup Simplify Methods
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @see https://www.reddit.com/r/javascript/comments/9zhvuw/is_there_a_better_way_to_check_for_nested_object/
   */
  streamFns.setupSimplify = function UtilitiesModuleSetupSimplify(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.isUndefined = function UtilitiesModuleSimplifyIsUndefined(value) {
        return typeof value === 'undefined';
      };
      mod.isNull = function UtilitiesModuleSimplifyIsNull(value) {
        return value === null;
      };
      mod.isNil = function UtilitiesModuleSimplifyIsNil(value) {
        return mod.isUndefined(value) || mod.isNull(value);
      };
      mod.path = function UtilitiesModuleSimplifyPath(object, keys) {
        return keys.reduce((object, key) => {
          let value;
          return mod.isNil(object) || mod.isNil(value = object[key]) ? null : value;
        }, object);
      };
      mod.prop = function UtilitiesModuleSimplifyProp(object, key) {
        return mod.path(object, key.split('.'));
      };
      mod.assign = function UtilitiesModuleSimplifyAssign(obj, keyPath, value) {
        const lastKeyIndex = keyPath.length-1;
        for (let i = 0; i < lastKeyIndex; ++ i) {
          const key = keyPath[i];
          if (!(key in obj)) {
            obj[key] = {};
          }
          obj = obj[key];
        }
        obj[keyPath[lastKeyIndex]] = value;
      };
      log('debug', 'Blackrock Utilities > [19] Setup Simplify Coding Methods', {}, 'UTILITIES_BOUND_SIMPLIFY_LIB');
      observer.next(evt);
    }, source);
  };
}();
