!function InstallerModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Installer Module
   *
   * @class Server.Modules.Installer
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Installer} module - The Installer Module Singleton
   *
   * @description This is the Installer Module of the Blackrock Application Server.
   * It provides tools to install new apps from files (that may have been exported
   * from another system) or from the Blackrock App Marketplace.
   * PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const installerModule = core.module('installer');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function InstallerModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Installer'); o.log = core.module('logger').log;
    o.log('debug', 'Blackrock Installer Module > Initialising...', {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Setup Installer Module
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function InstallerInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.bindModuleMethods,
        pipelines.init.registerWithCLI,
        pipelines.init.listenToStart,

        // Fires once per CLI command:
        pipelines.init.installApp,
        pipelines.init.removeApp,
        pipelines.init.switchRegistry,
        pipelines.init.listApps,
        pipelines.init.searchApps

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [0]) Bind Module Methods
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function bindModuleMethods
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
  pipelines.init.bindModuleMethods = function InstallerIPLBindModuleMethods(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      mod.switchRegistry = o.switchRegistry;
      mod.download = o.download;
      mod.install = o.install;
      mod.remove = o.remove;
      mod.list = o.list;
      mod.details = o.details;
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [1]) Register With CLI
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function registerWithCLI
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
  pipelines.init.registerWithCLI = function InstallerIPLRegisterWithCLI(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Blackrock Installer Module > [1] Installer registering with CLI...',
          {module: mod.name}, 'MODULE_REGISTER_WITH_CLI');
      core.module.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'install', 'params': '[app]', 'info': 'Installs a new app', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'install', 'params': params});
          }},
          {'cmd': 'remove', 'params': '[app]', 'info': 'Removes an installed app', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'remove', 'params': params});
          }},
          {'cmd': 'switch', 'params': '[registry]', 'info': 'Switches app registry', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'switch', 'params': params});
          }},
          {'cmd': 'list-apps', 'params': '\t', 'info': 'Lists installed apps', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'list-apps', 'params': params});
          }},
          {'cmd': 'search', 'params': '\t\t', 'info': 'Searches registry for app', 'fn': function(params) {
            core.emit('INSTALLER_INIT_INSTALLER', {'command': 'search', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        o.log('error',
            'Blackrock Installer Module > Failed to register with CLI - CLI module not loaded',
            {module: mod.name, error: err}, 'CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Listen to Start Endpoint
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function listenToStart
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
  pipelines.init.listenToStart = function InstallerIPLListenToStart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Blackrock Installer Module > [2a] Listener created for \'INSTALLER_INIT_INSTALLER\' event',
          {module: mod.name}, 'INSTALLER_LISTENER_CREATED');
      core.on('INSTALLER_INIT_INSTALLER', function InstallerIPLListenToStartCb(installerParams) {
        core.stopActivation = true;
        o.log('debug',
            'Blackrock Installer Module > [2b] \'INSTALLER_INIT_INSTALLER\' Event Received',
            {module: mod.name}, 'INSTALLER_LISTENER_EVT_RECEIVED');
        evt.command = installerParams.command;
        evt.params = installerParams.params;
        observer.next(evt);
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Install App
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function installApp
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
  pipelines.init.installApp = function InstallerIPLInstall(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'install') {
        o.log('debug', 'Installer > [3] Installing App...',
            {module: mod.name}, 'INSTALLER_INSTALL');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Remove App
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function removeApp
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
  pipelines.init.removeApp = function InstallerIPLRemove(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'remove') {
        o.log('debug', 'Installer > [4] Removing App...',
            {module: mod.name}, 'INSTALLER_REMOVE');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Switch Registry
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function switchRegistry
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
  pipelines.init.switchRegistry = function InstallerIPLSwitch(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'switch') {
        o.log('debug', 'Installer > [5] Switching Registry...',
            {module: mod.name}, 'INSTALLER_SWITCH');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) List Apps In Registry
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function listApps
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
  pipelines.init.listApps = function InstallerIPLListApps(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'list-apps') {
        o.log('debug', 'Installer > [6] Listing Apps...',
            {module: mod.name}, 'INSTALLER_LIST_APPS');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Search for App
   *
   * @private
   * @memberof Server.Modules.Installer
   * @function searchApps
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
  pipelines.init.searchApps = function InstallerIPLSearch(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'search') {
        o.log('debug', 'Installer > [7] Listing Apps...',
            {module: mod.name}, 'INSTALLER_SEARCH');
        observer.next(evt);
      } else {
        observer.next(evt);
      }
    }, source);
  };


  /**
   * External Method: Switch Registry
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function switchRegistry
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.switchRegistry = function InstallerSwitchRegistry(input) {};

  /**
   * External Method: Download Item
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function download
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.download = function InstallerDownload(input) {};

  /**
   * External Method: Install Item
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function install
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.install = function InstallerInstall(input) {};

  /**
   * External Method: Remove Item
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function remove
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.remove = function InstallerRemove(input) {};

  /**
   * External Method: Return List of Items
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function list
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.list = function InstallerReturnList(input) {};

  /**
   * External Method: Return Item Details
   *
   * @public
   * @memberof Server.Modules.Installer
   * @function details
   * @param {object} input - The Input Object
   * @return {object} result - The Result Object
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.details = function InstallerReturnDetails(input) {};
}();
