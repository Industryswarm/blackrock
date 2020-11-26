/*!
* Blackrock Farm Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function FarmWrapper(undefined) {





	/** Create parent event emitter object from which to inherit mod object */
	var core, mod, log, pipelines = {}, streamFns = {}, lib, rx, op, Observable, scuttleBucketInstance;
	var jobServer = false, serverModel, serverEmitter, farmServers = {}, utils = {};






	/**
	 * ===========================
	 * Farm Initialisation Methods
	 * ===========================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function FarmInit(coreObj){
		core = coreObj, mod = new core.Mod("Farm"), mod.log = log = core.module("logger").log;
		log("debug", "Blackrock Farm > Initialising...", {}, "FARM_INIT");
		lib = core.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var Pipeline = pipelines.setupFarm();
		new Pipeline({}).pipe();
		return mod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Farm
	 */
	pipelines.setupFarm = function FarmSetupPipeline(){
		return new core.Base().extend({
			constructor: function FarmSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function FarmSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function FarmSetupPipelinePipe() {
				log("debug", "Blackrock Farm > Server Initialisation Pipeline Created - Executing Now:", {}, "FARM_EXEC_INIT_PIPELINE");
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once on server initialisation:
					op.map(evt => { if(evt) return streamFns.loadScuttlebutt(evt); }),
					streamFns.createModelAndServer,
					op.map(evt => { if(evt) return streamFns.persistToDisk(evt); }),
					op.map(evt => { if(evt) return streamFns.setupUpdateListener(evt); }),
					op.map(evt => { if(evt) return streamFns.connectToSeeds(evt); }),
					op.map(evt => { if(evt) return streamFns.setupGetAndSetMethods(evt); }),
					op.map(evt => { if(evt) return streamFns.setupIsJobServer(evt); }),
					op.map(evt => { if(evt) return streamFns.setupEventEmitter(evt); }),
					op.map(evt => { if(evt) return streamFns.setupUpdateRouter(evt); }),
					op.map(evt => { if(evt) return streamFns.updateServerStatus(evt); }),
					op.map(evt => { if(evt) return streamFns.inactivateStaleServers(evt); }),
					op.map(evt => { if(evt) return streamFns.toggleLocalAsJobServer(evt); }),
					op.map(evt => { if(evt) return streamFns.checkAndVoteOnJobServerRoles(evt); })
					
				);
				stream1.subscribe(function FarmSetupPipelineSubscribeCallback(res) {
					null;
				});
			}
		});
	};










	/**
	 * =====================================
	 * Farm Stream Processing Functions
	 * (Fires Once on Server Initialisation)
	 * =====================================
	 */

	/**
	 * (Internal > Stream Methods [1]) Setup Module
	 * @param {object} evt - The Request Event
	 */
	streamFns.loadScuttlebutt = function FarmLoadScuttlebutt(evt){
		evt.lib = {
			sb: {
				Model: require("./support/scuttlebutt/model"),
				Events: require("./support/scuttlebutt/events"),
				Security: require("./support/scuttlebutt/security"),
				ScuttleBucket: require("./support/scuttlebucket")
			},
			net: require("net")
		};
		log("debug", "Blackrock Farm > [1] Loaded Scuttlebutt Libraries", {}, "FARM_LOADED_SCUTTLEBUTT");
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Create Server
	 * @param {object} evt - The Request Event
	 */
	streamFns.createModelAndServer = function FarmCreateModelAndServer(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Farm > [2] Attempting to create model and start server", {}, "FARM_SERVER_STARTING");
					if(core.cfg().farm) { var farm = core.cfg().farm; } else { var farm = {}; }
					if(farm.server && farm.server.port) { var port = farm.server.port; } else { var port = 8000; }
					utils.isPortTaken(port, function FarmCreateModelAndServerPortTakenCallback(err, result){
						if(result != false){ 
							evt.serverNotStarted = true;
							log("error","Blackrock Farm > Cannot start Scuttlebutt as the defined port (" + port + ") is already in use", {}, "FARM_SERVER_PORT_IN_USE"); 
							observer.next(evt);
							return; 
						}
						var sl = evt.lib.sb;
						var create = function FarmCreateModelAndServerCreateScuttleBucket() {
						  return new sl.ScuttleBucket()
						    .add('model', new sl.Model())
						    .add('events', new sl.Events("evts"))
						}
						scuttleBucketInstance = create();
						evt.lib.net.createServer(function FarmCreateModelAndServerCreateServerCallback(stream) {
							var ms = scuttleBucketInstance.createStream();
							stream.pipe(ms).pipe(stream);
							ms.on('error', function FarmCreateModelAndServerOnMSError() { stream.destroy(); });
							stream.on('error', function FarmCreateModelAndServerOnStreamError() { ms.destroy(); });
						}).listen(port, function () {
							log("debug", "Blackrock Farm > Created New Scuttlebutt Model + TCP Server Listening On Port " + port, {}, "FARM_SERVER_STARTED");
						});
						serverModel = scuttleBucketInstance.get("model");
						serverEmitter = scuttleBucketInstance.get("events");
						observer.next(evt);
						return;
					});
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Persist To Disk (NOT WORKING)
	 * @param {object} evt - The Request Event
	 */
	streamFns.persistToDisk = function FarmPersistToDisk(evt){
		log("debug", "Blackrock Farm > [3] Setting Up Disk Persistance...", {}, "FARM_INIT_DISK_PERS");
		if(core.cfg().farm) { var farm = core.cfg().farm; } else { var farm = {}; }
		if(farm.server && farm.server.cache) { var cache = farm.server.cache; } else { var cache = null; }
		if(cache) {
			var file = core.fetchBasePath("cache") + "/" + cache;
			var fs = require('fs');
			if(!fs.existsSync(file)) { fs.closeSync(fs.openSync(file, 'w')); }
			fs.createReadStream(file).pipe(scuttleBucketInstance.createWriteStream());
			scuttleBucketInstance.on('sync', function FarmPersistToDiskSyncCallback() {
				scuttleBucketInstance.createReadStream().pipe(fs.createWriteStream(file));
			});
		}
		return evt;
	} 

	/**
	 * (Internal > Stream Methods [4]) Setup Update Listener
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupUpdateListener = function FarmSetupUpdateListener(evt){
		log("debug", "Blackrock Farm > [4] Setting Up Update Listener...", {}, "FARM_INIT_UPDATE_LISTENER");
		mod.updateListener = function FarmUpdateListener(fn) { return serverModel.on('update', fn); }
		return evt;
	}	

	/**
	 * (Internal > Stream Methods [5]) Connect To Seed
	 * @param {object} evt - The Request Event
	 */
	streamFns.connectToSeeds = function FarmConnectToSeeds(evt){
		log("debug", "Blackrock Farm > [5] Connecting To Seed Server...", {}, "FARM_CONNECTING_TO_SEED_SERVER");
		var connectToSeed = function FarmConnectToSeed(host, port) {
			var stream = evt.lib.net.connect(port);
			var ms = scuttleBucketInstance.createStream();
			stream.pipe(ms).pipe(stream);			
		}
		if(evt.serverNotStarted) { return evt; }
		if(core.cfg().farm) { var farm = core.cfg().farm; } else { var farm = {}; }
		if(farm.seeds) {
			for (var i = 0; i < farm.seeds.length; i++) {
				var host = farm.seeds[i].split(":")[0];
				var port = farm.seeds[i].split(":")[1];
				connectToSeed(host, port);
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Setup "Get From Store" & "Set Against Store" Methods
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetAndSetMethods = function FarmSetupGetAndSetMethods(evt){
		log("debug", "Blackrock Farm > [6] Setting Up Model Get & Set Methods...", {}, "FARM_SETUP_MODEL_GET_SET");
		mod.get = function FarmGetDataValue(key) { return serverModel.get(key); }
		mod.set = function FarmSetDataValue(key, value) { return serverModel.set(key, value); }
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Setup the "isJobServer()" Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupIsJobServer = function FarmSetupIsJobServer(evt){
		log("debug", "Blackrock Farm > [7] Setting Up 'isJobServer' Method...", {}, "FARM_SETUP_IS_JOB_SERVER_METHOD");
		mod.isJobServer = function FarmIsJobServer() { return jobServer; }
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Setup Distributed Event Emitter
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupEventEmitter = function FarmSetupEventEmitter(evt){
		log("debug", "Blackrock Farm > [8] Setting Up Event Emitter...", {}, "FARM_SETUP_EMITTER");
		mod.events = {
			emit: function FarmEventEmitterEmit(event, data) {
				return serverEmitter.emit(event, data);
			},
			on: function FarmEventEmitterOn(event, listener) {
				return serverEmitter.on(event, listener);
			},
			history: function FarmEventEmitterHistory(filter) {
				return serverEmitter.history(filter);
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Setup Update Router
	 * @param {object} evt - The Request Event
	 *
	 * This method sets up an Update Router
	 */
	streamFns.setupUpdateRouter = function FarmSetupUpdateRouter(evt){
		log("debug", "Blackrock Farm > [9] Setting Up The Update Router...", {}, "FARM_SETUP_UPDATE_ROUTER");
		serverModel.on('update', function FarmSetupUpdateRouterOnUpdate(f1, f2, f3) {
			var key = f1[0], val = f1[1];
			if(key.startsWith("servers")) {
				key = key.split("[");
				var serverUri = key[1].slice(0, -1);
				if(core.module("utilities").isJSON(val)) {
					val = JSON.parse(val);
					farmServers[serverUri] = val;
				}
			}
		});
		return evt;
	}

	/**
	 * (Internal > Stream Methods [10]) Setup Job to Update Server Status Every 2 Seconds
	 * @param {object} evt - The Request Event
	 *
	 * This method sets up a new job to fetch the latest heartbeat from the Logger module
	 * AND to count the number of servers in the farm, and then to update the farm-wide property
	 * for this server with the latest information from these sources. This job runs every 2 seconds.
	 */
	streamFns.updateServerStatus = function FarmUpdateServerStatus(evt){
		log("debug", "Blackrock Farm > [10] Setting Up Job to Update Server Status With Latest Heartbeat...", {}, "FARM_SETUP_HEARTBEAT_JOB");
		var dayjs = lib.dayjs
		var interval = setInterval(function FarmUpdateServerStatusInterval(){
			var latestHeartbeat = core.module("logger").getLatestHeartbeat();
			var serverCount = 0;
			for(var key in farmServers) { if(farmServers[key].status == "active") { serverCount++; } }
			latestHeartbeat.peerCount = serverCount;
			core.module("logger").updateLatestHeartbeat("peerCount", latestHeartbeat.peerCount);
			var val = JSON.stringify({
				status: "active",
				lastUpdated: dayjs().format(),
				heartbeat: latestHeartbeat
			});
			mod.set("servers[127.0.0.1:" + core.cfg().farm.server.port + "]", val);
		}, 2000);
		return evt;
	}

	/**
	 * (Internal > Stream Methods [11]) Setup Job to Inactivate Stale Servers
	 * @param {object} evt - The Request Event
	 *
	 * This method sets up a local job that runs every 2 seconds. The job checks
	 * the lastUpdated property against each server in the farm and if it was updated
	 * more than 3 seconds ago, it's status will be updated within the farm-wide
	 * properties to become "inactive"
	 */
	streamFns.inactivateStaleServers = function FarmInactivateStaleServers(evt){
		log("debug", "Blackrock Farm > [11] Setting Up Job to Inactivate Stale Servers...", {}, "FARM_SETUP_INACTIVATE_STALE_JOB");
		var dayjs = lib.dayjs;
		var interval = setInterval(function FarmInactivateStaleServersInterval(){
			var currentDateStamp = dayjs();
			for(var server in farmServers) {
				var lastUpdated = dayjs(farmServers[server].lastUpdated);
				if(currentDateStamp.diff(lastUpdated) > 3000 && farmServers[server].status == "active") {
					var val = JSON.stringify({
						status: "inactive",
						lastUpdated: dayjs().format()
					});
					mod.set("servers[" + server + "]", val);
				}
			}
		}, 2000);
		return evt;
	}

	/**
	 * (Internal > Stream Methods [12]) Toggle Local Server as Job Server if Not In Farm
	 * @param {object} evt - The Request Event
	 *
	 * This method waits 10 seconds following server boot to see whether it ends up joining
	 * a server farm. If it does not, then the "Primary Job Server" Role is automatically 
	 * applied to this server. If it later joins a farm then it will relinquish this role.
	 * If no other servers in the farm have this role then selection will be based on a vote.
	 */
	streamFns.toggleLocalAsJobServer = function FarmToggleAsJobServer(evt){
		//setTimeout(function farmToggleAsJobServerTimeout(){
			var serverCount = 0;
			for(var key in farmServers) { if(farmServers[key].status == "active") { serverCount++; } }
			if(serverCount <= 1) {
				jobServer = true;
				log("debug", "Blackrock Farm > [12] This stand-alone server has been toggled as the Primary Job Server", {}, "FARM_IS_PRIMARY_JOB_SERVER");
			} else {
				log("debug", "Blackrock Farm > [12] This server is part of a farm and may be allocated the Primary Job Server role in the future", {}, "FARM_NOT_PRIMARY_JOB_SERVER");
			}
		//}, 10000);
		return evt;
	}

	/**
	 * (Internal > Stream Methods [13]) Check & Vote On Job Server Roles
	 * @param {object} evt - The Request Event
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
	streamFns.checkAndVoteOnJobServerRoles = function FarmCheckAndVoteOnJobServerRoles(evt){
		return evt;
	}











	/**
	 * ===============
	 * Utility Methods
	 * ===============
	 */

	/**
	 * (Internal > Utilities) Checks if a port is already taken or in use
	 * @param {integer} port - The port number to check
	 * @param {function} cb - Callback function
	 */
	utils.isPortTaken = function FarmIsPortTaken(port, cb) {
	  var tester = require('net').createServer()
	  	.once('error', function FarmIsPortTakenOnError(err) { if (err.code != 'EADDRINUSE') { return cb(err); }; cb(null, true); })
	  	.once('listening', function FarmIsPortTakenOnListening() { tester.once('close', function() { cb(null, false) }).close(); })
	  	.listen(port)
	}









	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();