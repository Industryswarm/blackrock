!function AxonInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock Axon Interface
   *
   * @public
   * @class Server.Interfaces.Axon
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.Axon} interface - The Axon Interface Singleton
   *
   * @todo Finish writing the Axon interface
   *
   * @description This is the Axon Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the Axon protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const axonInterfaceSingleton = core.module('axon', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @see https://github.com/tj/axon
   */
  module.exports = function AxonInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('Axon'); log = core.module('logger').log;
    log('debug', 'Axon Interface > Initialising...',
        {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.startInstance = startInstance;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });
    return myInterface;
  };

  /**
   * Start Axon Instance
   *
   * @public
   * @memberof Server.Interfaces.Axon
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the Axon Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const axonInterfaceSingleton = core.module('axon', 'interface');
   * axonInterfaceSingleton.startInstance('default');
   */
  const startInstance = function AxonStartInstance(name) {
    // const myName =  myInterface.name.toLowerCase();
    // const cfg = core.cfg().interfaces[myName][name];
    log('startup',
        myInterface.name + ' Interface > Starting Interface Instance (' + name + ').',
        {interface: myInterface.name, instance: name}, 'INTERFACE_STARTING_INSTANCE');
    const routers = [];
    for (const routerName in core.cfg().router.instances) {
      // noinspection JSUnfilteredForInLoop
      if (core.cfg().router.instances[routerName].interfaces &&
         (core.cfg().router.instances[routerName].interfaces.includes('*') ||
          core.cfg().router.instances[routerName].interfaces.includes(name))) {
        // noinspection JSUnfilteredForInLoop
        routers.push(core.module('router').get(routerName));
      }
    }
    if (routers.length <= 0) {
      log('startup',
          myInterface.name + ' Interface > Cannot start interface instance (' +
          name + ') as it is not mapped to any routers.',
          {interface: myInterface.name, instance: name}, 'INTERFACE_ERR_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface instance (' +
          name + ') as it is not implemented.', {interface: myInterface.name, instance: name},
          'INTERFACE_ERR_NOT_IMPLEMENTED');
    }
  };
}();
