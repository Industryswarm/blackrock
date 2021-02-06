!function SSHInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock SSH Interface
   *
   * @public
   * @class Server.Interfaces.SSH
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.SSH} interface - The Axon Interface Singleton
   *
   * @todo Finish writing the SSH interface
   *
   * @description This is the SSH Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the SSH protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const sshInterfaceSingleton = core.module('ssh', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function SSHInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('SSH'); log = core.module('logger').log;
    log('debug', 'SSH Interface > Initialising...', {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.startInstance = startInstance;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });
    return myInterface;
  };

  /**
   * Start SSH Instance
   *
   * @public
   * @memberof Server.Interfaces.SSH
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the SSH Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const sshInterfaceSingleton = core.module('ssh', 'interface');
   * sshInterfaceSingleton.startInstance('default');
   */
  const startInstance = function SSHStartInstance(name) {
    log('startup', myInterface.name + ' Interface > Starting Interface (' + name + ').',
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
          myInterface.name + ' Interface > Cannot start interface instance (' + name +
          ') as it is not mapped to any routers.', {interface: myInterface.name, instance: name},
          'INTERFACE_ERR_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface > Cannot start interface instance (' + name +
          ') as it is not implemented.', {interface: myInterface.name, instance: name},
          'INTERFACE_ERR_NOT_IMPLEMENTED');
    }
  };
}();
