/**
 * Interfaces Collection
 * @namespace Server.Interfaces
 *
 * @author Darren Smith
 * @copyright Copyright (c) 2021 Darren Smith
 * @license Licensed under the LGPL license.
 *
 * @description
 * This is the Interfaces Collection. Interfaces provide a mechanism for your application to access
 * external users or services/applications, or to be accessed by them (over the internet). Blackrock
 * comes with a number of built-in interfaces, such as HTTP and WebSockets. Core interface
 * functionality happens without you needing to write any code to talk to them. Interfaces are made
 * available on ports at application server startup, and incoming and outgoing messages via the
 * interfaces are routed via the Router module transparently to your service controllers. That said,
 * some interfaces have methods available to access advanced functionality.
 * Interfaces (well, their classes) are described below. You do not need to
 * instantiate the interface classes, so you can safely ignore the class constructor for each. Interfaces
 * are automatically loaded (instantiated) at application server startup and are made available via
 * the module() method directly on the application server instance (core object). Which, of course,
 * is the instantiated version of the core module.
 *
 * @example
 * // Example 1: Getting an Interface Instance From a Server-Linked Application
 * require('is-blackrock').init()
 *   .then(function(core) {
 *     const interfaceInstance = core.module(interfaceName, 'interface')
 *     // Do something with the interface here
 *   });
 *
 * @example
 * // Example 2: Getting an Interface Instance From Service Route Initialisation Method
 * !function() {
 *   const ctrl;
 *   module.exports = ctrl = {};
 *   ctrl.init = function(core){
 *     const interfaceInstance = core.module(interfaceName, 'interface');
 *     // Do something with the interface here
 *   }
 * }();
 *
 * @example
 * // Example 3: Getting an Interface Instance From Service Route Handler Method
 * !function() {
 *   const ctrl;
 *   module.exports = ctrl = {};
 *   ctrl.get = function(req, res){
 *     const interfaceInstance = req.core.module(interfaceName, 'interface');
 *     // Do something with the interface here
 *     res.send({message: 'We did something with an interface!!!'})
 *   }
 * }();
 */
