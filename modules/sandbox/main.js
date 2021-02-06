!function SandboxModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Sandbox Module
   *
   * @public
   * @class Server.Modules.Sandbox
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Sandbox} module - The Sandbox Module Singleton
   *
   * @description This is the Sandbox Module of the Blackrock Application Server.
   * It provides a virtualized environment within which to execute Javascript
   * code that is un-trusted.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function SandboxModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Sandbox'); o.log = core.module('logger').log;
    o.log('debug', 'Blackrock Sandbox Module > Initialising...', {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function SandboxModuleNextTickCb() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Setup Sandbox Module
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function SandboxInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.importLibraries,
        pipelines.init.setupEndpoint,

        // Fires once per call to Execute Code on this Module:
        pipelines.init.createVM,
        pipelines.init.getCode,
        pipelines.init.executeCode

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Import Libraries
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function importLibraries
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
  pipelines.init.importLibraries = function SandboxIPLImportLibraries(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function SandboxIPLImportLibrariesOp(observer, evt) {
      const {NodeVM} = require('./_support/main.js');
      evt.NodeVM = NodeVM;
      o.log('debug_deep', 'Blackrock Sandbox > [1] Libraries Imported.',
          {module: mod.name}, 'SANDBOX_LIBS_IMPORTED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [2] - Operator) Setup Code Execution Endpoint
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function setupEndpoint
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
  pipelines.init.setupEndpoint = function SandboxIPLSetupEndpoint(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function SandboxIPLSetupEndpointOp(observer, evt) {

      /**
       * Execute Code in Sandbox
       *
       * @public
       * @memberof Server.Modules.Sandbox
       * @function execute
       * @param {object} options - Options Object
       * @param {string} options.file - Path to File to Execute
       * @param {function} cb - Callback Function
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.execute = evt.Execute = function SandboxIPLExecute(options, cb) {
        o.log('debug_deep',
            'Sandbox > [3] Call Received to Execute Code',
            {options: options, module: mod.name}, 'SANDBOX_CALL_TO_EXEC_CODE');
        const message = {parentEvent: evt, options: options, cb: cb};
        observer.next(message);
      };
      o.log('debug_deep',
          'Sandbox > [2] Code Execution Endpoint Attached To This Module',
          {module: mod.name}, 'SANDBOX_EXEC_ENDPOINT_BOUND');
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Create VM
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function createVM
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
  pipelines.init.createVM = function SandboxIPLCreateVM(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function SandboxIPLCreateVMOp(observer, evt) {
      evt.vm = new evt.parentEvent.NodeVM({
        console: 'inherit',
        sandbox: {},
        require: {
          external: true,
          builtin: ['fs', 'path', 'dgram'],
          mock: {
            fs: {
              readFileSync() {
                return 'Nice try!';
              },
            },
          },
        },
      });
      o.log('debug_deep', 'Sandbox > [4] VM Created', {module: mod.name}, 'SANDBOX_VM_CREATED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [4] - Operator) Get Code
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function getCode
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
  pipelines.init.getCode = function SandboxIPLGetCode(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function SandboxIPLGetCodeOp(observer, evt) {
      if (evt.options.file) {
        const fs = require('fs');
        try {
          const options = evt.options; const cb = evt.cb; const parentEvent = evt.parentEvent; const vm = evt.vm;
          fs.readFile(evt.options.file, function SandboxIPLGetCodeReadFileCb(err, data) {
            const event = {
              options: options,
              cb: cb,
              parentEvent: parentEvent,
              vm: vm,
            };
            if (err) throw (err);
            event.options.code = '' + data;
            observer.next(event);
            o.log('debug_deep', 'Sandbox > [4] Code Read From File',
                {module: mod.name}, 'SANDBOX_CODE_READ_FROM_FILE');
          });
        } catch (e) {
          observer.next(evt);
          o.log('error',
              'Sandbox > [4] Error Attempting to Read Code From File',
              {module: mod.name}, 'SANDBOX_ERR_READ_CODE_FROM_FILE');
        }
      } else {
        observer.next(evt);
        o.log('debug_deep',
            'Sandbox > [4] No Need to Read Code From File - Provided Directly',
            {module: mod.name}, 'SANDBOX_CODE_PROVIDED_DIRECT');
      }
    }, source);
  };

  /**
   * (Internal > Stream  Methods [5] - Operator) Execute Code
   *
   * @private
   * @memberof Server.Modules.Sandbox
   * @function executeCode
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
  pipelines.init.executeCode = function SandboxIPLExecuteCode(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function SandboxIPLExecuteCodeOp(observer, evt) {
      evt.ctrl = evt.vm.run(evt.options.code, core.fetchBasePath('module') +
          '/modules/sandbox/main.js');
      evt.cb({ctrl: evt.ctrl, file: evt.options.file, i: evt.options.i});
      observer.next(evt);
      o.log('debug_deep', 'Sandbox > [5] Code Executed', {module: mod.name}, 'SANDBOX_EXEC_CODE');
    }, source);
  };
}();
