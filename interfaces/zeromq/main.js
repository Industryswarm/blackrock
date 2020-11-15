/*!
* Blackrock ZeroMQ Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ZeroMQWrapper(undefined) {

	/** Create parent event emitter object from which to inherit interface object */
	var core, interface, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function ZeroMQInit(coreObj){
		core = coreObj, interface = new core.Interface("ZeroMQ"), log = core.module("logger").log;
		log("debug", "Blackrock ZeroMQ Interface > Initialising...", {}, "ZEROMQ_INIT");
		interface.startInterface = startInterface;
		core.on("CORE_START_INTERFACES", function(evt) { interface.startInterfaces(); });
/*
		console.log('testing zeromq');
		const zmq = require("./support/zeromq/v5-compat");

		var WORKERS_NUM = 10;
		var router = zmq.socket('router');

		var d = new Date();
		var endTime = d.getTime() + 5000;

		router.bind('tcp://*:9000', function(err) {
			if(err) console.log('error binding', err);
			router.on('message', function () {
			  var identity = Array.prototype.slice.call(arguments)[0];
			  var d = new Date();
			  var time = d.getTime();
			  if (time < endTime) {
			    router.send([identity, '', 'Work harder!'])
			  } else {
			    router.send([identity, '', 'Fired!']);
			  }
			});

			for (var i = 0; i < WORKERS_NUM; i++) {
			  (function () {
			    var worker = zmq.socket('req');

			    worker.connect('tcp://127.0.0.1:9000');

			    var total = 0;
			    worker.on('message', function (msg) {
			      var message = msg.toString();
			      if (message === 'Fired!'){
			        console.log('Completed %d tasks', total);
			        worker.close();
			      }
			      total++;

			      setTimeout(function zeromqExampleTimeout() {
			        worker.send('Hi boss!');
			      }, 1000)
			    });

			    worker.send('Hi boss!');
			  })();
			}
		});
*/


		return interface;
	}

	/**
	 * (Internal) Attempts to start an interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function ZeroMQStartInterface(name){
		var myName = interface.name.toLowerCase();
		var cfg = core.cfg().interfaces[myName][name];
		log("startup", interface.name + " Interface Module > Starting Interface (" + name + ").", {}, "ZEROMQ_STARTING");
		var routers = [];
		for(var routerName in core.cfg().router.instances){
			if(core.cfg().router.instances[routerName].interfaces && (core.cfg().router.instances[routerName].interfaces.includes("*") || core.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(core.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){ log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not mapped to any routers.", {}, "ZEROMQ_NO_ROUTERS"); } 
		else { log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not implemented.", {}, "ZEROMQ_NOT_IMPLEMENTED"); }
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();