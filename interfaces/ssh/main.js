!function SSHInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock SSH Interface
   * @class Server.Interfaces.SSH
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.SSH} interface - The Axon Interface
   *
   * @description This is the SSH Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the SSH protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @todo Finish writing the SSH interface
   */
  module.exports = function SSHInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('SSH'); log = core.module('logger').log;
    log('debug', 'Blackrock SSH Interface > Initialising...', {}, 'SSH_INIT');
    myInterface.startInterface = startInterface;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
    });
    return myInterface;
  };

  /**
   * Attempts to start an SSH Interface
   * @private
   * @param {string} name - The name of the interface
   */
  const startInterface = function SSHInterfaceStartInterface(name) {
    log('startup', myInterface.name + ' Interface Module > Starting Interface (' + name + ').', {}, 'SSH_INIT');
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
          ') as it is not mapped to any routers.', {}, 'SSH_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface (' + name +
          ') as it is not implemented.', {}, 'SSH_NOT_IMPLEMENTED');
    }
  };
}();
