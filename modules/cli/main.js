!function CLIModuleWrapper() {
  let core; let mod; let o = {};

  /**
   * Blackrock CLI Module
   *
   * @public
   * @class Server.Modules.CLI
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.CLI} module - The CLI Module Singleton
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
  module.exports = function CLIModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('CLI'); o.cliCommands = {};
    o.setupExternalModuleMethods(); mod.register = register;
    o.log('debug', 'CLI > Initialising...', {module: mod.name}, 'MODULE_INIT');
    core.on('CORE_FINALISING', function() {
      start();
    });
    return mod;
  };


  /**
   * Setup External Methods
   *
   * @private
   * @memberof Server.Modules.CLI
   * @name setupExternalModuleMethods
   * @function
   * @ignore
   *
   * @description
   * This method binds the handlers - 'log' and 'enableConsole' to the internal module object (o)
   *
   * @example
   * o.setupExternalModuleMethods();
   * // log and enableConsole methods are now bound to the internal module object (o)
   */
  o.setupExternalModuleMethods = function CLISetupExtModMethods() {
    o.log = function CLILog(level, logMsg, attrObj, evtName) {
      const logger = core.module('logger');
      if (logger && logger.log) {
        logger.log(level, logMsg, attrObj, evtName);
      }
    };
    o.enableConsole = function CLIEnableConsole() {
      const logger = core.module('logger');
      if (logger && logger.enableConsole) {
        logger.enableConsole();
      }
    };
  };


  /**
   * (External) Register CLI Commands
   *
   * @public
   * @memberof Server.Modules.CLI
   * @name register
   * @function
   * @param {object} commands - The Commands Object
   * @return {boolean} result - Method Result
   *
   * @description
   * The register method on the CLI Module is used to register function handlers against a collection of
   * defined command-line arguments. It can only be called internally (from other modules) within the application
   * server, and must be called as part of the module's construction. Once all dependencies are loaded, the CLI
   * Module will check the command-line arguments for the presence of any registered commands, and where present
   * will execute the registered handlers for those commands.
   *
   * @example
   * core.module.isLoaded('cli').then(function(cliMod) {
   *    cliMod.register([
   *      {'cmd': 'install', 'params': '[app]', 'info': 'Installs a new app', 'fn': function(params) {
   *        core.emit('INSTALLER_INIT_INSTALLER', {'command': 'install', 'params': params});
   *      }},
   *      {'cmd': 'remove', 'params': '[app]', 'info': 'Removes an installed app', 'fn': function(params) {
   *        core.emit('INSTALLER_INIT_INSTALLER', {'command': 'remove', 'params': params});
   *      }},
   *    ]);
   *  }).catch(function(err) {
   *    log('error',
   *        'Failed to register with CLI - CLI module not loaded',
   *        err, 'INSTALLER_CLI_MOD_NOT_LOADED');
   *  });
   */
  const register = function CLIRegCmds(commands) {
    if (typeof commands === 'object' && commands !== null && !Array.isArray(commands)) {
      o.cliCommands[commands.cmd] = commands;
    } else if (Array.isArray(commands) && commands !== null) {
      for (let i = 0; i < commands.length; i++) {
        o.cliCommands[commands[i].cmd] = commands[i];
      }
    }
    return true;
  };


  /**
   * Initialises CLI Module
   *
   * @private
   * @memberof Server.Modules.CLI
   * @name start
   * @ignore
   * @function
   *
   * @description
   * This method is internal to the CLI Module and can only be called from within it. It initialises the module
   * once all server dependencies have been loaded.
   *
   * @example
   * start();
   * // CLI Module Initialisation Begins...
   */
  const start = function CLIStart() {
    process.nextTick(function CLIStartNextTickCb() {
      process.argv.push('terminator');
      // eslint-disable-next-line new-cap
      const lib = core.lib;
      // noinspection JSUnresolvedVariable
      const rx = lib.rxjs;
      const op = lib.operators; const stream = new rx.from(process.argv);
      const showHelp = function CLIModuleShowHelp() {
        core.stopActivation = true;
        console.log('\n');
        console.log('Usage: ' + core.pkg().name + ' [options]\n');
        console.log('Options: ');
        console.log('start console\t\t\t\tStarts the server in console mode');
        // eslint-disable-next-line guard-for-in
        for (const cmd in o.cliCommands) {
          // noinspection JSUnfilteredForInLoop
          console.log(cmd + ' ' + o.cliCommands[cmd].params + '\t\t\t' + o.cliCommands[cmd].info);
        }
        console.log('\n');
        process.exit();
      };
      o.log('debug',
          'CLI > Server Initialisation Pipeline Created - Executing Now:',
          {module: mod.name}, 'CLI_EXEC_INIT_PIPELINE'
      );
      stream.pipe(
          op.filter(function CLIStreamFn1Filter(evt) {
            // eslint-disable-next-line no-extend-native
            String.prototype.endsWith = function CLIEndsWith(suffix) {
              return this.indexOf(suffix, this.length - suffix.length) !== -1;
            };
            const endsWithAny = function CLIEndsWithAny(suffixes, string) {
              for (const suffix of suffixes) {
                if (string.endsWith(suffix)) return true;
              } return false;
            };
            // noinspection JSUnresolvedVariable
            return !endsWithAny([
              'sudo', 'node', 'nodemon', 'forever', 'blackrock', 'index.js',
              'npm', 'pm2', 'server.js', Object.keys(core.pkg().bin)[0],
            ], evt);
          }),
          op.map(function CLIStreamFn2Map(evt) {
            o.log('debug', 'CLI > [1] Command-Line Arguments Filtered',
                {module: mod.name}, 'CLI_ARGS_FILTERED');
            return evt;
          }),
          op.reduce(function CLIStreamFn3Reduce(acc, one) {
            return acc + ' ' + one;
          }),
          op.map(function CLIModuleStreamFn4Map(evt) {
            o.log('debug', 'CLI > [2] Remaining Arguments Reduced',
                {module: mod.name}, 'CLI_ARGS_REDUCED');
            return evt;
          })
      ).subscribe(function CLISubscribeCallback(val) {
        val = val.replace('terminator', '').trim();
        setTimeout(function() {
          let command;
          for (const cmd in o.cliCommands) {
            // noinspection JSUnfilteredForInLoop
            if (val.startsWith(cmd)) {
              command = cmd;
            }
          }
          if (val === 'start console' || core.globals.get('test') || process.send) {
            core.stopActivation = false;
            o.log('debug',
                'CLI > [3] Start Console Called - Enabling Console and emitting CORE_START_INTERFACES',
                {module: mod.name}, 'CLI_ENABLE_CONSOLE');
            setTimeout(function CLIEnableConsoleTimeout() {
              o.enableConsole();
            }, 50);
            core.emit('CORE_START_INTERFACES');
          } else if (o.cliCommands[command] && o.cliCommands[command].fn) {
            o.log('debug',
                'CLI > [3] Registered CLI command being executed',
                {'cmd': val, module: mod.name}, 'CLI_EXECUTING_CLI_COMMAND');
            o.cliCommands[command].fn(val.slice(command.length));
          } else {
            showHelp();
            o.log('debug',
                'CLI > [3] No valid commands received - Displaying Command-Line Help',
                {module: mod.name}, 'CLI_NO_ARGS_SHOWING_HELP');
          }
        }, 5);
      }).unsubscribe();
    });
  };
}();
