!function GeneratorModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib;
  let rx; const fs = require('fs');


  /**
   * Blackrock Generator Module
   *
   * @class Server.Modules.Generator
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Generator} module - The Generator Module
   *
   * @description This is the Generator Module of the Blackrock Application Server.
   * It provides tools to generate new services - providing the foundations for almost
   * any idea for an application or service. There are currently no accessible methods
   * exposed on this module.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function GeneratorModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Generator'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Generator Module > Initialising...', {}, 'GENERATOR_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupGeneratorModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Generator Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupGeneratorModule = function GeneratorModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function GeneratorModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function GeneratorModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function GeneratorModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Generator Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'GENERATOR_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        stream.pipe(

            // Fires once on server initialisation:
            streamFns.registerWithCLI,
            streamFns.listenToStart,

            // Fires once on each CLI command:
            streamFns.parseParamsAndCheckForService,
            streamFns.createNewServiceWithoutFile,
            streamFns.createNewServiceWithFile

        ).subscribe();
      },
    });
  };


  /**
   * Generator Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Register With CLI
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.registerWithCLI = function GeneratorModuleRegisterWithCLI(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Generator Module > [1] Generator registering with CLI...',
          {}, 'GENERATOR_REGISTER_WITH_CLI');
      core.isLoaded('cli').then(function(cliMod) {
        cliMod.register([
          {'cmd': 'create', 'params': '[name] [file]', 'info': 'Create a new service', 'fn': function(params) {
            core.emit('GENERATOR_INIT_GENERATOR', {'command': 'create', 'params': params});
          }},
        ]);
      }).catch(function(err) {
        log('error',
            'Blackrock Generator Module > Failed to register with CLI - CLI module not loaded',
            err, 'GENERATOR_CLI_MOD_NOT_LOADED');
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
  streamFns.listenToStart = function GeneratorModuleListenToStart(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Generator Module > [2a] Listener created for \'GENERATOR_INIT_GENERATOR\' event',
          {}, 'GENERATOR_LISTENER_CREATED');
      core.on('GENERATOR_INIT_GENERATOR', function GeneratorModuleStartGeneratorCallback(genParams) {
        core.stopActivation = true;
        log('debug',
            'Blackrock Generator > [2b] \'GENERATOR_INIT_GENERATOR\' Event Received',
            {}, 'GENERATOR_LISTENER_EVT_RECEIVED');
        evt.command = genParams.command;
        evt.params = genParams.params;
        observer.next(evt);
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Parse Params And Check For Service
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.parseParamsAndCheckForService = function GeneratorModuleParseParamsAndCheckForService(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.command === 'create') {
        log('debug',
            'Blackrock Generator Module > [3] Parsing parameters and checking for service...',
            {}, 'GENERATOR_PARSE_PARAMS');
        const params = evt.params.trim().split(' ');
        let serviceName = ''; let serviceFile = '';
        const servicePath = core.fetchBasePath('services');
        if (params[0]) {
          serviceName = params[0];
        }
        if (params[1]) {
          serviceFile = params[1];
        }
        if (!serviceName) {
          console.log('You must specify a service name (and optionally a definition file)');
          process.exit();
        }
        if (fs.existsSync(servicePath + '/' + serviceName)) {
          console.log('Service (' + serviceName + ') Already Exists');
          process.exit();
        }
        evt.servicePath = servicePath;
        evt.serviceName = serviceName;
        evt.serviceFile = serviceFile;
        observer.next(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Create New Service Without File
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createNewServiceWithoutFile = function GeneratorModuleCreateNewServiceWithoutFile(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.serviceFile) {
        observer.next(evt);
        return;
      }
      let filesWritten = 0;
      log('debug',
          'Blackrock Generator Module > [4] Creating new service without definition file...',
          {}, 'GENERATOR_CREATING_SERVICE_NO_FILE');
      fs.mkdirSync(evt.servicePath + '/' + evt.serviceName);
      const rootFolders = ['controllers', 'html', 'lib', 'locale', 'models', 'test', 'views'];
      for (let i = 0; i < rootFolders.length; i++) {
        fs.mkdirSync(evt.servicePath + '/' + evt.serviceName + '/' + rootFolders[i]);
        if (rootFolders[i] !== 'controllers' && rootFolders[i] !== 'views') {
          fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' +
                      rootFolders[i] + '/stub.txt', 'Insert your ' + rootFolders[i] + ' into this folder', (err) => {
            if (err) throw err;
            filesWritten ++;
          });
        }
      }
      const serviceDefinition = {
        'name': evt.serviceName,
        'host': 'www.' + evt.serviceName + '.local',
        'basePath': '',
        'active': true,
      };
      const def = JSON.stringify(serviceDefinition);
      fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'service.json', def, function(err) {
        if (err) throw err;
        filesWritten ++;
      });
      const ctrlFile = createControllerFile('controllers', '[Author]', {'get': {'viewFile': 'home.mustache'}});
      fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'controllers/controller.js',
          ctrlFile, function(err) {
            if (err) throw err;
            filesWritten ++;
          });
      // eslint-disable-next-line max-len
      const viewFile = `<h1>Welcome to Your Sample Site</h1>\n<p>This is your new Blackrock Service. Customise it as you see fit.</p>\n         `;
      fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'views/home.mustache', viewFile, function(err) {
        if (err) throw err;
        filesWritten ++;
      });

      // Listener With Timeout Feature:
      const timeout = 1000; let timer = 0;
      const interval = setInterval(function() {
        if (filesWritten >= 8) {
          clearInterval(interval);
          console.log('Service (' + evt.serviceName + ') Created Successfully');
          process.exit();
        } else if (timer >= timeout) {
          clearInterval(interval);
          console.log('Timed Out Creating Service (' + evt.serviceName + ')');
          process.exit();
        }
        timer += 10;
      }, 10);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Create New Service With File
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.createNewServiceWithFile = function GeneratorModuleCreateNewServiceWithFile(source) {
    return lib.rxOperator(function(observer, evt) {
      // Setup:
      let totalFiles = 0;
      let filesWritten = 0;
      log('debug',
          'Blackrock Generator Module > [5] Creating new service with definition file...',
          {}, 'GENERATOR_CREATING_SERVICE_WITH_FILE');
      let serviceFile;
      try {
        serviceFile = require(evt.serviceFile);
      } catch (err) {
        console.log('Invalid service definition file provided');
        process.exit();
      }

      // Create Root and First-Level Folder Set:
      fs.mkdirSync(evt.servicePath + '/' + evt.serviceName);
      totalFiles += 5;
      const rootFolders = ['controllers', 'html', 'lib', 'locale', 'models', 'test', 'views'];
      for (let i = 0; i < rootFolders.length; i++) {
        fs.mkdirSync(evt.servicePath + '/' + evt.serviceName + '/' + rootFolders[i]);
        if (rootFolders[i] !== 'controllers' && rootFolders[i] !== 'views') {
          fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + rootFolders[i] + '/stub.txt',
              'Insert your ' + rootFolders[i] + ' into this folder', function(err) {
                if (err) throw err;
                filesWritten ++;
              });
        }
      }
      const serviceDefinition = {'name': evt.serviceName};
      if (serviceFile.host) {
        serviceDefinition.host = serviceFile.host;
      } else {
        serviceDefinition.host = 'www.' + evt.serviceName + '.local';
      }
      if (serviceFile.basePath) {
        serviceDefinition.basePath = serviceFile.basePath;
      } else {
        serviceDefinition.basePath = '';
      }
      if (serviceFile.active) {
        serviceDefinition.active = serviceFile.active;
      } else {
        serviceDefinition.active = true;
      }
      totalFiles += 1;
      const def = JSON.stringify(serviceDefinition);
      fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'service.json', def, function(err) {
        if (err) throw err;
        filesWritten ++;
      });
      const timerFn = function GeneratorModuleTimerFn() {
        const timeout = 1000; let timer = 0;
        const interval = setInterval(function() {
          if (filesWritten >= totalFiles) {
            clearInterval(interval);
            console.log('Service (' + evt.serviceName + ') Created Successfully');
            process.exit();
          } else if (timer >= timeout) {
            clearInterval(interval);
            console.log('Timed Out Creating Service (' + evt.serviceName + ')');
            process.exit();
          }
          timer += 10;
        }, 10);
      };
      if (!serviceFile.routes) {
        // Create Root Controller File:
        totalFiles += 1;
        const ctrlFile = createControllerFile('controllers', '[Author]', {'get': {'viewFile': 'home.mustache'}});
        fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'controllers/controller.js',
            ctrlFile, function(err) {
              if (err) throw err;
              filesWritten ++;
            });
        // eslint-disable-next-line max-len
        const viewFile = `<h1>Welcome to Your Sample Site</h1>\n<p>This is your new Blackrock Service. Customise it as you see fit.</p>\n             `;
        totalFiles += 1;
        fs.writeFile(evt.servicePath + '/' + evt.serviceName + '/' + 'views/home.mustache', viewFile, function(err) {
          if (err) throw err;
          filesWritten ++;
        });
        timerFn();
      }
      if (serviceFile.route) {
        countRouteFiles(serviceFile.route, function(err1, res1) {
          if (err1) {
            console.log('Error Counting Route Files For Service (' + evt.serviceName + ') - ' + err1.message);
            process.exit();
          }
          totalFiles += res1.fileCount;
          generateRouteLevel(serviceFile.route, function(err2, res2) {
            if (err2) {
              console.log('Error Generating Routes For Service (' + evt.serviceName + ') - ' + res2.err);
              process.exit();
            }
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
   * (Internal > Utility Methods) Create New Service With File
   * @private
   * @param {string} path - The Path
   * @param {string} author - The Author's Name
   * @param {object} verbs - Verbs Object
   * @return {string} ctrlFile - The Controller File (Text Format)
   */
  const createControllerFile = function GeneratorModuleCreateCtrlFile(path, author, verbs) {
    const addVerb = function GeneratorModuleCreateCtrlFileAddVerb(verb, viewFile) {
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
   * @private
   * @param {number} routeLevel - The Route Level
   * @param {function} callbackFn - Callback Function
   */
  const countRouteFiles = function GeneratorModuleCountRouteFiles(routeLevel, callbackFn) {};

  /**
   * (Internal > Utility Methods) Parse & Generate Route Level
   * @private
   * @param {number} routeLevel - The Route Level
   * @param {function} callbackFn - Callback Function
   */
  const generateRouteLevel = function GeneratorModuleParseGenRouteLevel(routeLevel, callbackFn) {};
}();
