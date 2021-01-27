!function WebSocketsInterfaceWrapper() {
  let core; let myInterface; let log; let instances = {};

  /**
   * Blackrock WebSockets Interface
   * @class Server.Interfaces.WebSockets
   * @augments Server.Modules.Core.Interface
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Interfaces.WebSockets} interface - The Axon Interface
   *
   * @description This is the WebSockets Interface of the Blackrock Application Server.
   * It is responsible for providing an interface to other clients and servers via
   * the WebSockets protocol. PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @todo Finish writing the WebSockets interface
   */
  module.exports = function WebSocketsInterfaceConstructor(coreObj) {
    core = coreObj; myInterface = new core.Interface('WebSockets'); log = core.module('logger').log;
    log('debug', 'Blackrock WebSockets Interface > Initialising...', {}, 'WEBSOCKETS_INIT');
    myInterface.startInterface = startInterface;
    core.on('CORE_START_INTERFACES', function() {
      myInterface.startInterfaces();
    });
    return myInterface;
  };

  /**
   * Attempts to start a WebSockets Interface
   * @private
   * @param {string} name - The name of the interface
   */
  const startInterface = function WebSocketsInterfaceStartInterface(name) {
    const self = this;
    const cfg = core.cfg().interfaces.websockets[name];
    log('startup',
        'WebSockets Server Interface > Starting and binding WebSockets Interface (' + name +
        ') to the HTTP Server Interface (' + cfg.httpInterface + ').', {}, 'WEBSOCKETS_STARTING');
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
          'WebSockets Interface Module > Cannot start WebSockets interface (' + name +
          ') on port ' + cfg.port + ' as it is not mapped to any routers.', {}, 'WEBSOCKETS_NO_ROUTERS');
      return;
    }
    const WebSocket = require('./_support/ws/ws');
    let timeoutCounter = 0;
    const timeout = 10000;
    const intervalObject = setInterval(function WebSocketsInterfaceStartInterfaceTimeoutHandler() {
      timeoutCounter = timeoutCounter + 100;
      let httpInterface;
      if (core.module('http', 'interface')) httpInterface = core.module('http', 'interface').get(cfg.httpInterface);
      if (httpInterface && httpInterface.server && httpInterface.listening === true) {
        clearInterval(intervalObject);
        const server = httpInterface.server;
        instances = self.instances;
        if (!instances[name]) instances[name] = new core.Base().extend({});
        instances[name].wss = new WebSocket.Server({server});
        listen(instances[name].wss, name, routers);
        log('startup',
            'WebSockets Interface > Started, Bound to HTTP Server Interface and Listening.',
            {}, 'WEBSOCKETS_STARTED');
        return true;
      }
      if (timeoutCounter >= timeout) {
        clearInterval(intervalObject);
        log('error', 'WebSockets Interface > Error binding to HTTP interface.', {}, 'WEBSOCKETS_ERR_BIND_TO_HTTP');
        return false;
      }
    }, 100);
  };

  /**
   * (Internal) Listen for Incoming Connections
   * @param {object} server - WebSockets Server Object
   * @param {string} name - ???
   * @param {array} routers - ???
   */
  const listen = function WebSocketsInterfaceListen(server, name, routers) {
    server.on('connection', function WebSocketsInterfaceConnectionHandler(ws, req) {
      log('debug', 'WebSockets Interface > New remote client session initiated', {}, 'WEBSOCKETS_NEW_SESSION');
      let cxnFormat = 'string';
      const cxnMode = 'gateway';
      const sessionId = core.module('utilities').uuid4();
      const responseListener = function WebSocketsInterfaceConnectionResponseListener(resMsg) {
        log('debug',
            'WebSockets Interface > Received message ' +
            resMsg.msgId + ' from router', resMsg, 'WEBSOCKETS_RES_FROM_ROUTER');
        if (cxnFormat === 'string') {
          ws.send(resMsg.response.message);
        } else {
          ws.send(JSON.stringify(resMsg.response.body));
        }
      };
      instances[name].on('outgoing.' + sessionId, responseListener);
      ws.on('close', function incoming() {
        instances[name].removeListener('outgoing.' + sessionId, responseListener);
        log('debug',
            'WebSockets Server Interface > Remote client session closed.',
            {sessionId: sessionId}, 'WEBSOCKETS_SESSION_CLOSED');
      });
      ws.on('message', function WebSocketsInterfaceIncomingMessageHandler(msg) {
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
            exit(ws, req, msgObject, cxnFormat, responseListener, sessionId);
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

  const help = function WebSocketsInterfaceHelp(ws, req, msgObject, cxnFormat) {
    log('debug',
        'WebSockets Server Interface > Returning help section on client request',
        {}, 'WEBSOCKETS_SHOWING_HELP');
    if (cxnFormat === 'string') {
      ws.send('Help not implemented.');
    } else if (cxnFormat === 'json') {
      ws.send('{"message":"Help not implemented"}');
    }
  };

  const exit = function WebSocketsInterfaceExit(ws) {
    ws.close(1000, 'Exiting WebSocket Shell on Client Request.');
  };

  const setFormat = function WebSocketsInterfaceSetFormat(ws, req, msgObject, cxnFormat) {
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
        'WebSockets Server Interface > Updating session format to ' +
        cxnFormat + ' on client request', {}, 'WEBSOCKETS_UPDATE_FORMAT');
    return cxnFormat;
  };

  const routeMessage = function WebSocketsInterfaceRouteMessage(ws, req, msgObject, cxnFormat, sessionId, name) {
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
        'WebSockets Server Interface > Sending message ' +
        message.msgId + ' to router', message, 'WEBSOCKETS_REQ_TO_ROUTER');
    const responseListener = function WebSocketsRouteMessageResponseListener(msg) {
      log('debug',
          'WebSockets Server Interface > Received response ' +
          msg.msgId + ' from router', msg, 'WEBSOCKETS_RES_FROM_ROUTER');
      resReturned = true;
      ws.send(JSON.stringify(msg.response.body));
      instances[name].removeListener('outgoing.' + msgId, responseListener);
    };
    instances[name].on('outgoing.' + msgId, responseListener);
    req.router.incoming(message);
    const timeout = 5000;
    let timer = 0;
    const interval = setInterval(function WebsocketsRouteMessageTimeoutHandler() {
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
