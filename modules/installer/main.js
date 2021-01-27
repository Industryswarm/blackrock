!function InstallerModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;

  /**
   * Blackrock Installer Module
   *
   * @class Server.Modules.Installer
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Installer} module - The Installer Module
   *
   * @description This is the Installer Module of the Blackrock Application Server.
   * It provides tools to install new services from files (that may have been exported
   * from another system) or from the Blackrock Services Marketplace.
   * PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function InstallerModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Installer'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Installer Module > Initialising...', {}, 'INSTALLER_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupInstallerModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Installer Module
   * @private
   * @return {object} pipeline - The Pipeline Module
   */
  pipelines.setupInstallerModule = function InstallerModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function InstallerModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function InstallerModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function InstallerModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Installer Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'INSTALLER_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        const stream = Stream.pipe(

            // Fires once on server initialisation:
            streamFns.registerWithCLI,
            streamFns.listenToStart,

            // Fires once per CLI command:
            streamFns.installService,
            streamFns.removeService,
            streamFns.switchRegistry,
            streamFns.listServices,
            streamFns.searchServices

        );
        stream.subscribe(function InstallerModuleSetupPipelineSubscribe() {
          console.log('\nNot Implemented - Installer\n');
          process.exit();
        });
      },
    });
  };


  /**
   * Installer Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Register With CLI
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.registerWithCLI = function InstallerModuleRegisterWithCLI(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Installer Module > [1] Installer registering with CLI...',
          {}, 'INSTALLER_REGISTER_WITH_CLI');
      core.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'install', 'params': '[service]', 'info': 'Installs a new service', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'install', 'params': params});
          }},
          {'cmd': 'remove', 'params': '[service]', 'info': 'Removes an installed service', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'remove', 'params': params});
          }},
          {'cmd': 'switch', 'params': '[registry]', 'info': 'Switches service registry', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'switch', 'params': params});
          }},
          {'cmd': 'list-services', 'params': '\t', 'info': 'Lists installed services', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'list-services', 'params': params});
          }},
          {'cmd': 'search', 'params': '\t\t', 'info': 'Searches registry for service', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'search', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        log('error',
            'Blackrock Installer Module > Failed to register with CLI - CLI module not loaded',
            err, 'INSTALLER_CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Listen to Start Endpoint
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.listenToStart = function InstallerModuleListenToStart(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Installer Module > [2a] Listener created for \'INSTALLER_INIT_INSTALLER\' event',
          {}, 'INSTALLER_LISTENER_CREATED');
      core.on('INSTALLER_INIT_INSTALLER', function InstallerModuleListenToStartCb(installerParams) {
        core.stopActivation = true;
        log('debug',
            'Blackrock Installer Module > [2b] \'INSTALLER_INIT_INSTALLER\' Event Received',
            {}, 'INSTALLER_LISTENER_EVT_RECEIVED');
        evt.command = installerParams.command;
        evt.params = installerParams.params;
        observer.next(evt);
      });
    }, source);
  };


  /**
   * Installer Stream Processing Functions...
   * (Fires Once Per CLI Command)
   */

  /**
   * (Internal > Stream Methods [3]) Install Service
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.installService = function InstallerModuleInstall(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'install') {
        log('debug', 'Blackrock Installer Module > [3] Installing Service...', {}, 'INSTALLER_INSTALL');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Remove Service
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.removeService = function InstallerModuleRemove(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'remove') {
        log('debug', 'Blackrock Installer Module > [4] Removing Service...', {}, 'INSTALLER_REMOVE');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Switch Registry
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.switchRegistry = function InstallerModuleSwitch(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'switch') {
        log('debug', 'Blackrock Installer Module > [5] Switching Registry...', {}, 'INSTALLER_SWITCH');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) List Services In Registry
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.listServices = function InstallerModuleListServices(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'list-services') {
        log('debug', 'Blackrock Installer Module > [6] Listing Services...', {}, 'INSTALLER_LIST_SERVICES');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Search for Service
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.searchServices = function InstallerModuleSearch(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'search') {
        log('debug', 'Blackrock Installer Module > [7] Listing Services...', {}, 'INSTALLER_SEARCH');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };
}();
