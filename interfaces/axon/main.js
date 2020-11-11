/*!
* Blackrock Axon Interface Module
*
* Reference: https://github.com/tj/axon
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function AxonWrapper(undefined) {

	/** Create parent event emitter object from which to inherit interface object */
	var core, interface, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} coreObj - The parent core object
	 */
	var init = function AxonInit(coreObj){
		core = coreObj, interface = new core.Interface("Axon"), log = core.module("logger").log;
		log("debug", "Blackrock Axon Interface > Initialising...", {}, "AXON_INIT");
		interface.startInterface = startInterface;
		interface.startInterfaces();
		return interface;
	}

	/**
	 * (Internal) Attempts to start an interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function AxonStartInterface(name){
		var myName = ismod.name.toLowerCase();
		var cfg = core.cfg().interfaces[myName][name];
		log("startup", interface.name + " Interface Module > Starting Interface (" + name + ").", {}, "AXON_STARTING");
		var routers = [];
		for(var routerName in core.cfg().router.instances){
			if(core.cfg().router.instances[routerName].interfaces && (core.cfg().router.instances[routerName].interfaces.includes("*") || core.cfg().router.instances[routerName].interfaces.includes(name))) {
				routers.push(core.module("router").get(routerName));
			}
		}
		if(routers.length <= 0){ log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not mapped to any routers.", {}, "AXON_NO_ROUTERS"); } 
		else { log("startup", interface.name + " Interface Module > Cannot start interface (" + name + ") as it is not implemented.", {}, "AXON_NOT_IMPLEMENTED"); }
	}

	/**
	 * (Internal) Export Module
	 */
	module.exports = init;
}();