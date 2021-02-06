!function ValidateLibraryWrapper() {
    let library; let cache; let log;

    /**
     * Blackrock Validate Library
     *
     * @public
     * @class Server.Modules.Utilities.Validate
     * @ignore
     * @param {object} cfg - Config Object
     * @return {Server.Modules.Utilities.Validate} library - The Validate Library Singleton
     *
     * @description
     * This is the Validate Library from the Utilities Module within the Blackrock Application Server.
     * It provides tools to validate any one of a number of discrete and streaming data structures and primitives,
     * based on a set of defined rules (or constraints). Some of the items that it can validate include:
     *
     * - JSON (via JSON Schema Definition Objects or Files)
     * - CSV (Strings or Files)
     * - Javascript Primitives (String, Number, Float, Boolean, Etc...)
     * - XML and XHTML (via XML Schema Definition (XSD) Files or Strings)
     *
     *
     * @see http://json-schema.org/
     * @see https://ajv.js.org/
     * @author Darren Smith
     * @copyright Copyright (c) 2021 Darren Smith
     * @license Licensed under the LGPL license.
     */
    module.exports = function ValidateSingleton(cfg) {
        if(!library) library = new ValidateInternal(cfg);
        return library;
    };


    /**
     * Internal CSV Validator Class
     *
     * @private
     * @ignore
     * @class Server.Modules.Utilities.Validate.Internal.Csv
     */
    const CsvValidator = function ValidateInternalCsv() {}

    /**
     * Csv Validator Check Method
     *
     * @private
     * @ignore
     * @name check
     * @memberof Server.Modules.Utilities.Validate.Internal.Csv
     * @param {string} inputString - Input String
     * @param {string} directive - Directive
     * @param {object} options - Options Object
     * @return {boolean} result - Result of Check
     */
    CsvValidator.check = function ValidateInternalCsvCheck(inputString, directive, options) {
        if(!inputString || !directive) return false;
    }



    /**
     * Internal JSON Validator Class
     *
     * @private
     * @ignore
     * @class Server.Modules.Utilities.Validate.Internal.Json
     */
    const JsonValidator = function ValidateInternalJson() {}

    let JsonCompiledSchemaCache = {};

    /**
     * Json Validator Load Schema Method
     *
     * @private
     * @ignore
     * @memberof Server.Modules.Utilities.Validate.Internal.String
     * @name load
     * @param {string} key - Schema Key
     * @param {object} schema -JSON Schema Object
     */
    JsonValidator.load = function ValidateInternalJsonLoad(key, schema) {

    }
    JsonValidator.check = function ValidateInternalJsonCheck() {

    }


    /**
     * Internal String Validation Class
     *
     * @private
     * @ignore
     * @class Server.Modules.Utilities.Validate.Internal.String
     */
    const StringValidator = function ValidateInternalString() {}

    /**
     * String Validator Check Method
     *
     * @private
     * @ignore
     * @memberof Server.Modules.Utilities.Validate.Internal.String
     * @name check
     * @param {string} inputString - Input String
     * @param {string} directive - Directive
     * @param {object} options - Options Object
     * @param {number} options.numChars - Number of Characters
     * @return {boolean} result - Result of Check
     */
    StringValidator.check = function ValidateInternalStringCheck(inputString, directive, options) {
        if(!inputString || !directive) return false;
        switch(directive) {
            case 'length':
                if(!options.numChars) return false;
                return inputString.length === options.numChars;
            default:
                return false;
        }
    }


    /**
     * Validate Extender Class
     *
     * @private
     * @ignore
     * @class Server.Modules.Utilities.Validate.Internal.Extender
     */
    const Extender = function ValidateInternalExtender() {}

    /**
     * Internal Validate Class
     *
     * @private
     * @ignore
     * @class Server.Modules.Utilities.Validate.Internal
     * @param {object} cfg - Config Object
     */
    const ValidateInternal = function ValidateInternal(cfg) {}
    ValidateInternal.prototype.json = JsonValidator();
    ValidateInternal.prototype.string = StringValidator();
    ValidateInternal.prototype.csv = CsvValidator();
    ValidateInternal.prototype.extend = Extender();
















    /**
     * (Internal > Pipeline [1]) Init Pipeline
     *
     * @private
     * @memberof Server.Modules.Validate
     * @name pipelines.init
     * @function
     * @ignore
     *
     * @description
     * This is the Module Initialisation Pipeline.
     *
     * @example
     * pipelines.init();        // Pipeline Executes...
     */
    pipelines.init = function ValidateInitPipeline() {
        // noinspection JSUnresolvedFunction
        core.lib.rxPipeline({}).pipe(

            // Fires once on server initialisation:
            pipelines.init.importInitLibrary,
            pipelines.init.bindLoadSchemaFiles,
            pipelines.init.loadLocalSchema,
            pipelines.init.bindValidator,

        ).subscribe();
    };


    /**
     * (Internal > Init Pipeline Methods [1]) Import & Initialise Library
     *
     * @private
     * @memberof Server.Modules.Validate
     * @name pipelines.init.importInitLibrary
     * @function
     * @ignore
     * @param {observable} source - The Source Observable
     * @return {observable} output - Output Observable
     *
     * @description
     * This Init Pipeline method is responsible for importing the JSON Schema Validation Library in to the
     * module's memory.
     */
    pipelines.init.importInitLibrary = function ValidateIPLImportInitLib(source) {
        // noinspection JSUnresolvedFunction
        return core.lib.rxOperator(function ValidateIPLImportInitLibOp(observer, evt) {
            o.log('debug',
                'Validate > [1] Importing & Initialising JSON Schema Validation Library', {name: mod.name},
                'VALIDATE_IMPORT_INIT_LIB');
            // noinspection JSUnresolvedVariable
            o.Library = require('./_support/ajv7.min.js').default;
            o.localSchemaPath = core.fetchBasePath('module') + '/_definitions/json-schema';
            o.loadSchema = function ValidateLoadSchema(uri) {
                return new Promise(function (resolve, reject) {
                    const uriArray = uri.split('/');
                    const filename = uriArray[uriArray.length - 1];
                    let loadedFile;
                    try {
                        loadedFile = require(o.localSchemaPath + '/' + filename);
                    } catch(err) {
                        reject(err);
                    }
                    if(loadedFile) resolve(loadedFile);
                });
            }
            o.instance = new o.Library({loadSchema: o.loadSchema});
            o.validators = {};
            observer.next(evt);
        }, source);
    };

    /**
     * (Internal > Init Pipeline Methods [2]) Bind Load Schema Method
     *
     * @private
     * @memberof Server.Modules.Validate
     * @name pipelines.init.bindLoadSchemaFiles
     * @function
     * @ignore
     * @param {observable} source - The Source Observable
     * @return {observable} output - Output Observable
     *
     * @description
     * This Init Pipeline method is responsible for binding a method to the Validate Module Singleton
     * that allows the caller to load a JSON Schema definition file from either a local or remote source.
     */
    pipelines.init.bindLoadSchemaFiles = function ValidateIPLBindLoadSchemaFiles(source) {
        // noinspection JSUnresolvedFunction
        return core.lib.rxOperator(function ValidateIPLBindLoadSchemaFilesOp(observer, evt) {
            o.log('debug',
                'Validate > [2] Binding Loader Method', {name: mod.name},
                'VALIDATE_BINDING_LOADER');

            /**
             * Load JSON Schema Definition File
             *
             * @public
             * @ignore
             * @memberof Server.Modules.Validate
             * @name load
             * @function
             * @param {string} location - Schema File Location
             * @return {boolean} result - Method Result
             *
             * @description
             * The load method loads the specified JSON Schema Definition file, compiles it and generators a
             * Validator function which is cached for later use.
             *
             * @example
             * const validateModule = core.module('validate');
             * if(validateModule.load('/path/to/schema/file.json')) {
             *   console.log('Schema Loaded Successfully');
             * }
             */
            mod.load = function ValidateLoadSchema(location) {
                let schema; let validateFn;
                const locationArray = location.split('/');
                const filename = locationArray[locationArray.length - 1];
                try {
                    schema = require(location);
                } catch(err) {
                    o.log('error',
                        'Validate > Load Method could not find specified schema', {location: location, error: err},
                        'VALIDATE_ERR_LOADING_SCHEMA');
                    return false;
                }
                try {
                    o.instance.compileAsync(schema).then(function (validateFn) {
                        o.validators[filename] = validateFn;
                    }).catch(function(err) {
                        o.log('error',
                            'Validate > Error Async Compiling Schema', {location: location, error: err},
                            'VALIDATE_ERR_LOADING_SCHEMA');
                    });
                } catch(err) {
                    o.log('error',
                        'Validate > Failed to Compile JSON Schema File', {location: location, error: err},
                        'VALIDATE_ERR_COMPILE_SCHEMA');
                    return false;
                }
            }
            observer.next(evt);
        }, source);
    };

    /**
     * (Internal > Init Pipeline Methods [3]) Load Local Schema
     *
     * @private
     * @ignore
     * @memberof Server.Modules.Validate
     * @name pipelines.init.loadLocalSchema
     * @function
     * @ignore
     * @param {observable} source - The Source Observable
     * @return {observable} output - Output Observable
     *
     * @description
     * This Init Pipeline method is responsible for finding, importing and loading each of the locally
     * available JSON Schema files in to the module's memory.
     */
    pipelines.init.loadLocalSchema = function ValidateIPLLoadLocalSchema(source) {
        // noinspection JSUnresolvedFunction
        return core.lib.rxOperator(function ValidateIPLLoadLocalSchemaOp(observer, evt) {
            o.log('debug',
                'Validate > [2] Loading Local JSON Schema Files', {name: mod.name},
                'VALIDATE_LOAD_LOCAL_SCHEMA');
            const localSchemaPath = core.fetchBasePath('module') + '/_definitions/json-schema';
            require("fs").access(localSchemaPath, function ValidateCheckDir(pathLookupErr) {
                if (!pathLookupErr) {
                    require("fs").readdir(localSchemaPath,
                        function ValidateReadDirFn(pathListingErr, pathListingFiles) {
                        if (pathListingErr) {
                            o.log('error',
                                'Validate > Cannot get file list from local schema definitions path', {name: mod.name},
                                'VALIDATE_ERR_LOAD_LOCAL_NO_LIST');
                            observer.next(evt);
                        } else {
                            pathListingFiles.forEach(function (file) {
                                if(file.endsWith('.json')) {
                                    if(mod.load(localSchemaPath + '/' + file)) {
                                        o.log('debug',
                                            'Validate > Loaded Local JSON Schema Definition File',
                                            {location: file}, 'VALIDATE_LOADED_LOCAL_FILE');
                                    }
                                }
                            });
                            observer.next(evt);
                        }
                    });
                } else {
                    o.log('error',
                        'Validate > Cannot find valid local schema definitions path', {name: mod.name},
                        'VALIDATE_ERR_LOAD_LOCAL_INVALID_PATH');
                    observer.next(evt);
                }
            });
        }, source);
    };

    /**
     * (Internal > Init Pipeline Methods [4]) Bind Validator Method
     *
     * @private
     * @ignore
     * @memberof Server.Modules.Validate
     * @name pipelines.init.bindValidator
     * @function
     * @ignore
     * @param {observable} source - The Source Observable
     * @return {observable} output - Output Observable
     *
     * @description
     * This Init Pipeline method is responsible for binding the Validator Method to the Validate Module
     * Singleton.
     */
    pipelines.init.bindValidator = function ValidateIPLBindValidator(source) {
        // noinspection JSUnresolvedFunction
        return core.lib.rxOperator(function ValidateIPLBindValidatorOp(observer, evt) {
            o.log('debug',
                'Validate > [2] Binding Validator Method', {name: mod.name},
                'VALIDATE_BINDING_VALIDATOR');
            mod.validate = function ValidateValidator(schemaFile, jsonFile) {
                let jsonContent;
                try {
                    jsonContent = require(jsonFile);
                } catch(err) {
                    o.log('error',
                        'Validate > Cannot Validate - JSON File Cannot Be Found',
                        {schema: schemaFile, json: jsonFile, error: err}, 'VALIDATE_ERR_JSON_NOT_FOUND');
                    return false;
                }
                if(!o.validators[schemaFile]) {
                    o.log('error',
                        'Validate > Cannot Validate - Schema File Invalid Or Not Loaded',
                        {schema: schemaFile, json: jsonFile}, 'VALIDATE_ERR_SCHEMA_NOT_FOUND');
                    return false;
                } else {
                    const check = o.validators[schemaFile](jsonContent);
                    if(!check) {
                        o.log('error',
                            'Validate > JSON Validation Failed',
                            {schema: schemaFile, json: jsonFile, error: o.validators[schemaFile].errors},
                            'VALIDATE_ERR_SCHEMA_NOT_FOUND');
                        return false;
                    } else {
                        o.log('debug',
                            'Validate > JSON Validation Successful',
                            {schema: schemaFile, json: jsonFile},
                            'VALIDATE_JSON_VALIDATED');
                        return true;
                    }
                }
            }
            observer.next(evt);
        }, source);
    };
}();
