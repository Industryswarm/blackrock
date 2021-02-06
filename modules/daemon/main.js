!function DaemonModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Daemon Module
   *
   * @public
   * @class Server.Modules.Daemon
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Daemon} module - The Daemon Module Singleton
   *
   * @description This is the Daemon Module of the Blackrock Application Server.
   * It allows the user to run the application server as a system daemon, as
   * opposed to being tied to the current console session. There are currently
   * no accessible methods exposed on this module.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function DaemonModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Daemon'); o.log = core.module('logger').log;
    core.on('updateLogFn', function() {
      o.log = core.module('logger').log;
    });
    o.log('debug', 'Daemon > Initialising...', {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function DaemonModuleInitPipeline() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Init Pipeline
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name init
   * @ignore
   * @function
   *
   * @description
   * Tbc...
   *
   * @example
   * pipelines.init();
   */
  pipelines.init = function DaemonInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.registerWithCLI,
        pipelines.init.listenToStart,

        // Fires on provision of daemon command from CLI:
        pipelines.init.checkNameAndInit,
        pipelines.init.setupCallbacks,
        pipelines.init.checkRoot,
        pipelines.init.startDaemon,
        pipelines.init.stopDaemon,
        pipelines.init.restartDaemon,
        pipelines.init.statusDaemon

    ).subscribe();
  };


  /**
   * (Internal > Init Pipeline Methods [1]) Register With CLI
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name registerWithCLI
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.registerWithCLI = function DaemonIPLRegWithCLI(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLRegWithCLIOp(observer, evt) {
      o.log('debug', 'Daemon > [0] Daemon registering with CLI...', {module: mod.name},
          'MODULE_REGISTER_WITH_CLI');
      core.module.isLoaded('cli').then(function DaemonIPLCLIIsModLoaded(cliMod) {
        cliMod.register([
          {'cmd': 'start', 'params': '\t\t', 'info': 'Starts the daemon server',
            'fn': function DaemonIPLCLIRegOne(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'start', 'params': params});
          }},
          {'cmd': 'stop', 'params': '\t\t', 'info': 'Stops the daemon server',
            'fn': function DaemonIPLCLIRegTwo(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'stop', 'params': params});
          }},
          {'cmd': 'status', 'params': '\t\t', 'info': 'Gets the status of the daemon server',
            'fn': function DaemonIPLCLIRegThree(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'status', 'params': params});
          }},
          {'cmd': 'restart', 'params': '\t', 'info': 'Restarts the daemon server',
            'fn': function DaemonIPLCLIRegFour(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'restart', 'params': params});
          }},
        ]);
      }).catch(function DaemonIPLCLIRegFail(err) {
        o.log('error',
            'Daemon > Failed to register with CLI - CLI module not loaded',
            {module: mod.name, error: err}, 'CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [2]) Listen to Start Endpoint
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name listenToStart
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.listenToStart = function DaemonIPLListenToStart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLListenToStartOp(observer, evt) {
      o.log('debug',
          'Daemon > [1a] Listener created for \'DAEMON_INIT_DAEMON\' event',
          {module: mod.name}, 'DAEMON_LISTENER_CREATED');
      core.on('DAEMON_INIT_DAEMON', function DaemonIPLListenToStartDaemonCb(daemonParams) {
        core.stopActivation = true;
        o.log('debug',
            'Daemon > [1b] \'DAEMON_INIT_DAEMON\' Event Received',
            {module: mod.name}, 'DAEMON_LISTENER_EVT_RECEIVED');
        evt.name = core.pkg().name;
        evt.isChildProcess = process.send;
        evt.command = daemonParams.command;
        if (!process.send) {
          observer.next(evt);
        } else {
          o.log('fatal',
              'Daemon > Initiated, but running in daemon mode. Terminating...',
              {module: mod.name}, 'DAEMON_RUNNING_IN_DAEMON_MODE_TERM');
        }
      });
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [3]) Check Daemon Name And Init Daemon
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name checkNameAndInit
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.checkNameAndInit = function DaemonIPLCheckNameAndInit(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLCheckNameAndInitOp(observer, evt) {
      if (!evt.name) {
        o.log('error',
            'Daemon > Name not passed correctly to daemon module',
            {module: mod.name}, 'DAEMON_INCORRECT_NAME');
        process.exit();
      }
      o.daemonize = require('./_support/daemonize');
      const strippedName = evt.name.replace(/-/g, '');
      evt.daemon = o.daemonize.setup({
        main: '../../../' + core.pkg().main,
        name: strippedName,
        pidfile: '/var/run/' + strippedName + '.pid',
        cwd: process.cwd(),
        silent: true,
      });
      o.log('debug',
          'Daemon > [2] Daemon Name Checked & Daemon Initialised',
          {module: mod.name}, 'DAEMON_NAME_CHECKED_AND_INIT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [3]) Setup Daemon Callbacks
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name setupCallbacks
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupCallbacks = function DaemonIPLSetupCb(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLSetupCbOp(observer, evt) {
      evt.daemon
          .on('starting', function DaemonIPLSetupCbOnStarting() {
            console.log('Daemon > Starting...\n');
          })
          .on('started', function DaemonIPLSetupCbOnStarted(pid) {
            console.log('Daemon > Started. PID: ' + pid + '\n');
            process.exit();
          })
          .on('stopping', function DaemonIPLSetupCbOnStopping() {
            console.log('Daemon > Stopping...\n');
          })
          .on('running', function DaemonIPLSetupCbOnRunning(pid) {
            console.log('Daemon > Already running. PID: ' + pid + '\n');
            process.exit();
          })
          .on('notrunning', function DaemonIPLSetupCbOnNotRunning() {
            console.log('Daemon > Not running\n');
            process.exit();
          })
          .on('error', function DaemonIPLSetupCbOnError(err) {
            console.log('Daemon > Failed to start:  ' + err.message + '\n');
            process.exit();
          });
      if (evt.command === 'restart') {
        evt.daemon.on('stopped', function DaemonIPLSetupCbOnStoppedForRestart(pid) {
          console.log('Daemon > Stopped (' + pid + ')\n');
          evt.daemon.start();
        });
      } else {
        evt.daemon.on('stopped', function DaemonIPLSetupCbOnStopped(pid) {
          console.log('Daemon > Stopped(' + pid + ')\n');
          process.exit();
        });
      }
      o.log('debug',
          'Daemon > [3] Setup callbacks for daemon',
          {module: mod.name}, 'DAEMON_CALLBACKS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [4]) Check Root
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name checkRoot
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.checkRoot = function DaemonIPLCheckRoot(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLCheckRootOp(observer, evt) {
      if ((evt.command === 'start' || evt.command === 'stop' || evt.command === 'restart') && process.getuid() !== 0) {
        console.log('Daemon > Expected to run as root\n');
        process.exit();
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [5]) Start Daemon
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name startDaemon
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.startDaemon = function DaemonIPLStartDaemon(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLStartDaemonOp(observer, evt) {
      if (evt.command === 'start') evt.daemon.start();
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [6]) Stop Daemon
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name stopDaemon
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.stopDaemon = function DaemonIPLStopDaemon(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLStopDaemonOp(observer, evt) {
      if (evt.command === 'stop') evt.daemon.stop();
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [7]) Restart Daemon
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name restartDaemon
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.restartDaemon = function DaemonIPLRestartDaemon(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLRestartDaemonOp(observer, evt) {
      if (evt.command === 'restart') {
        const status = evt.daemon.status();
        if (status) evt.daemon.stop();
        else evt.daemon.start();
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [8]) Status of Daemon
   *
   * @private
   * @memberof Server.Modules.Daemon
   * @name statusDaemon
   * @ignore
   * @function
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.statusDaemon = function DaemonIPLStatusDaemon(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function DaemonIPLStatusDaemonOp(observer, evt) {
      if (evt.command === 'status') {
        if (evt.daemon.status()) {
          console.log('Daemon > Daemon is running\n');
          process.exit();
        } else {
          console.log('Daemon > Daemon is not running\n');
          process.exit();
        }
      }
      observer.next(evt);
    }, source);
  };
}();
