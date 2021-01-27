!function ConfigureModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;

  /**
   * Blackrock Configure Module
   *
   * @class Server.Modules.Configure
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Configure} module - The Configure Module
   *
   * @description This is the Configure Module of the Blackrock Application Server.
   * It provides the required tools to manage the application server's configuration,
   * including full and partial updates, and live reload of config mid-execution. There
   * are currently no accessible methods exposed on this module. PLEASE NOTE: This module
   * is undergoing development and is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ConfigureModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Configure'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Configure Module > Initialising...', {}, 'CONFIGURE_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupConfigureModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * EVENT STREAM PIPELINES...
   */

  /**
   * (Internal > Pipeline [1]) Setup Configure
   * @private
   * @return {object} pipeline - Pipeline Object
   */
  pipelines.setupConfigureModule = function ConfigureModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function ConfigureModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function ConfigureModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function ConfigureModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Configure Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'CONFIGURE_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        const stream1 = stream.pipe(

            // Fires once on server initialisation:
            streamFns.registerWithCLI,
            streamFns.listenToStart,

            // Fires once per CLI command:
            streamFns.reloadConfig,
            streamFns.listConfig,
            streamFns.getConfig,
            streamFns.updateConfig

        );
        stream1.subscribe(function ConfigureModuleSetupPipelineSubscribe(res) {
          if (!res.complete) {
            console.log('\nNot Implemented - Configure\n');
          }
          process.exit();
        });
      },
    });
  };


  /**
   * Configure Stream Processing Functions:
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Register With CLI
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   */
  streamFns.registerWithCLI = function ConfigureModuleRegisterWithCLI(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Configure Module > [1] Configure registering with CLI...', {},
          'CONFIGURE_REGISTER_WITH_CLI');
      core.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'update', 'params': '[param]=[value]', 'info': 'Updates a config parameter', 'fn': function(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'update', 'params': params});
          }},
          {'cmd': 'list', 'params': '\t\t', 'info': 'Shows list of config parameters', 'fn': function(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'list', 'params': params});
          }},
          {'cmd': 'get', 'params': '[param]\t', 'info': 'Gets value for a config parameter', 'fn': function(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'get', 'params': params});
          }},
          {'cmd': 'reload', 'params': '\t\t', 'info': 'Reloads system config file', 'fn': function(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'reload', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        log('error',
            'Blackrock Configure Module > Failed to register with CLI - CLI module not loaded',
            err, 'CONFIGURE_CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Listen to Start Endpoint
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   */
  streamFns.listenToStart = function ConfigureModulePipelineFnsListenToStart(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Configure Module > [2a] Listener created for \'CONFIGURE_INIT_CONFIGURE\' event',
          {}, 'CONFIGURE_LISTENER_CREATED');
      core.on('CONFIGURE_INIT_CONFIGURE', function ConfigureModuleStartConfigureCb(configParams) {
        core.stopActivation = true;
        log('debug',
            'Blackrock Configure Module > [2b] \'CONFIGURE_INIT_CONFIGURE\' Event Received',
            {}, 'CONFIGURE_LISTENER_EVT_RECEIVED');
        evt.command = configParams.command;
        evt.params = configParams.params;
        evt.complete = false;
        observer.next(evt);
      });
    }, source);
  };


  /**
   * Configure Stream Processing Functions...
   * (Fires Once per CLI Command)
   */

  /**
   * (Internal > Stream Methods [3]) Reloads Config
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   */
  streamFns.reloadConfig = function ConfigureModulePipelineFnsReloadConfig(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'reload') {
        log('debug', 'Blackrock Configure Module > [3] Reloading System Config...', {}, 'CONFIGURE_RELOADING_CONFIG');
        const configPath = core.fetchBasePath('config');
        let config;
        try {
          config = require(configPath);
        } catch (err) {
          evt.error = err;
          observer.next(evt);
          return;
        }
        const result = core.updateConfig(config);
        if (result) {
          evt.complete = true;
        }
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Lists Config
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding listConfig method within the Configure Module
   */
  streamFns.listConfig = function ConfigureModulePipelineFnsListConfig(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'list') {
        log('debug', 'Blackrock Configure Module > [4] Listing System Config...', {}, 'CONFIGURE_LISTING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Gets Config
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding getConfig method within the Configure Module
   */
  streamFns.getConfig = function ConfigureModulePipelineFnsGetConfig(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'list') {
        log('debug', 'Blackrock Configure Module > [5] Getting System Config...', {}, 'CONFIGURE_GETTING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Updates Config
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding updateConfig method within the Configure Module
   */
  streamFns.updateConfig = function ConfigureModulePipelineFnsUpdateConfig(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'list') {
        log('debug', 'Blackrock Configure Module > [6] Updating System Config...', {}, 'CONFIGURE_UPDATING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };
}();
