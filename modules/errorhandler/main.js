!function ErrorHandlerModuleWrapper() {
  let core; let mod; let log; let errorCount = 0; const errorMessages = {}; const pipelines = {};
  const streamFns = {}; let lib; let rx;


  /**
   * Blackrock ErrorHandler Module
   *
   * @class Server.Modules.ErrorHandler
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.ErrorHandler} module - The ErrorHandler Module
   *
   * @description This is the ErrorHandler Module of the Blackrock Application Server.
   * It provides tools to listen for and catch exceptions server-wide and to handle
   * these exceptions, as opposed to letting the server crash.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function ErrorHandlerModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('ErrorHandler'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Error Handler > Initialising...', {}, 'ERRORHANDLER_INIT');
    lib = core.lib; rx = lib.rxjs;
    if (core.cfg().errorHandler && core.cfg().errorHandler.enabled === true) {
      process.nextTick(function() {
        const Pipeline = pipelines.setupErrorHandlerModule();
        new Pipeline({}).pipe();
      });
    }
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Error Handler Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupErrorHandlerModule = function ErrorHandlerModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function ErrorHandlerModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function ErrorHandlerModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function ErrorHandlerModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Error Handler > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'ERRORHANDLER_EXEC_INIT_PIPELINE');
        const self = this; const stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        stream.pipe(

            // Fires once on server initialisation:
            streamFns.setupErrorHandled,
            streamFns.setupUncaughtException

        ).subscribe();
      },
    });
  };


  /**
   * Error Handler Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Setup Error Handled
   * @private
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupErrorHandled = function ErrorHandlerModuleSetupErrorHandled(source) {
    return lib.rxOperator(function(observer, evt) {
      /**
       * Listen For ErrorHandled Event
       *
       * @event Server.Modules.ErrorHandler~event:errorhandled
       *
       * @description
       * If you listen to the ErrorHandler module instance and detect an ErrorThrown
       * event, you can handle it and then fire/emit an ErrorHandled event back to
       * the ErrorHandler module instance to tell the application server that the
       * error has been handled. This should prevent the server from crashing.
       */
      mod.on('errorhandled', function ErrorHandlerModuleErrorHandledCallback(err) {
        if (errorMessages[err] && errorMessages[err] === true) {
          errorCount --;
          errorMessages[err] = false;
          delete errorMessages[err];
        }
      });
      log('debug',
          'Blackrock Error Handler > [1] Setup Listener Method for the \'errorhandled\' event',
          {}, 'ERRORHANDLER_SETUP_HANDLED_LISTENER');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Setup Uncaught Exception
   * @private
   * @param {observable} source - Source Observable
   * @return {observable} destination - Destination Observable
   */
  streamFns.setupUncaughtException = function ErrorHandlerModuleSetupUncaughtException(source) {
    return lib.rxOperator(function(observer, evt) {
      process.on('uncaughtException', function ErrorHandlerModuleUncaughtExceptionCallback(err) {
        errorMessages[err.message] = true;
        errorCount ++;
        let counter = 0;
        let timeout;
        if (core.cfg().errorhandler && core.cfg().errorhandler.timeout) {
          timeout = core.cfg().errorhandler.timeout;
        } else {
          timeout = 5000;
        }
        /**
         * ErrorThrown Event
         *
         * @event Server.Modules.ErrorHandler#errorthrown
         * @type {string}
         *
         * @description
         * The ErrorThrown event is fired on the ErrorHandler module instance
         * whenever an unhandled exception occurs within the application
         * server.
         */
        mod.emit('errorthrown', err.message);
        const interval = setInterval(function ErrorHandlerModuleUncaughtExceptionTimeout() {
          if (errorCount <= 0) {
            clearInterval(interval);
            log('debug',
                'Blackrock Error Handler > Thrown exception(s) handled by a listening module or service - ' +
                err.message, err, 'ERRORHANDLER_EXCEPT_HANDLED');
            return;
          }
          if (counter >= timeout) {
            clearInterval(interval);
            log('fatal',
                'Blackrock Error Handler > Caught unhandled exception(s). Terminating application server. Error - ' +
                err.message, err, 'ERRORHANDLER_EXCEPT_UNHANDLED');
            core.shutdown();
            return;
          }
          counter += 10;
        }, 10);
      });
      log('debug',
          'Blackrock Error Handler > [2] Setup Listener Method for the \'uncaughtexception\' event',
          {}, 'ERRORHANDLER_SETUP_UNCAUGHT_LISTENER');
      observer.next(evt);
    }, source);
  };
}();
