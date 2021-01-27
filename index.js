#!/usr/bin/env node

/**
 * Blackrock Application Server
 * @namespace Server
 *
 * @description
 * This is the primary dependency for the Blackrock Application Server.
 * It loads the Core module initially, which in turn loads all remaining
 * modules and interfaces. If the application server is being included within
 * another Node.JS application as a dependency (is-blackrock), then the core
 * module object will be exported to the parent application.
 *
 * @example
 * // EXAMPLE 1: PROMISES
 *
 * // Get Inactive Application Server:
 * const blackrock = require('is-blackrock');
 *
 * // Start Server (Using Promise):
 * blackrock.init()
 *   .then(function(core) {
 *     console.log(core.status);
 *     // Output: 'Active' (if server has finished initialising)
 *   });
 *
 * @example
 * // EXAMPLE 2: CALLBACKS
 *
 * // Get Inactive Application Server:
 * const blackrock = require('is-blackrock');
 *
 * // Start Server (Using Callback):
 * blackrock.init(function(core) {
 *   console.log(core.status);
 *   // Output: 'Active' (if server has finished initialising)
 * });
 *
 * @example
 * // EXAMPLE 3: STAND-ALONE (COMMAND-LINE / BLOCKING):
 * > blackrock start console
 *
 * @example
 * // EXAMPLE 4: STAND-ALONE (COMMAND-LINE / DAEMON):
 * > blackrock start
 */

!function BlackrockWrapper() {
  const Server = function Server() {
    let core;
    if (!module.parent) core = require('./modules/core/main.js').init();
    else module.exports = core = require('./modules/core/main.js');
    this.core = core;
  };

  /**
   * Blackrock Application Server Instance
   * @memberof Server
   * @type Server.Modules.Core
   * @instance
   *
   * @description
   * This is the application server instance that is exported to the application
   * that includes this module (is-blackrock) as a dependency.
   */
  const instance = new Server();
  instance.core.void();
}();
