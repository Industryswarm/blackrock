/**
 * Modules Collection
 * @namespace Server.Modules
 *
 * @author Darren Smith
 * @copyright Copyright (c) 2021 Darren Smith
 * @license Licensed under the LGPL license.
 *
 * @description
 * This is the Modules Collection. Most of the functionality within the Blackrock application server
 * is accessible via modules. Modules (well, their classes) are described below. You do not need to
 * instantiate the module classes, so you can safely ignore the class constructor for each. Modules
 * are automatically loaded (instantiated) at application server startup and are made available via
 * the module() method directly on the application server instance (core object). Which, of course,
 * is the instantiated version of the core module.
 *
 * @example
 * // Example 1: Getting a Module Instance From a Server-Linked Application
 * require('is-blackrock').init()
 *   .then(function(core) {
 *     const moduleInstance = core.module(moduleName)
 *     // Do something with the module here
 *   });
 *
 * @example
 * // Example 2: Getting a Module Instance From a Service Route Initialisation Method
 * !function() {
 *   const ctrl;
 *   module.exports = ctrl = {};
 *   ctrl.init = function(core){
 *     const moduleInstance = core.module(moduleName);
 *     // Do something with the module here
 *   }
 * }();
 *
 * @example
 * // Example 3: Getting a Module Instance From a Service Route Handler Method
 * !function() {
 *   const ctrl;
 *   module.exports = ctrl = {};
 *   ctrl.get = function(req, res){
 *     const moduleInstance = req.core.module(moduleName);
 *     // Do something with the module here
 *     res.send({message: 'We did something with a module!!!'})
 *   }
 * }();
 */
