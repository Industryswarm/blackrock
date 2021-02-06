!function FarmModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Farm Module
   *
   * @public
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
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function FarmModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Farm'); o.log = core.module('logger').log;
    o.farmServers = {}; o.utils = {}; o.jobServer = false;
    o.log('debug', 'Blackrock Farm > Initialising...', {module: mod.name}, 'MODULE_INIT');
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
   * @function registerWithCLI
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.runInitPipeline = function FarmInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.loadScuttlebutt,
        pipelines.init.createModelAndServer,
        pipelines.init.persistToDisk,
        pipelines.init.setupUpdateListener,
        pipelines.init.connectToSeeds,
        pipelines.init.setupGetAndSetMethods,
        pipelines.init.setupIsJobServer,
        pipelines.init.setupEventEmitter,
        pipelines.init.setupUpdateRouter,
        pipelines.init.updateServerStatus,
        pipelines.init.inactivateStaleServers,
        pipelines.init.toggleLocalAsJobServer,
        pipelines.init.checkAndVoteOnJobServerRoles

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Load Scuttlebutt
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function loadScuttlebutt
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   * */
  pipelines.init.loadScuttlebutt = function FarmIPLLoadScuttlebutt(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLLoadScuttlebuttOp(observer, evt) {
      evt.lib = {
        sb: {
          Model: require('./_support/scuttlebutt/model'),
          Events: require('./_support/scuttlebutt/events'),
          Security: require('./_support/scuttlebutt/security'),
          ScuttleBucket: require('./_support/scuttlebucket'),
        },
        net: require('net'),
      };
      o.log('debug', 'Farm > [1] Loaded Scuttlebutt Libraries',
          {module: mod.name}, 'FARM_LOADED_SCUTTLEBUTT');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Create Model And Server
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function createModelAndServer
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.createModelAndServer = function FarmIPLCreateModel(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLCreateModelOp(observer, evt) {
      o.log('debug', 'Blackrock Farm > [2] Attempting to create model and start server',
          {module: mod.name}, 'FARM_SERVER_STARTING');
      let farm;
      // noinspection JSUnresolvedVariable
      if (core.cfg().farm) {
        // noinspection JSUnresolvedVariable
        farm = core.cfg().farm;
      } else farm = {};
      let port;
      if (farm.server && farm.server.port) port = farm.server.port;
      else port = 8000;
      o.utils.isPortTaken(port, function FarmIPLCreateModelPortTakenCb(err, result) {
        if (result !== false) {
          evt.serverNotStarted = true;
          o.log('error',
              'Farm > Cannot start Scuttlebutt as the defined port (' + port + ') is already in use',
              {module: mod.name}, 'FARM_SERVER_PORT_IN_USE');
          observer.next(evt);
          return;
        }
        const sl = evt.lib.sb;
        const create = function FarmIPLCreateModelCreateScuttleBucket() {
          return new sl.ScuttleBucket()
              .add('model', new sl.Model())
              .add('events', new sl.Events('evts'));
        };
        o.scuttleBucketInstance = create();
        evt.lib.net.createServer(function FarmIPLCreateModelCreateServerCb(stream) {
          const ms = o.scuttleBucketInstance.createStream();
          stream.pipe(ms).pipe(stream);
          ms.on('error', function FarmIPLCreateModelOnMSErr() {
            stream.destroy();
          });
          stream.on('error', function FarmIPLCreateModelOnStreamErr() {
            ms.destroy();
          });
        }).listen(port, function() {
          o.log('debug',
              'Farm > Created New Scuttlebutt Model + TCP Server Listening On Port ' + port,
              {module: mod.name}, 'FARM_SERVER_STARTED');
        });
        o.serverModel = o.scuttleBucketInstance.get('model');
        o.serverEmitter = o.scuttleBucketInstance.get('events');
        observer.next(evt);
      });
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Persist To Disk (NOT WORKING)
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function persistToDisk
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.persistToDisk = function FarmIPLPersistToDisk(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLPersistToDiskOp(observer, evt) {
      o.log('debug', 'Farm > [3] Setting Up Disk Persistence...',
          {module: mod.name}, 'FARM_INIT_DISK_PERS');
      let farm;
      // noinspection JSUnresolvedVariable
      if (core.cfg().farm) {
        // noinspection JSUnresolvedVariable
        farm = core.cfg().farm;
      } else farm = {};
      let cache;
      if (farm.server && farm.server.cache) cache = farm.server.cache;
      else cache = null;
      if (cache) {
        const file = core.fetchBasePath('cache') + '/' + cache;
        const fs = require('fs');
        if (!fs.existsSync(file)) fs.closeSync(fs.openSync(file, 'w'));
        fs.createReadStream(file).pipe(o.scuttleBucketInstance.createWriteStream());
        o.scuttleBucketInstance.on('sync', function FarmIPLPersistToDiskSyncCallback() {
          o.scuttleBucketInstance.createReadStream().pipe(fs.createWriteStream(file));
        });
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Setup Update Listener
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function setupUpdateListener
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupUpdateListener = function FarmSetupUpdateListener(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmSetupUpdateListenerOp(observer, evt) {
      o.log('debug', 'Farm > [4] Setting Up Update Listener...',
          {module: mod.name}, 'FARM_INIT_UPDATE_LISTENER');
      /**
       * Update Listener
       *
       * @public
       * @memberof Server.Modules.Farm
       * @function updateListener
       * @param {function} fn - Callback For Listener
       * @return {*} result - Lookup Value
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.updateListener = function FarmUpdateListener(fn) {
        return o.serverModel.on('update', fn);
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Connect To Seed
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function connectToSeeds
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.connectToSeeds = function FarmIPLConnectToSeeds(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLConnectToSeedsOp(observer, evt) {
      o.log('debug', 'Farm > [5] Connecting To Seed Server...',
          {module: mod.name}, 'FARM_CONNECTING_TO_SEED_SERVER');
      const connectToSeed = function FarmModuleConnectToSeed(host, port) {
        const stream = evt.lib.net.connect(port);
        const ms = o.scuttleBucketInstance.createStream();
        stream.pipe(ms).pipe(stream);
      };
      if (evt.serverNotStarted) return evt;
      let farm;
      // noinspection JSUnresolvedVariable
      if (core.cfg().farm) {
        // noinspection JSUnresolvedVariable
        farm = core.cfg().farm;
      } else farm = {};
      // noinspection JSUnresolvedVariable
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
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function setupGetAndSetMethods
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupGetAndSetMethods = function FarmIPLSetupGetAndSetMethods(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLSetupGetAndSetMethodsOp(observer, evt) {
      o.log('debug', 'Farm > [6] Setting Up Model Get & Set Methods...',
          {module: mod.name}, 'FARM_SETUP_MODEL_GET_SET');
      /**
       * Get Method
       *
       * @public
       * @memberof Server.Modules.Farm
       * @function get
       * @param {string} key - Lookup Key
       * @return {*} result - Lookup Value
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.get = function FarmGetDataValue(key) {
        return o.serverModel.get(key);
      };
      /**
       * Set Method
       *
       * @public
       * @memberof Server.Modules.Farm
       * @function set
       * @param {string} key - Lookup Key
       * @param {*} value - Value to Set
       * @return {*} result - Result
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.set = function FarmSetDataValue(key, value) {
        return o.serverModel.set(key, value);
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [7]) Setup the "isJobServer()" Method
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function setupIsJobServer
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupIsJobServer = function FarmIPLSetupIsJobServer(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLSetupIsJobServerOp(observer, evt) {
      o.log('debug', 'Farm > [7] Setting Up \'isJobServer\' Method...',
          {module: mod.name}, 'FARM_SETUP_IS_JOB_SERVER_METHOD');
      /**
       * Is Job Server?
       *
       * @public
       * @memberof Server.Modules.Farm
       * @function isJobServer
       * @return {boolean} result - Is Job Server Result (True | False)
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.isJobServer = function FarmIsJobServer() {
        return o.jobServer;
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [8]) Setup Distributed Event Emitter
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function setupEventEmitter
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupEventEmitter = function FarmIPLSetupEventEmitter(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLSetupEventEmitterOp(observer, evt) {
      o.log('debug', 'Farm > [8] Setting Up Event Emitter...',
          {module: mod.name}, 'FARM_SETUP_EMITTER');
      mod.events = {
        emit: function FarmEventEmitterEmit(event, data) {
          return o.serverEmitter.emit(event, data);
        },
        on: function FarmEventEmitterOn(event, listener) {
          return o.serverEmitter.on(event, listener);
        },
        history: function FarmEventEmitterHistory(filter) {
          return o.serverEmitter.history(filter);
        },
      };
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [9]) Setup Update Router
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function setupUpdateRouter
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupUpdateRouter = function FarmIPLSetupUpdateRouter(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLSetupUpdateRouterOp(observer, evt) {
      o.log('debug', 'Farm > [9] Setting Up The Update Router...',
          {module: mod.name}, 'FARM_SETUP_UPDATE_ROUTER');
      o.serverModel.on('update', function FarmIPLSetupUpdateRouterOnUpdate(f1) {
        let key = f1[0]; let val = f1[1];
        if (key.startsWith('servers')) {
          key = key.split('[');
          const serverUri = key[1].slice(0, -1);
          if (core.module('utilities').isJSON(val)) {
            val = JSON.parse(val);
            o.farmServers[serverUri] = val;
          }
        }
      });
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [10]) Setup Job to Update Server Status Every 2 Seconds
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function updateServerStatus
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * This method sets up a new job to fetch the latest heartbeat from the Logger module
   * AND to count the number of servers in the farm, and then to update the farm-wide property
   * for this server with the latest information from these sources. This job runs every 2 seconds.
   *
   * @example
   * Tbc...
   */
  pipelines.init.updateServerStatus = function FarmIPLUpdateServerStatus(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLUpdateServerStatusOp(observer, evt) {
      o.log('debug',
          'Farm > [10] Setting Up Job to Update Server Status With Latest Heartbeat...',
          {module: mod.name}, 'FARM_SETUP_HEARTBEAT_JOB');
      // noinspection JSUnresolvedVariable
      const dayjs = core.lib.dayjs;
      setInterval(function FarmUpdateServerStatusInt() {
        const latestHeartbeat = core.module('logger').getLatestHeartbeat();
        let serverCount = 0;
        for (const key in o.farmServers) {
          // noinspection JSUnfilteredForInLoop
          if (o.farmServers[key].status === 'active') serverCount++;
        }
        latestHeartbeat.peerCount = serverCount;
        core.module('logger').updateLatestHeartbeat('peerCount', latestHeartbeat.peerCount);
        const val = JSON.stringify({
          status: 'active',
          lastUpdated: dayjs().format(),
          heartbeat: latestHeartbeat,
        });
        // noinspection JSUnresolvedVariable
        mod.set('servers[127.0.0.1:' + core.cfg().farm.server.port + ']', val);
      }, 2000);
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [11]) Setup Job to Inactivate Stale Servers
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function inactivateStaleServers
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * This method sets up a local job that runs every 2 seconds. The job checks
   * the lastUpdated property against each server in the farm and if it was updated
   * more than 3 seconds ago, it's status will be updated within the farm-wide
   * properties to become "inactive"
   *
   * @example
   * Tbc...
   */
  pipelines.init.inactivateStaleServers = function FarmIPLInactivateStaleServers(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLInactivateStaleServersOp(observer, evt) {
      o.log('debug',
          'Farm > [11] Setting Up Job to Inactivate Stale Servers...',
          {module: mod.name}, 'FARM_SETUP_INACTIVATE_STALE_JOB');
      // noinspection JSUnresolvedVariable
      const dayjs = core.lib.dayjs;
      // noinspection JSUnfilteredForInLoop
      setInterval(function FarmIPLInactivateStaleServersInt() {
        const currentDateStamp = dayjs();
        // eslint-disable-next-line guard-for-in
        for (const server in o.farmServers) {
          // noinspection JSUnfilteredForInLoop
          const lastUpdated = dayjs(o.farmServers[server].lastUpdated);
          // noinspection JSUnfilteredForInLoop
          if (currentDateStamp.diff(lastUpdated) > 3000 && o.farmServers[server].status === 'active') {
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
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function toggleLocalAsJobServer
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * This method waits 10 seconds following server boot to see whether it ends up joining
   * a server farm. If it does not, then the "Primary Job Server" Role is automatically
   * applied to this server. If it later joins a farm then it will relinquish this role.
   * If no other servers in the farm have this role then selection will be based on a vote.
   *
   * @example
   * Tbc...
   */
  pipelines.init.toggleLocalAsJobServer = function FarmIPLToggleAsJobServer(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLToggleAsJobServerOp(observer, evt) {
      let serverCount = 0;
      for (const key in o.farmServers) {
        // noinspection JSUnfilteredForInLoop
        if (o.farmServers[key].status === 'active') serverCount++;
      }
      if (serverCount <= 1) {
        o.jobServer = true;
        o.log('debug',
            'Farm > [12] This stand-alone server has been toggled as the Primary Job Server',
            {module: mod.name}, 'FARM_IS_PRIMARY_JOB_SERVER');
      } else {
        o.log('debug',
            'Farm > [12] This server is part of a farm and ' +
            'may be allocated the Primary Job Server role in the future',
            {module: mod.name}, 'FARM_NOT_PRIMARY_JOB_SERVER');
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [13]) Check & Vote On Job Server Roles
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function checkAndVoteOnJobServerRoles
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
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
   *
   * @example
   * Tbc...
   */
  pipelines.init.checkAndVoteOnJobServerRoles = function FarmIPLCheckAndVoteOnJobServerRoles(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function FarmIPLCheckAndVoteOnJobServerRolesOp(observer, evt) {
      observer.next(evt);
    }, source);
  };


  /**
   * (Internal > Utilities) Checks if a port is already taken or in use
   *
   * @private
   * @memberof Server.Modules.Farm
   * @function utils.isPortTaken
   * @ignore
   * @param {number} port - The port number to check
   * @param {function} cb - Callback function
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  o.utils.isPortTaken = function FarmUtilsIsPortTaken(port, cb) {
    const tester = require('net').createServer()
        .once('error', function FarmUtilsIsPortTakenOnErr(err) {
          if (err.code !== 'EADDRINUSE') return cb(err);
          cb(null, true);
        })
        .once('listening', function FarmUtilsIsPortTakenOnListen() {
          tester.once('close', function FarmUtilsIsPortTakenOnClose() {
            cb(null, false);
          }).close();
        })
        .listen(port);
  };
}();
