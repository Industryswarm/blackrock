!function UtilitiesModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Utilities Module
   *
   * @public
   * @class Server.Modules.Utilities
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Utilities} module - The Utilities Module Singleton
   *
   * @description This is the Utilities Module of the Blackrock Application Server.
   * It provides a large selection of utilities to help fast-track development of
   * your next app or web service.
   *
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function UtilitiesModule(coreObj) {
    if (mod) return mod;
    // eslint-disable-next-line no-extend-native
    String.prototype.endsWith = function UtilitiesEndsWith(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    core = coreObj; mod = new core.Mod('Utilities'); o.log = core.module('logger').log;
    o.log('debug', 'Utilities > Initialising...', {module: mod.name}, 'MODULE_INIT');
    mod.system = {};
    core.on('updateLogFn', function() {
      o.log = core.module('logger').log;
    });
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Setup Utilities Module
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function UtilitiesSetupInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.setupBase,
        pipelines.init.setupUuid4,
        pipelines.init.setupIsJSON,
        pipelines.init.setupRandomString,
        pipelines.init.setupObjectLength,
        pipelines.init.setupGetCurrentDateInISO,
        pipelines.init.setupValidateString,
        pipelines.init.setupCloneObject,
        pipelines.init.setupLoadModule,
        pipelines.init.setupCsvParse,
        pipelines.init.setupEncrypt,
        pipelines.init.setupDecrypt,
        pipelines.init.setupXML,
        pipelines.init.setupGetMemoryUse,
        pipelines.init.setupGetCpuLoad,
        pipelines.init.setupGetStartTime,
        pipelines.init.setupGetEndTime,
        pipelines.init.setupGetObjectMemoryUsage,
        pipelines.init.setupSimplify

    ).subscribe();
  };


  /**
   * (Internal > Stream Methods [1]) Setup Base
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupBase
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupBase = function UtilitiesIPLSetupBase(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupBaseOp(observer) {
      o.log('debug', 'Utilities > [1] Base Object Schema Initialised',
          {module: mod.name}, 'UTILITIES_BASE_OBJ_SCHEMA_INIT');
      observer.next({methods: {}});
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Setup UUID4 Utility Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupUuid4
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupUuid4 = function UtilitiesIPLSetupUUID(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupUUIDOp(observer, evt) {
      /**
       * Generate UUID4 String
       *
       * @public
       * @function uuid4
       * @memberof Server.Modules.Utilities
       * @return {string} uuid - Generated UUID4 String
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      // eslint-disable-next-line no-unused-vars
      mod.uuid4 = evt.methods.uuid4 = function UtilitiesUUID() {
        let uuid = ''; let ii;
        for (ii = 0; ii < 32; ii += 1) {
          switch (ii) {
            case 8:
            case 20: uuid += '-'; uuid += (Math.random() * 16 | 0).toString(16); break;
            case 12: uuid += '-'; uuid += '4'; break;
            case 16: uuid += '-'; uuid += (Math.random() * 4 | 8).toString(16); break;
            default: uuid += (Math.random() * 16 | 0).toString(16);
          }
        }
        return uuid;
      };
      o.log('debug', 'Utilities > [2] \'uuid4\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_UUID4');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Setup Is JSON Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupIsJSON
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupIsJSON = function UtilitiesIPLSetupIsJSON(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupIsJSONOp(observer, evt) {
      /**
       * Is JSON?
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function isJSON
       * @param {*} input - JSON Data (in String or Object Form)
       * @return {string} result - Result of Query (json_string | json_object | string)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.isJSON = evt.methods.isJSON = function UtilitiesIsJSON(input) {
        if (input !== null && typeof input === 'object') return 'json_object';
        try {
          JSON.parse(input);
          return 'json_string';
        } catch (e) {
          return 'string';
        }
      };
      o.log('debug',
          'Utilities > [3] \'isJSON\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_IS_JSON');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Random String Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupRandomString
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupRandomString = function UtilitiesIPLSetupRandomString(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupRandomStringOp(observer, evt) {
      /**
       * Generate Random String
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function randomString
       * @param {number} length - Length of Random String to Generate
       * @return {string} text - The generated random string
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.randomString = evt.methods.randomString = function UtilitiesRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      };
      o.log('debug',
          'Utilities > [4] \'randomString\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_RANDOM_STRING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Object Length Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupObjectLength
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupObjectLength = function UtilitiesIPLSetupObjectLength(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupObjectLengthOp(observer, evt) {
      /**
       * Get Object Length
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function objectLength
       * @param {object} object - The Javascript Object
       * @return {number} length - The size of the object (number of keys)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.objectLength = evt.methods.objectLength = function UtilitiesObjectLength(object) {
        let length = 0;
        for ( const key in object ) {
          // eslint-disable-next-line no-prototype-builtins
          if ( object.hasOwnProperty(key) ) {
            ++length;
          }
        }
        return length;
      };
      o.log('debug',
          'Utilities > [5] \'objectLength\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_OBJ_LENGTH');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Setup Get Current Date in ISO Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetCurrentDateInISO
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetCurrentDateInISO = function UtilitiesIPLSetupGetCurrentDateInISO(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetCurrentDateInISOOp(observer, evt) {
      /**
       * Get Current Date In ISO
       *
       * @public
       * @function getCurrentDateInISO
       * @memberof Server.Modules.Utilities
       * @return {string} currentDateISO - Current Date in ISO
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getCurrentDateInISO = evt.methods.getCurrentDateInISO = function UtilitiesGetCurrentDateInISO() {
        let currentDate = new Date();
        return currentDate.toISOString();
      };
      o.log('debug',
          'Utilities > [6] \'getCurrentDateInISO\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_CURRENT_DATE_IN_ISO');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Setup Get Current Date in ISO Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupValidateString
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupValidateString = function UtilitiesIPLSetupValidateString(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupValidateStringOp(observer, evt) {
      /**
       * Validate String
       *
       * @public
       * @function validateString
       * @memberof Server.Modules.Utilities
       * @param {string} text - Input String to Validate
       * @param {object} validator - Validator for String
       * @param {string} validator.whitelist - Whitelist to validate against
       * @param {string} validator.regex - Regex to Validate Against
       * @param {boolean} validator.email - Whether to validate as email (True | False)
       * @return {boolean} result - Result of Validation
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.validateString = evt.methods.validateString = function UtilitiesValidateString(text, validator) {
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
      o.log('debug',
          'Utilities > [7] \'validateString\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_VALIDATE_STRING');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Setup Clone Object Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupCloneObject
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupCloneObject = function UtilitiesIPLSetupCloneObject(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupCloneObjectOp(observer, evt) {
      /**
       * Clone Object
       *
       * @public
       * @function cloneObject
       * @memberof Server.Modules.Utilities
       * @param {object} src - Source Object
       * @return {object} target - Target Object
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.cloneObject = evt.methods.cloneObject = function UtilitiesCloneObject(src) {
        const target = {};
        for (const prop in src) {
          // eslint-disable-next-line no-prototype-builtins
          if (src.hasOwnProperty(prop)) target[prop] = src[prop];
        }
        return target;
      };
      o.log('debug',
          'Utilities > [8] \'cloneObject\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_CLONE_OBJ');
      observer.next(evt);
    }, source);
  };


  /**
   * (Internal > Stream Methods [9]) Setup Load Module Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupLoadModule
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupLoadModule = function UtilitiesIPLSetupLoadMod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupLoadModOp(observer, evt) {
      /**
       * Load Module
       *
       * @public
       * @function loadModule
       * @memberof Server.Modules.Utilities
       * @param {string} name - Module Name
       * @return {Server.Modules.Core.Module} module - Loaded Module
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.loadModule = evt.methods.loadModule = function UtilitiesLoadMod(name) {
        return require(name + '.js');
      };
      o.log('debug',
          'Utilities > [9] \'loadModule\' Method Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_LOAD_MOD');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [10]) Setup Parse CSV Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupCsvParse
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupCsvParse = function UtilitiesIPLSetupCsvParse(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupCsvParseOp(observer, evt) {
      /**
       * Parses CSV
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function parseCsv
       * @param {string} inputString - String of raw text data in CSV format
       * @param {object} options - Options object. Can set options.delimiter to something other than a comma
       * @param {function} cb - Callback function
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.parseCsv = evt.methods.parseCsv = function UtilitiesCsvParse(inputString, options, cb) {
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
      o.log('debug',
          'Utilities > [10] \'parse\' Method Attached To \'csv\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_CSV_PARSE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [11]) Setup Crypto Encrypt Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupEncrypt
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupEncrypt = function UtilitiesIPLSetupEncrypt(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupEncryptOp(observer, evt) {
      /**
       * Symmetric Encryption of Text String, Given Key
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function encrypt
       * @param {string} text - String of text to encrypt
       * @param {string} key - RSA key to use to encrypt the string
       * @param {string} encoding - Encoding for output. Supports - 'buffer', 'binary', 'hex' or 'base64'.
       * @return {string} encrypted - Encrypted String
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.encrypt = evt.methods.encrypt = function UtilitiesEncrypt(text, key, encoding) {
        const NodeRSA = require('./_support/node-rsa');
        key = new NodeRSA(key);
        // noinspection JSUnresolvedFunction
        return key.encrypt(text, encoding);
      };
      o.log('debug',
          'Utilities > [11] \'encrypt\' Method Attached To \'crypto\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_CRYPTO_ENCRYPT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [12]) Setup Crypto Decrypt Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupDecrypt
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupDecrypt = function UtilitiesIPLSetupDecrypt(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupDecryptOp(observer, evt) {
      /**
       * Symmetric Decryption of Text String, Given Key
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @function decrypt
       * @param {string} text - String of text to decrypt
       * @param {string} key - RSA key to use to decrypt the string
       * @param {string} encoding - Encoding for output. Supports - 'buffer', 'json' or 'utf8'
       * @return {string} decrypted - Decrypted string
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.decrypt = evt.methods.decrypt = function UtilitiesDecrypt(text, key, encoding) {
        const NodeRSA = require('./_support/node-rsa');
        key = new NodeRSA(key);
        // noinspection JSUnresolvedFunction
        return key.decrypt(text, encoding);
      };
      o.log('debug',
          'Utilities > [12] \'decrypt\' Method Attached To \'crypto\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_CRYPTO_DECRYPT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Setup XML Parsing Library
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupXML
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @see https://github.com/NaturalIntelligence/fast-xml-parser
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupXML = function UtilitiesIPLSetupXML(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupXMLOp(observer, evt) {
      /**
       * Load Module
       *
       * @public
       * @memberof Server.Modules.Utilities
       * @name xml
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.xml = evt.methods.xml = require('./_support/xml/parser.js');
      o.log('debug',
          'Utilities > [13] XML Parser Library Attached To This Module',
          {module: mod.name}, 'UTILITIES_BOUND_XML_PARSER_LIB');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [14]) Setup Get Memory Use Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetMemoryUse
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetMemoryUse = function UtilitiesIPLSetupGetMemoryUse(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetMemoryUseOp(observer, evt) {
      /**
       * Get Memory Use
       *
       * @public
       * @function getMemoryUse
       * @memberof Server.Modules.Utilities
       * @param {string} type - Type
       * @return {number} module - Memory Use
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getMemoryUse = mod.system.getMemoryUse = function UtilitiesGetMemoryUse(type) {
        const used = process.memoryUsage();
        if (type && used[type]) return used[type];
        else {
          let memoryUse = 0;
          // eslint-disable-next-line guard-for-in
          for (const key in used) {
            // noinspection JSUnfilteredForInLoop
            memoryUse += used[key];
          }
          return memoryUse;
        }
      };
      o.log('debug',
          'Utilities > [14] \'getMemoryUse\' Method Attached To \'system\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_MEM_USE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [15]) Setup Get CPU Load Method
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetCpuLoad
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetCpuLoad = function UtilitiesIPLSetupGetCpuLoad(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetCpuLoadOp(observer, evt) {
      /**
       * Get CPU Load
       *
       * @public
       * @function getCpuLoad
       * @memberof Server.Modules.Utilities
       * @param {function} cb - Callback Function
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getCpuLoad = mod.system.getCpuLoad = function UtilitiesGetCpuLoad(cb) {
        const os = require('os');
        const cpuAverage = function UtilitiesGetCpuLoadCpuAvgFn() {
          let totalIdle = 0; let totalTick = 0; const cpus = os.cpus();
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
        setTimeout(function UtilitiesGetCpuLoadTimeout() {
          const endMeasure = cpuAverage();
          const idleDifference = endMeasure.idle - startMeasure.idle;
          const totalDifference = endMeasure.total - startMeasure.total;
          const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
          cb(percentageCPU);
        }, 100);
      };
      o.log('debug',
          'Utilities > [15] \'getCpuLoad\' Method Attached To \'system\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_CPU_LOAD');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [16]) Setup Get Start Time
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetStartTime
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetStartTime = function UtilitiesIPLSetupGetStartTime(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetStartTimeOp(observer, evt) {
      /**
       * Get Start Time
       *
       * @public
       * @function getStartTime
       * @memberof Server.Modules.Utilities
       * @return {*} time - Start Time
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getStartTime = mod.system.getStartTime = function UtilitiesGetStartTime() {
        return process.hrtime();
      };
      o.log('debug',
          'Utilities > [16] \'getStartTime\' Method Attached To \'system\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_START_TIME');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [17]) Setup Get End Time
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetEndTime
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetEndTime = function UtilitiesIPLSetupGetEndTime(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetEndTimeOp(observer, evt) {
      /**
       * Get End Time
       *
       * @public
       * @function getEndTime
       * @memberof Server.Modules.Utilities
       * @param {*} start - Start Time
       * @return {*} end - End Time
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getEndTime = mod.system.getEndTime = function UtilitiesGetEndTime(start) {
        const precision = 3;
        const elapsed = process.hrtime(start)[1] / 1000000;
        let end = process.hrtime(start)[0];
        const ms = elapsed.toFixed(precision) / 1000;
        end += ms;
        // start = process.hrtime();
        return end;
      };
      o.log('debug',
          'Utilities > [17] \'getEndTime\' Method Attached To \'system\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_END_TIME');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [18]) Setup Get Object Memory Usage
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupGetObjectMemoryUsage
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetObjectMemoryUsage = function UtilitiesIPLSetupGetObjectMemoryUsage(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupGetObjectMemoryUsageOp(observer, evt) {
      /**
       * Get Object Memory Usage
       *
       * @public
       * @function getObjectMemoryUsage
       * @memberof Server.Modules.Utilities
       * @param {object} object - Object to get Memory Usage Of
       * @return {number} size - Object Size
       * @see http://creativecommons.org/publicdomain/zero/1.0/legalcode
       * @see http://code.iamkate.com/
       * @author Kate Morley
       *
       * @description
       * Derived From: sizeof.js
       * A function to calculate the approximate memory usage of objects
       *
       * @example
       * Tbc...
       */
      mod.getObjectMemoryUsage = mod.system.getObjectMemoryUsage = function UtilitiesGetObjectMemoryUsage(object) {
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
                for (const key in objects[index]) {
                  // noinspection JSUnfilteredForInLoop
                  size += 2 * key.length;
                }
              }
              // eslint-disable-next-line guard-for-in
              for (const key in objects[index]) {
                let processed = false;
                for (let search = 0; search < objects.length; search ++) {
                  // noinspection JSUnfilteredForInLoop
                  if (objects[search] === objects[index][key]) {
                    processed = true;
                    break;
                  }
                }
                if (!processed) {
                  // noinspection JSUnfilteredForInLoop
                  objects.push(objects[index][key]);
                }
              }
          }
        }
        return size;
      };
      o.log('debug',
          'Utilities > [18] \'getObjectMemoryUsage\' Method Attached To \'system\' Object On This Module',
          {module: mod.name}, 'UTILITIES_BOUND_GET_OBJ_MEM_USE');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [19]) Setup Simplify Methods
   *
   * @private
   * @memberof Server.Modules.Utilities
   * @function pipelines.init.setupSimplify
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @see https://www.reddit.com/r/javascript/comments/9zhvuw/is_there_a_better_way_to_check_for_nested_object/
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupSimplify = function UtilitiesIPLSetupSimplify(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function UtilitiesIPLSetupSimplifyOp(observer, evt) {
      /**
       * Is Undefined?
       *
       * @public
       * @function isUndefined
       * @memberof Server.Modules.Utilities
       * @param {*} value - Value to Check
       * @return {boolean} result - Result of Check (True | False)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.isUndefined = function UtilitiesIPLSimplifyIsUndefined(value) {
        return typeof value === 'undefined';
      };
      /**
       * Is Null?
       *
       * @public
       * @function isNull
       * @memberof Server.Modules.Utilities
       * @param {*} value - Value to Check
       * @return {boolean} result - Result of Check (True | False)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.isNull = function UtilitiesIPLSimplifyIsNull(value) {
        return value === null;
      };
      /**
       * Is Nil?
       *
       * @public
       * @function isNil
       * @memberof Server.Modules.Utilities
       * @param {*} value - Value to Check
       * @return {boolean} result - Result of Check (True | False)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.isNil = function UtilitiesIPLSimplifyIsNil(value) {
        return mod.isUndefined(value) || mod.isNull(value);
      };
      /**
       * Path
       *
       * @public
       * @function path
       * @memberof Server.Modules.Utilities
       * @param {object} object - Object
       * @param {array} keys - Keys
       * @return {*} result - Result
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.path = function UtilitiesIPLSimplifyPath(object, keys) {
        return keys.reduce((object, key) => {
          let value;
          return mod.isNil(object) || mod.isNil(value = object[key]) ? null : value;
        }, object);
      };
      /**
       * Prop
       *
       * @public
       * @function prop
       * @memberof Server.Modules.Utilities
       * @param {object} object - Object
       * @param {string} key - Key
       * @return {*} result - Result
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.prop = function UtilitiesIPLSimplifyProp(object, key) {
        return mod.path(object, key.split('.'));
      };
      /**
       * Assign
       *
       * @public
       * @function prop
       * @memberof Server.Modules.Utilities
       * @param {object} obj - Object
       * @param {string} keyPath - Key Path
       * @param {string} value - Value
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.assign = function UtilitiesIPLSimplifyAssign(obj, keyPath, value) {
        const lastKeyIndex = keyPath.length-1;
        for (let i = 0; i < lastKeyIndex; ++ i) {
          const key = keyPath[i];
          if (!(key in obj)) obj[key] = {};
          obj = obj[key];
        }
        obj[keyPath[lastKeyIndex]] = value;
      };
      o.log('debug', 'Utilities > [19] Setup Simplify Coding Methods',
          {module: mod.name}, 'UTILITIES_BOUND_SIMPLIFY_LIB');
      observer.next(evt);
    }, source);
  };
}();
