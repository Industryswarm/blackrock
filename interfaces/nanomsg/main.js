!function NanoMsgInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock NanoMSG Interface
   * @class Server.Interfaces.NanoMSG
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.NanoMSG} interface - The Axon Interface
   *
   * @description This is the NanoMSG Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the NanoMSG protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @todo Finish writing the NanoMSG interface
   */
  module.exports = function NanoMsgInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('NanoMSG'); log = core.module('logger').log;
    log('debug', 'Blackrock NanoMSG Interface > Initialising...', {}, 'NANOMSG_INIT');
    myInterface.startInterface = startInterface;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
    });
    return myInterface;
  };

  /**
   * Attempts to start a NanoMSG Interface
   * @private
   * @param {string} name - The name of the interface
   */
  const startInterface = function NanoMsgInterfaceStartInterface(name) {
    log('startup', myInterface.name + ' Interface Module > Starting Interface (' + name + ').', {}, 'NANOMSG_STARTING');
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
          myInterface.name + ' Interface Module > Cannot start interface (' + name +
          ') as it is not mapped to any routers.', {}, 'NANOMSG_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface (' + name +
          ') as it is not implemented.', {}, 'NANOMSG_NOT_IMPLEMENTED');
    }
  };
}();
