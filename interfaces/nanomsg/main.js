!function NanoMsgInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock NanoMSG Interface
   *
   * @public
   * @class Server.Interfaces.NanoMSG
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.NanoMSG} interface - The NanoMSG Interface Singleton
   *
   * @todo Finish writing the NanoMSG interface
   *
   * @description This is the NanoMSG Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the NanoMSG protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const nanomsgInterfaceSingleton = core.module('nanomsg', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function NanoMSGInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('NanoMSG'); log = core.module('logger').log;
    log('debug', 'NanoMSG Interface > Initialising...', {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.startInstance = startInstance;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });
    return myInterface;
  };

  /**
   * Start NanoMSG Instance
   *
   * @public
   * @memberof Server.Interfaces.NanoMSG
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the NanoMSG Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const nanomsgInterfaceSingleton = core.module('nanomsg', 'interface');
   * nanomsgInterfaceSingleton.startInstance('default');
   */
  const startInstance = function NanoMSGStartInstance(name) {
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
