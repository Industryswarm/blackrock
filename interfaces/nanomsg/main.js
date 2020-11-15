/*!
* Blackrock NanoMSG Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function NanoMsgWrapper(undefined) {

	/** Create parent event emitter object from which to inherit interface object */
	var core, interface, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function NanoMsgInit(coreObj){
		core = coreObj, interface = new core.Interface("NanoMSG"), log = core.module("logger").log;
		log("debug", "Blackrock NanoMSG Interface > Initialising...", {}, "NANOMSG_INIT");
		interface.startInterface = startInterface;
		core.on("CORE_START_INTERFACES", function(evt) { interface.startInterfaces(); });
		return interface;
	}

	/**
	 * (Internal) Attempts to start an interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function NanoMsgStartInterface(name){
		var myName = interface.name.toLowerCase();
		var cfg = core.cfg().interfaces[myName][name];
		log("startup", interface.name + " Interface Module > Starting Interface (" + name + ").", {}, "NANOMSG_STARTING");
		var routers = [];
		for(var routerName in core.cfg().router.instances){
			if(core.cfg().router.instances[routerName].interfaces && (core.cfg().router.instances[routerName].interfaces.includes("*") || core.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(core.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){ log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not mapped to any routers.", {}, "NANOMSG_NO_ROUTERS"); } 
		else { log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not implemented.", {}, "NANOMSG_NOT_IMPLEMENTED"); }
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();