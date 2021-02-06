!function ConfigureModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Configure Module
   *
   * @public
   * @class Server.Modules.Configure
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Configure} module - The Configure Module Singleton
   *
   * @description This is the Configure Module of the Blackrock Application Server.
   * It provides the required tools to manage the application server's configuration,
   * including full and partial updates, and live reload of config mid-execution. There
   * are currently no accessible methods exposed on this module. PLEASE NOTE: This module
   * is undergoing development and is not yet functional.
   *
   * @example
   * // For Blackrock As A Dependency Or Internally:
   * const configureModule = core.module('configure');
   *
   * @example
   * // From App Controllers:
   * const configureModule = req.core.module('configure');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ConfigureModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Configure'); o.log = core.module('logger').log;
    o.log('debug', 'Configure > Initialising...', {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Init Pipeline
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name pipelines.init
   * @function
   * @ignore
   *
   * @description
   * This is the Module Initialisation Pipeline for the Configure Module. It executes a pipeline of tasks,
   * in sequence in order to bring the module into an active state.
   *
   * @example
   * pipelines.init();
   */
  pipelines.init = function ConfigureInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.registerWithCLI,
        pipelines.init.listenToStart,

        // Fires once per CLI command:
        pipelines.init.reloadConfig,
        pipelines.init.listConfig,
        pipelines.init.getConfig,
        pipelines.init.updateConfig

    ).subscribe(function ConfigureIPLSubscribe(res) {
      if (!res.complete) {
        console.log('\nNot Implemented - Configure\n');
      }
    });
  };


  /**
   * (Internal > Init Pipeline Methods [1]) Register With CLI
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name registerWithCLI
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.registerWithCLI = function ConfigureIPLRegWithCLI(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLRegWithCLIOp(observer, evt) {
      o.log('debug',
          'Configure > [1] Configure registering with CLI...', {module: mod.name},
          'MODULE_REGISTER_WITH_CLI');
      core.module.isLoaded('cli').then(function ConfigureIPLRegWithCLIIsLoaded(cliMod) {
        cliMod.register([
          {'cmd': 'update', 'params': '[param]=[value]', 'info': 'Updates a config parameter',
            'fn': function ConfigureIPLRegWithCLIUpdate(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'update', 'params': params});
          }},
          {'cmd': 'list', 'params': '\t\t', 'info': 'Shows list of config parameters',
            'fn': function ConfigureIPLRegWithCLIList(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'list', 'params': params});
          }},
          {'cmd': 'get', 'params': '[param]\t', 'info': 'Gets value for a config parameter',
            'fn': function ConfigureIPLRegWithCLIGet(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'get', 'params': params});
          }},
          {'cmd': 'reload', 'params': '\t\t', 'info': 'Reloads system config file',
            'fn': function ConfigureIPLRegWithCLIReload(params) {
            core.emit('CONFIGURE_INIT_CONFIGURE', {'command': 'reload', 'params': params});
          }},
        ]);
      }).catch(function ConfigureIPLRegWithCLIFail(err) {
        o.log('error',
            'Configure > Failed to register with CLI - CLI module not loaded',
            {module: mod.name, error: err}, 'CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [2]) Listen to Start Endpoint
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name listenToStart
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.listenToStart = function ConfigureIPLListenToStart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLListenToStartOp(observer, evt) {
      o.log('debug',
          'Configure > [2a] Listener created for \'CONFIGURE_INIT_CONFIGURE\' event',
          {module: mod.name}, 'CONFIGURE_LISTENER_CREATED');
      core.on('CONFIGURE_INIT_CONFIGURE', function ConfigureIPLListenToStartOn(configParams) {
        core.stopActivation = true;
        o.log('debug',
            'Configure > [2b] \'CONFIGURE_INIT_CONFIGURE\' Event Received',
            {module: mod.name}, 'CONFIGURE_LISTENER_EVT_RECEIVED');
        evt.command = configParams.command;
        evt.params = configParams.params;
        evt.complete = false;
        observer.next(evt);
      });
    }, source);
  };


  /**
   * (Internal > Init Pipeline Methods [3]) Reloads Config
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name reloadConfig
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.reloadConfig = function ConfigureIPLReloadConfig(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLReloadConfigOp(observer, evt) {
      if (evt.command === 'reload') {
        o.log('debug', 'Configure > [3] Reloading System Config...', {module: mod.name},
            'CONFIGURE_RELOADING_CONFIG');
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
        if (result) evt.complete = true;
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [4]) Lists Config
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name listConfig
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding listConfig method within the Configure Module
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.listConfig = function ConfigureIPLListConfig(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLListConfigOp(observer, evt) {
      if (evt.command === 'list') {
        o.log('debug', 'Configure > [4] Listing System Config...', {module: mod.name},
            'CONFIGURE_LISTING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [5]) Gets Config
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name getConfig
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding getConfig method within the Configure Module
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.getConfig = function ConfigureIPLGetConfig(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLGetConfigOp(observer, evt) {
      if (evt.command === 'get') {
        o.log('debug', 'Configure > [5] Getting System Config...', {module: mod.name},
            'CONFIGURE_GETTING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [6]) Updates Config
   *
   * @private
   * @memberof Server.Modules.Configure
   * @name updateConfig
   * @function
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} output - Output Observable
   * @todo Finish coding updateConfig method within the Configure Module
   *
   * @description
   * Tbc...
   *
   * @example
   * // Tbc...
   */
  pipelines.init.updateConfig = function ConfigureIPLUpdateConfig(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ConfigureIPLUpdateConfigOp(observer, evt) {
      if (evt.command === 'update') {
        o.log('debug', 'Configure > [6] Updating System Config...', {module: mod.name},
            'CONFIGURE_UPDATING_CONFIG');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };
}();
