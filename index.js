#!/usr/bin/env node

/**
 * Blackrock Application Server
 *
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
  /**
   * Detect Server Mode
   *
   * @type Server.Modules.Core
   *
   * @description
   * This block of code detects the mode of the server (whether that be 'Blackrock as a Dependency' or a
   * 'Stand-Alone Application Server). If the former, it does not call the init() method. If the latter, it does.
   */
  try {
    const core = require('./modules/core/main.js');
    if (require.main === module) {
      // noinspection JSUnresolvedFunction
      core.init().then(function(blackrock) {}).catch(function(err) {});
    } else {
      module.exports = core;
    }
  } catch(err) {
    console.log('Blackrock > Unable To Initialise (Cannot Find or Load Core Module)', err)
  }
}();
