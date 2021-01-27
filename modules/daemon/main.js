!function DaemonModuleWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function DaemonEndsWith(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  let core; let mod; let log; let daemonize;
  const pipelines = {}; const streamFns = {}; let lib; let rx;


  /**
   * Blackrock Daemon Module
   *
   * @class Server.Modules.Daemon
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Daemon} module - The Daemon Module
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
  module.exports = function DaemonModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Daemon'); log = core.module('logger').log;
    core.on('updateLogFn', function() {
      log = core.module('logger').log;
    });
    log('debug', 'Blackrock Daemon Module > Initialising...', {}, 'DAEMON_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupDaemonModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Daemon
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupDaemonModule = function DaemonModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function DaemonModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function DaemonModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function DaemonModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Daemon Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'DAEMON_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        stream.pipe(

            // Fires once on server initialisation:
            streamFns.registerWithCLI,
            streamFns.listenToStart,

            // Fires on provision of daemon command from CLI:
            streamFns.checkNameAndInit,
            streamFns.setupCallbacks,
            streamFns.checkRoot,
            streamFns.startDaemon,
            streamFns.stopDaemon,
            streamFns.restartDaemon,
            streamFns.statusDaemon

        ).subscribe();
      },
    });
  };


  /**
   * Daemon Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [0]) Register With CLI
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.registerWithCLI = function DaemonModuleRegisterWithCLI(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Daemon Module > [0] Daemon registering with CLI...', {}, 'DAEMON_REGISTER_WITH_CLI');
      core.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'start', 'params': '\t\t', 'info': 'Starts the daemon server', 'fn': function(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'start', 'params': params});
          }},
          {'cmd': 'stop', 'params': '\t\t', 'info': 'Stops the daemon server', 'fn': function(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'stop', 'params': params});
          }},
          {'cmd': 'status', 'params': '\t\t', 'info': 'Gets the status of the daemon server', 'fn': function(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'status', 'params': params});
          }},
          {'cmd': 'restart', 'params': '\t', 'info': 'Restarts the daemon server', 'fn': function(params) {
            core.emit('DAEMON_INIT_DAEMON', {'command': 'restart', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        log('error',
            'Blackrock Daemon Module > Failed to register with CLI - CLI module not loaded',
            err, 'DAEMON_CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [1]) Listen to Start Endpoint
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.listenToStart = function DaemonModulePipelineFnsListenToStart(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Daemon Module > [1a] Listener created for \'DAEMON_INIT_DAEMON\' event',
          {}, 'DAEMON_LISTENER_CREATED');
      core.on('DAEMON_INIT_DAEMON', function DaemonModuleListenToStartStartDaemonCb(daemonParams) {
        core.stopActivation = true;
        log('debug',
            'Blackrock Daemon Module > [1b] \'DAEMON_INIT_DAEMON\' Event Received',
            {}, 'DAEMON_LISTENER_EVT_RECEIVED');
        evt.name = core.pkg().name;
        evt.isChildProcess = process.send;
        evt.command = daemonParams.command;
        if (!process.send) {
          observer.next(evt);
        } else {
          log('fatal',
              'Blackrock Daemon Module > Initiated, but running in daemon mode. Terminating...',
              {}, 'DAEMON_RUNNING_IN_DAEMON_MODE_TERM');
        }
      });
    }, source);
  };


  /**
   * Daemon Stream Processing Functions...
   * (Fires on provision of daemon command from CLI)
   */

  /**
   * (Internal > Stream Methods [2]) Check Daemon Name And Init Daemon
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.checkNameAndInit = function DaemonModulePipelineFnsCheckNameAndInit(source) {
    return lib.rxOperator(function(observer, evt) {
      if (!evt.name) {
        log('error',
            'Blackrock Daemon Module > Name not passed correctly to daemon module',
            {}, 'DAEMON_INCORRECT_NAME');
        process.exit();
      }
      daemonize = require('./_support/daemonize');
      const strippedName = evt.name.replace(/-/g, '');
      evt.daemon = daemonize.setup({
        main: '../../../' + core.pkg().main,
        name: strippedName,
        pidfile: '/var/run/' + strippedName + '.pid',
        cwd: process.cwd(),
        silent: true,
      });
      log('debug',
          'Blackrock Daemon Module > [2] Daemon Name Checked & Daemon Initialised',
          {}, 'DAEMON_NAME_CHECKED_AND_INIT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Setup Daemon Callbacks
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupCallbacks = function DaemonModulePipelineFnsSetupCallbacks(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.daemon
          .on('starting', function DaemonModulePipelineFnsSetupCallbacksOnStarting() {
            console.log('Blackrock Daemon Module > Starting...\n');
          })
          .on('started', function DaemonModulePipelineFnsSetupCallbacksOnStarted(pid) {
            console.log('Blackrock Daemon Module > Started. PID: ' + pid + '\n');
            process.exit();
          })
          .on('stopping', function DaemonModulePipelineFnsSetupCallbacksOnStopping() {
            console.log('Blackrock Daemon Module > Stopping...\n');
          })
          .on('running', function DaemonModulePipelineFnsSetupCallbacksOnRunning(pid) {
            console.log('Blackrock Daemon Module > Already running. PID: ' + pid + '\n');
            process.exit();
          })
          .on('notrunning', function DaemonModulePipelineFnsSetupCallbacksOnNotRunning() {
            console.log('Blackrock Daemon Module > Not running\n');
            process.exit();
          })
          .on('error', function DaemonModulePipelineFnsSetupCallbacksOnError(err) {
            console.log('Blackrock Daemon Module > Failed to start:  ' + err.message + '\n');
            process.exit();
          });
      if (evt.command === 'restart') {
        evt.daemon.on('stopped', function DaemonModulePipelineFnsSetupCallbacksOnStoppedForRestart(pid) {
          console.log('Blackrock Daemon Module > Stopped (' + pid + ')\n');
          evt.daemon.start();
        });
      } else {
        evt.daemon.on('stopped', function DaemonModulePipelineFnsSetupCallbacksOnStopped(pid) {
          console.log('Blackrock Daemon Module > Stopped(' + pid + ')\n');
          process.exit();
        });
      }
      log('debug',
          'Blackrock Daemon Module > [3] Setup callbacks for daemon',
          {}, 'DAEMON_CALLBACKS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Check Root
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.checkRoot = function DaemonModulePipelineFnsCheckRoot(source) {
    return lib.rxOperator(function(observer, evt) {
      if ((evt.command === 'start' || evt.command === 'stop' || evt.command === 'restart') && process.getuid() !== 0) {
        console.log('Blackrock Daemon Module > Expected to run as root\n');
        process.exit();
      } else {
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Start Daemon
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.startDaemon = function DaemonModulePipelineFnsStartDaemon(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'start') {
        evt.daemon.start();
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Stop Daemon
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.stopDaemon = function DaemonModulePipelineFnsStopDaemon(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'stop') {
        evt.daemon.stop();
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Restart Daemon
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.restartDaemon = function DaemonModulePipelineFnsRestartDaemon(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'restart') {
        const status = evt.daemon.status();
        if (status) {
          evt.daemon.stop();
        } else {
          evt.daemon.start();
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Status of Daemon
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.statusDaemon = function DaemonModulePipelineFnsStatusDaemon(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'status') {
        if (evt.daemon.status()) {
          console.log('Blackrock Daemon Module > Daemon is running\n');
          process.exit();
        } else {
          console.log('Blackrock Daemon Module > Daemon is not running\n');
          process.exit();
        }
      }
      observer.next(evt);
    }, source);
  };
}();
