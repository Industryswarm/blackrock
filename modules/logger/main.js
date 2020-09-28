/*!
* ISNode Blackrock Logger Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function LoggerWrapper(undefined) {






	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function LoggerEndsWith(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod, fileStream, sinks = {}, log, pipelines = {}, utils = {}, streamFns = {}, consoleEnabled = false;
	var lib, rx, op, Observable, analyticsStore = { sessionEventCount: 0 }, latestHeartbeat = {}, logBuffer = [];
	var daemonInControl = false, modIsLoaded = false;







	/**
	 * =============================
	 * Logger Initialisation Methods
	 * =============================
	 */

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function LoggerInit(isnodeObj){
		if(modIsLoaded) { return ismod; }
		isnode = isnodeObj, ismod = new isnode.ISMod("Logger");
		ismod.log = log = function LoggerQuickLog(level, logMsg, attrObj) {
			var currentDate = new Date();
			currentDate = currentDate.toISOString();
			var sEvt = streamFns.detectAvailableSinks({ "noLog": true });
			var evt = { "level": level, "logMsg": logMsg, "attrObj": attrObj, "datestamp": currentDate, "sinks": sEvt.sinks }
			logBuffer.push(evt);
		}
		var loadDependencies = false;
		isnode.on("startDaemon", function LoggerOnStartDaemon(){ daemonInControl = true; });
		isnode.on("loadDependencies", function LoggerOnLoadDependencies(){ loadDependencies = true; });
		log("debug", "Blackrock Logger > Initialising...");
		lib = isnode.lib, rx = lib.rxjs, op = lib.operators, Observable = rx.Observable;
		var intervalCounter = 0;
		var interval = setInterval(function LoggerInitInterval(){
			if(loadDependencies) {
				clearInterval(interval);	
				ISSinkPipeline = pipelines.sendToSinks();
				new ISSinkPipeline({}).pipe();
				var ISPipeline = pipelines.setupLogger();
				new ISPipeline({}).pipe();
			}
			if(intervalCounter >= 500) { clearInterval(interval); }
			intervalCounter += 10;
		}, 10);
		ismod.unload = function LoggerUnload(){
			log("debug","Logger Module > Closing any open logging connections and shutting down.");
			if(fileStream){ delete fileStream; isnode.emit("module-shut-down", "Logger"); } 
			else { isnode.emit("module-shut-down", "Logger"); }
		}
		modIsLoaded = true;
		return ismod;
	}






	/**
	 * =====================
	 * Event Stream Pipeline
	 * =====================
	 */


	/**
	 * (Internal > Pipeline [1]) Setup Logger
	 */
	pipelines.setupLogger = function LoggerSetupPipeline(){
		return new isnode.Base().extend({
			constructor: function LoggerSetupPipelineConstructor(evt) { this.evt = evt; },
			callback: function LoggerSetupPipelineCallback(cb) { return cb(this.evt); },
			pipe: function LoggerSetupPipelinePipe() {
				const self = this; 
				process.nextTick(function LoggerSetupPipelineNextTick(){
					log("debug", "Blackrock Logger > Server Initialisation Pipeline Created - Executing Now:");
					const stream = rx.bindCallback((cb) => {self.callback(cb);})();
					const stream1 = stream.pipe(

						// Fires once on server initialisation:
						op.map(evt => { if(evt) return streamFns.setupFileStream(evt); }),
						op.map(evt => { if(evt) return streamFns.detectAvailableSinks(evt); }),
						op.map(evt => { if(evt) return streamFns.setupViewAnalytics(evt); }),
						op.map(evt => { if(evt) return streamFns.setupJobs(evt); }),
						op.map(evt => { if(evt) return streamFns.setupGetAndUpdateLatestHeartbeat(evt); }),
						op.map(evt => { if(evt) return streamFns.loadCachedHeartbeats(evt); }),
						op.map(evt => { if(evt) return streamFns.fireServerBootAnalyticsEvent(evt); }),
						op.map(evt => { if(evt) return streamFns.bindEnableConsole(evt); }),
						streamFns.bindLogEndpoints
						
					);
					stream1.subscribe(function LoggerSetupPipelineSubscribe(evt) {
						//console.log(evt);
					});
				});
			}
		});
	};

	/**
	 * (Internal > Pipeline [2]) Send To Sinks
	 */
	pipelines.sendToSinks = function LoggerSendToSinksPipeline(){
		return new isnode.Base().extend({
			constructor: function LoggerSendToSinksPipelineConstructor(evt) { this.evt = evt; },
			callback: function LoggerSendToSinksPipelineCallback(cb) { return cb(this.evt); },
			pipe: function LoggerSendToSinksPipelinePipe() {
				const self = this; const stream = rx.fromEvent(ismod, "logEvent");
				const stream1 = stream.pipe(

					// Fires once per Log Event:
					streamFns.unbufferEvents,
					streamFns.fanoutToSinks
					
				);
				stream1.subscribe(function LoggerSendToSinksPipelineSubscribe(evt) {
					switch(evt.activeSink){
						case "console":
							streamFns.sendToConsole(evt);
							break;
						case "file":
							streamFns.sendToFile(evt);
							break;
						case "elasticsearch":
							streamFns.sendToElasticSearch(evt);
							break;
					}
				});
			}
		});
	};

	/**
	 * (Internal > Pipeline [5]) Process Analytics Event
	 */
	pipelines.processAnalyticsEvent = function LoggerProcessAnalyticsEventPipeline(){
		return new isnode.Base().extend({
			constructor: function LoggerProcessAnalyticsEventPipelineConstructor(evt) { this.evt = evt; },
			callback: function LoggerProcessAnalyticsEventPipelineCallback(cb) { return cb(this.evt); },
			pipe: function LoggerProcessAnalyticsEventPipelinePipe() {
				const self = this; const stream = rx.bindCallback((cb) => {self.callback(cb);})();
				const stream1 = stream.pipe(

					// Fires once per Analytics Log Event (Request) following server initialisation:
					op.map(evt => { if(evt) return streamFns.processAnalyticsEvent(evt); })
					
				);
				stream1.subscribe(function LoggerProcessAnalyticsEventPipelineSubscribe(res) {
					//console.log(res);
				});
			}
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
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupFileStream = function LoggerSetupFileStream(evt){
		if(isnode.cfg().logger.sinks.file && isnode.cfg().logger.sinks.file.enabled == true){
			var fs = require("fs");
			if(isnode.cfg().logger.sinks.file.location)
				var location = isnode.cfg().logger.sinks.file.location;
			else
				var location = "./isnode.log";
			if (fs.existsSync(location)) {
			    fileStream = fs.createWriteStream(location, {flags:'a'});
			}
			log("debug", "Blackrock Logger > [1] Setup the File Stream");
		} else {
			log("debug", "Blackrock Logger > [1] Skipped Creation of File Stream");
		}
		
		return evt;
	}

	/**
	 * (Internal > Stream Methods [2]) Detect Available Sinks
	 * @param {object} evt - The Request Event
	 */
	streamFns.detectAvailableSinks = function LoggerDetectAvailableSinks(evt){
		evt.sinks = {};
		if(isnode.cfg().logger.enabled == true){
			if(isnode.cfg().logger.sinks.console && isnode.cfg().logger.sinks.console.enabled == true){ evt.sinks.console = true; }
			if(isnode.cfg().logger.sinks.file && isnode.cfg().logger.sinks.file.enabled == true){ evt.sinks.file = true; }
			if(isnode.cfg().logger.sinks.elasticsearch && isnode.cfg().logger.sinks.elasticsearch.enabled == true){ evt.sinks.elasticsearch = true; }
			if(!evt.noLog) { log("debug", "Blackrock Logger > [2] Detected Available Log Sinks"); }
		} else {
			if(!evt.noLog) { log("debug", "Blackrock Logger > [2] Did Not Detect Log Sinks - As Logger is Disabled in Config"); }
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [3]) Setup View Analytics Method
	 * @param {object} evt - The Request Event
	 *
	 * {
	 *	"2000": {
	 *		"01": {
	 *			"01": [
	 *				{
     *					"server": {
	 *						"dateLastBoot": "2020-12-20 00:00:00",
	 *						"dateCacheLastSaved": "2020-12-20 00:00:00"
	 *					},
	 *					"msgs": {
	 *						"reqSize": 0,
	 *						"avgProcessingTime": 0,
	 *						"avgMemUsed": 0,
	 *						"avgCpuLoad": 0,
	 *						"resSize": 0
	 *					}
	 *				}
	 *			]
	 *		}
	 *	}
	 */
	streamFns.setupViewAnalytics = function LoggerSetupViewAnalytics(evt){

		var ViewClass = new isnode.Base().extend({
			constructor: function LoggerViewAnalyticsClassConstructor() { return this; },
			callback: function LoggerViewAnalyticsClassCallback(cb) { return cb(this.evt); },
			process: function LoggerViewAnalyticsClassPipe() {
				var self = this;
				var viewObject = {
					server: { dateLastBoot: "", dateCacheLastSaved: "" },
					msgs: {
						totalReqSize: 0, totalResSize: 0,
						totalReqCount: 0, totalResCount: 0,
						avgReqSize: 0, avgResSize: 0,
						avgProcessingTime: 0, avgMemUsed: 0, avgCpuLoad: 0
					}
				}
				viewObject.server.dateLastBoot = self.fetchMaxValue("dateLastBoot");
				viewObject.server.dateCacheLastSaved = self.fetchMaxValue("dateCacheLastSaved");
				viewObject.msgs.totalReqSize = self.fetchTotalValue("reqSize");
				viewObject.msgs.totalResSize = self.fetchTotalValue("resSize");
				viewObject.msgs.totalReqCount = self.fetchCount("reqSize");
				viewObject.msgs.totalResCount = self.fetchCount("resSize");
				viewObject.msgs.avgReqSize = self.fetchAvgValue("reqSize");
				viewObject.msgs.avgResSize = self.fetchAvgValue("resSize");
				viewObject.msgs.avgProcessingTime = self.fetchAvgValue("avgProcessingTime");
				viewObject.msgs.avgMemUsed = self.fetchAvgValue("avgMemUsed");
				viewObject.msgs.avgCpuLoad = self.fetchAvgValue("avgCpuLoad");
				return viewObject;
			},
			stub: function LoggerViewAnalyticsClassStub() {
				return {
					serverParams: ["dateLastBoot", "dateCacheLastSaved"],
					msgsParams: ["reqSize", "avgProcessingTime", "avgMemUsed", "avgCpuLoad", "resSize"],
					dp: this.getDatePartsAndPrepareStore()
				}
			},
			getDatePartsAndPrepareStore: function LoggerViewAnalyticsClassGetDateParts() {
				var dayjs = lib.dayjs, dateObject = dayjs().format("YYYY-MM-DD").split("-");
				var year = dateObject[0], month = dateObject[1], day = dateObject[2];
				if(!analyticsStore[year]) { analyticsStore[year] = {}; }
				if(!analyticsStore[year][month]) { analyticsStore[year][month] = {}; }
				if(!analyticsStore[year][month][day]) { analyticsStore[year][month][day] = []; }
				return {year: year, month: month, day: day};
			},
			sortBy: function LoggerViewAnalyticsClassSortBy(array, intField, param, direction) {
				if(direction == "min") {
					array.sort(function LoggerViewAnalyticsClassSortBySortFnOne(a, b) { 
						if(!a[intField] && b[intField]) { return 0 - b[intField][param]; }
						else if (!a[intField] && !b[intField]) { return 0; }
						else if (a[intField] && !b[intField]) { return a[intField][param] - 0; }
						else { return a[intField][param] - b[intField][param]; }
					});				
				} else {
					array.sort(function LoggerViewAnalyticsClassSortBySortFnTwo(b, a) { 
						if(((a && !a[intField]) || !a) && b && b[intField]) { return 0 - b[intField][param]; }
						else if (((a && !a[intField]) || !a) && ((b && !b[intField]) || !b)) { return 0; }
						else if (a && a[intField] && ((b && !b[intField]) || !b)) { return a[intField][param] - 0; }
						else { return a[intField][param] - b[intField][param]; }
					});	
				}
				return array;
			},
			fetchMaxValue: function LoggerViewAnalyticsClassFetchMaxValue(param) {
				var s = this.stub(), dp = s.dp, serverParams = s.serverParams, msgsParams = s.msgsParams, sortBy = this.sortBy;
				if(serverParams.includes(param)) { var intField = "server"; } 
				else if(msgsParams.includes(param)) { var intField = "msgs"; }
				var daysEvts = analyticsStore[dp.year][dp.month][dp.day];
				daysEvts = sortBy(daysEvts, intField, param, "max");
				if(!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) { return 0; }
				return daysEvts[0][intField][param];
			},
			fetchMinValue: function LoggerViewAnalyticsClassFetchMinValue(param) {
				var s = this.stub(), dp = s.dp, serverParams = s.serverParams, msgsParams = s.msgsParams, sortBy = this.sortBy;
				if(serverParams.includes(param)) { var intField = "server"; } 
				else if(msgsParams.includes(param)) { var intField = "msgs"; }
				var daysEvts = analyticsStore[dp.year][dp.month][dp.day];
				daysEvts = sortBy(daysEvts, intField, param, "min");
				if(!daysEvts || !daysEvts[0] || !daysEvts[0][intField] || !daysEvts[0][intField][param]) { return 0; }
				return daysEvts[0][intField][param];
			},
			fetchTotalValue: function LoggerViewAnalyticsClassFetchTotalValue(param) {
				var s = this.stub(), dp = s.dp, serverParams = s.serverParams, msgsParams = s.msgsParams, sortBy = this.sortBy;
				if(serverParams.includes(param)) { var intField = "server"; } 
				else if(msgsParams.includes(param)) { var intField = "msgs"; }
				var daysEvts = analyticsStore[dp.year][dp.month][dp.day];
				var sumTotal = 0;
				for (var i = 0; i < daysEvts.length; i++) {
					if(daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) { sumTotal += daysEvts[i][intField][param]; }
				}
				return sumTotal;
			},
			fetchAvgValue: function LoggerViewAnalyticsClassFetchAvgValue(param) {
				var s = this.stub(), dp = s.dp, serverParams = s.serverParams, msgsParams = s.msgsParams, sortBy = this.sortBy;
				if(serverParams.includes(param)) { var intField = "server"; } 
				else if(msgsParams.includes(param)) { var intField = "msgs"; }
				var daysEvts = analyticsStore[dp.year][dp.month][dp.day];
				var avgValue = 0, sumTotal = 0, recordCount = 0;
				for (var i = 0; i < daysEvts.length; i++) {
					if(daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) { sumTotal += daysEvts[i][intField][param]; recordCount ++; }
				}
				avgValue = sumTotal / recordCount;
				return avgValue;
			},
			fetchCount: function LoggerViewAnalyticsClassFetchCount(param) {
				var s = this.stub(), dp = s.dp, serverParams = s.serverParams, msgsParams = s.msgsParams, sortBy = this.sortBy;
				if(serverParams.includes(param)) { var intField = "server"; } 
				else if(msgsParams.includes(param)) { var intField = "msgs"; }
				var daysEvts = analyticsStore[dp.year][dp.month][dp.day];
				var recordCount = 0;
				for (var i = 0; i < daysEvts.length; i++) {
					if(daysEvts[i] && daysEvts[i][intField] && daysEvts[i][intField][param]) { recordCount ++; }
				}
				return recordCount;
			}
		});

		if(!ismod.analytics) { ismod.analytics = {}; }
		var viewObject = new ViewClass();

		ismod.analytics.view = function LoggerExternalViewAnalyticsMethod(){ return viewObject.process(); }

		log("debug", "Blackrock Logger > [3] View Analytics Setup & Ready For Use");

		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Setup Jobs
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupJobs = function LoggerSetupJobs(evt){
		log("debug", "Blackrock Logger > [4] Setting Up Heartbeat + Cache Jobs");
		if(isnode.cfg().logger.heartbeat) {
			var heartbeatJob = function LoggerHeartbeatJob() {
				var beat = isnode.module("logger").analytics.view();
				var roundAndLabel = function LoggerRoundAndLabel(param) {
					if(param >= 1024 && param < 1048576) {
						param = Math.round(param / 1024);
						param = Number(param).toLocaleString();
						param += " KB";
					} else if (param >= 1048576) {
						param = Math.round(param / 1024 / 1024);
						param = Number(param).toLocaleString();
						param += " MB";
					} else {
						param = Math.round(param);
						param = Number(param).toLocaleString();
						param += " Bytes"; 
					}
					return param;				
				}
				latestHeartbeat.totalReqSize = beat.msgs.totalReqSize = roundAndLabel(beat.msgs.totalReqSize);
				latestHeartbeat.totalResSize = beat.msgs.totalResSize = roundAndLabel(beat.msgs.totalResSize);
				latestHeartbeat.avgReqSize = beat.msgs.avgReqSize = roundAndLabel(beat.msgs.avgReqSize);
				latestHeartbeat.avgResSize = beat.msgs.avgResSize = roundAndLabel(beat.msgs.avgResSize);
				latestHeartbeat.avgMemUsed = beat.msgs.avgMemUsed = roundAndLabel(beat.msgs.avgMemUsed);
				latestHeartbeat.avgCpuLoad = beat.msgs.avgCpuLoad = Math.round(beat.msgs.avgCpuLoad) + "%";
				latestHeartbeat.totalReqCount = beat.msgs.totalReqCount;
				latestHeartbeat.totalResCount = beat.msgs.totalResCount;
				latestHeartbeat.avgProcessingTime = beat.msgs.avgProcessingTime;
				latestHeartbeat.dateLastBoot = beat.msgs.dateLastBoot;
				latestHeartbeat.dateCacheLastSaved = beat.msgs.dateCacheLastSaved;
				if(!latestHeartbeat.peerCount) { latestHeartbeat.peerCount = 1 }
				var serviceStats = {}; serviceStats.servicesMemoryUse = "0 Bytes", serviceStats.servicesCount = 0, serviceStats.servicesRouteCount = 0;
				if(isnode.module("services") && isnode.module("services").serviceStats) {
					var serviceStats = isnode.module("services").serviceStats();
					serviceStats.servicesMemoryUse = roundAndLabel(serviceStats.servicesMemoryUse);
				}
				var runningInSandbox = "No";
				if(isnode.module("sandbox") && isnode.cfg().services.sandbox.default == true)
					runningInSandbox = "Yes";

				if(isnode.cfg().logger.heartbeat.console && consoleEnabled && !isnode.globals.get("silent")) {
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
	  d8P"      "Y8b, ,d8P"      "Y8b       Server Status: ` + isnode.status + `
	 dP'           "8a8"           \`Yd      Server Mode: Live (Stand-Alone)
	 8(              "              )8      Processes Running On This Server: 1
	 I8                             8I      Loaded Module Count: ` + isnode.moduleCount("modules") + `
	  Yb,                         ,dP       Loaded Interface Count: ` + isnode.moduleCount("interfaces") + `
	   "8a,                     ,a8"        Servers In Farm: ` + latestHeartbeat.peerCount + `
	     "8a,                 ,a8"          
	       "Yba             adP"            SERVICE INFORMATION:
	         \`Y8a         a8P'              Loaded Service Count: ` + serviceStats.servicesCount + ` (` + serviceStats.servicesMemoryUse + `)
	           \`88,     ,88'                Total Route / Controller Count: ` + serviceStats.servicesRouteCount + ` (` + serviceStats.servicesMemoryUse + `)
	             "8b   d8"                  Running in Sandbox: ` + runningInSandbox + `
	              "8b d8"                   
	               \`888'                    
	                 "

	=========================================================================================================
				`	);
				}
			}

			var cacheJob = function LoggerCacheJob() {
				log("debug", "Blackrock Logger > Running Heartbeat Cache Job");
				var content = JSON.stringify(analyticsStore);
				var fs = require("fs");
				var path = isnode.getBasePath() + "/cache/heartbeat/heartbeats.json";
				fs.writeFile(path, content, {encoding:'utf8', flag:'w'}, function LoggerCacheJobWriteFileCallback(err){});
			}

			isnode.module("jobs").jobs.add({ id: "CH01", name: "Console Server Heartbeat Job", type: "recurring", delay: isnode.cfg().logger.heartbeat.heartbeatFreq, local: true }, heartbeatJob, {});
			isnode.module("jobs").jobs.add({ id: "SH02", name: "Server Heartbeat Cache Job", type: "recurring", delay: isnode.cfg().logger.heartbeat.cacheFreq, local: true }, cacheJob, {});

		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Setup Get & Update Latest Heartbeat Method
	 * @param {object} evt - The Request Event
	 */
	streamFns.setupGetAndUpdateLatestHeartbeat = function LoggerSetupGetAndUpdateLatestHeartbeat(evt){
		log("debug", "Blackrock Logger > [5] Setting up the 'getLatestHeartbeat' and 'updateLatestHeartbeat' Methods on Logger");
		ismod.getLatestHeartbeat = function LoggerGetLatestHeartbeat() {
			return latestHeartbeat;
		}
		ismod.updateLatestHeartbeat = function LoggerUpdateLatestHeartbeat(key, value) {
			latestHeartbeat[key] = value;
			return true;
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Load Cached Heartbeats
	 * @param {object} evt - The Request Event
	 */
	streamFns.loadCachedHeartbeats = function LoggerLoadCachedHeartbeats(evt){
		log("debug", "Blackrock Logger > [6] Loading cached heartbeats if they exist");
		setTimeout(function LoggerLoadCachedHeartbeatsTimeout() {
			var fs = require("fs");
			var path = isnode.getBasePath() + "/cache/heartbeat/heartbeats.json";
			fs.readFile(path, 'utf8', function loggerLoadCachedHeartbeatsReadFileCallback(err, content){
				if(content) { analyticsStore = JSON.parse(content); }
			});
		}, 70);
		return evt;
	}

	/**
	 * (Internal > Stream Methods [7]) Fire the "Server Boot" Analytics Event
	 * @param {object} evt - The Request Event
	 */
	streamFns.fireServerBootAnalyticsEvent = function LoggerFireServerBootAnalyticsEvent(evt){
		log("debug", "Blackrock Logger > [7] Firing the \"Server Boot\" Analytics Event");
		setTimeout(function LoggerFireBootAnalyticsEventTimeout() {
			var dayjs = lib.dayjs;
			ismod.analytics.log({ "server": { "dateLastBoot": dayjs().format() } });
		}, 70);
		return evt;
	}

	/**
	 * (Internal > Stream Methods [8]) Binds the 'enableConsole' method to this module
	 * @param {object} evt - The Request Event
	 */
	streamFns.bindEnableConsole = function LoggerBindEnableConsole(evt){
		log("debug", "Blackrock Logger > [8a] Binding 'enableConsole' method to this module");
		ismod.enableConsole = function LoggerEnableConsole() { 
			log("debug", "Blackrock Logger > [8b] 'enableConsole' has been called");
			consoleEnabled = true; 
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [9]) Bind Log Endpoints
	 * @param {observable} source - The Source Observable
	 */
	streamFns.bindLogEndpoints = function LoggerBindLogEndpoints(source){
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					log("debug", "Blackrock Logger > [9] Setting Up Analytics & Log Endpoint On The Logger Module");
					ismod.log = log = function LoggerLog(level, logMsg, attrObj){
						var currentDate = new Date();
						currentDate = currentDate.toISOString();
						var evt2 = {};
						evt2 = {
							"datestamp": currentDate,
							"level": level,
							"logMsg": logMsg,
							"attrObj": attrObj,
							"sinks": evt.sinks
						}
						ismod.emit("logEvent", evt2);
						observer.next();
					};
					if(!daemonInControl) { isnode.emit("updateLogFn"); }
					if(!ismod.analytics) { ismod.analytics = {}; }
					ismod.analytics.log = function LoggerAnalyticsLog(query){
						var evt2 = {};
						evt2.analyticsEvent = { "query": query };
						var ISPipeline = pipelines.processAnalyticsEvent();
						new ISPipeline(evt2).pipe();
					};
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

















	/**
	 * ==================================
	 * Logger Stream Processing Functions
	 * (Fires Once For Each Log Event)
	 * ==================================
	 */

	/**
	 * (Internal > Stream  Methods [1]) Buffer Log Events Until Console Enabled
	 */
	streamFns.unbufferEvents = function LoggerUnbufferEvents(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					if(consoleEnabled && logBuffer) {
						for (var i = 0; i < logBuffer.length; i++) { observer.next(logBuffer[i]); }
						observer.next(evt);
						logBuffer = [];
					} else { logBuffer.push(evt); }
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream  Methods [2]) Fanout To Sinks
	 */
	streamFns.fanoutToSinks = function LoggerFanoutToSinks(source) {
		return new Observable(observer => {
			const subscription = source.subscribe({
				next(evt) {
					//console.log(evt);
					for(var sink in evt.sinks) { 
						var evt2 = {
							"level": evt.level,
							"logMsg": evt.logMsg,
							"attrObj": evt.attrObj,
							"sinks": evt.sinks
						};
						if(evt.datestamp) { evt2.datestamp = evt.datestamp; }
						if(sink == "console") {
							evt2.activeSink = "console";
							observer.next(evt2);
							evt2 = {};
						} else if (sink == "file") {
							evt2.activeSink = "file";
							observer.next(evt2);
							evt2 = {};
						} else if (sink == "elasticsearch") {
							evt2.activeSink = "elasticsearch";
							observer.next(evt2);
							evt2 = {};
						}
					}
				},
				error(error) { observer.error(error); }
			});
			return () => subscription.unsubscribe();
		});
	}

	/**
	 * (Internal > Stream Methods [3]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToConsole = function LoggerSendToConsole(evt){
		var level = evt.level, logMsg = evt.logMsg, attrObj = evt.attrObj, currentDate = evt.datestamp;
		if(evt.activeSink == "console" && !isnode.globals.get("silent")) {
			if(isnode.cfg().logger.levels.includes(level)){
				console.log(currentDate + " (" + level + ") " + logMsg);
				if(attrObj && isnode.cfg().logger.logMetadataObjects)
					console.log(attrObj);
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [4]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToFile = function LoggerSendToFile(evt){
		var level = evt.level, logMsg = evt.logMsg, attrObj = evt.attrObj, currentDate = evt.datestamp;
		if(evt.activeSink == "file") {
			if(isnode.cfg().logger.levels.includes(level)){
				fileStream.write(currentDate + " (" + level  +") " + logMsg + "\n\n");
				if(attrObj && isnode.cfg().logger.logMetadataObjects == true)
					fileStream.write(JSON.stringify(attrObj));
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [5]) Send Log Event to Console
	 * @param {object} evt - The Request Event
	 */
	streamFns.sendToElasticSearch = function LoggerSendToElasticSearch(evt){
		var level = evt.level, logMsg = evt.logMsg, attrObj = evt.attrObj, currentDate = evt.datestamp;
		if(evt.activeSink == "elasticsearch") {
			var httpModule = isnode.module("http", "interface");
			if(!httpModule) { return; }
			var client = httpModule.client;
			var indexBucket = currentDate.split("T");
			indexBucket = indexBucket[0];
			var index = isnode.cfg().logger.sinks.elasticsearch["base_index"] + "-" + indexBucket;
			var baseUri = isnode.cfg().logger.sinks.elasticsearch["base_uri"];
			if(isnode.cfg().logger.levels.includes(level)){
				var body = {
					"timestamp": currentDate,
					"level": level,
					"message": logMsg,
					"attributes": attrObj
				}
				if(attrObj && isnode.cfg().logger.logMetadataObjects == true) {
					body.attributes = attrObj;
				}
				client.request({
					"url": baseUri + "/" + index + "/_doc/",
					"method": "POST",
					"headers": {"Content-Type": "application/json" },
					"encoding": "utf8",
					"data": body
				}, function LoggerSendToElasticSearchCallback(httpErr, httpRes) { 
					return;
				});
			}
		}
		return evt;
	}

	/**
	 * (Internal > Stream Methods [6]) Process Analytics Event
	 * @param {object} evt - The Request Event
	 *
	 *	"server": {
	 *		"dateLastBoot": "2020-12-20 00:00:00",
	 *		"dateCacheLastSaved": "2020-12-20 00:00:00"
	 *	},
	 *	"msgs": {
	 *		"reqSize": 0,
	 *		"avgProcessingTime": 0,
	 *		"avgMemUsed": 0,
	 *		"avgCpuLoad": 0,
	 *		"resSize": 0
	 *	}
	 */
	streamFns.processAnalyticsEvent = function LoggerProcessAnalyticsEvent(evt){
		if(evt.analyticsEvent) {
			var query = evt.analyticsEvent.query, dayjs = lib.dayjs;
			var dateObject = dayjs().format("YYYY-MM-DD").split("-");
			var year = dateObject[0], month = dateObject[1], day = dateObject[2];
			if(!analyticsStore[year]) { analyticsStore[year] = {}; }
			if(!analyticsStore[year][month]) { analyticsStore[year][month] = {}; }
			if(!analyticsStore[year][month][day]) { analyticsStore[year][month][day] = []; }
			for(var param1 in query) {
				for(var param2 in query[param1]) {
					if(!analyticsStore[year][month][day][analyticsStore.sessionEventCount]) { 
						analyticsStore[year][month][day][analyticsStore.sessionEventCount] = {}; 
						analyticsStore[year][month][day][analyticsStore.sessionEventCount][param1] = {}; 
					}
					analyticsStore[year][month][day][analyticsStore.sessionEventCount][param1][param2] = query[param1][param2];
				}
			}
			analyticsStore.sessionEventCount ++;
		}
		return evt;
	}








	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();