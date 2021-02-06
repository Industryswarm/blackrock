!function WebSocketsInterfaceWrapper() {
  let core; let myInterface; let log; let instances = {};

  /**
   * Blackrock WebSockets Interface
   *
   * @public
   * @class Server.Interfaces.WebSockets
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Interfaces.WebSockets} interface - The WebSockets Interface Singleton
   *
   * @todo Finish writing the WebSockets interface
   *
   * @description This is the WebSockets Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the WebSockets protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @example
   * const websocketsInterfaceSingleton = core.module('websockets', 'interface');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function WebSocketsInterface(coreObj) {
    core = coreObj; myInterface = new core.Interface('WebSockets'); log = core.module('logger').log;
    log('debug', 'WebSockets Interface > Initialising...', {interface: myInterface.name}, 'INTERFACE_INIT');
    myInterface.startInstance = startInstance;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInstances();
    });
    return myInterface;
  };

  /**
   * Start WebSockets Instance
   *
   * @public
   * @memberof Server.Interfaces.WebSockets
   * @name startInstance
   * @function
   * @ignore
   * @param {string} name - The name of the instance
   *
   * @description
   * Starts a single instance of the WebSockets Interface. Take note - this is called automatically when the interface
   * is loaded by the application server, and thus there should never be any need to call this yourself.
   *
   * @example
   * const websocketsInterfaceSingleton = core.module('websockets', 'interface');
   * websocketsInterfaceSingleton.startInstance('default');
   */
  const startInstance = function WebSocketsStartInterface(name) {
    const self = this;
    const cfg = core.cfg().interfaces.websockets[name];
    // noinspection JSUnresolvedVariable
    log('startup',
        'WebSockets Interface > Starting and binding WebSockets Interface (' + name +
        ') to the HTTP Server Interface Instance (' + cfg.httpInterface + ').',
        {interface: myInterface.name, instance: name, httpInstance: cfg.httpInterface},
        'INTERFACE_STARTING_INSTANCE');
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
      // noinspection JSUnresolvedVariable
      log('startup',
          'WebSockets Interface > Cannot start WebSockets interface instance (' + name +
          ') on port ' + cfg.port + ' as it is not mapped to any routers.',
          {interface: myInterface.name, instance: name, httpInstance: cfg.httpInterface},
          'INTERFACE_ERR_NO_ROUTERS');
      return;
    }
    const WebSocket = require('./_support/ws/ws');
    let timeoutCounter = 0;
    const timeout = 10000;
    const intervalObject = setInterval(function WebSocketsStartInstanceIntervalFn() {
      timeoutCounter = timeoutCounter + 100;
      let httpInterface;
      if (core.module('http', 'interface')) {
        // noinspection JSUnresolvedVariable
        httpInterface = core.module('http', 'interface').get(cfg.httpInterface);
      }
      if (httpInterface && httpInterface.server && httpInterface.listening === true) {
        clearInterval(intervalObject);
        const server = httpInterface.server;
        instances = self.instances;
        if (!instances[name]) {
          // noinspection JSValidateTypes
          instances[name] = new core.Base().extend({});
        }
        instances[name].wss = new WebSocket.Server({server});
        listen(instances[name].wss, name, routers);
        // noinspection JSUnresolvedVariable
        log('startup',
            'WebSockets Interface > Started Instance, Bound to HTTP Server Interface and Listening.',
            {interface: myInterface.name, instance: name, httpInstance: cfg.httpInterface},
            'INTERFACE_STARTED_INSTANCE');
        return true;
      }
      if (timeoutCounter >= timeout) {
        clearInterval(intervalObject);
        // noinspection JSUnresolvedVariable
        log('error',
            'WebSockets Interface > Timeout occurred whilst binding to the HTTP interface instance.',
            {interface: myInterface.name, instance: name, httpInstance: cfg.httpInterface},
            'INTERFACE_ERR_BINDING_TO_HTTP');
        return false;
      }
    }, 100);
  };

  /**
   * Listen for Incoming Connections
   *
   * @private
   * @memberof Server.Interfaces.WebSockets
   * @name listen
   * @function
   * @ignore
   * @param {object} server - WebSockets Server Object
   * @param {string} name - Interface Instance Name
   * @param {array} routers - Router Collection
   *
   * @description
   * Internal Interface Method: Listens for and handles incoming connections to a bound WebSockets Interface Instance.
   * NOTE: This method cannot be accessed from the WebSockets Interface Singleton.
   *
   * @example
   * instances[name].wss = new WebSocket.Server({server});
   * listen(instances[name].wss, name, routers);
   */
  const listen = function WebSocketsListen(server, name, routers) {
    server.on('connection', function WebSocketsListenCxnHandler(ws, req) {
      log('debug',
          'WebSockets Interface > New remote client session initiated',
          {interface: myInterface.name, instance: name}, 'INTERFACE_NEW_CXN');
      let cxnFormat = 'string';
      const cxnMode = 'gateway';
      const sessionId = core.module('utilities').uuid4();
      const responseListener = function WebSocketsListenCxnResListener(resMsg) {
        log('debug',
            'WebSockets Interface > Received message ' +
            resMsg.msgId + ' from router',
            {interface: myInterface.name, instance: name, res: resMsg}, 'INTERFACE_NEW_REQ');
        if (cxnFormat === 'string') ws.send(resMsg.response.message);
        else ws.send(JSON.stringify(resMsg.response.body));
      };
      instances[name].on('outgoing.' + sessionId, responseListener);
      ws.on('close', function WebSocketsListenCxnCloseEvt() {
        instances[name].removeListener('outgoing.' + sessionId, responseListener);
        log('debug',
            'WebSockets Interface > Remote client session closed.',
            {interface: myInterface.name, instance: name, sessionId: sessionId}, 'INTERFACE_CXN_CLOSED');
      });
      ws.on('message', function WebSocketsListenReqHandler(msg) {
        if (cxnMode === 'gateway') {
          const msgType = core.module('utilities').isJSON(msg);
          let msgObject;
          if (msgType === 'json_string') {
            msgObject = JSON.parse(msg);
            msgObject.reference = core.module('utilities').randomString(12);
            if (!msgObject.command) {
              ws.send('{"message":"Command not specified"}');
              return;
            }
          } else {
            msgObject = {
              'command': msg,
              'reference': core.module('utilities').randomString(12),
            };
          }
          if (msgObject.command === 'help') {
            help(ws, req, msgObject, cxnFormat);
          } else if (msgObject.command.startsWith('set format')) {
            cxnFormat = setFormat(ws, req, msgObject, cxnFormat);
          } else if (msgObject.command === 'exit') {
            exit(ws);
          } else {
            for (let i = 0; i < routers.length; i++) {
              req.router = routers[i];
              routeMessage(ws, req, msgObject, cxnFormat, sessionId, name);
            }
          }
        }
      });
    });
  };

  /**
   * WebSockets Session Method: Help
   *
   * @private
   * @memberof Server.Interfaces.WebSockets
   * @name help
   * @function
   * @ignore
   * @param {object} ws - WebSockets Server Object
   * @param {object} req - Request Object
   * @param {object} msgObject - Message Object
   * @param {string} cxnFormat - Connection Format
   *
   * @description
   * Internal Interface Method: Provides help to remote clients when requested.
   * NOTE: This method cannot be accessed from the WebSockets Interface Singleton.
   *
   * @example
   * if (msgObject.command === 'help') help(ws, req, msgObject, cxnFormat);       // Responds with Help Information
   */
  const help = function WebSocketsCxnFnHelp(ws, req, msgObject, cxnFormat) {
    log('debug',
        'WebSockets Interface > Returning help section on client request',
        {interface: myInterface.name, command: 'help'}, 'INTERFACE_REQ_CMD');
    if (cxnFormat === 'string') {
      ws.send('Help not implemented.');
    } else if (cxnFormat === 'json') {
      ws.send('{"message":"Help not implemented"}');
    }
  };

  /**
   * WebSockets Session Method: Exit
   *
   * @private
   * @memberof Server.Interfaces.WebSockets
   * @name exit
   * @function
   * @ignore
   * @param {object} ws - WebSockets Server Object
   *
   * @description
   * Internal Interface Method: Provides help to remote clients when requested.
   * NOTE: This method cannot be accessed from the WebSockets Interface Singleton.
   *
   * @example
   * if (msgObject.command === 'exit') exit(ws);      // Closes the WebSockets Connection
   */
  const exit = function WebSocketsCxnFnExit(ws) {
    log('debug',
        'WebSockets Interface > Closing Session...',
        {interface: myInterface.name, command: 'exit'}, 'INTERFACE_REQ_CMD');
    ws.close(1000, 'Exiting WebSocket Shell on Client Request.');
  };

  /**
   * WebSockets Session Method: Set Format
   *
   * @private
   * @memberof Server.Interfaces.WebSockets
   * @name setFormat
   * @function
   * @ignore
   * @param {object} ws - WebSockets Server Object
   * @param {object} req - Request Object
   * @param {object} msgObject - Message Object
   * @param {string} cxnFormat - Requested Connection Format ('string' | 'json')
   *
   * @description
   * Internal Interface Method: Allows remote client to request a new request / response format. The options are 'string' and 'json'.
   * NOTE: This method cannot be accessed from the WebSockets Interface Singleton.
   *
   * @example
   * if (msgObject.command == 'set format json') setFormat(ws, req, msgObject, 'json');
   */
  const setFormat = function WebSocketsCxnFnSetFormat(ws, req, msgObject, cxnFormat) {
    const formatString = msgObject.command.split(' ');
    const format = formatString[2];
    if (format === cxnFormat && format === 'string') {
      ws.send('Format already set to string.');
    } else if (format === cxnFormat && format === 'json') {
      ws.send('{"message":"Format already set to json"}');
    } else {
      if (format === 'string') {
        cxnFormat = 'string';
        ws.send('Format now set to string');
      } else if (format === 'json') {
        cxnFormat = 'json';
        ws.send('{"message":"Format now set to json"}');
      } else {
        if (cxnFormat === 'string') {
          ws.send('Specified message format unknown');
        } else if (cxnFormat === 'json') {
          ws.send('{"message":"Specified message format unknown"}');
        } else {
          ws.send('Specified message format unknown, current format invalid');
        }
      }
    }
    log('debug',
        'WebSockets Interface > Updating session format to ' + cxnFormat + ' on client request',
        {interface: myInterface.name, command: 'setFormat', format: format}, 'INTERFACE_REQ_CMD');
    return cxnFormat;
  };

  /**
   * WebSockets Session Method: Route Message
   *
   * @private
   * @memberof Server.Interfaces.WebSockets
   * @name routeMessage
   * @function
   * @ignore
   * @param {object} ws - WebSockets Server Object
   * @param {object} req - Request Object
   * @param {object} msgObject - Message Object
   * @param {string} cxnFormat - Requested Connection Format ('string' | 'json')
   * @param {string} sessionId - Current WebSockets Session ID
   * @param {string} name - Active WebSockets Interface Instance Name
   *
   * @description
   * Internal Interface Method: Routes the incoming message to the Router Module to be sent onward to a
   * App Controller to handle - if a route exists.
   * NOTE: This method cannot be accessed from the WebSockets Interface Singleton.
   *
   * @example
   * routeMessage(ws, req, msgObject, 'json', sessionId, 'default');
   */
  const routeMessage = function WebSocketsCxnFnRouteMsg(ws, req, msgObject, cxnFormat, sessionId, name) {
    let resReturned = false;
    const msgId = core.module('utilities').uuid4();
    const host = req.headers.host;
    const splitHost = host.split(':');
    let command = msgObject.command;
    command = command.split(' ');
    const method = command[0];
    const path = command[1];
    const message = {
      'type': 'websockets',
      'msgId': msgId,
      'state': 'incoming',
      'directional': 'duplex',
      'request': {
        'path': path,
        'host': splitHost[0],
        'port': splitHost[1],
        'query': null,
        'params': null,
        'cookies': null,
        'ip': null,
        'verb': method,
        'secure': false,
        'body': msgObject,
      },
    };
    log('debug',
        'WebSockets Interface > Sending message ' + message.msgId + ' to router',
        {message: message, interface: myInterface.name, command: 'route'}, 'INTERFACE_ROUTING_REQ');
    const responseListener = function WebSocketsCxnFnRouteMsgResListener(msg) {
      log('debug',
          'WebSockets Interface > Received response ' + msg.msgId + ' from router',
          {message: msg, interface: myInterface.name}, 'INTERFACE_RECEIVED_RES');
      resReturned = true;
      ws.send(JSON.stringify(msg.response.body));
      instances[name].removeListener('outgoing.' + msgId, responseListener);
    };
    instances[name].on('outgoing.' + msgId, responseListener);
    req.router.incoming(message);
    const timeout = 5000;
    let timer = 0;
    const interval = setInterval(function WebSocketsCxnFnRouteMsgTimeoutHandler() {
      if (!resReturned && timer < timeout) {
        timer += 500;
      } else if (!resReturned && timer >= timeout) {
        ws.send(JSON.stringify({'error': 'Request timed out'}));
        resReturned = true;
        clearInterval(interval);
        instances[name].removeListener('outgoing.' + msgId, responseListener);
      } else if (resReturned) {
        clearInterval(interval);
        instances[name].removeListener('outgoing.' + msgId, responseListener);
      }
    }, 500);
  };
}();
