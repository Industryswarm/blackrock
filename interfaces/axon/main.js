// https://github.com/tj/axon

/*!
* ISNode Blackrock ZeroMQ Interface Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function AxonWrapper(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	var isnode, ismod, log;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnode - The parent isnode object
	 */
	var init = function AxonInit(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISInterface("Axon"), log = isnode.module("logger").log;
		log("debug", "Blackrock Axon Interface > Initialising...");
		ismod.startInterface = startInterface;
		ismod.startInterfaces();
		return ismod;
	}

	/**
	 * (Internal) Attempts to start an interface
	 * @param {string} name - The name of the interface
	 */
	var startInterface = function AxonStartInterface(name){
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