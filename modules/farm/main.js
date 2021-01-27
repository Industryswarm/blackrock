!function FarmModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {};
  let lib; let rx; let scuttleBucketInstance; let jobServer = false; let serverModel;
  let serverEmitter; const farmServers = {}; const utils = {};


  /**
   * Blackrock Farm Module
   *
   * @class Server.Modules.Farm
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Farm} module - The Farm Module
   *
   * @description This is the Farm Module of the Blackrock Application Server.
   * It provides distributed / cluster compute capabilities for the server,
   * allowing you to run multiple disparate instances of the server (that can
   * be geographically disbursed) in unison. It uses the Scuttlebutt Gossip
   * Protocol to share state across all nodes in the cluster.
   * PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function FarmModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Farm'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Farm > Initialising...', {}, 'FARM_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupFarmModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * =====================
   * Event Stream Pipeline
   * =====================
   */


  /**
   * (Internal > Pipeline [1]) Setup Farm Module
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupFarmModule = function FarmModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function FarmModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function FarmModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function FarmModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Farm > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'FARM_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        stream.pipe(

            // Fires once on server initialisation:
            streamFns.loadScuttlebutt,
            streamFns.createModelAndServer,
            streamFns.persistToDisk,
            streamFns.setupUpdateListener,
            streamFns.connectToSeeds,
            streamFns.setupGetAndSetMethods,
            streamFns.setupIsJobServer,
            streamFns.setupEventEmitter,
            streamFns.setupUpdateRouter,
            streamFns.updateServerStatus,
            streamFns.inactivateStaleServers,
            streamFns.toggleLocalAsJobServer,
            streamFns.checkAndVoteOnJobServerRoles

        ).subscribe();
      },
    });
  };


  /**
   * =====================================
   * Farm Stream Processing Functions
   * (Fires Once on Server Initialisation)
   * =====================================
   */

  /**
   * (Internal > Stream Methods [1]) Load Scuttlebutt
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   * */
  streamFns.loadScuttlebutt = function FarmModuleLoadScuttlebutt(source) {
    return lib.rxOperator(function(observer, evt) {
      evt.lib = {
        sb: {
          Model: require('./_support/scuttlebutt/model'),
          Events: require('./_support/scuttlebutt/events'),
          Security: require('./_support/scuttlebutt/security'),
          ScuttleBucket: require('./_support/scuttlebucket'),
        },
        net: require('net'),
      };
      log('debug', 'Blackrock Farm > [1] Loaded Scuttlebutt Libraries', {}, 'FARM_LOADED_SCUTTLEBUTT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Create Model And Server
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.createModelAndServer = function FarmModuleCreateModelAndServer(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [2] Attempting to create model and start server', {}, 'FARM_SERVER_STARTING');
      let farm;
      if (core.cfg().farm) {
        farm = core.cfg().farm;
      } else {
        farm = {};
      }
      let port;
      if (farm.server && farm.server.port) {
        port = farm.server.port;
      } else {
        port = 8000;
      }
      utils.isPortTaken(port, function FarmModuleCreateModelAndServerPortTakenCallback(err, result) {
        if (result !== false) {
          evt.serverNotStarted = true;
          log('error',
              'Blackrock Farm > Cannot start Scuttlebutt as the defined port (' + port + ') is already in use',
              {}, 'FARM_SERVER_PORT_IN_USE');
          observer.next(evt);
          return;
        }
        const sl = evt.lib.sb;
        const create = function FarmModuleCreateModelAndServerCreateScuttleBucket() {
          return new sl.ScuttleBucket()
              .add('model', new sl.Model())
              .add('events', new sl.Events('evts'));
        };
        scuttleBucketInstance = create();
        evt.lib.net.createServer(function FarmModuleCreateModelAndServerCreateServerCallback(stream) {
          const ms = scuttleBucketInstance.createStream();
          stream.pipe(ms).pipe(stream);
          ms.on('error', function FarmModuleCreateModelAndServerOnMSError() {
            stream.destroy();
          });
          stream.on('error', function FarmModuleCreateModelAndServerOnStreamError() {
            ms.destroy();
          });
        }).listen(port, function() {
          log('debug',
              'Blackrock Farm > Created New Scuttlebutt Model + TCP Server Listening On Port ' + port,
              {}, 'FARM_SERVER_STARTED');
        });
        serverModel = scuttleBucketInstance.get('model');
        serverEmitter = scuttleBucketInstance.get('events');
        observer.next(evt);
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Persist To Disk (NOT WORKING)
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.persistToDisk = function FarmModulePersistToDisk(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [3] Setting Up Disk Persistence...', {}, 'FARM_INIT_DISK_PERS');
      let farm;
      if (core.cfg().farm) {
        farm = core.cfg().farm;
      } else {
        farm = {};
      }
      let cache;
      if (farm.server && farm.server.cache) {
        cache = farm.server.cache;
      } else {
        cache = null;
      }
      if (cache) {
        const file = core.fetchBasePath('cache') + '/' + cache;
        const fs = require('fs');
        if (!fs.existsSync(file)) {
          fs.closeSync(fs.openSync(file, 'w'));
        }
        fs.createReadStream(file).pipe(scuttleBucketInstance.createWriteStream());
        scuttleBucketInstance.on('sync', function FarmModulePersistToDiskSyncCallback() {
          scuttleBucketInstance.createReadStream().pipe(fs.createWriteStream(file));
        });
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Update Listener
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupUpdateListener = function FarmModuleSetupUpdateListener(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [4] Setting Up Update Listener...', {}, 'FARM_INIT_UPDATE_LISTENER');
      mod.updateListener = function FarmModuleUpdateListener(fn) {
        return serverModel.on('update', fn);
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Connect To Seed
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.connectToSeeds = function FarmModuleConnectToSeeds(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [5] Connecting To Seed Server...', {}, 'FARM_CONNECTING_TO_SEED_SERVER');
      const connectToSeed = function FarmModuleConnectToSeed(host, port) {
        const stream = evt.lib.net.connect(port);
        const ms = scuttleBucketInstance.createStream();
        stream.pipe(ms).pipe(stream);
      };
      if (evt.serverNotStarted) {
        return evt;
      }
      let farm;
      if (core.cfg().farm) {
        farm = core.cfg().farm;
      } else {
        farm = {};
      }
      if (farm.seeds) {
        for (let i = 0; i < farm.seeds.length; i++) {
          const host = farm.seeds[i].split(':')[0];
          const port = farm.seeds[i].split(':')[1];
          connectToSeed(host, port);
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Setup "Get From Store" & "Set Against Store" Methods
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupGetAndSetMethods = function FarmModuleSetupGetAndSetMethods(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [6] Setting Up Model Get & Set Methods...', {}, 'FARM_SETUP_MODEL_GET_SET');
      mod.get = function FarmModuleGetDataValue(key) {
        return serverModel.get(key);
      };
      mod.set = function FarmModuleSetDataValue(key, value) {
        return serverModel.set(key, value);
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Setup the "isJobServer()" Method
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupIsJobServer = function FarmModuleSetupIsJobServer(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [7] Setting Up \'isJobServer\' Method...', {}, 'FARM_SETUP_IS_JOB_SERVER_METHOD');
      mod.isJobServer = function FarmModuleIsJobServer() {
        return jobServer;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Setup Distributed Event Emitter
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupEventEmitter = function FarmModuleSetupEventEmitter(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [8] Setting Up Event Emitter...', {}, 'FARM_SETUP_EMITTER');
      mod.events = {
        emit: function FarmModuleEventEmitterEmit(event, data) {
          return serverEmitter.emit(event, data);
        },
        on: function FarmModuleEventEmitterOn(event, listener) {
          return serverEmitter.on(event, listener);
        },
        history: function FarmModuleEventEmitterHistory(filter) {
          return serverEmitter.history(filter);
        },
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Setup Update Router
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupUpdateRouter = function FarmModuleSetupUpdateRouter(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Farm > [9] Setting Up The Update Router...', {}, 'FARM_SETUP_UPDATE_ROUTER');
      serverModel.on('update', function FarmModuleSetupUpdateRouterOnUpdate(f1) {
        let key = f1[0]; let val = f1[1];
        if (key.startsWith('servers')) {
          key = key.split('[');
          const serverUri = key[1].slice(0, -1);
          if (core.module('utilities').isJSON(val)) {
            val = JSON.parse(val);
            farmServers[serverUri] = val;
          }
        }
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [10]) Setup Job to Update Server Status Every 2 Seconds
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * This method sets up a new job to fetch the latest heartbeat from the Logger module
   * AND to count the number of servers in the farm, and then to update the farm-wide property
   * for this server with the latest information from these sources. This job runs every 2 seconds.
   */
  streamFns.updateServerStatus = function FarmModuleUpdateServerStatus(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Farm > [10] Setting Up Job to Update Server Status With Latest Heartbeat...',
          {}, 'FARM_SETUP_HEARTBEAT_JOB');
      const dayjs = lib.dayjs;
      setInterval(function FarmModuleUpdateServerStatusInterval() {
        const latestHeartbeat = core.module('logger').getLatestHeartbeat();
        let serverCount = 0;
        for (const key in farmServers) {
          if (farmServers[key].status === 'active') {
            serverCount++;
          }
        }
        latestHeartbeat.peerCount = serverCount;
        core.module('logger').updateLatestHeartbeat('peerCount', latestHeartbeat.peerCount);
        const val = JSON.stringify({
          status: 'active',
          lastUpdated: dayjs().format(),
          heartbeat: latestHeartbeat,
        });
        mod.set('servers[127.0.0.1:' + core.cfg().farm.server.port + ']', val);
      }, 2000);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [11]) Setup Job to Inactivate Stale Servers
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * This method sets up a local job that runs every 2 seconds. The job checks
   * the lastUpdated property against each server in the farm and if it was updated
   * more than 3 seconds ago, it's status will be updated within the farm-wide
   * properties to become "inactive"
   */
  streamFns.inactivateStaleServers = function FarmModuleInactivateStaleServers(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Farm > [11] Setting Up Job to Inactivate Stale Servers...',
          {}, 'FARM_SETUP_INACTIVATE_STALE_JOB');
      const dayjs = lib.dayjs;
      setInterval(function FarmModuleInactivateStaleServersInterval() {
        const currentDateStamp = dayjs();
        // eslint-disable-next-line guard-for-in
        for (const server in farmServers) {
          const lastUpdated = dayjs(farmServers[server].lastUpdated);
          if (currentDateStamp.diff(lastUpdated) > 3000 && farmServers[server].status === 'active') {
            const val = JSON.stringify({
              status: 'inactive',
              lastUpdated: dayjs().format(),
            });
            mod.set('servers[' + server + ']', val);
          }
        }
      }, 2000);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [12]) Toggle Local Server as Job Server if Not In Farm
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * This method waits 10 seconds following server boot to see whether it ends up joining
   * a server farm. If it does not, then the "Primary Job Server" Role is automatically
   * applied to this server. If it later joins a farm then it will relinquish this role.
   * If no other servers in the farm have this role then selection will be based on a vote.
   */
  streamFns.toggleLocalAsJobServer = function FarmModuleToggleAsJobServer(source) {
    return lib.rxOperator(function(observer, evt) {
      let serverCount = 0;
      for (const key in farmServers) {
        if (farmServers[key].status === 'active') {
          serverCount++;
        }
      }
      if (serverCount <= 1) {
        jobServer = true;
        log('debug',
            'Blackrock Farm > [12] This stand-alone server has been toggled as the Primary Job Server',
            {}, 'FARM_IS_PRIMARY_JOB_SERVER');
      } else {
        log('debug',
            'Blackrock Farm > [12] This server is part of a farm and ' +
            'may be allocated the Primary Job Server role in the future',
            {}, 'FARM_NOT_PRIMARY_JOB_SERVER');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Check & Vote On Job Server Roles
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * This method sets up a job that only runs where there is > 1 server in the farm
   * (ie; not for stand-alone servers). When run, the job checks the farm-wide
   * properties - "PrimaryJobServer" and "SecondaryJobServer". If either of
   * these servers are inactive or the properties are empty, then this server will publish
   * a vote event to the farm that votes for two servers from the farm to fill these roles.
   * Server selection is random. Upon all votes being submitted, this and all other servers
   * in the farm will tally up the votes. If an even number of votes were submitted,
   * the last vote is discarded. The servers that receive the most votes will automatically
   * assign themselves the corresponding role and will update the farm-wide property for
   * the role that they were allocated with a value of their server IP + port.
   */
  streamFns.checkAndVoteOnJobServerRoles = function FarmModuleCheckAndVoteOnJobServerRoles(source) {
    return lib.rxOperator(function(observer, evt) {
      observer.next(evt);
    }, source);
  };


  /**
   * ===============
   * Utility Methods
   * ===============
   */

  /**
   * (Internal > Utilities) Checks if a port is already taken or in use
   * @param {number} port - The port number to check
   * @param {function} cb - Callback function
   */
  utils.isPortTaken = function FarmModuleIsPortTaken(port, cb) {
    const tester = require('net').createServer()
        .once('error', function FarmModuleIsPortTakenOnError(err) {
          if (err.code !== 'EADDRINUSE') {
            return cb(err);
          } cb(null, true);
        })
        .once('listening', function FarmModuleIsPortTakenOnListening() {
          tester.once('close', function() {
            cb(null, false);
          }).close();
        })
        .listen(port);
  };
}();
