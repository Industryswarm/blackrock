!function AxonInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock Axon Interface
   * @class Server.Interfaces.Axon
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.Axon} interface - The Axon Interface
   *
   * @description This is the Axon Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the Axon protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @see https://github.com/tj/axon
   * @todo Finish writing the Axon interface
   */
  module.exports = function AxonInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('Axon'); log = core.module('logger').log;
    log('debug', 'Blackrock Axon Interface > Initialising...', {}, 'AXON_INIT');
    myInterface.startInterface = startInterface;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
    });
    return myInterface;
  };

  /**
   * Attempts to start an Axon Interface
   * @private
   * @param {string} name - The name of the interface
   */
  const startInterface = function AxonInterfaceStart(name) {
    // const myName =  myInterface.name.toLowerCase();
    // const cfg = core.cfg().interfaces[myName][name];
    log('startup', myInterface.name + ' Interface Module > Starting Interface (' + name + ').', {}, 'AXON_STARTING');
    const routers = [];
    for (const routerName in core.cfg().router.instances) {
      if (core.cfg().router.instances[routerName].interfaces &&
         (core.cfg().router.instances[routerName].interfaces.includes('*') ||
          core.cfg().router.instances[routerName].interfaces.includes(name))) {
        routers.push(core.module('router').get(routerName));
      }
    }
    if (routers.length <= 0) {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface (' +
          name + ') as it is not mapped to any routers.',
          {}, 'AXON_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface (' +
          name + ') as it is not implemented.', {}, 'AXON_NOT_IMPLEMENTED');
    }
  };
}();
