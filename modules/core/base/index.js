!function() {
  const EventEmitter = require('./eventemitter2.js');
  const Factory = function() {};

  const augment = function(base, body) {
    const uber = Factory.prototype = typeof base === 'function' ? base.prototype : base;
    const prototype = new Factory;
    const properties = body.apply(prototype, Array.prototype.slice.call(arguments, 2).concat(uber));
    if (typeof properties === 'object') {
      for (const key in properties) {
        // noinspection JSUnfilteredForInLoop
        prototype[key] = properties[key];
      }
    }
    if (!prototype.hasOwnProperty('constructor')) return prototype;
    const constructor = prototype.constructor;
    constructor.prototype = prototype;
    return constructor;
  };

  augment.defclass = function(prototype) {
    const constructor = prototype.constructor;
    constructor.prototype = prototype;
    return constructor;
  };

  augment.extend = function(base, body) {
    return augment(base, function(uber) {
      this.uber = uber;
      return body;
    });
  };

  /**
   * Blackrock Core Module Base Class
   * @class Server.Modules.Core.Base
   *
   * @description
   * This is the Base Class from the Core module. It is the ultimate parent class
   * from which all others (Core, Module and Interface) inherit. It combines a
   * flexible event emitter (with wildcard and pattern listening capabilities) with
   * the Augment class inheritance library, RxJS for Reactive Programming and Day.JS
   * for Date/Time Management.
   *
   * @example
   * const Hello = new core.Base().extend({
   *   constructor: function HelloConstructor(name) {
   *     this.name = name;
   *   },
   *   hello: function HelloHello() {
   *     console.log('Hello, ' + this.name + '!');
   *   }
   * });
   *
   * @author Darren Smith
   * @copyright Copyright (c) 2021 Darren Smith
   * @license Licensed under the LGPL license.
   * @see https://github.com/hij1nx/EventEmitter2
   * @see https://github.com/aaditmshah/augment
   * @see https://github.com/ReactiveX/rxjs
   * @see https://github.com/iamkun/dayjs
   */
  const Base = module.exports = augment.extend(EventEmitter.EventEmitter2, {

    constructor: function Base() {
      this.configNow({
        wildcard: true, delimiter: '.', newListener: false,
        maxListeners: 1000, verboseMemoryLeak: false,
      });
      const rx = require('./rxjs.umd.min.js');
      this.lib.add('rxjs', rx);
      this.lib.add('operators', require('./rxjs.umd.min.js').operators);
      this.lib.add('rxOperator', function UtilitiesReactiveOperator(fn, source) {
        return new rx.Observable((observer) => {
          const subscription = source.subscribe({
            next(evt) {
              fn(observer, evt);
            },
            error(error) {
              observer.error(error);
            },
          });
          return () => subscription.unsubscribe();
        });
      });
      this.lib.add('rxPipeline', function UtilitiesReactivePipelineLib(initEvent, cb, fromEmitter, fromEvent) {
        const Pipeline = new Base().extend({
          constructor: function UtilitiesReactivePipeline(evt) {
            this.evt = evt;
          },
          callback: function UtilitiesReactivePipelineCb(cb) {
            return cb(this.evt);
          },
          getPipeline: function UtilitiesReactivePipelineGet(cb, fromEmitter, fromEvent) {
            const self = this;
            if(fromEmitter && fromEvent) {
              return rx.fromEvent(fromEmitter, fromEvent);
            } else {
              return rx.bindCallback((cb) => {
                self.callback(cb);
              })();
            }
          },
        });
        const pipeline = new Pipeline(initEvent);
        if(fromEmitter && fromEvent) return pipeline.getPipeline(cb, fromEmitter, fromEvent);
        else return pipeline.getPipeline(cb);
      });
      this.lib.add('dayjs', require('./dayjs.min.js'));
    },

    extend: function Extend(attr1, attr2) {
      let base; let body;
      if (!attr2) {
        base = this;
        body = attr1;
      } else {
        base = attr1;
        body = attr2;
      }
      return augment.extend(base, body);
    },

    lib: {
      add: function AddToLibrary(name, library) {
        this[name] = library;
      },
      remove: function RemoveFromLibrary(name) {
        delete this[name];
      },
    },
  });
}();
