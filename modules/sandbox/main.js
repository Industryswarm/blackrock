!function SandboxModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;


  /**
   * Blackrock Sandbox Module
   *
   * @class Server.Modules.Sandbox
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Sandbox} module - The Sandbox Module
   *
   * @description This is the Sandbox Module of the Blackrock Application Server.
   * It provides a virtualized environment within which to execute Javascript
   * code that is un-trusted.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function SandboxModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Sandbox'); log = core.module('logger').log;
    log('debug', 'Blackrock Sandbox Module > Initialising...', {}, 'SANDBOX_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupSandboxModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * =====================
   * Event Stream Pipeline
   * =====================
   */

  /**
   * (Internal > Pipeline [1]) Setup Sandbox Module
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupSandboxModule = function SandboxModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function SandboxModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function SandboxModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function SandboxModuleSetupPipelinePipe() {
        log('debug_deep',
            'Blackrock Sandbox Module > Setup Sandbox Pipeline Created - Executing Now:',
            {}, 'SANDBOX_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.importLibraries,
            streamFns.setupEndpoint,

            // Fires once per call to Execute Code on this Module:
            streamFns.createVM,
            streamFns.getCode,
            streamFns.executeCode

        ).subscribe();
      },
    });
  };


  /**
   * =====================================
   * Sandbox Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Import Libraries
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.importLibraries = function SandboxModuleImportLibraries(source) {
    return lib.rxOperator(function(observer, evt) {
      const {NodeVM} = require('./_support/main.js');
      evt.NodeVM = NodeVM;
      log('debug_deep', 'Blackrock Sandbox > [1] Libraries Imported.', {}, 'SANDBOX_LIBS_IMPORTED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [2] - Operator) Setup Code Execution Endpoint
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupEndpoint = function SandboxModuleSetupEndpoint(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.Execute = function SandboxModuleExecute(options, cb) {
        log('debug_deep',
            'Blackrock Sandbox > [3] Call Received to Execute Code',
            {options: options}, 'SANDBOX_CALL_TO_EXEC_CODE');
        const message = {parentEvent: evt, options: options, cb: cb};
        observer.next(message);
      };
      log('debug_deep',
          'Blackrock Sandbox > [2] Code Execution Endpoint Attached To This Module',
          {}, 'SANDBOX_EXEC_ENDPOINT_BOUND');
      mod.execute = evt.Execute;
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Create VM
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createVM = function SandboxModuleCreateVM(source) {
    return lib.rxOperator(function(observer, evt) {
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
      log('debug_deep', 'Blackrock Sandbox > [4] VM Created', {}, 'SANDBOX_VM_CREATED');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [4] - Operator) Get Code
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.getCode = function SandboxModuleGetCode(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.options.file) {
        const fs = require('fs');
        try {
          const options = evt.options; const cb = evt.cb; const parentEvent = evt.parentEvent; const vm = evt.vm;
          fs.readFile(evt.options.file, function SandboxModuleGetCodeReadFileCallback(err, data) {
            const event = {
              options: options,
              cb: cb,
              parentEvent: parentEvent,
              vm: vm,
            };
            if (err) throw (err);
            event.options.code = '' + data;
            observer.next(event);
            log('debug_deep', 'Blackrock Sandbox > [4] Code Read From File', {}, 'SANDBOX_CODE_READ_FROM_FILE');
          });
        } catch (e) {
          observer.next(evt);
          log('error',
              'Blackrock Sandbox > [4] Error Attempting to Read Code From File',
              {}, 'SANDBOX_ERR_READ_CODE_FROM_FILE');
        }
      } else {
        observer.next(evt);
        log('debug_deep',
            'Blackrock Sandbox > [4] No Need to Read Code From File - Provided Directly',
            {}, 'SANDBOX_CODE_PROVIDED_DIRECT');
      }
    }, source);
  };

  /**
   * (Internal > Stream  Methods [5] - Operator) Execute Code
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.executeCode = function SandboxModuleExecuteCode(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.ctrl = evt.vm.run(evt.options.code, core.fetchBasePath('module') +
          '/modules/sandbox/main.js');
      evt.cb({ctrl: evt.ctrl, file: evt.options.file, i: evt.options.i});
      observer.next(evt);
      log('debug_deep', 'Blackrock Sandbox > [5] Code Executed', {}, 'SANDBOX_EXEC_CODE');
    }, source);
  };
}();
