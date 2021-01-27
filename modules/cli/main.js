!function CLIModuleWrapper() {
  let core; let mod; let log; let enableConsole; const cliCommands = {};

  /**
   * Blackrock CLI Module
   *
   * @class Server.Modules.CLI
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.CLI} module - The CLI Module
   *
   * @description This is the CLI Module of the Blackrock Application Server.
   * It is responsible for parsing command-line arguments passed to the application
   * server at startup, and then executing methods from within other modules that have
   * registered with the CLI module for those specific command-line arguments.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function CLIModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('CLI');
    setupExternalModuleMethods();
    mod.register = register;
    log('debug', 'Blackrock CLI Module > Initialising...', {}, 'CLI_INIT');
    core.on('CORE_FINALISING', function() {
      start();
    });
    return mod;
  };


  /**
   * Setup External Methods (log & enableConsole)
   * @private
   * @ignore
   * @function
   */
  const setupExternalModuleMethods = function CLIModuleSetupExternalModuleMethods() {
    // LOGGER MODULE (LOG METHOD):
    log = function CLILog(level, logMsg, attrObj, evtName) {
      const logger = core.module('logger');
      if (logger && logger.log) {
        logger.log(level, logMsg, attrObj, evtName);
      }
    };

    // LOGGER MODULE (ENABLE CONSOLE METHOD):
    enableConsole = function CoreEnableConsole() {
      const logger = core.module('logger');
      if (logger && logger.enableConsole) {
        logger.enableConsole();
      }
    };
  };


  /**
   * (External) Register CLI Commands
   * @memberof Server.Modules.CLI
   * @function
   * @param {object} commands - The Commands Object
   * @return {bool} result - Method Result
   *
   * @example
   * core.isLoaded('cli').then(function(cliMod) {
   *    cliMod.register([
   *      {'cmd': 'install', 'params': '[service]', 'info': 'Installs a new service', 'fn': function(params) {
   *        core.emit('INSTALLER_INIT_INSTALLER', {'command': 'install', 'params': params});
   *      }},
   *      {'cmd': 'remove', 'params': '[service]', 'info': 'Removes an installed service', 'fn': function(params) {
   *        core.emit('INSTALLER_INIT_INSTALLER', {'command': 'remove', 'params': params});
   *      }},
   *    ]);
   *  }).catch(function(err) {
   *    log('error',
   *        'Blackrock Installer Module > Failed to register with CLI - CLI module not loaded',
   *        err, 'INSTALLER_CLI_MOD_NOT_LOADED');
   *  });
   */
  const register = function CLIModuleRegisterCommands(commands) {
    if (typeof commands === 'object' && commands !== null && !Array.isArray(commands)) {
      cliCommands[commands.cmd] = commands;
    } else if (Array.isArray(commands) && commands !== null) {
      for (let i = 0; i < commands.length; i++) {
        cliCommands[commands[i].cmd] = commands[i];
      }
    }
    return true;
  };


  /**
   * Initialises CLI Module
   * @private
   * @ignore
   * @function
   */
  const start = function CLIModuleStart() {
    process.nextTick(function CLIModuleStartNextTickCallback() {
      process.argv.push('terminator');
      // eslint-disable-next-line new-cap
      const lib = core.lib; const rx = lib.rxjs; const op = lib.operators; const stream = new rx.from(process.argv);
      const showHelp = function CLIModuleShowHelp() {
        core.stopActivation = true;
        console.log('\n');
        console.log('Usage: ' + core.pkg().name + ' [options]\n');
        console.log('Options: ');
        console.log('start console\t\t\t\tStarts the server in console mode');
        // eslint-disable-next-line guard-for-in
        for (const cmd in cliCommands) {
          console.log(cmd + ' ' + cliCommands[cmd].params + '\t\t\t' + cliCommands[cmd].info);
        }
        console.log('\n');
        process.exit();
      };
      log('debug',
          'Blackrock CLI Module > Server Initialisation Pipeline Created - Executing Now:',
          {}, 'CLI_EXEC_INIT_PIPELINE'
      );
      stream.pipe(
          op.filter(function CLIModuleStreamFn1Filter(evt) {
            // eslint-disable-next-line no-extend-native
            String.prototype.endsWith = function CLIEndsWith(suffix) {
              return this.indexOf(suffix, this.length - suffix.length) !== -1;
            };
            const endsWithAny = function CLIModuleEndsWithAny(suffixes, string) {
              for (const suffix of suffixes) {
                if (string.endsWith(suffix)) return true;
              } return false;
            };
            return !endsWithAny([
              'sudo', 'node', 'nodemon', 'forever', 'blackrock', 'index.js',
              'npm', 'pm2', 'server.js', Object.keys(core.pkg().bin)[0],
            ], evt);
          }),
          op.map(function CLIModuleStreamFn2Map(evt) {
            log('debug', 'Blackrock CLI Module > [1] Command-Line Arguments Filtered', {}, 'CLI_ARGS_FILTERED');
            return evt;
          }),
          op.reduce(function CLIModuleStreamFn3Reduce(acc, one) {
            return acc + ' ' + one;
          }),
          op.map(function CLIModuleStreamFn4Map(evt) {
            log('debug', 'Blackrock CLI Module > [2] Remaining Arguments Reduced', {}, 'CLI_ARGS_REDUCED');
            return evt;
          })
      ).subscribe(function CLIModuleSubscribeCallback(val) {
        val = val.replace('terminator', '').trim();
        setTimeout(function() {
          let command;
          for (const cmd in cliCommands) {
            if (val.startsWith(cmd)) {
              command = cmd;
            }
          }
          if (val === 'start console' || core.globals.get('test') || process.send) {
            core.stopActivation = false;
            log('debug',
                'Blackrock CLI Module > [3] Start Console Called - Enabling Console and emitting CORE_START_INTERFACES',
                {}, 'CLI_ENABLE_CONSOLE');
            setTimeout(function CLIModuleEnableConsoleTimeout() {
              enableConsole();
            }, 50);
            core.emit('CORE_START_INTERFACES');
          } else if (cliCommands[command] && cliCommands[command].fn) {
            log('debug',
                'Blackrock CLI Module > [3] Registered CLI command being executed',
                {'cmd': val}, 'CLI_EXECUTING_CLI_COMMAND');
            cliCommands[command].fn(val.slice(command.length));
          } else {
            showHelp();
            log('debug',
                'Blackrock CLI Module > [3] No valid commands received - Displaying Command-Line Help',
                {}, 'CLI_NO_ARGS_SHOWING_HELP');
          }
        }, 5);
      }).unsubscribe();
    });
  };
}();
