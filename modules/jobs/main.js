!function JobsModuleWrapper() {
  let core; let mod; let log; let lib; const queue = []; const recurring = {};
  const pipelines = {}; const streamFns = {}; const recurringFns = {}; let rx;


  /**
   * Blackrock Jobs Module
   *
   * @class Server.Modules.Jobs
   * @augments Server.Modules.Core.Module
   * @param {Server.Modules.Core} coreObj - The Parent Core Object
   * @return {Server.Modules.Jobs} module - The Jobs Module
   *
   * @description This is the Jobs Module of the Blackrock Application Server.
   * It provides tools to setup and monitor scheduled or recurring jobs from
   * within the service on the application server.
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   */
  module.exports = function JobsModuleConstructor(coreObj) {
    core = coreObj; mod = new core.Mod('Jobs'); mod.log = log = core.module('logger').log;
    log('debug', 'Blackrock Jobs Module > Initialising...', {}, 'JOBS_INIT');
    lib = core.lib; rx = lib.rxjs;
    process.nextTick(function() {
      const Pipeline = pipelines.setupJobsModule();
      new Pipeline({}).pipe();
    });
    return mod;
  };


  /**
   * Event Stream Pipeline...
   */

  /**
   * (Internal > Pipeline [1]) Setup Jobs Module
   * @private
   * @return {object} pipeline - The Pipeline Object
   */
  pipelines.setupJobsModule = function JobsModuleSetupPipeline() {
    return new core.Base().extend({
      constructor: function JobsModuleSetupPipelineConstructor(evt) {
        this.evt = evt;
      },
      callback: function JobsModuleSetupPipelineCallback(cb) {
        return cb(this.evt);
      },
      pipe: function JobsModuleSetupPipelinePipe() {
        log('debug',
            'Blackrock Jobs Module > Server Initialisation Pipeline Created - Executing Now:',
            {}, 'JOBS_EXEC_INIT_PIPELINE');
        const self = this; const Stream = rx.bindCallback((cb) => {
          self.callback(cb);
        })();
        Stream.pipe(

            // Fires once on server initialisation:
            streamFns.setupIntervals,
            streamFns.processQueue,
            streamFns.setupJobEndpoints,

            // Fires once per Job Endpoint Request:
            streamFns.addJobToQueue,
            streamFns.removeJobFromQueue,
            streamFns.executeJob

        ).subscribe();
      },
    });
  };


  /**
   * Jobs Stream Processing Functions...
   * (Fires Once on Server Initialisation)
   */

  /**
   * (Internal > Stream Methods [1]) Setup Intervals
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupIntervals = function JobsModuleSetupIntervals(source) {
    return lib.rxOperator(function(observer, evt) {
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
      log('debug', 'Blackrock Jobs Module > [1] Set Up The Intervals', {}, 'JOBS_SETUP_INTERVALS');
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [2]) Process Queue
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.processQueue = function JobsModuleProcessQueue(source) {
    return lib.rxOperator(function(observer, evt) {
      log('debug',
          'Blackrock Jobs Module > [2] Created \'Process Queue\' Method w/ Indefinite Interval.' +
          'Processing Queue Now...',
          {}, 'JOBS_CREATED_QUEUE');
      const iterateThroughQueue = function JobsModuleIterateThroughQueue() {
        setInterval(function JobsModuleIterateThroughQueueInterval() {
          if (queue.length > 0) {
            for (let i = 0; i < evt.jobsPerInterval; i++) {
              const queueItem = queue.shift();
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
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.setupJobEndpoints = function JobsModuleSetupJobEndpoints(source) {
    return lib.rxOperator(function(observer, evt) {
      mod.jobs = {}; evt.methods = {};

      /**
       * Add Job to Queue
       * @memberof Server.Modules.Jobs
       * @name add
       * @function
       * @param {*} definition - Definition
       * @param {function} fn - Job Function to Execute
       * @param {*} input - Input
       */
      evt.methods.add = mod.jobs.add = mod.add = function JobsModuleAddJob(definition, fn, input) {
        const msg = {action: 'add', input: {definition: definition, fn: fn, input: input}};
        observer.next(msg);
      };

      /**
       * Remove Job From Queue
       * @memberof Server.Modules.Jobs
       * @name remove
       * @function
       * @param {string} id - Job Identifier
       */
      evt.methods.remove = mod.jobs.remove = mod.remove = function JobsModuleRemoveJob(id) {
        const msg = {action: 'remove', input: {id: id}};
        observer.next(msg);
      };

      /**
       * Execute Job
       * @memberof Server.Modules.Jobs
       * @name execute
       * @function
       * @param {string} id - Job Identifier
       */
      evt.methods.execute = mod.jobs.execute = mod.execute = function JobsModuleExecuteJob(id) {
        const msg = {action: 'execute', input: {id: id}};
        observer.next(msg);
      };
      log('debug',
          'Blackrock Jobs Module > [3] Setup the Jobs Module Endpoint Methods - \'add\' and \'remove\'',
          {}, 'JOBS_ADD_REMOVE_BOUND');
    }, source);
  };

  /**
   * (Internal > Stream Methods [4]) Add Job to Queue
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.addJobToQueue = function JobsModuleAddJobToQueue(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.action === 'add') {
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          log('error',
              'Blackrock Jobs Module > Attempted to Add Job But Module Not Enabled',
              evt.input.definition, 'JOBS_ERR_ADD_MOD_DISABLED');
          return false;
        }
        if (!evt.input.definition) {
          log('error',
              'Blackrock Jobs Module > Attempted to Add Job But Definition Object Not Set',
              evt.input.definition, 'JOBS_ERR_ADD_DEF_INVALID');
          return false;
        }
        if (evt.input.definition && !evt.input.definition.id) {
          log('error',
              'Blackrock Jobs Module > Attempted to Add Job But Job ID Not Set',
              evt.input.definition, 'JOBS_ERR_ADD_ID_NOT_SET');
          return false;
        }
        if (evt.input.definition && !evt.input.definition.name) {
          log('error',
              'Blackrock Jobs Module > Attempted to Add Job But Job Name Not Set',
              evt.input.definition, 'JOBS_ERR_ADD_NAME_NOT_SET');
          return false;
        }
        if (evt.input.definition && evt.input.definition.type === 'queue') {
          queue.push({definition: evt.input.definition, fn: evt.input.fn, input: evt.input.input});
          log('debug',
              'Blackrock Jobs Module > Job #'+evt.input.definition.id +
            ' ('+evt.input.definition.name+') Queued Successfully', evt.input.definition, 'JOBS_SINGLE_ADD_SUCCESSFUL');
          return true;
        } else if (evt.input.definition && evt.input.definition.type === 'recurring') {
          if (!evt.input.definition.delay) {
            log('error',
                'Blackrock Jobs Module > Attempted to Add Recurring Job But Delay Not Set',
                evt.input.definition, 'JOBS_ERR_ADD_RECURRING_DELAY_NOT_SET');
            return false;
          }
          recurringFns[evt.input.definition.id] = {
            fn: evt.input.fn,
            input: evt.input.input,
          };
          recurring[evt.input.definition.id] = setInterval(function JobsModuleRecurringJobInterval() {
            if (evt.input.definition.local === true ||
              (evt.input.definition.local === false &&
              core.module('farm').isJobServer() === true)) {
              evt.input.fn(evt.input.input);
            }
          }, evt.input.definition.delay);
          log('debug',
              'Blackrock Jobs Module > Recurring Job #' + evt.input.definition.id+' (' +
            evt.input.definition.name + ') Queued Successfully',
              evt.input.definition, 'JOBS_RECURRING_ADD_SUCCESSFUL');
          return true;
        } else if (evt.input.definition && evt.input.definition.type === 'schedule') {
          log('error',
              'Blackrock Jobs Module > Unsupported Definition Type',
              evt.input.definition, 'JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED');
          return false;
        } else {
          log('error',
              'Blackrock Jobs Module > Unsupported Definition Type',
              evt.input.definition, 'JOBS_RECURRING_ADD_ERR_DEF_UNSUPPORTED');
          return false;
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [5]) Remove Job From Queue
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.removeJobFromQueue = function JobsModuleRemoveJobFromQueue(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.action === 'remove') {
        let found = false;
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          log('error',
              'Blackrock Jobs Module > Attempted to Remove Job But Jobs Module Not Enabled',
              {}, 'JOBS_ERR_REMOVE_MOD_DISABLED');
          return;
        }
        if (recurring[evt.input.id]) {
          clearInterval(recurring[evt.input.id]);
          delete recurring[evt.input.id];
          delete recurringFns[evt.input.id];
          found = true;
          log('debug',
              'Blackrock Jobs Module > Job #' + evt.input.id + ' removed from recurring queue successfully',
              {}, 'JOBS_RECURRING_REMOVE_SUCCESSFUL');
        } else {
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].definition.id === evt.input.id) {
              delete queue[i];
              found = true;
              log('debug',
                  'Blackrock Jobs Module > Job #' + evt.input.id + ' removed from queue successfully',
                  {}, 'JOBS_SINGLE_REMOVE_SUCCESSFUL');
            }
          }
        }
        if (!found) {
          log('error',
              'Blackrock Jobs Module > Could not find and remove Job #' + evt.input.id,
              {}, 'JOBS_REMOVE_ERR_INVALID_JOB_ID');
        }
      }
      observer.next(evt);
    }, source);
  };

  /**
   * (Internal > Stream Methods [6]) Execute Job
   * @private
   * @param {observable} source - The Source Observable
   * @return {observable} destination - The Destination Observable
   */
  streamFns.executeJob = function JobsModuleExecuteJob(source) {
    return lib.rxOperator(function(observer, evt) {
      if (evt.action === 'execute') {
        if (core.cfg().jobs && (core.cfg().jobs.enabled !== true || !core.cfg().jobs.enabled)) {
          log('error',
              'Blackrock Jobs Module > Attempted to Execute Job But Jobs Module Not Enabled',
              'JOBS_ERR_EXEC_MOD_DISABLED');
          return;
        }
        const fnInfo = recurringFns[evt.input.id];
        fnInfo.fn(fnInfo.input);
      }
      observer.next(evt);
    }, source);
  };
}();
