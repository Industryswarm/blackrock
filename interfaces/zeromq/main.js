/*!
* ISNode Blackrock ZeroMQ Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function ZeroMQWrapper(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function ZeroMQInit(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISInterface("ZeroMQ"), log = isnode.module("logger").log;
		log("debug", "Blackrock ZeroMQ Interface > Initialising...");
		ismod.startInterface = startInterface;
		ismod.startInterfaces();
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


		return ismod;
	}

	/**
	 * (Internal) Attempts to start an interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function ZeroMQStartInterface(name){
		var myName = ismod.name.toLowerCase();
		var cfg = isnode.cfg().interfaces[myName][name];
		log("startup", ismod.name + " Interface Module > Starting Interface (" + name + ").");
		var routers = [];
		for(var routerName in isnode.cfg().router.instances){
			if(isnode.cfg().router.instances[routerName].interfaces && (isnode.cfg().router.instances[routerName].interfaces.includes("*") || isnode.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(isnode.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){ log("startup", ismod.name + " Interface Module > Cannot start interface (" + name + ") as it is not mapped to any routers."); } 
		else { log("startup", ismod.name + " Interface Module > Cannot start interface (" + name + ") as it is not implemented."); }
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();