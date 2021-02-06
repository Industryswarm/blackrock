!function ErrorHandlerModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock ErrorHandler Module
   *
   * @public
   * @class Server.Modules.ErrorHandler
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.ErrorHandler} module - The ErrorHandler Module
   *
   * @description This is the ErrorHandler Module of the Blackrock Application Server.
   * It provides tools to listen for and catch exceptions server-wide and to handle
   * these exceptions, as opposed to letting the server crash.
   *
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ErrorHandlerModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('ErrorHandler'); o.log = core.module('logger').log;
    o.errorCount = 0; o.errorMessages = {};
    o.log('debug', 'Error Handler > Initialising...', {module: mod.name}, 'MODULE_INIT');
    // noinspection JSUnresolvedVariable
    if (core.cfg().errorHandler && core.cfg().errorHandler.enabled === true) {
      process.nextTick(function() {
        pipelines.init();
      });
    }
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Init Pipeline
   *
   * @private
   * @memberof Server.Modules.ErrorHandler
   * @function init
   * @private
   * @ignore
   *
   * @description
   * Tbc
   *
   * @example
   * Tbc...
   */
  pipelines.init = function ErrorHandlerInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.setupErrorHandled,
        pipelines.init.setupUncaughtException

    ).subscribe();
  };


  /**
   * (Internal > Init Pipeline Methods [1]) Setup Error Handled
   *
   * @private
   * @memberof Server.Modules.ErrorHandler
   * @function setupErrorHandled
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupErrorHandled = function ErrHandlerIPLSetupErrHandled(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ErrHandlerIPLSetupErrHandledOp(observer, evt) {
      /**
       * Listen For ErrorHandled Event
       *
       * @public
       * @event Server.Modules.ErrorHandler~event:errorhandled
       *
       * @description
       * If you listen to the ErrorHandler module instance and detect an ErrorThrown
       * event, you can handle it and then fire/emit an ErrorHandled event back to
       * the ErrorHandler module instance to tell the application server that the
       * error has been handled. This should prevent the server from crashing.
       *
       * @example
       * Tbc...
       */
      mod.on('errorhandled', function ErrHandlerErrHandledCb(err) {
        if (o.errorMessages[err] && o.errorMessages[err] === true) {
          o.errorCount --;
          o.errorMessages[err] = false;
          delete o.errorMessages[err];
        }
      });
      o.log('debug',
          'Error Handler > [1] Setup Listener Method for the \'errorhandled\' event',
          {module: mod.name}, 'ERRORHANDLER_SETUP_HANDLED_LISTENER');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [2]) Setup Uncaught Exception
   *
   * @private
   * @memberof Server.Modules.ErrorHandler
   * @function setupUncaughtException
   * @ignore
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   *
   * @description
   * Tbc
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupUncaughtException = function ErrHandlerIPLSetupUncaughtException(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function ErrHandlerIPLSetupUncaughtExceptionOp(observer, evt) {
      process.on('uncaughtException', function ErrHandlerIPLUncaughtExceptionCb(err) {
        o.errorMessages[err.message] = true;
        o.errorCount ++;
        let counter = 0;
        let timeout;
        // noinspection JSUnresolvedVariable
        if (core.cfg().errorhandler && core.cfg().errorhandler.timeout) {
          // noinspection JSUnresolvedVariable
          timeout = core.cfg().errorhandler.timeout;
        } else {
          timeout = 5000;
        }
        /**
         * ErrorThrown Event
         *
         * @public
         * @event Server.Modules.ErrorHandler#errorthrown
         * @type {string}
         *
         * @description
         * The ErrorThrown event is fired on the ErrorHandler module instance
         * whenever an unhandled exception occurs within the application
         * server.
         *
         * @example
         * Tbc...
         */
        mod.emit('errorthrown', err.message);
        const interval = setInterval(function ErrHandlerIPLUncaughtExceptionTimeout() {
          if (o.errorCount <= 0) {
            clearInterval(interval);
            o.log('debug',
                'Error Handler > Thrown exception(s) handled by a listening module or service - ' +
                err.message, {module: mod.name, error: err}, 'ERRORHANDLER_EXCEPT_HANDLED');
            return;
          }
          if (counter >= timeout) {
            clearInterval(interval);
            o.log('fatal',
                'Error Handler > Caught unhandled exception(s). Terminating application server. Error - ' +
                err.message, {module: mod.name, error: err}, 'ERRORHANDLER_EXCEPT_UNHANDLED');
            core.shutdown();
            return;
          }
          counter += 10;
        }, 10);
      });
      o.log('debug',
          'Error Handler > [2] Setup Listener Method for the \'uncaughtexception\' event',
          {module: mod.name}, 'ERRORHANDLER_SETUP_UNCAUGHT_LISTENER');
      observer.next(evt);
    }, source);
  };
}();
