!function ZeroMQInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock ZeroMQ Interface
   *
   * @public
   * @class Server.Interfaces.ZeroMQ
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.ZeroMQ} interface - The ZeroMQ Interface Singleton
   *
   * @todo Finish writing the ZeroMQ Interface
   *
   * @description This is the ZeroMQ Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the ZeroMQ protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const zeromqInterfaceSingleton = core.module('zeromq', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ZeroMQInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('ZeroMQ'); log = core.module('logger').log;
    log('debug', 'ZeroMQ Interface > Initialising...', {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.startInstance = startInstance;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });

    /*
    const zmq = require('./_support/zeromq/v5-compat');
    const WORKERS_NUM = 10;
    const router = zmq.socket('router');
    const d = new Date();
    const endTime = d.getTime() + 5000;
    router.bind('tcp://*:9000', function() {
      router.on('message', function() {
        // eslint-disable-next-line prefer-rest-params
        const identity = Array.prototype.slice.call(arguments)[0];
        const d = new Date();
        const time = d.getTime();
        if (time < endTime) {
          router.send([identity, '', 'Work harder!']);
        } else {
          router.send([identity, '', 'Fired!']);
        }
      });
      for (let i = 0; i < WORKERS_NUM; i++) {
        (function() {
          const worker = zmq.socket('req');
          worker.connect('tcp://127.0.0.1:9000');
          worker.on('message', function(msg) {
            const message = msg.toString();
            if (message === 'Fired!') {
              worker.close();
            }
            setTimeout(function zeromqExampleTimeout() {
              worker.send('Hi boss!');
            }, 1000);
          });
          worker.send('Hi boss!');
        })();
      }
    });
    */

    return myInterface;
  };

  /**
   * Start ZeroMQ Instance
   *
   * @public
   * @memberof Server.Interfaces.ZeroMQ
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the ZeroMQ Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const zeromqInterfaceSingleton = core.module('zeromq', 'interface');
   * zeromqInterfaceSingleton.startInstance('default');
   */
  const startInstance = function ZeroMQStartInstance(name) {
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
