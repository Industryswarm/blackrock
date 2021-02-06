!function DataAccessModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Data Access Module
   *
   * @public
   * @class Server.Modules.DataAccess
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Module Singleton
   * @return {Server.Modules.DataAccess} module - The Data Access Module Singleton
   *
   * @description This is the Data Access Module of the Blackrock Application Server.
   * It provides a level of abstraction for servers running on the Blackrock
   * application server that want to access databases. It provides a single interface
   * to talk to any one of a number of databases and even has its own built-in JSON
   * Database store for rapid prototyping. PLEASE NOTE: This interface is undergoing
   * development and is not yet functional.
   *
   * @example
   * Tbc...
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function DataAccessModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('DataAccess'); o.log = core.module('logger').log;
    o.log('debug', 'Data Access > Initialising...',
        {module: mod.name}, 'MODULE_INIT');
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Init Pipeline
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init = function DataAccessInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

        // Fires once on server initialisation:
        pipelines.init.bindListMethod,
        pipelines.init.bindCreateMethod,
        pipelines.init.bindGetMethod,
        pipelines.init.bindUpdateMethod,
        pipelines.init.bindDeleteMethod

    ).subscribe();
  };


  /**
   * (Internal > Init Pipeline Methods [1]) Bind List Method
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function bindListMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write list method on Data module
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.bindListMethod = function DataAccessIPLBindListMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug', 'Data Access > [1] Binding List Method...',
          {module: mod.name}, 'DATA_ACCESS_MOD_BIND_LIST_METHOD');
      /**
       * External 'list' Method
       *
       * @public
       * @memberof Server.Modules.DataAccess
       * @function list
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.list = function DataAccessIPLListMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [2]) Bind Create Method
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function bindCreateMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write create method on DataAccess module
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.bindCreateMethod = function DataAccessIPLBindCreateMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug', 'Data Access > [2] Binding Create Method...',
          {module: mod.name}, 'DATA_ACCESS_MOD_BIND_CREATE_METHOD');
      /**
       * External 'create' Method
       *
       * @public
       * @memberof Server.Modules.DataAccess
       * @function create
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.create = function DataAccessIPLCreateMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [3]) Bind Get Method
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function bindGetMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write get method on DataAccess module
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.bindGetMethod = function DataAccessIPLBindGetMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug', 'Data Access > [3] Binding Get Method...',
          {module: mod.name}, 'DATA_ACCESS_MOD_BIND_GET_METHOD');
      /**
       * External 'get' Method
       *
       * @public
       * @memberof Server.Modules.DataAccess
       * @function get
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.get = function DataAccessIPLGetMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [4]) Bind Update Method
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function bindUpdateMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write update method on DataAccess module
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.bindUpdateMethod = function DataAccessIPLBindUpdateMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug', 'Data Access > [4] Binding Update Method...',
          {module: mod.name}, 'DATA_ACCESS_MOD_BIND_UPDATE_METHOD');
      /**
       * External 'update' Method
       *
       * @public
       * @memberof Server.Modules.DataAccess
       * @function update
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.update = function DataAccessIPLUpdateMethod() {};
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Init Pipeline Methods [5]) Bind Delete Method
   *
   * @private
   * @memberof Server.Modules.DataAccess
   * @function bindDeleteMethod
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @todo Write delete method on DataAccess module
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.bindDeleteMethod = function DataAccessIPLBindDeleteMethod(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug', 'Data Access > [5] Binding Delete Method...',
          {module: mod.name}, 'DATA_ACCESS_MOD_BIND_DELETE_METHOD');
      /**
       * External 'delete' Method
       *
       * @public
       * @memberof Server.Modules.DataAccess
       * @function delete
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      mod.delete = function DataAccessIPLDeleteMethod() {};
      observer.next(evt);
    }, source);
  };
}();
