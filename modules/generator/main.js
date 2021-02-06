!function GeneratorModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Generator Module
   *
   * @public
   * @class Server.Modules.Generator
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Generator} module - The Generator Module
   *
   * @description This is the Generator Module of the Blackrock Application Server.
   * It provides tools to generate new apps - providing the foundations for almost
   * any idea for an application or app. There are currently no accessible methods
   * exposed on this module.
   *
   * @example
   * const generatorModule = core.module('generator');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function GeneratorModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Generator'); o.log = core.module('logger').log;
    o.log('debug', 'Generator > Initialising...', {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Init Pipeline
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name init
   * @function
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * pipelines.init();
   */
  pipelines.init = function GeneratorInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

      // Fires once on server initialisation:
      pipelines.init.registerWithCLI,
      pipelines.init.listenToStart,

      // Fires once on each CLI command:
      pipelines.init.parseParamsAndCheckForApp,
      pipelines.init.createNewAppWithoutFile,
      pipelines.init.createNewAppWithFile

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Register With CLI
   *
   * @private
   * @memberof Server.Modules.Generator
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
  pipelines.init.registerWithCLI = function GeneratorRegisterWithCLI(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Generator > [1] Generator registering with CLI...',
          {module: mod.name}, 'MODULE_REGISTER_WITH_CLI');
      core.module.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'create', 'params': '[name] [file]', 'info': 'Create a new app', 'fn': function(params) {
            core.emit('GENERATOR_INIT_GENERATOR', {'command': 'create', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        o.log('error',
            'Generator > Failed to register with CLI - CLI module not loaded',
            {module: mod.name, error: err}, 'CLI_MOD_NOT_LOADED');
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Listen to Start Endpoint
   *
   * @private
   * @memberof Server.Modules.Generator
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
  pipelines.init.listenToStart = function GeneratorListenToStart(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Generator > [2a] Listener created for \'GENERATOR_INIT_GENERATOR\' event',
          {module: mod.name}, 'GENERATOR_LISTENER_CREATED');
      core.on('GENERATOR_INIT_GENERATOR', function GeneratorModuleStartGeneratorCallback(genParams) {
        core.stopActivation = true;
        o.log('debug',
            'Generator > [2b] \'GENERATOR_INIT_GENERATOR\' Event Received',
            {module: mod.name}, 'GENERATOR_LISTENER_EVT_RECEIVED');
        evt.command = genParams.command;
        evt.params = genParams.params;
        observer.next(evt);
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Parse Params And Check For App
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name parseParamsAndCheckForApp
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
  pipelines.init.parseParamsAndCheckForApp = function GeneratorParseParamsAndCheckForApp(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.command === 'create') {
        o.log('debug',
            'Generator > [3] Parsing parameters and checking for app...',
            {module: mod.name}, 'GENERATOR_PARSE_PARAMS');
        const params = evt.params.trim().split(' ');
        let appName = ''; let appFile = '';
        const appPath = core.fetchBasePath('apps');
        if (params[0]) {
          appName = params[0];
        }
        if (params[1]) {
          appFile = params[1];
        }
        if (!appName) {
          console.log('You must specify a app name (and optionally a definition file)');
          process.exit();
        }
        if (require('fs').existsSync(appPath + '/' + appName)) {
          console.log('App (' + appName + ') Already Exists');
          process.exit();
        }
        evt.appPath = appPath;
        evt.appName = appName;
        evt.appFile = appFile;
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Create New App Without File
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name createNewAppWithoutFile
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
  pipelines.init.createNewAppWithoutFile = function GeneratorCreateNewAppWithoutFile(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.appFile) {
        observer.next(evt);
        return;
      }
      let filesWritten = 0;
      o.log('debug',
          'Generator > [4] Creating new app without definition file...',
          {module: mod.name}, 'GENERATOR_CREATING_APP_NO_FILE');
      require('fs').mkdirSync(evt.appPath + '/' + evt.appName);
      const rootFolders = ['controllers', 'html', 'lib', 'locale', 'models', 'test', 'views'];
      for (let i = 0; i < rootFolders.length; i++) {
        require('fs').mkdirSync(evt.appPath + '/' + evt.appName + '/' + rootFolders[i]);
        if (rootFolders[i] !== 'controllers' && rootFolders[i] !== 'views') {
          require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' +
                      rootFolders[i] + '/stub.txt', 'Insert your ' + rootFolders[i] + ' into this folder', (err) => {
            if (err) throw err;
            filesWritten ++;
          });
        }
      }
      const appDefinition = {
        'name': evt.appName,
        'host': 'www.' + evt.appName + '.local',
        'basePath': '',
        'active': true,
      };
      const def = JSON.stringify(appDefinition);
      require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + 'app.json', def, function(err) {
        if (err) throw err;
        filesWritten ++;
      });
      const ctrlFile = o.createControllerFile('controllers', '[Author]', {'get': {'viewFile': 'home.mustache'}});
      require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + 'controllers/controller.js',
          ctrlFile, function(err) {
            if (err) throw err;
            filesWritten ++;
          });
      // eslint-disable-next-line max-len
      const viewFile = `<h1>Welcome to Your Sample Site</h1>\n<p>This is your new Blackrock App. Customise it as you see fit.</p>\n         `;
      require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + 'views/home.mustache', viewFile, function(err) {
        if (err) throw err;
        filesWritten ++;
      });

      // Listener With Timeout Feature:
      const timeout = 1000; let timer = 0;
      const interval = setInterval(function() {
        if (filesWritten >= 8) {
          clearInterval(interval);
          console.log('App (' + evt.appName + ') Created Successfully');
          process.exit();
        } else if (timer >= timeout) {
          clearInterval(interval);
          console.log('Timed Out Creating App (' + evt.appName + ')');
          process.exit();
        }
        timer += 10;
      }, 10);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Create New App With File
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name createNewAppWithFile
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
  pipelines.init.createNewAppWithFile = function GeneratorCreateNewAppWithFile(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      // Setup:
      let totalFiles = 0;
      let filesWritten = 0;
      o.log('debug',
          'Generator > [5] Creating new app with definition file...',
          {module: mod.name}, 'GENERATOR_CREATING_APP_WITH_FILE');
      let appFile;
      try {
        appFile = require(evt.appFile);
      } catch (err) {
        console.log('Invalid app definition file provided');
        process.exit();
      }

      // Create Root and First-Level Folder Set:
      require('fs').mkdirSync(evt.appPath + '/' + evt.appName);
      totalFiles += 5;
      const rootFolders = ['controllers', 'html', 'lib', 'locale', 'models', 'test', 'views'];
      for (let i = 0; i < rootFolders.length; i++) {
        require('fs').mkdirSync(evt.appPath + '/' + evt.appName + '/' + rootFolders[i]);
        if (rootFolders[i] !== 'controllers' && rootFolders[i] !== 'views') {
          require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + rootFolders[i] + '/stub.txt',
              'Insert your ' + rootFolders[i] + ' into this folder', function(err) {
                if (err) throw err;
                filesWritten ++;
              });
        }
      }
      const appDefinition = {'name': evt.appName};
      if (appFile.host) {
        appDefinition.host = appFile.host;
      } else {
        appDefinition.host = 'www.' + evt.appName + '.local';
      }
      if (appFile.basePath) {
        appDefinition.basePath = appFile.basePath;
      } else {
        appDefinition.basePath = '';
      }
      if (appFile.active) {
        appDefinition.active = appFile.active;
      } else {
        appDefinition.active = true;
      }
      totalFiles += 1;
      const def = JSON.stringify(appDefinition);
      require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + 'app.json',
          def, function(err) {
        if (err) throw err;
        filesWritten ++;
      });
      const timerFn = function GeneratorModuleTimerFn() {
        const timeout = 1000; let timer = 0;
        const interval = setInterval(function() {
          if (filesWritten >= totalFiles) {
            clearInterval(interval);
            console.log('App (' + evt.appName + ') Created Successfully');
            process.exit();
          } else if (timer >= timeout) {
            clearInterval(interval);
            console.log('Timed Out Creating App (' + evt.appName + ')');
            process.exit();
          }
          timer += 10;
        }, 10);
      };
      if (!appFile.routes) {
        // Create Root Controller File:
        totalFiles += 1;
        const ctrlFile = o.createControllerFile('controllers', '[Author]',
            {'get': {'viewFile': 'home.mustache'}});
        require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' +
            'controllers/controller.js',
            ctrlFile, function(err) {
              if (err) throw err;
              filesWritten ++;
            });
        // eslint-disable-next-line max-len
        const viewFile = `<h1>Welcome to Your Sample Site</h1>\n<p>This is your new Blackrock App. Customise it as you see fit.</p>\n             `;
        totalFiles += 1;
        require('fs').writeFile(evt.appPath + '/' + evt.appName + '/' + 'views/home.mustache', viewFile, function(err) {
          if (err) throw err;
          filesWritten ++;
        });
        timerFn();
      }
      if (appFile.route) {
        o.countRouteFiles(appFile.route, function(err1, res1) {
          if (err1) {
            console.log('Error Counting Route Files For App (' + evt.appName + ') - ' + err1.message);
            process.exit();
          }
          // noinspection JSUnresolvedVariable
          totalFiles += res1.fileCount;
          o.generateRouteLevel(appFile.route, function(err2, res2) {
            if (err2) {
              console.log('Error Generating Routes For App (' + evt.appName + ') - ' + res2.err);
              process.exit();
            }
            // noinspection JSUnresolvedVariable
            filesWritten += res2.fileCount;
          });
          timerFn();
        });
      }
    }, source);
  };


  /**
   *  UTILITY METHODS...
   */

  /**
   * (Internal > Utility Methods) Create New App With File
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name createControllerFile
   * @ignore
   * @function
   * @param {string} path - The Path
   * @param {string} author - The Author's Name
   * @param {object} verbs - Verbs Object
   * @return {string} ctrlFile - The Controller File (Text Format)
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.createControllerFile = function GeneratorCreateCtrlFile(path, author, verbs) {
    const addVerb = function GeneratorCreateCtrlFileAddVerb(verb, viewFile) {
      return `
    /**
     * ` + verb.toUpperCase() + `
     * @param {object} req - Request object
     * @param {object} res - Response object
     */
    ctrl.` + verb + ` = function(req, res){
        var context = {};
        res.render("` + viewFile + `", context);\n  }\n\n\n         `;
    };

    const currentDate = new Date();
    const fullYear = currentDate.getFullYear();
    let ctrlFile = `/*!
* ` + path + `/controller.js
*
* Copyright (c) ` + fullYear + ` ` + author + `\n*/\n\n;!function(undefined) {\n\n  var ctrl = {};\n\n\n        `;

    // eslint-disable-next-line guard-for-in
    for (const verb in verbs) {
      ctrlFile += addVerb(verb, verbs[verb].viewFile);
    }

    ctrlFile += `
    /**
     * (ENTRY POINT FOR EXECUTION)
     */
    module.exports = ctrl;
    
}();
        `;

    return ctrlFile;
  };

  /**
   * (Internal > Utility Methods) Count Route Files
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name countRouteFiles
   * @ignore
   * @function
   * @param {number} routeLevel - The Route Level
   * @param {function} callbackFn - Callback Function
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.countRouteFiles = function GeneratorCountRouteFiles(routeLevel, callbackFn) {};

  /**
   * (Internal > Utility Methods) Parse & Generate Route Level
   *
   * @private
   * @memberof Server.Modules.Generator
   * @name generateRouteLevel
   * @ignore
   * @function
   * @param {number} routeLevel - The Route Level
   * @param {function} callbackFn - Callback Function
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.generateRouteLevel = function GeneratorParseGenRouteLevel(routeLevel, callbackFn) {};
}();
