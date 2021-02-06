!function LoggerModuleWrapper() {
  let core; let mod; const o = {}; const pipelines = function() {};

  /**
   * Blackrock Logger Module
   *
   * @public
   * @class Server.Modules.Logger
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.Logger} module - The Logger Module Singleton
   *
   * @description This is the Logger Module of the Blackrock Application Server.
   * It provides a logging method that can be used throughout the framework /
   * application server, as well as directly from within apps. It has routing
   * capabilities, allowing log events to be routed to - the Console, a Log File
   * on the filesystem, ElasticSearch and emitted directly to the Core Module instance.
   *
   * @example
   * const loggerModule = req.core.module('logger');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function LoggerModule(coreObj) {
    if (mod) return mod;
    // eslint-disable-next-line no-extend-native
    String.prototype.endsWith = function LoggerEndsWith(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    if (process.send) {
      fs.appendFileSync('/tmp/blackrock-daemon-fix.txt', 'Daemon Fix\n');
      fs.unlinkSync('/tmp/blackrock-daemon-fix.txt');
    }
    o.logBuffer = []; o.daemonInControl = false; o.logOverride = false;
    o.coreObjTimeout = 500; o.consoleEnabled = false; o.analyticsStore = {sessionEventCount: 0};
    o.latestHeartbeat = {}; o.logBuffer = []; o.fs = require('fs');
    core = coreObj; mod = new core.Mod('Logger');
    o.log = mod.log = function LoggerModuleQuickLog(level, logMsg, attrObj, evtName) {
      if (o.logOverride) return o.newLog(level, logMsg, attrObj);
      let currentDate = new Date();
      currentDate = currentDate.toISOString();
      const sEvt = pipelines.init.detectAvailableSinks({'noLog': true});
      const evt = {
        'level': level, 'logMsg': logMsg, 'attrObj': attrObj,
        'datestamp': currentDate, 'sinks': sEvt.sinks, 'evtName': evtName,
      };
      o.logBuffer.push(evt);
      return true;
    };
    let loadDependencies = false;
    core.on('CORE_START_DAEMON', function LoggerModuleOnStartDaemon() {
      o.daemonInControl = true;
    });
    core.on('CORE_LOAD_DEPENDENCIES', function LoggerModuleOnLoadDep() {
      loadDependencies = true;
    });
    o.log('debug', 'Logger > Initialising...',
        {module: mod.name}, 'LOGGER_INIT');
    let intervalCounter = 0;
    const interval = setInterval(function LoggerModuleInitInterval() {
      if (loadDependencies) {
        clearInterval(interval);
        pipelines.sendToSinks();
        pipelines.init();
      }
      if (intervalCounter >= 500) clearInterval(interval);
      intervalCounter += 10;
    }, 10);
    /**
     * (Undocumented) Unload Logger Module
     *
     * @private
     * @memberof Server.Modules.Logger
     * @function unload
     * @ignore
     *
     * @description
     * Tbc...
     *
     * @example
     * Tbc...
     */
    mod.unload = function LoggerModuleUnload() {
      o.log('debug',
          'Logger > Closing any open logging connections and shutting down.',
          {module: mod.name}, 'LOGGER_UNLOAD');
      if (o.fileStream) {
        // eslint-disable-next-line no-delete-var
        // noinspection JSAnnotator
        delete o.fileStream;
        core.emit('module-shut-down', 'Logger');
      } else {
        core.emit('module-shut-down', 'Logger');
      }
    };
    return mod;
  };

  /**
   * (Internal > Pipeline [1]) Setup Logger Module
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function LoggerInitPipeline() {
    // noinspection JSUnresolvedFunction, JSUnresolvedVariable
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.setupFileStream,
        core.lib.operators.map((evt) => {
          if (evt) return pipelines.init.detectAvailableSinks(evt);
        }),
        pipelines.init.setupViewAnalytics,
        pipelines.init.setupJobs,
        pipelines.init.setupGetAndUpdateLatestHeartbeat,
        pipelines.init.loadCachedHeartbeats,
        pipelines.init.fireServerBootAnalyticsEvent,
        pipelines.init.bindEnableConsole,
        pipelines.init.bindLogEndpoints

    ).subscribe();
  };

  /**
   * (Internal > Pipeline [2]) Send To Sinks
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.sendToSinks = function LoggerSendToSinksPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}, null, mod, 'logEvent').pipe(

        // Fires once per Log Event:
        pipelines.sendToSinks.unbufferEvents,
        pipelines.sendToSinks.fanoutToSinks

    ).subscribe(function LoggerSendToSinksPipelineSub(evt) {
      switch (evt.activeSink) {
        case 'console': pipelines.sendToSinks.sendToConsole(evt); break;
        case 'file': pipelines.sendToSinks.sendToFile(evt); break;
        case 'elasticsearch': pipelines.sendToSinks.sendToElasticSearch(evt); break;
        case 'core': pipelines.sendToSinks.sendToCoreObject(evt); break;
      }
    });
  };

  /**
   * (Internal > Pipeline [5]) Process Analytics Event
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.processAnalyticsEvt
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.processAnalyticsEvt = function LoggerProcessAnalyticsEvtPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once per Analytics Log Event (Request)
        pipelines.processAnalyticsEvt.processAnalyticsEvt

    ).subscribe();
  };


  /**
   * (Internal > Stream Methods [1]) Setup File Stream
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.setupFileStream
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
  pipelines.init.setupFileStream = function LoggerIPLSetupFileStream(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerIPLSetupFileStreamOp(observer, evt) {
      if (core.cfg().logger.sinks.file && core.cfg().logger.sinks.file.enabled === true) {
        let location;
        if (core.cfg().logger.sinks.file.location) location = core.cfg().logger.sinks.file.location;
        else location = core.fetchBasePath('root') + '/blackrock.log';
        if (o.fs.existsSync(location)) o.fileStream = fs.createWriteStream(location, {flags: 'a'});
        o.log('debug', 'Logger  > [1] Setup the File Stream',
            {module: mod.name}, 'LOGGER_SETUP_FILE_STREAM');
      } else {
        o.log('debug', 'Logger > [1] Skipped Creation of File Stream',
            {module: mod.name}, 'LOGGER_NO_FILE_STREAM');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Detect Available Sinks
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.detectAvailableSinks
   * @ignore
   * @param {object} evt - The Incoming Event
   * @return {object} evt - The Outgoing Event
   */
  pipelines.init.detectAvailableSinks = function LoggerIPLDetectAvailableSinks(evt) {
      evt.sinks = {}; evt.sinks.core = true;
      if (core.cfg().logger.enabled === true) {
        if (core.cfg().logger.sinks.console && core.cfg().logger.sinks.console.enabled === true) {
          evt.sinks.console = true;
        }
        if (core.cfg().logger.sinks.file && core.cfg().logger.sinks.file.enabled === true) evt.sinks.file = true;
        if (core.cfg().logger.sinks.elasticsearch && core.cfg().logger.sinks.elasticsearch.enabled === true) {
          evt.sinks.elasticsearch = true;
        }
        if (!evt.noLog) {
          o.log('debug',
              'Logger > [2] Detected Available Log Sinks',
              {module: mod.name, sinks: evt.sinks}, 'LOGGER_DETECTED_SINKS');
        }
      } else {
        if (!evt.noLog) {
          o.log('debug',
              'Logger > [2] Did Not Detect Log Sinks - As Logger is Disabled in Config',
              {module: mod.name}, 'LOGGER_DISABLED');
        }
      }
      return evt;
  };

  /**
   * (Internal > Stream Methods [3]) Setup View Analytics Method
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.setupViewAnalytics
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
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
  pipelines.init.setupViewAnalytics = function LoggerIPLSetupViewAnalytics(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerIPLSetupViewAnalytics(observer, evt) {
      // noinspection JSValidateTypes
      const ViewClass = new core.Base().extend({
        constructor: function LoggerIPLViewAnalyticsClassConstructor() {
          return this;
        },
        callback: function LoggerIPLViewAnalyticsClassCallback(cb) {
          return cb(this.evt);
        },
        process: function LoggerIPLViewAnalyticsClassPipe() {
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
          // noinspection JSUnresolvedVariable
          const dayjs = core.lib.dayjs; const dateObject = dayjs().format('YYYY-MM-DD').split('-');
          const year = dateObject[0]; const month = dateObject[1]; const day = dateObject[2];
          if (!o.analyticsStore[year]) o.analyticsStore[year] = {};
          if (!o.analyticsStore[year][month]) o.analyticsStore[year][month] = {};
          if (!o.analyticsStore[year][month][day]) o.analyticsStore[year][month][day] = [];
          return {year: year, month: month, day: day};
        },
        sortBy: function LoggerIPLViewAnalyticsClassSortBy(array, intField, param, direction) {
          if (direction === 'min') {
            array.sort(function LoggerIPLViewAnalyticsClassSortBySortFnOne(a, b) {
              if (!a[intField] && b[intField]) return 0 - b[intField][param];
              else if (!a[intField] && !b[intField]) return 0;
              else if (a[intField] && !b[intField]) return a[intField][param] - 0;
              else return a[intField][param] - b[intField][param];
            });
          } else {
            array.sort(function LoggerIPLViewAnalyticsClassSortBySortFnTwo(b, a) {
              if (((a && !a[intField]) || !a) && b && b[intField]) return 0 - b[intField][param];
              else if (((a && !a[intField]) || !a) && ((b && !b[intField]) || !b)) return 0;
              else if (a && a[intField] && ((b && !b[intField]) || !b)) return a[intField][param] - 0;
              else return a[intField][param] - b[intField][param];
            });
          }
          return array;
        },
        fetchMaxValue: function LoggerIPLViewAnalyticsClassFetchMaxValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams; const sortBy = this.sortBy;
          let intField;
          if (serverParams.includes(param)) intField = 'server';
          else if (msgsParams.includes(param)) intField = 'msgs';
          let daysEvts = o.analyticsStore[dp.year][dp.month][dp.day];
          daysEvts = sortBy(daysEvts, intField, param, 'max');
          if (!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) return 0;
          return daysEvts[0][intField][param];
        },
        /* fetchMinValue: function LoggerIPLViewAnalyticsClassFetchMinValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams; const sortBy = this.sortBy;
          let intField;
          if (serverParams.includes(param)) intField = 'server';
          else if (msgsParams.includes(param)) intField = 'msgs';
          let daysEvts = o.analyticsStore[dp.year][dp.month][dp.day];
          daysEvts = sortBy(daysEvts, intField, param, 'min');
          if (!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) {
            return 0;
          }
          return daysEvts[0][intField][param];
        }, */
        fetchTotalValue: function LoggerIPLViewAnalyticsClassFetchTotalValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) intField = 'server';
          else if (msgsParams.includes(param)) intField = 'msgs';
          const daysEvts = o.analyticsStore[dp.year][dp.month][dp.day];
          let sumTotal = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) {
              sumTotal += daysEvts[i][intField][param];
            }
          }
          return sumTotal;
        },
        fetchAvgValue: function LoggerIPLViewAnalyticsClassFetchAvgValue(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) intField = 'server';
          else if (msgsParams.includes(param)) intField = 'msgs';
          const daysEvts = o.analyticsStore[dp.year][dp.month][dp.day];
          let avgValue; let sumTotal = 0; let recordCount = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) {
              sumTotal += daysEvts[i][intField][param];
              recordCount ++;
            }
          }
          // eslint-disable-next-line prefer-const
          avgValue = sumTotal / recordCount;
          return avgValue;
        },
        fetchCount: function LoggerIPLViewAnalyticsClassFetchCount(param) {
          const s = this.stub(); const dp = s.dp; const serverParams = s.serverParams;
          const msgsParams = s.msgsParams;
          let intField;
          if (serverParams.includes(param)) intField = 'server';
          else if (msgsParams.includes(param)) intField = 'msgs';
          const daysEvts = o.analyticsStore[dp.year][dp.month][dp.day];
          let recordCount = 0;
          for (let i = 0; i < daysEvts.length; i++) {
            if (daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) recordCount ++;
          }
          return recordCount;
        },
      });
      if (!mod.analytics) mod.analytics = {};
      const viewObject = new ViewClass();
      mod.analytics.view = function LoggerIPLExternalViewAnalyticsFn() {
        return viewObject.process();
      };
      o.log('debug',
          'Logger > [3] View Analytics Setup & Ready For Use',
          {module: mod.name}, 'LOGGER_VIEW_ANALYTICS_SETUP');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Jobs
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.setupJobs
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
  pipelines.init.setupJobs = function LoggerIPLSetupJobs(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Logger > [4] Setting Up Heartbeat + Cache Jobs',
          {module: mod.name}, 'LOGGER_SETUP_HEARTBEAT_JOBS');
      if (core.cfg().logger.heartbeat) {
        const heartbeatJob = function LoggerIPLHeartbeatJob() {
          const beat = core.module('logger').analytics.view();
          const roundAndLabel = function LoggerIPLRoundAndLabel(param) {
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
          o.latestHeartbeat.totalReqSize = beat.msgs.totalReqSize = roundAndLabel(beat.msgs.totalReqSize);
          o.latestHeartbeat.totalResSize = beat.msgs.totalResSize = roundAndLabel(beat.msgs.totalResSize);
          o.latestHeartbeat.avgReqSize = beat.msgs.avgReqSize = roundAndLabel(beat.msgs.avgReqSize);
          o.latestHeartbeat.avgResSize = beat.msgs.avgResSize = roundAndLabel(beat.msgs.avgResSize);
          o.latestHeartbeat.avgMemUsed = beat.msgs.avgMemUsed = roundAndLabel(beat.msgs.avgMemUsed);
          o.latestHeartbeat.avgCpuLoad = beat.msgs.avgCpuLoad = Math.round(beat.msgs.avgCpuLoad) + '%';
          o.latestHeartbeat.totalReqCount = beat.msgs.totalReqCount;
          o.latestHeartbeat.totalResCount = beat.msgs.totalResCount;
          o.latestHeartbeat.avgProcessingTime = beat.msgs.avgProcessingTime;
          o.latestHeartbeat.dateLastBoot = beat.msgs.dateLastBoot;
          o.latestHeartbeat.dateCacheLastSaved = beat.msgs.dateCacheLastSaved;
          if (!o.latestHeartbeat.peerCount) o.latestHeartbeat.peerCount = 1;
          let appStats = {}; appStats.appsMemoryUse = '0 Bytes';
          appStats.appsCount = 0; appStats.appsRouteCount = 0;
          if (core.module('app-engine') && core.module('app-engine').appStats) {
            appStats = core.module('app-engine').appStats();
            appStats.appsMemoryUse = roundAndLabel(appStats.appsMemoryUse);
          }
          let runningInSandbox = 'No';
          if (core.module('sandbox') && core.cfg()['app-engine'].sandbox.default === true) runningInSandbox = 'Yes';
          const loadedAppCount = appStats.appsCount + ` (` + appStats.appsMemoryUse + `)`;
          const totalRouteCtrlCount = appStats.appsRouteCount + ` (` + appStats.appsMemoryUse + `)`;
          if (core.cfg().logger.heartbeat.console && o.consoleEnabled && !core.globals.get('silent')) {
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
  I8                             8I      Loaded Module Count: ` + core.module.count('modules') + `
   Yb,                         ,dP       Loaded Interface Count: ` + core.module.count('interfaces') + `
    "8a,                     ,a8"        Servers In Farm: ` + o.latestHeartbeat.peerCount + `
      "8a,                 ,a8"          
        "Yba             adP"            APP INFORMATION:
          \`Y8a         a8P'              Loaded App Count: ` + loadedAppCount + `
            \`88,     ,88'                Total Route / Controller Count: ` + totalRouteCtrlCount + `
              "8b   d8"                  Running in Sandbox: ` + runningInSandbox + `
               "8b d8"                   
                \`888'                    
                  "

 =========================================================================================================
     ` );
          }
        };
        const cacheJob = function LoggerIPLCacheJob() {
          const content = JSON.stringify(o.analyticsStore);
          const path = core.fetchBasePath('cache') + '/heartbeat/heartbeats.json';
          o.fs.writeFile(path, content, {encoding: 'utf8', flag: 'w'},
              function LoggerModuleCacheJobWriteFileCallback(err) {});
        };
        core.module.isLoaded('jobs').then(function LoggerIPLIsJobsLoadedThen(jobsMod) {
          // noinspection JSUnresolvedVariable
          jobsMod.add({
            id: 'CH01', name: 'Console Server Heartbeat Job',
            type: 'recurring', delay: core.cfg().logger.heartbeat.heartbeatFreq, local: true,
          }, heartbeatJob, {});
          // noinspection JSUnresolvedVariable
          jobsMod.add({
            id: 'SH02', name: 'Server Heartbeat Cache Job',
            type: 'recurring', delay: core.cfg().logger.heartbeat.cacheFreq, local: true,
          }, cacheJob, {});
        }).catch(function LoggerIPLIsJobsLoadedCatch(err) {
          o.log('debug',
              'Logger > [4] Cannot Load Jobs Module',
              {module: mod.name, error: err}, 'LOGGER_NO_LOAD_JOBS');
        });
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Setup Get & Update Latest Heartbeat Method
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.setupGetAndUpdateLatestHeartbeat
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
  pipelines.init.setupGetAndUpdateLatestHeartbeat = function LoggerIPLSetupGetAndUpdateLatestHb(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Logger > [5] Setting up the \'getLatestHeartbeat\' and ' +
          '\'updateLatestHeartbeat\' Methods on Logger',
          {module: mod.name}, 'LOGGER_BOUND_GET_UPDATE_HEARTBEAT_METHODS');
      /**
       * Get Latest Heartbeat
       *
       * @public
       * @memberof Server.Modules.Logger
       * @function getLatestHeartbeat
       * @return {object} latestHeartbeat - The Latest Heartbeat
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.getLatestHeartbeat = function LoggerGetLatestHeartbeat() {
        return o.latestHeartbeat;
      };
      /**
       * (Undocumented) Update Latest Heartbeat
       *
       * @private
       * @memberof Server.Modules.Logger
       * @function updateLatestHeartbeat
       * @param {string} key - Latest Heartbeat Key
       * @param {object|*} value - Latest Heartbeat Value
       * @return {boolean} result - Result of Updating Latest Heartbeat
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.updateLatestHeartbeat = function LoggerUpdateLatestHeartbeat(key, value) {
        o.latestHeartbeat[key] = value;
        return true;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Load Cached Heartbeats
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.loadCachedHeartbeats
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
  pipelines.init.loadCachedHeartbeats = function LoggerIPLLoadCachedHeartbeats(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Logger > [6] Loading cached heartbeats if they exist',
          {module: mod.name}, 'LOGGER_LOAD_CACHED_HEARTBEATS');
      setTimeout(function LoggerIPLLoadCachedHeartbeatsTimeout() {
        const path = core.fetchBasePath('cache') + '/heartbeat/heartbeats.json';
        o.fs.readFile(path, 'utf8',
            function LoggerIPLLoadCachedHeartbeatsReadFileCb(err, content) {
          if (content) o.analyticsStore = JSON.parse(content);
        });
      }, 70);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Fire the "Server Boot" Analytics Event
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.fireServerBootAnalyticsEvent
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
  pipelines.init.fireServerBootAnalyticsEvent = function LoggerIPLFireServerBootAnalyticsEvt(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerIPLFireServerBootAnalyticsEvtOp(observer, evt) {
      o.log('debug',
          'Logger > [7] Firing the "Server Boot" Analytics Event',
          {module: mod.name}, 'LOGGER_FIRE_SERVER_BOOT_EVT');
      setTimeout(function LoggerIPLFireServerBootAnalyticsEvtTimeout() {
        // noinspection JSUnresolvedFunction
        mod.analytics.log({'server': {'dateLastBoot': core.lib.dayjs().format()}});
      }, 70);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Binds the 'enableConsole' method to this module
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.bindEnableConsole
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
  pipelines.init.bindEnableConsole = function LoggerIPLBindEnableConsole(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerIPLBindEnableConsoleOp(observer, evt) {
      o.log('debug',
          'Logger > [8a] Binding \'enableConsole\' method to this module',
          {module: mod.name}, 'LOGGER_BOUND_ENABLE_CONSOLE');
      /**
       * (Undocumented) Enable Console
       *
       * @private
       * @memberof Server.Modules.Logger
       * @function enableConsole
       * @ignore
       *
       * @description
       * This method is called internally to enable the console (switch from caching log requests directed
       * at the console to actually sending them through to the console), once the Logger Module has
       * finished initialising.
       *
       * @example
       * Tbc...
       */
      mod.enableConsole = function LoggerBindEnableConsole() {
        o.log('debug',
            'Logger > [8b] \'enableConsole\' has been called',
            {module: mod.name}, 'LOGGER_ENABLE_CONSOLE_CALLED');
        o.consoleEnabled = true;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Bind Log Endpoints
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.init.bindLogEndpoints
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
  pipelines.init.bindLogEndpoints = function LoggerIPLBindLogEndpoints(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerIPLBindLogEndpointsOp(observer, evt) {
      o.log('debug',
          'Logger > [9] Bound Analytics & Log Endpoint On The Logger Module',
          {module: mod.name}, 'LOGGER_BOUND_ANALYTICS_LOG_ENDPOINTS');
      o.logOverride = true;
      /**
       * Log an Event
       *
       * @public
       * @memberof Server.Modules.Logger
       * @function log
       * @param {string} level - Log Level (startup|error|warning|debug|[custom])
       * @param {string} logMsg - Log Message
       * @param {object} [attrObj] - Attributes Object
       * @param {string} [evtName] - Event Name
       * @return {boolean} result - Result (True|False)
       *
       * @description
       * This method is the main method used to log new events in the Blackrock Application Server. You
       * must pass it a 'level' (startup|error|warning|debug|[custom]) and message at a minimum. The
       * Attributes Object and Event Name are optional.
       *
       * @example
       * const log = req.core.module('logger').log;
       * log('debug', 'This is a sample message', {type: "sample"}, 'SAMPLE_MSG');
       * // If Console Enabled, Output Is: 'XXXX-XX-XX XX-XX-XX (debug) This is a sample message'
       */
      mod.log = o.log = o.newLog = function LoggerModuleLog(level, logMsg, attrObj, evtName) {
        let currentDate = new Date();
        currentDate = currentDate.toISOString();
        const evt2 = {
          'datestamp': currentDate, 'level': level, 'logMsg': logMsg,
          'attrObj': attrObj, 'evtName': evtName, 'sinks': evt.sinks,
        };
        mod.emit('logEvent', evt2);
        observer.next();
        return true;
      };
      if (!o.daemonInControl) core.emit('updateLogFn');
      if (!mod.analytics) {
        /**
         * Analytics Logger Object
         *
         * @public
         * @memberof Server.Modules.Logger
         * @property {function} log - Log Method
         *
         * @description
         * This method is used internally to track server analytics such as up time, total and average number
         * of requests and responses going through the Router Module, Etc...
         *
         * @example
         * Tbc...
         */
        mod.analytics = {};
      }
      /**
       * Log an Analytics Event
       *
       * @public
       * @memberof Server.Modules.Logger
       * @function analytics.log
       * @param {object} query - Analytics Log Query
       *
       * @description
       * This method is used internally to track server analytics such as up time, total and average number
       * of requests and responses going through the Router Module, Etc...
       *
       * @example
       * Tbc...
       */
      mod.analytics.log = function LoggerModuleAnalyticsLog(query) {
        const evt2 = {};
        evt2.analyticsEvent = {'query': query};
        pipelines.processAnalyticsEvt();
      };
    }, source);
  };


  /**
   * (Internal > Stream  Methods [1]) Un-Buffer Log Events When Console Enabled
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.unbufferEvents
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
  pipelines.sendToSinks.unbufferEvents = function LoggerSTSPLUnbufferEvents(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (o.consoleEnabled && o.logBuffer) {
        for (let i = 0; i < o.logBuffer.length; i++) {
          observer.next(o.logBuffer[i]);
        }
        observer.next(evt);
        o.logBuffer = [];
      } else o.logBuffer.push(evt);
    }, source);
  };

  /**
   * (Internal > Stream  Methods [2]) Fan-Out To Sinks
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.fanoutToSinks
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
  pipelines.sendToSinks.fanoutToSinks = function LoggerModuleFanoutToSinks(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      // eslint-disable-next-line guard-for-in
      for (const sink in evt.sinks) {
        let evt2 = {
          'level': evt.level, 'logMsg': evt.logMsg, 'attrObj': evt.attrObj,
          'evtName': evt.evtName, 'sinks': evt.sinks,
        };
        if (evt.datestamp) evt2.datestamp = evt.datestamp;
        // noinspection JSUnfilteredForInLoop
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
   * (Internal > Stream Methods [2.5]) Send Log Event to Core Object Event Emitter
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.sendToCoreObject
   * @ignore
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.sendToSinks.sendToCoreObject = function LoggerModuleSendToCoreObject(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj;
    const currentDate = evt.datestamp; const evtName = evt.evtName;
    let logMessage; let logMod; const logMsgSplit = logMsg.split('>');
    if (logMsgSplit && logMsgSplit[0]) logMod = logMsgSplit[0].trim(); else logMod = '';
    if (logMsgSplit && logMsgSplit[1]) logMessage = logMsgSplit[1].trim(); else logMessage = '';
    setTimeout(function() {
      const emitObj = {
        'datestamp': currentDate, 'evtName': evtName, 'level': level,
        'module': logMod, 'msg': logMessage, 'attr': attrObj,
      };
      core.emit('log', emitObj);
      if (evtName) core.emit(evtName, emitObj);
      if (logMod) core.emit(logMod, emitObj);
      if (o.coreObjTimeout > 0) o.coreObjTimeout --;
    }, o.coreObjTimeout);
    return evt;
  };

  /**
   * (Internal > Stream Methods [3]) Send Log Event to Console
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.sendToConsole
   * @ignore
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.sendToSinks.sendToConsole = function LoggerModuleSendToConsole(evt) {
    const level = evt.level; const logMsg = evt.logMsg; const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'console' && !core.globals.get('silent')) {
      // noinspection JSUnresolvedVariable
      if (core.cfg().logger.levels.includes(level)) {
        console.log(currentDate + ' (' + level + ') ' + logMsg);
        // noinspection JSUnresolvedVariable
        if (attrObj && Object.keys(attrObj).length >= 1 && core.cfg().logger.logMetadataObjects) {
          console.log(attrObj);
        }
      }
    }
    return evt;
  };

  /**
   * (Internal > Stream Methods [4]) Send Log Event to Console
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.sendToFile
   * @ignore
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.sendToSinks.sendToFile = function LoggerModuleSendToFile(evt) {
    const level = evt.level; const logMsg = evt.logMsg;
    const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'file') {
      // noinspection JSUnresolvedVariable
      if (o.fileStream && core.cfg().logger.levels.includes(level)) {
        o.fileStream.write(currentDate + ' (' + level +') ' + logMsg + '\n\n');
        // noinspection JSUnresolvedVariable
        if (attrObj && core.cfg().logger.logMetadataObjects === true) {
          o.fileStream.write(JSON.stringify(attrObj));
        }
      }
    }
    return evt;
  };

  /**
   * (Internal > Stream Methods [5]) Send Log Event to ElasticSearch
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.sendToSinks.sendToElasticSearch
   * @ignore
   * @param {object} evt - The Request Event
   * @return {object} evt - The Response Event
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.sendToSinks.sendToElasticSearch = function LoggerModuleSendToElasticSearch(evt) {
    const level = evt.level; const logMsg = evt.logMsg;
    const attrObj = evt.attrObj; const currentDate = evt.datestamp;
    if (evt.activeSink === 'elasticsearch') {
      const httpModule = core.module('http', 'interface');
      if (!httpModule) return;
      const client = httpModule.client;
      let indexBucket = currentDate.split('T');
      indexBucket = indexBucket[0];
      const index = core.cfg().logger.sinks.elasticsearch['base_index'] + '-' + indexBucket;
      const baseUri = core.cfg().logger.sinks.elasticsearch['base_uri'];
      // noinspection JSUnresolvedVariable
      if (core.cfg().logger.levels.includes(level)) {
        const body = {
          'timestamp': currentDate,
          'level': level,
          'message': logMsg,
          'attributes': attrObj,
        };
        // noinspection JSUnresolvedVariable
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
   * (Internal > Stream Methods [6]) Process Analytics Event
   *
   * @private
   * @memberof Server.Modules.Logger
   * @function pipelines.processAnalyticsEvt.processAnalyticsEvt
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
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
  pipelines.processAnalyticsEvt.processAnalyticsEvt = function LoggerPAEPLProcessAnalyticsEvt(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function LoggerPAEPLProcessAnalyticsEvtOp(observer, evt) {
      if (evt.analyticsEvent) {
        const query = evt.analyticsEvent.query;
        // noinspection JSUnresolvedVariable
        const dayjs = core.lib.dayjs;
        const dateObject = dayjs().format('YYYY-MM-DD').split('-');
        const year = dateObject[0]; const month = dateObject[1]; const day = dateObject[2];
        if (!o.analyticsStore[year]) o.analyticsStore[year] = {};
        if (!o.analyticsStore[year][month]) o.analyticsStore[year][month] = {};
        if (!o.analyticsStore[year][month][day]) o.analyticsStore[year][month][day] = [];
        // eslint-disable-next-line guard-for-in
        for (const param1 in query) {
          // eslint-disable-next-line guard-for-in
          for (const param2 in query[param1]) {
            if (!o.analyticsStore[year][month][day][o.analyticsStore.sessionEventCount]) {
              o.analyticsStore[year][month][day][o.analyticsStore.sessionEventCount] = {};
              o.analyticsStore[year][month][day][o.analyticsStore.sessionEventCount][param1] = {};
            }
            const dateAnalyticsEvtStore = o.analyticsStore[year][month][day];
            // noinspection JSUnfilteredForInLoop
            dateAnalyticsEvtStore[o.analyticsStore.sessionEventCount][param1][param2] = query[param1][param2];
          }
        }
        o.analyticsStore.sessionEventCount ++;
      }
      observer.next(evt);
    }, source);
  };
}();
