/**
 * EventEmitter2 + Augment + rxJS (Reactive Extensions)
 * @see https://github.com/hij1nx/EventEmitter2
 * @see https://github.com/aaditmshah/augment
 *
 * Modified to include Augment as the Base class for the emitter.
 * This allows the emitter to be extended - creating child emitters
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */

!function() {
  const EventEmitter = require('./eventemitter2.js');
  const Factory = function() {};
  const augment = function(base, body) {
    const uber = Factory.prototype = typeof base === 'function' ? base.prototype : base;
    const prototype = new Factory;
    const properties = body.apply(prototype, Array.prototype.slice.call(arguments, 2).concat(uber));
    if (typeof properties === 'object') for (const key in properties) prototype[key] = properties[key];
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

  /*
   *   DEFINE BASE CLASS:
   *   ADD LIBRARY MANAGEMENT METHODS AND THE REACTIVE EXTENSIONS:
   */

  const Base = augment.extend(EventEmitter.EventEmitter2, {

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
      this.lib.add('dayjs', require('./dayjs.min.js'));
    },

    extend: function Extend(attr1, attr2) {
      if (!attr2) {
        var base = this; var body = attr1;
      } else {
        var base = attr1; var body = attr2;
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

  module.exports = Base;
}();
