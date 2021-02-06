!function JobsModuleWrapper() {
  let core; let mod; let o = {}; const pipelines = function() {};

  /**
   * Blackrock Jobs Module
   *
   * @public
   * @class Server.Modules.Jobs
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Core Object Singleton
   * @return {Server.Modules.Jobs} module - The Jobs Module Singleton
   *
   * @description This is the Jobs Module of the Blackrock Application Server.
   * It provides tools to setup and monitor scheduled or recurring jobs from
   * within the app on the application server.
   *
   * @example
   * const jobsModule = core.module('jobs');
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function JobsModule(coreObj) {
    if (mod) return mod;
    core = coreObj; mod = new core.Mod('Jobs'); o.log = core.module('logger').log;
    o.log('debug', 'Jobs > Initialising...', {module: mod.name}, 'MODULE_INIT');
    o.recurringFns = {}; o.recurring = {}; o.queue = [];
    process.nextTick(function() {
      pipelines.init();
    });
    return mod;
  };


  /**
   * (Internal > Pipeline [1]) Setup Jobs Module
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function pipelines.init
   * @ignore
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  // noinspection JSUnresolvedFunction
  pipelines.init = function JobsInitPipeline() {
    // noinspection JSUnresolvedFunction
    core.lib.rxPipeline({}).pipe(

      // Fires once on server initialisation:
      pipelines.init.setupIntervals,
      pipelines.init.processQueue,
      pipelines.init.setupJobEndpoints,

      // Fires once per Job Endpoint Request:
      pipelines.init.addJobToQueue,
      pipelines.init.removeJobFromQueue,
      pipelines.init.executeJob

    ).subscribe();
  };

  /**
   * (Internal > Stream Methods [1]) Setup Intervals
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function setupIntervals
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupIntervals = function JobsIPLSetupIntervals(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (core.cfg().jobs && core.cfg().jobs.queue && core.cfg().jobs.queue.interval) {
        evt.interval = core.cfg().jobs.queue.interval;
      } else {
        evt.interval = 500;
      }
      if (core.cfg().jobs && core.cfg().jobs.queue && core.cfg().jobs.queue.jobsPerInterval) {
        evt.jobsPerInterval = core.cfg().jobs.queue.jobsPerInterval;
      } else {
        evt.jobsPerInterval = 5;
      }
      o.log('debug', 'Jobs > [1] Set Up The Intervals',
          {module: mod.name}, 'JOBS_SETUP_INTERVALS');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Process Queue
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function processQueue
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.processQueue = function JobsIPLProcessQueue(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      o.log('debug',
          'Jobs > [2] Created \'Process Queue\' Method w/ Indefinite Interval.' +
          'Processing Queue Now...',
          {module: mod.name}, 'JOBS_CREATED_QUEUE');
      const iterateThroughQueue = function JobsIPLIterateThroughQueue() {
        setInterval(function JobsIPLIterateThroughQueueInterval() {
          if (o.queue.length > 0) {
            for (let i = 0; i < evt.jobsPerInterval; i++) {
              const queueItem = o.queue.shift();
              if (queueItem && queueItem.fn && queueItem.input) {
                queueItem.fn(queueItem.input);
              } else if (queueItem && queueItem.fn && !queueItem.input) {
                queueItem.fn();
              }
            }
          }
        }, evt.interval);
      };
      iterateThroughQueue();
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [3]) Setup Add & Remove Job Endpoints
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function setupJobEndpoints
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.setupJobEndpoints = function JobsIPLSetupJobEndpoints(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      evt.methods = {};

      /**
       * Add Job to Queue
       *
       * @memberof Server.Modules.Jobs
       * @name add
       * @function
       * @param {*} definition - Definition
       * @param {function} fn - Job Function to Execute
       * @param {*} input - Input
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      evt.methods.add = mod.add = function JobsAddJob(definition, fn, input) {
        const msg = {action: 'add', input: {definition: definition, fn: fn, input: input}};
        observer.next(msg);
      };

      /**
       * Remove Job From Queue
       *
       * @memberof Server.Modules.Jobs
       * @name remove
       * @function
       * @param {string} id - Job Identifier
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      evt.methods.remove = mod.remove = function JobsRemoveJob(id) {
        const msg = {action: 'remove', input: {id: id}};
        observer.next(msg);
      };

      /**
       * (Undocumented) Execute Job
       *
       * @private
       * @memberof Server.Modules.Jobs
       * @name execute
       * @function
       * @param {string} id - Job Identifier
       * @ignore
       *
       * @description
       * Tbc...
       *
       * @example
       * Tbc...
       */
      evt.methods.execute = mod.execute = function JobsExecuteJob(id) {
        const msg = {action: 'execute', input: {id: id}};
        observer.next(msg);
      };

      o.log('debug',
          'Jobs > [3] Setup the Jobs Module Endpoint Methods - add, remove and execute',
          {module: mod.name}, 'JOBS_ADD_REMOVE_BOUND');

    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Add Job to Queue
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function addJobToQueue
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.addJobToQueue = function JobsIPLAddJobToQueue(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.action === 'add') {
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          o.log('error',
              'Jobs > Attempted to Add Job But Module Not Enabled',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_ERR_ADD_MOD_DISABLED');
          return false;
        }
        if (!evt.input.definition) {
          o.log('error',
              'Jobs > Attempted to Add Job But Definition Object Not Set',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_ERR_ADD_DEF_INVALID');
          return false;
        }
        if (evt.input.definition && !evt.input.definition.id) {
          o.log('error',
              'Jobs > Attempted to Add Job But Job ID Not Set',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_ERR_ADD_ID_NOT_SET');
          return false;
        }
        if (evt.input.definition && !evt.input.definition.name) {
          o.log('error',
              'Jobs > Attempted to Add Job But Job Name Not Set',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_ERR_ADD_NAME_NOT_SET');
          return false;
        }
        if (evt.input.definition && evt.input.definition.type === 'queue') {
          queue.push({definition: evt.input.definition, fn: evt.input.fn, input: evt.input.input});
          o.log('debug',
              'Jobs > Job #'+evt.input.definition.id +
            ' ('+evt.input.definition.name+') Queued Successfully',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_SINGLE_ADD_SUCCESSFUL');
          return true;
        } else if (evt.input.definition && evt.input.definition.type === 'recurring') {
          if (!evt.input.definition.delay) {
            o.log('error',
                'Jobs > Attempted to Add Recurring Job But Delay Not Set',
                {module: mod.name, definition: evt.input.definition}, 'JOBS_ERR_ADD_RECURRING_DELAY_NOT_SET');
            return false;
          }
          o.recurringFns[evt.input.definition.id] = {
            fn: evt.input.fn,
            input: evt.input.input,
          };
          o.recurring[evt.input.definition.id] = setInterval(function JobsIPLRecurringJobInterval() {
            if (evt.input.definition.local === true ||
              (evt.input.definition.local === false &&
              core.module('farm').isJobServer() === true)) {
              evt.input.fn(evt.input.input);
            }
          }, evt.input.definition.delay);
          o.log('debug',
              'Jobs > Recurring Job #' + evt.input.definition.id+' (' +
            evt.input.definition.name + ') Queued Successfully',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_RECURRING_ADD_SUCCESSFUL');
          return true;
        } else if (evt.input.definition && evt.input.definition.type === 'schedule') {
          o.log('error',
              'Jobs > Unsupported Definition Type',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED');
          return false;
        } else {
          o.log('error',
              'Jobs > Unsupported Definition Type',
              {module: mod.name, definition: evt.input.definition}, 'JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED');
          return false;
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Remove Job From Queue
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function removeJobFromQueue
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.removeJobFromQueue = function JobsIPLRemoveJobFromQueue(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.action === 'remove') {
        let found = false;
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          o.log('error',
              'Jobs > Attempted to Remove Job But Jobs Module Not Enabled',
              {module: mod.name}, 'JOBS_ERR_REMOVE_MOD_DISABLED');
          return;
        }
        if (o.recurring[evt.input.id]) {
          clearInterval(o.recurring[evt.input.id]);
          delete o.recurring[evt.input.id];
          delete o.recurringFns[evt.input.id];
          found = true;
          o.log('debug',
              'Jobs > Job #' + evt.input.id + ' removed from recurring queue successfully',
              {module: mod.name}, 'JOBS_RECURRING_REMOVE_SUCCESSFUL');
        } else {
          for (let i = 0; i < o.queue.length; i++) {
            if (o.queue[i].definition.id === evt.input.id) {
              delete o.queue[i];
              found = true;
              o.log('debug',
                  'Jobs > Job #' + evt.input.id + ' removed from queue successfully',
                  {module: mod.name}, 'JOBS_SINGLE_REMOVE_SUCCESSFUL');
            }
          }
        }
        if (!found) {
          o.log('error',
              'Jobs > Could not find and remove Job #' + evt.input.id,
              {module: mod.name}, 'JOBS_REMOVE_ERR_INVALID_JOB_ID');
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Execute Job
   *
   * @private
   * @memberof Server.Modules.Jobs
   * @function executeJob
   * @ignore
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   *
   * @description
   * Tbc...
   *
   * @example
   * Tbc...
   */
  pipelines.init.executeJob = function JobsModuleExecuteJob(source) {
    // noinspection JSUnresolvedFunction
    return core.lib.rxOperator(function(observer, evt) {
      if (evt.action === 'execute') {
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          o.log('error',
              'Jobs > Attempted to Execute Job But Jobs Module Not Enabled', {module: mod.name},
              'JOBS_ERR_EXEC_MOD_DISABLED');
          return;
        }
        const fnInfo = o.recurringFns[evt.input.id];
        fnInfo.fn(fnInfo.input);
      }
      observer.next(evt);
    }, source);
  };
}();
