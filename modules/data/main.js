!function DataModuleWrapper() {
  let core; let mod; let log; const pipelines = {}; const streamFns = {}; let lib; let rx;


  /**
   * Blackrock Data Module
   *
   * @class Server.Modules.Data
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Data} module - The Data Module
   *
   * @description This is the Data Module of the Blackrock Application Server.
   * It provides a level of abstraction for servers running on the Blackrock
   * application server that want to access databases. It provides a single interface
   * to talk to any one of a number of databases and even has its own built-in JSON
   * Database store for rapid prototyping. PLEASE NOTE: This interface is undergoing
   * development and is not yet functional.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function DataModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Data'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Data Module > Initialising...', {}, 'DATA_MOD_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupDataModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Data Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupDataModule = function DataModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function DataModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function DataModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function DataModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Data Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'DATA_MOD_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.bindListMethod,
            streamFns.bindCreateMethod,
            streamFns.bindGetMethod,
            streamFns.bindUpdateMethod,
            streamFns.bindDeleteMethod

        ).subscribe();
      },
    });
  };


  /**
   * Data Module Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Bind List Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write list method on Data module
   */
  streamFns.bindListMethod = function DataModuleBindListMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Data Module > [1] Binding List Method...', {}, 'DATA_MOD_BIND_LIST_METHOD');
      mod.list = function DataModuleListMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Bind Create Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write create method on Data module
   */
  streamFns.bindCreateMethod = function DataModuleBindCreateMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Data Module > [2] Binding Create Method...', {}, 'DATA_MOD_BIND_CREATE_METHOD');
      mod.create = function DataModuleCreateMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Bind Get Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write get method on Data module
   */
  streamFns.bindGetMethod = function DataModuleBindGetMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Data Module > [3] Binding Get Method...', {}, 'DATA_MOD_BIND_GET_METHOD');
      mod.get = function DataModuleGetMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Bind Update Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write update method on Data module
   */
  streamFns.bindUpdateMethod = function DataModuleBindUpdateMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Data Module > [4] Binding Update Method...', {}, 'DATA_MOD_BIND_UPDATE_METHOD');
      mod.update = function DataModuleUpdateMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Bind Delete Method
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write delete method on Data module
   */
  streamFns.bindDeleteMethod = function DataModuleBindDeleteMethod(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug', 'Blackrock Data Module > [5] Binding Delete Method...', {}, 'DATA_MOD_BIND_DELETE_METHOD');
      mod.delete = function DataModuleDeleteMethod() {};
      observer.next(evt);
    }, source);
  };
}();
