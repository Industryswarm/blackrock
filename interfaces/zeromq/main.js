!function ZeroMQInterfaceWrapper() {
  let core; let myInterface; let log;

  /**
   * Blackrock ZeroMQ Interface
   * @class Server.Interfaces.ZeroMQ
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.ZeroMQ} interface - The Axon Interface
   *
   * @description This is the ZeroMQ Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the ZeroMQ protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @todo Finish writing the ZeroMQ Interface
   */
  module.exports = function ZeroMQInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('ZeroMQ'); log = core.module('logger').log;
    log('debug', 'Blackrock ZeroMQ Interface > Initialising...', {}, 'ZEROMQ_INIT');
    myInterface.startInterface = startInterface;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
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
   * Attempts to start a ZeroMQ Interface
   * @private
   * @param {string} name - The name of the interface
   */
  const startInterface = function ZeroMQInterfaceStartInterface(name) {
    log('startup', myInterface.name + ' Interface Module > Starting Interface (' + name + ').', {}, 'ZEROMQ_STARTING');
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
          ') as it is not mapped to any routers.', {}, 'ZEROMQ_NO_ROUTERS');
    } else {
      log('startup',
          myInterface.name + ' Interface Module > Cannot start interface (' + name +
          ') as it is not implemented.', {}, 'ZEROMQ_NOT_IMPLEMENTED');
    }
  };
}();
