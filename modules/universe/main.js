!function UniverseModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;

  /**
   * Blackrock Universe Module
   *
   * @class Server.Modules.Universe
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Universe} module - The Universe Module
   *
   * @description This is the Universe Module of the Blackrock Application Server.
   * It provides a single easy-to-use object interface to a world of data. You can
   * subscribe to any one of a number of channels and as new data becomes available
   * its pushed directly in to your app. You can also pull data as required. The
   * Universe Module allows you to develop environmentally reactive applications.
   * PLEASE NOTE: This interface is undergoing development and
   * is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function UniverseModuleInit(coreObj) {
    core = coreObj; mod = new core.Mod('Universe'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Universe Module > Initialising...', {}, 'UNIVERSE_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupUniverseModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline:
   */

  /**
   * (Internal > Pipeline [1]) Setup Universe Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupUniverseModule = function UniverseModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function UniverseModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function UniverseModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function UniverseModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Universe Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'UNIVERSE_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.setupModule

        ).subscribe();
      },
    });
  };


  /**
   * Universe Stream Processing Functions:
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Setup Module
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupModule = function UniverseModuleSetup(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Universe Module > [1] Module Not Implemented', {}, 'UNIVERSE_NOT_IMPLEMENTED');
      observer.next(evt);
    }, source);
  };
}();
