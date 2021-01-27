!function LoggerModuleWrapper() {
  // eslint-disable-next-line no-extend-native
  String.prototype.endsWith = function LoggerEndsWith(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
  let core; let mod; let fileStream; let log; let newLog; let logOverride = false;
  const pipelines = {}; const streamFns = {}; let consoleEnabled = false; let coreObjTimeout = 500;
  let lib; let rx; let op; let analyticsStore = {sessionEventCount: 0}; const latestHeartbeat = {};
  let daemonInControl = false; let modIsLoaded = false; let logBuffer = []; const fs = require('fs');


  /**
   * Blackrock Logger Module
   *
   * @class Server.Modules.Logger
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Logger} module - The Logger Module
   *
   * @description This is the Logger Module of the Blackrock Application Server.
   * It provides a logging method that can be used throughout the framework /
   * application server, as well as directly from within services. It has routing
   * capabilities, allowing log events to be routed to - the Console, a Log File
   * on the filesystem, ElasticSearch and emitted directly to the Core Module instance.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function LoggerModuleConstructor(coreObj) {
    if (process.send) {
      fs.appendFileSync('/tmp/blackrock-daemon-fix.txt', 'Daemon Fix\n');
      fs.unlinkSync('/tmp/blackrock-daemon-fix.txt');
    }
    if (modIsLoaded) {
      return mod;
    }
    core = coreObj; mod = new core.Mod('Logger');
    mod.log = log = function LoggerModuleQuickLog(level, logMsg, attrObj, evtName) {
      if (logOverride) {
        return newLog(level, logMsg, attrObj);
      }
      let currentDate = new Date();
      currentDate = currentDate.toISOString();
      const sEvt = streamFns.detectAvailableSinks({'noLog': true});
      const evt = {
        'level': level, 'logMsg': logMsg, 'attrObj': attrObj,
        'datestamp': currentDate, 'sinks': sEvt.sinks, 'evtName': evtName,
      };
      logBuffer.push(evt);
      return true;
    };
    let loadDependencies = false;
    core.on('CORE_START_DAEMON', function LoggerModuleOnStartDaemon() {
      daemonInControl = true;
    });
    core.on('CORE_LOAD_DEPENDENCIES', function LoggerModuleOnLoadDependencies() {
      loadDependencies = true;
    });
    log('debug', 'Blackrock Logger Module > Initialising...', {}, 'LOGGER_INIT');
    lib = core.lib; rx = lib.rxjs; op = lib.operators;
    let intervalCounter = 0;
    const interval = setInterval(function LoggerModuleInitInterval() {
      if (loadDependencies) {
        clearInterval(interval);
        const SinkPipeline = pipelines.sendToSinks();
        new SinkPipeline({}).pipe();
        const Pipeline = pipelines.setupLoggerModule();
        new Pipeline({}).pipe();
      }
      if (intervalCounter >= 500) {
        clearInterval(interval);
      }
      intervalCounter += 10;
    }, 10);
    mod.unload = function LoggerModuleUnload() {
      log('debug',
          'Blackrock Logger Module > Closing any open logging connections and shutting down.',
          {}, 'LOGGER_UNLOAD');
      if (fileStream) {
        // eslint-disable-next-line no-delete-var
        delete fileStream; core.emit('module-shut-down', 'Logger');
      } else {
        core.emit('module-shut-down', 'Logger');
      }
    };
    modIsLoaded = true;
    return mod;
  };


  /**
   * =====================
   * Event Stream Pipeline
   * =====================
   */

  /**
   * (Internal > Pipeline [1]) Setup Logger Module
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupLoggerModule = function LoggerModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function LoggerModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function LoggerModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function LoggerModuleSetupPipelinePipe() {
        const self = this;
        process.nextTick(function LoggerModuleSetupPipelineNextTick() {
          log('debug',
              'Blackrock Logger Module > Server Initialisation Pipeline Created - Executing Now:',
              {}, 'LOGGER_EXEC_INIT_PIPELINE');
          const Stream = rx.bindCallback((cb) => {
            self.callback(cb);
          })();
          Stream.pipe(

              // Fires once on server initialisation:
              streamFns.setupFileStream,
              op.map((evt) => {
                if (evt) return streamFns.detectAvailableSinks(evt);
              }),
              streamFns.setupViewAnalytics,
              streamFns.setupJobs,
              streamFns.setupGetAndUpdateLatestHeartbeat,
              streamFns.loadCachedHeartbeats,
              streamFns.fireServerBootAnalyticsEvent,
              streamFns.bindEnableConsole,
              streamFns.bindLogEndpoints

          ).subscribe();
        });
      },
    });
  };

  /**
   * (Internal > Pipeline [2]) Send To Sinks
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.sendToSinks = function LoggerModuleSendToSinksPipeline() {
    return new core.Base().extend({
      constructor: function LoggerModuleSendToSinksPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function LoggerModuleSendToSinksPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function LoggerModuleSendToSinksPipelinePipe() {
        const Stream = rx.fromEvent(mod, 'logEvent');
        Stream.pipe(

            // Fires once per Log Event:
            streamFns.unbufferEvents,
            streamFns.fanoutToSinks

        ).subscribe(function LoggerModuleSendToSinksPipelineSubscribe(evt) {
          switch (evt.activeSink) {
            case 'console':
              streamFns.sendToConsole(evt);
              break;
            case 'file':
              streamFns.sendToFile(evt);
              break;
            case 'elasticsearch':
              streamFns.sendToElasticSearch(evt);
              break;
            case 'core':
              streamFns.sendToCoreObject(evt);
              break;
          }
        });
      },
    });
  };

  /**
   * (Internal > Pipeline [5]) Process Analytics Event
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.processAnalyticsEvent = function LoggerModuleProcessAnalyticsEventPipeline() {
    return new core.Base().extend({
      constructor: function LoggerModuleProcessAnalyticsEventPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function LoggerModuleProcessAnalyticsEventPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function LoggerModuleProcessAnalyticsEventPipelinePipe() {
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once per Analytics Log Event (Request) following server initialisation:
            streamFns.processAnalyticsEvent

        ).subscribe();
      },
    });
  };


  /**
   * =====================================
   * Logger Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Setup File Stream
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupFileStream = function LoggerModuleSetupFileStream(source) {
    return lib.rxOperator(function(observer, evt) {
      if (core.cfg().logger.sinks.file && core.cfg().logger.sinks.file.enabled === true) {
        const fs = require('fs'); let location;
        if (core.cfg().logger.sinks.file.location) {
          location = core.cfg().logger.sinks.file.location;
        } else {
          location = core.fetchBasePath('root') + '/blackrock.log';
        }
        if (fs.existsSync(location)) {
          fileStream = fs.createWriteStream(location, {flags: 'a'});
        }
        log('debug', 'Blackrock Logger Module  > [1] Setup the File Stream', {}, 'LOGGER_SETUP_FILE_STREAM');
      } else {
        log('debug', 'Blackrock Logger Module > [1] Skipped Creation of File Stream', {}, 'LOGGER_NO_FILE_STREAM');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Detect Available Sinks
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   */
  streamFns.detectAvailableSinks = function LoggerModuleDetectAvailableSinks(evt) {
    evt.sinks = {};
    evt.sinks.core = true;
    if (core.cfg().logger.enabled === true) {
      if (core.cfg().logger.sinks.console && core.cfg().logger.sinks.console.enabled === true) {
        evt.sinks.console = true;
      }
      if (core.cfg().logger.sinks.file && core.cfg().logger.sinks.file.enabled === true) {
        evt.sinks.file = true;
      }
      if (core.cfg().logger.sinks.elasticsearch && core.cfg().logger.sinks.elasticsearch.enabled === true) {
        evt.sinks.elasticsearch = true;
      }
      if (!evt.noLog) {
        log('debug',
            'Blackrock Logger Module > [2] Detected Available Log Sinks',
            {'sinks': evt.sinks}, 'LOGGER_DETECTED_SINKS');
      }
    } else {
      if (!evt.noLog) {
        log('debug',
            'Blackrock Logger Module > [2] Did Not Detect Log Sinks - As Logger is Disabled in Config',
            {}, 'LOGGER_DISABLED');
      }
    }
    return evt;
  };

  /**
   * (Internal > Stream Methods [3]) Setup View Analytics Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * {
   *   "2000": {
   *      "01": {
   *         "01": [
   *            {
   *               "server": {
   *                  "dateLastBoot": "2020-12-20 00:00:00",
   *                  "dateCacheLastSaved": "2020-12-20 00:00:00"
   *               },
   *               "msgs": {
   *                  "reqSize": 0,
   *                  "avgProcessingTime": 0,
   *                  "avgMemUsed": 0,
   *                  "avgCpuLoad": 0,
   *                  "resSize": 0
   *               }
   *            }
   *         ]
   *      }
   *   }
   */
  streamFns.setupViewAnalytics = function LoggerModuleSetupViewAnalytics(source) {
    return lib.rxOperator(function(observer, evt) {
      const ViewClass = new core.Base().extend({
        constructor: function LoggerModuleViewAnalyticsClassConstructor() {
          return this;
        },
        callback: function LoggerModuleViewAnalyticsClassCallback(cb) {
          return cb(this.evt);
        },
        process: function LoggerModuleViewAnalyticsClassPipe() {
          const self = this;
          const viewObject = {
            server: {dateLastBoot: '', dateCacheLastSaved: ''},
            msgs: {
              totalReqSize: 0, totalResSize: 0,
              totalReqCount: 0, totalResCount: 0,
              avgReqSize: 0, avgResSize: 0,
              avgProcessingTime: 0, avgMemUsed: 0, avgCpuLoad: 0,
            },
          };
          viewObject.server.dateLastBoot = self.fetchMaxValue('dateLastBoot');
          viewObject.server.dateCacheLastSaved = self.fetchMaxValue('dateCacheLastSaved');
          viewObject.msgs.totalReqSize = self.fetchTotalValue('reqSize');
          viewObject.msgs.totalResSize = self.fetchTotalValue('resSize');
          viewObject.msgs.totalReqCount = self.fetchCount('reqSize');
          viewObject.msgs.totalResCount = self.fetchCount('resSize');
          viewObject.msgs.avgReqSize = self.fetchAvgValue('reqSize');
          viewObject.msgs.avgResSize = self.fetchAvgValue('resSize');
          viewObject.msgs.avgProcessingTime = self.fetchAvgValue('avgProcessingTime');
          viewObject.msgs.avgMemUsed = self.fetchAvgValue('avgMemUsed');
          viewObject.msgs.avgCpuLoad = self.fetchAvgValue('avgCpuLoad');
          return viewObject;
        },
        stub: function LoggerModuleViewAnalyticsClassStub() {
          return {
            serverParams: ['dateLastBoot', 'dateCacheLastSaved'],
            msgsParams: ['reqSize', 'avgProcessingTime', 'avgMemUsed', 'avgCpuLoad', 'resSize'],
            dp: this.getDatePartsAndPrepareStore(),
          };
        },
        getDatePartsAndPrepareStore: function LoggerModuleViewAnalyticsClassGetDateParts() {
          const dayjs = lib.dayjs; const dateObject = dayjs().format('YYYY-MM-DD').split('-');
          const year = dateObject[0]; const month = dateObject[1]; const day = dateObject[2];
          if (!analyticsStore[year]) {
            analyticsStore[year] = {};
          }
          if (!analyticsStore[year][month]) {
            analyticsStore[year][month] = {};
          }
          if (!analyticsStore[year][month][day]) {
            analyticsStore[year][month][day] = [];
          }
          return {year: year, month: month, day: day};
        },
        sortBy: function LoggerModuleViewAnalyticsClassSortBy(array, intField, param, direction) {
          if (direction === 'min') {
            array.sort(function LoggerModuleViewAnalyticsClassSortBySortFnOne(a, b) {
              if (!a[intField] && b[intField]) {
                return 0 - b[intField][param];
              } else if (!a[intField] && !b[intField]) {
                return 0;
              } else if (a[intField] && !b[intField]) {
                return a[intField][param] - 0;
              } else {
                return a[intField][param] - b[intField][param];
              }
            });
          } else {
            array.sort(function LoggerModuleViewAnalyticsClassSortBySortFnTwo(b, a) {
              if (((a && !a[intField]) || !a) && b && b[intField]) {
                return 0 - b[intField][param];
              } else if (((a && !a[intField]) || !a) && ((b && !b[intField]) || !b)) {
                return 0;
              } else if (a && a[intField] && ((b && !b[intField]) || !b)) {
                return a[intField][param] - 0;
              } else {
                return a[intField][param] - b[intField][param];
              }
            });
          }
          return array;
        },
        fetchMaxValue: function LoggerModuleViewAnalyticsClassFetchMaxValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams; const sortBy = this.sortBy;
          let intField;
          if (serverParams.includes(param)) {
            intField = 'server';
          } else if (msgsParams.includes(param)) {
            intField = 'msgs';
          }
          let daysEvts = analyticsStore[dp.year][dp.month][dp.day];
          daysEvts = sortBy(daysEvts, intField, param, 'max');
          if (!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) {
            return 0;
          }
          return daysEvts[0][intField][param];
        },
        /* fetchMinValue: function LoggerModuleViewAnalyticsClassFetchMinValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams; const sortBy = this.sortBy;
          let intField;
          if (serverParams.includes(param)) {
            intField = 'server';
          } else if (msgsParams.includes(param)) {
            intField = 'msgs';
          }
          let daysEvts = analyticsStore[dp.year][dp.month][dp.day];
          daysEvts = sortBy(daysEvts, intField, param, 'min');
          if (!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) {
            return 0;
          }
          return daysEvts[0][intField][param];
        }, */
        fetchTotalValue: function LoggerModuleViewAnalyticsClassFetchTotalValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) {
            intField = 'server';
          } else if (msgsParams.includes(param)) {
            intField = 'msgs';
          }
          const daysEvts = analyticsStore[dp.year][dp.month][dp.day];
          let sumTotal = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) {
              sumTotal += daysEvts[i][intField][param];
            }
          }
          return sumTotal;
        },
        fetchAvgValue: function LoggerModuleViewAnalyticsClassFetchAvgValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) {
            intField = 'server';
          } else if (msgsParams.includes(param)) {
            intField = 'msgs';
          }
          const daysEvts = analyticsStore[dp.year][dp.month][dp.day];
          let avgValue; let sumTotal = 0; let recordCount = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) {
              sumTotal += daysEvts[i][intField][param]; recordCount ++;
            }
          }
          // eslint-disable-next-line prefer-const
          avgValue = sumTotal / recordCount;
          return avgValue;
        },
        fetchCount: function LoggerModuleViewAnalyticsClassFetchCount(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams; const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) {
            intField = 'server';
          } else if (msgsParams.includes(param)) {
            intField = 'msgs';
          }
          const daysEvts = analyticsStore[dp.year][dp.month][dp.day];
          let recordCount = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) {
              recordCount ++;
            }
          }
          return recordCount;
        },
      });
      if (!mod.analytics) {
        mod.analytics = {};
      }
      const viewObject = new ViewClass();
      mod.analytics.view = function LoggerModuleExternalViewAnalyticsMethod() {
        return viewObject.process();
      };
      log('debug',
          'Blackrock Logger Module > [3] View Analytics Setup & Ready For Use',
          {}, 'LOGGER_VIEW_ANALYTICS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Jobs
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupJobs = function LoggerModuleSetupJobs(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [4] Setting Up Heartbeat + Cache Jobs',
          {}, 'LOGGER_SETUP_HEARTBEAT_JOBS');
      if (core.cfg().logger.heartbeat) {
        const heartbeatJob = function LoggerModuleHeartbeatJob() {
          const beat = core.module('logger').analytics.view();
          const roundAndLabel = function LoggerModuleRoundAndLabel(param) {
            if (param >= 1024 && param < 1048576) {
              param = Math.round(param / 1024);
              param = Number(param).toLocaleString();
              param += ' KB';
            } else if (param >= 1048576) {
              param = Math.round(param / 1024 / 1024);
              param = Number(param).toLocaleString();
              param += ' MB';
            } else {
              param = Math.round(param);
              param = Number(param).toLocaleString();
              param += ' Bytes';
            }
            return param;
          };
          latestHeartbeat.totalReqSize = beat.msgs.totalReqSize = roundAndLabel(beat.msgs.totalReqSize);
          latestHeartbeat.totalResSize = beat.msgs.totalResSize = roundAndLabel(beat.msgs.totalResSize);
          latestHeartbeat.avgReqSize = beat.msgs.avgReqSize = roundAndLabel(beat.msgs.avgReqSize);
          latestHeartbeat.avgResSize = beat.msgs.avgResSize = roundAndLabel(beat.msgs.avgResSize);
          latestHeartbeat.avgMemUsed = beat.msgs.avgMemUsed = roundAndLabel(beat.msgs.avgMemUsed);
          latestHeartbeat.avgCpuLoad = beat.msgs.avgCpuLoad = Math.round(beat.msgs.avgCpuLoad) + '%';
          latestHeartbeat.totalReqCount = beat.msgs.totalReqCount;
          latestHeartbeat.totalResCount = beat.msgs.totalResCount;
          latestHeartbeat.avgProcessingTime = beat.msgs.avgProcessingTime;
          latestHeartbeat.dateLastBoot = beat.msgs.dateLastBoot;
          latestHeartbeat.dateCacheLastSaved = beat.msgs.dateCacheLastSaved;
          if (!latestHeartbeat.peerCount) {
            latestHeartbeat.peerCount = 1;
          }
          let serviceStats = {}; serviceStats.servicesMemoryUse = '0 Bytes';
          serviceStats.servicesCount = 0; serviceStats.servicesRouteCount = 0;
          if (core.module('services') && core.module('services').serviceStats) {
            serviceStats = core.module('services').serviceStats();
            serviceStats.servicesMemoryUse = roundAndLabel(serviceStats.servicesMemoryUse);
          }
          let runningInSandbox = 'No';
          if (core.module('sandbox') && core.cfg().services.sandbox.default === true) {
            runningInSandbox = 'Yes';
          }

          const loadedServiceCount = serviceStats.servicesCount + ` (` + serviceStats.servicesMemoryUse + `)`;
          const totalRouteCtrlCount = serviceStats.servicesRouteCount + ` (` + serviceStats.servicesMemoryUse + `)`;
          if (core.cfg().logger.heartbeat.console && consoleEnabled && !core.globals.get('silent')) {
            console.log(`

    ========================================================================================================

       ,ad8PPPP88b,     ,d88PPPP8ba,        MSGS & SYSTEM STATS (THIS SERVER):
   d8P"      "Y8b, ,d8P"      "Y8b       Total Request Size: ` + beat.msgs.totalReqSize + `
  dP'           "8a8"           \`Yd      Total Response Size: ` + beat.msgs.totalResSize + `
  8(              "              )8      Total Request Count: ` + beat.msgs.totalReqCount + `
  I8                             8I      Total Response Count: ` + beat.msgs.totalResCount + `
   Yb,     Server Heartbeat    ,dP       Average Request Size: ` + beat.msgs.avgReqSize + `
    "8a,                     ,a8"        Average Response Size: ` + beat.msgs.avgResSize + `
      "8a,                 ,a8"          Average Processing Time: ` + (beat.msgs.avgProcessingTime * 100) + ` ms
        "Yba             adP"            Average Memory Use: ` + beat.msgs.avgMemUsed + `
          \`Y8a         a8P'              Average CPU Load: ` + beat.msgs.avgCpuLoad + `
            \`88,     ,88'
              "8b   d8"                  SERVER INFORMATION (THIS SERVER):
               "8b d8"                   Date of Last Boot: ` + beat.server.dateLastBoot + `
                \`888'                    Date Cache Last Saved: ` + beat.server.dateCacheLastSaved + `
                  "



    ,ad8PPPP88b,     ,d88PPPP8ba,        MORE SERVER INFORMATION:
   d8P"      "Y8b, ,d8P"      "Y8b       Server Status: ` + core.status + `
  dP'           "8a8"           \`Yd      Server Mode: Live (Stand-Alone)
  8(              "              )8      Processes Running On This Server: 1
  I8                             8I      Loaded Module Count: ` + core.moduleCount('modules') + `
   Yb,                         ,dP       Loaded Interface Count: ` + core.moduleCount('interfaces') + `
    "8a,                     ,a8"        Servers In Farm: ` + latestHeartbeat.peerCount + `
      "8a,                 ,a8"          
        "Yba             adP"            SERVICE INFORMATION:
          \`Y8a         a8P'              Loaded Service Count: ` + loadedServiceCount + `
            \`88,     ,88'                Total Route / Controller Count: ` + totalRouteCtrlCount + `
              "8b   d8"                  Running in Sandbox: ` + runningInSandbox + `
               "8b d8"                   
                \`888'                    
                  "

 =========================================================================================================
     ` );
          }
        };
        const cacheJob = function LoggerModuleCacheJob() {
          const content = JSON.stringify(analyticsStore);
          const fs = require('fs');
          const path = core.fetchBasePath('cache') + '/heartbeat/heartbeats.json';
          fs.writeFile(path, content, {encoding: 'utf8', flag: 'w'},
              function LoggerModuleCacheJobWriteFileCallback(err) {});
        };
        core.module('jobs').jobs.add({
          id: 'CH01', name: 'Console Server Heartbeat Job',
          type: 'recurring', delay: core.cfg().logger.heartbeat.heartbeatFreq, local: true,
        }, heartbeatJob, {});
        core.module('jobs').jobs.add({
          id: 'SH02', name: 'Server Heartbeat Cache Job',
          type: 'recurring', delay: core.cfg().logger.heartbeat.cacheFreq, local: true,
        }, cacheJob, {});
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Get & Update Latest Heartbeat Method
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupGetAndUpdateLatestHeartbeat = function LoggerModuleSetupGetAndUpdateLatestHeartbeat(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [5] Setting up the \'getLatestHeartbeat\' and ' +
          '\'updateLatestHeartbeat\' Methods on Logger',
          {}, 'LOGGER_BOUND_GET_UPDATE_HEARTBEAT_METHODS');
      mod.getLatestHeartbeat = function LoggerModuleGetLatestHeartbeat() {
        return latestHeartbeat;
      };
      mod.updateLatestHeartbeat = function LoggerModuleUpdateLatestHeartbeat(key, value) {
        latestHeartbeat[key] = value;
        return true;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Load Cached Heartbeats
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.loadCachedHeartbeats = function LoggerModuleLoadCachedHeartbeats(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [6] Loading cached heartbeats if they exist',
          {}, 'LOGGER_LOAD_CACHED_HEARTBEATS');
      setTimeout(function LoggerModuleLoadCachedHeartbeatsTimeout() {
        const fs = require('fs');
        const path = core.fetchBasePath('cache') + '/heartbeat/heartbeats.json';
        fs.readFile(path, 'utf8', function LoggerModuleLoadCachedHeartbeatsReadFileCallback(err, content) {
          if (content) analyticsStore = JSON.parse(content);
        });
      }, 70);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Fire the "Server Boot" Analytics Event
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.fireServerBootAnalyticsEvent = function LoggerModuleFireServerBootAnalyticsEvent(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [7] Firing the "Server Boot" Analytics Event',
          {}, 'LOGGER_FIRE_SERVER_BOOT_EVT');
      setTimeout(function LoggerModuleFireBootAnalyticsEventTimeout() {
        const dayjs = lib.dayjs;
        mod.analytics.log({'server': {'dateLastBoot': dayjs().format()}});
      }, 70);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Binds the 'enableConsole' method to this module
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindEnableConsole = function LoggerModuleBindEnableConsole(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [8a] Binding \'enableConsole\' method to this module',
          {}, 'LOGGER_BOUND_ENABLE_CONSOLE');
      mod.enableConsole = function LoggerModuleEnableConsole() {
        log('debug',
            'Blackrock Logger Module > [8b] \'enableConsole\' has been called',
            {}, 'LOGGER_ENABLE_CONSOLE_CALLED');
        consoleEnabled = true;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Bind Log Endpoints
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.bindLogEndpoints = function LoggerModuleBindLogEndpoints(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Logger Module > [9] Bound Analytics & Log Endpoint On The Logger Module',
          {}, 'LOGGER_BOUND_ANALYTICS_LOG_ENDPOINTS');
      logOverride = true;
      mod.log = log = newLog = function LoggerModuleLog(level, logMsg, attrObj, evtName) {
        let currentDate = new Date();
        currentDate = currentDate.toISOString();
        const evt2 = {
          'datestamp': currentDate,
          'level': level,
          'logMsg': logMsg,
          'attrObj': attrObj,
          'evtName': evtName,
          'sinks': evt.sinks,
        };
        mod.emit('logEvent', evt2);
        observer.next();
        return true;
      };
      if (!daemonInControl) core.emit('updateLogFn');
      if (!mod.analytics) mod.analytics = {};
      mod.analytics.log = function LoggerModuleAnalyticsLog(query) {
        const evt2 = {};
        evt2.analyticsEvent = {'query': query};
        const ISPipeline = pipelines.processAnalyticsEvent();
        new ISPipeline(evt2).pipe();
      };
    }, source);
  };


  /**
   * ==================================
   * Logger Stream Processing Functions
   * (Fires Once For Each Log Event)
   * ==================================
   */

  /**
   * (Internal > Stream  Methods [1]) Buffer Log Events Until Console Enabled
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.unbufferEvents = function LoggerModuleUnbufferEvents(source) {
    return lib.rxOperator(function(observer, evt) {
      if (consoleEnabled && logBuffer) {
        for (let i = 0; i < logBuffer.length; i++) {
          observer.next(logBuffer[i]);
        }
        observer.next(evt);
        logBuffer = [];
      } else {
        logBuffer.push(evt);
      }
    }, source);
  };

  /**
   * (Internal > Stream  Methods [2]) Fanout To Sinks
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.fanoutToSinks = function LoggerModuleFanoutToSinks(source) {
    return lib.rxOperator(function(observer, evt) {
      // eslint-disable-next-line guard-for-in
      for (const sink in evt.sinks) {
        let evt2 = {
          'level': evt.level,
          'logMsg': evt.logMsg,
          'attrObj': evt.attrObj,
          'evtName': evt.evtName,
          'sinks': evt.sinks,
        };
        if (evt.datestamp) evt2.datestamp = evt.datestamp;
        switch (sink) {
          case 'console': evt2.activeSink = 'console'; observer.next(evt2); evt2 = {}; break;
          case 'file': evt2.activeSink = 'file'; observer.next(evt2); evt2 = {}; break;
          case 'core': evt2.activeSink = 'core'; observer.next(evt2); evt2 = {}; break;
          case 'elasticsearch': evt2.activeSink = 'elasticsearch'; observer.next(evt2); evt2 = {}; break;
          default: break;
        }
      }
    }, source);
  };


  /**
   *  ===============================
   *  Logger Stream Sink Functions
   *  (Fires Once For Each Log Event)
   *  ===============================
   */

  /**
   * (Internal > Stream Methods [2.5]) Send Log Event to Core Object Event Emitter
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   */
  streamFns.sendToCoreObject = function LoggerModuleSendToCoreObject(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj;
    const currentDate = evt.datestamp; const evtName = evt.evtName;
    let logMessage; let logMod; const logMsgSplit = logMsg.split('>');
    if (logMsgSplit && logMsgSplit[0]) logMod = logMsgSplit[0].trim(); else logMod = '';
    if (logMsgSplit && logMsgSplit[1]) logMessage = logMsgSplit[1].trim(); else logMessage = '';
    setTimeout(function() {
      const emitObj = {
        'datestamp': currentDate,
        'evtName': evtName,
        'level': level,
        'module': logMod,
        'msg': logMessage,
        'attr': attrObj,
      };
      core.emit('log', emitObj);
      if (evtName) core.emit(evtName, emitObj);
      if (logMod) core.emit(logMod, emitObj);
      if (coreObjTimeout > 0) coreObjTimeout --;
    }, coreObjTimeout);
    return evt;
  };

  /**
   * (Internal > Stream Methods [3]) Send Log Event to Console
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   */
  streamFns.sendToConsole = function LoggerModuleSendToConsole(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'console' && !core.globals.get('silent')) {
      if (core.cfg().logger.levels.includes(level)) {
        console.log(currentDate + ' (' + level + ') ' + logMsg);
        if (attrObj && Object.keys(attrObj).length >= 1 && core.cfg().logger.logMetadataObjects) {
          console.log(attrObj);
        }
      }
    }
    return evt;
  };

  /**
   * (Internal > Stream Methods [4]) Send Log Event to Console
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   */
  streamFns.sendToFile = function LoggerModuleSendToFile(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'file') {
      if (fileStream && core.cfg().logger.levels.includes(level)) {
        fileStream.write(currentDate + ' (' + level +') ' + logMsg + '\n\n');
        if (attrObj && core.cfg().logger.logMetadataObjects === true) {
          fileStream.write(JSON.stringify(attrObj));
        }
      }
    }
    return evt;
  };

  /**
   * (Internal > Stream Methods [5]) Send Log Event to ElasticSearch
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   */
  streamFns.sendToElasticSearch = function LoggerModuleSendToElasticSearch(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'elasticsearch') {
      const httpModule = core.module('http', 'interface');
      if (!httpModule) return;
      const client = httpModule.client;
      let indexBucket = currentDate.split('T');
      indexBucket = indexBucket[0];
      const index = core.cfg().logger.sinks.elasticsearch['base_index'] + '-' + indexBucket;
      const baseUri = core.cfg().logger.sinks.elasticsearch['base_uri'];
      if (core.cfg().logger.levels.includes(level)) {
        const body = {
          'timestamp': currentDate,
          'level': level,
          'message': logMsg,
          'attributes': attrObj,
        };
        if (attrObj && core.cfg().logger.logMetadataObjects === true) body.attributes = attrObj;
        client.request({
          'url': baseUri + '/' + index + '/_doc/',
          'method': 'POST',
          'headers': {'Content-Type': 'application/json'},
          'encoding': 'utf8',
          'data': body,
        }, function LoggerModuleSendToElasticSearchCallback() {});
      }
    }
    return evt;
  };


  /**
   * ===============================
   * Logger Analytics Sink Functions
   * (Fires Once For Each Log Event)
   * ===============================
   */

  /**
   * (Internal > Stream Methods [6]) Process Analytics Event
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *   {
   *      "server": {
   *         "dateLastBoot": "2020-12-20 00:00:00",
   *         "dateCacheLastSaved": "2020-12-20 00:00:00"
   *      },
   *      "msgs": {
   *         "reqSize": 0,
   *         "avgProcessingTime": 0,
   *         "avgMemUsed": 0,
   *         "avgCpuLoad": 0,
   *         "resSize": 0
   *      }
   *   }
   */
  streamFns.processAnalyticsEvent = function LoggerModuleProcessAnalyticsEvent(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.analyticsEvent) {
        const query = evt.analyticsEvent.query; const dayjs = lib.dayjs;
        const dateObject = dayjs().format('YYYY-MM-DD').split('-');
        const year = dateObject[0]; const month = dateObject[1]; const day = dateObject[2];
        if (!analyticsStore[year]) {
          analyticsStore[year] = {};
        }
        if (!analyticsStore[year][month]) {
          analyticsStore[year][month] = {};
        }
        if (!analyticsStore[year][month][day]) {
          analyticsStore[year][month][day] = [];
        }
        // eslint-disable-next-line guard-for-in
        for (const param1 in query) {
          // eslint-disable-next-line guard-for-in
          for (const param2 in query[param1]) {
            if (!analyticsStore[year][month][day][analyticsStore.sessionEventCount]) {
              analyticsStore[year][month][day][analyticsStore.sessionEventCount] = {};
              analyticsStore[year][month][day][analyticsStore.sessionEventCount][param1] = {};
            }
            analyticsStore[year][month][day][analyticsStore.sessionEventCount][param1][param2] = query[param1][param2];
          }
        }
        analyticsStore.sessionEventCount ++;
      }
      observer.next(evt);
    }, source);
  };
}();
