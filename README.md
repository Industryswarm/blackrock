# Blackrock Application Server and Web Framework

###### <br/>

### Introduction

Welcome to the Blackrock Application Server & Framework. Blackrock has a Reactive / Event-Driven Architecture, and contains all the functionality you need to build your next Node.JS application, whether it be a web application, web service or something else.

<br/>

### Installing Blackrock

#### As a Stand-Alone Application Server


Blackrock can be installed as a stand-alone application server on your system. All you need to do is to [Install Node.JS and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.JS and NPM") and then open up a command-line prompt and type:

    > npm install -g is-blackrock


#### As a Dependency For Your Own Application


Blackrock can be installed as a dependency within your own Node.JS application. All you need to do is to [Install Node.JS and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.JS and NPM"), make sure you have a new or existing Node.JS application and then open up a command-line prompt and type:

    > cd /path/to/your/node.js/application

    > npm install --save is-blackrock

And then open up your project in your favourite IDE and (most likely in the Javascript file you launch with) include a reference to this dependency:

    const blackrock = require('is-blackrock').init();

Note: If the application isn't new (more than just a scaffold) then you have to realise the Blackrock takes over the process and instantiates its own HTTP interface (and so on). As such you may very well have to re-engineer much of your application to work with Blackrock. Also - you may need to alter the server's configuration. See {@tutorial server-configuration} for more information.

Also: the is-blackrock node module has ZERO dependencies. So your risk of losing access to any of your packages is minimised.

<br/><br/>


### Getting Started

See {@tutorial getting-started} for a quick and easy guide to help you get started building with Blackrock.

<br/>

### Modules Specifications

*Below you can find the specifications for each Blackrock module:*

| Module                                                                                                                                    | Description                                                                                                                                                                              |
| -----------                                                                                                                               | -----------------------------------------------------------------------------------------------------                                                                                    |
| [CLI Module](https://blackrock.industryswarm.com/docs/Server.Modules.CLI.html "CLI Specification")                                        | Manages execution of server actions based on command-line arguments provided at startup                                                                                                  |
| [Configure Module](https://blackrock.industryswarm.com/docs/Server.Modules.Configure.html "Configure Specification")                      | Provides methods and command line tools to manage server and service configuration                                                                                                       |
| [Core Module](https://blackrock.industryswarm.com/docs/Server.Modules.Core.html "Core Specification")                                     | Primary dependency (application server instance) that is exported to service routes and linked applications. Loads and provides access to all other modules and interfaces               |
| [Daemon Module](https://blackrock.industryswarm.com/docs/Server.Modules.Daemon.html "Daemon Specification")                               | Provides tools to instantiate the application server as a daemon and to manage the daemon                                                                                                |
| [Data Module](https://blackrock.industryswarm.com/docs/Server.Modules.Data.html "Data Specification")                                     | Provides a standard abstraction to third-party databases, and has a built-in filesystem JSON-based database that you can use to quickly build and prototype applications and services    |
| [ErrorHandler Module](https://blackrock.industryswarm.com/docs/Server.Modules.ErrorHandler.html "ErrorHandler Specification")             | Provides the tools to intercept and handle application server exceptions and prevent the server from crashing                                                                            |
| [Farm Module](https://blackrock.industryswarm.com/docs/Server.Modules.Farm.html "Farm Specification")                                     | Provides the tools to share state within a distributed compute cluster or farm. And to manage job processing without duplication of effort                                               |
| [Generator Module](https://blackrock.industryswarm.com/docs/Server.Modules.Generator.html "Generator Specification")                      | Provides methods and command line tools to generate your own services for use within Blackrock                                                                                           |
| [i18n Module](https://blackrock.industryswarm.com/docs/Server.Modules.i18n.html "i18n Specification")                                     | Provides support for internationalisation and localisation within your Blackrock services                                                                                                |
| [Installer Module](https://blackrock.industryswarm.com/docs/Server.Modules.Installer.html "Installer Specification")                      | Allows you to install additional services in to your application server from the Blackrock marketplace                                                                                   |
| [Jobs Module](https://blackrock.industryswarm.com/docs/Server.Modules.Jobs.html "Jobs Specification")                                     | Allows you to create, manage and execute asynchronous jobs (from your services) - recurring and scheduled                                                                                |
| [Logger Module](https://blackrock.industryswarm.com/docs/Server.Modules.Logger.html "Logger Specification")                               | Provides a method (log) to log your service (or intra app server) events and distribute these to any one of a number of log sinks                                                        |
| [Router Module](https://blackrock.industryswarm.com/docs/Server.Modules.Router.html "Router Specification")                               | Routes requests and responses between interfaces and service routes                                                                                                                      |
| [Sandbox Module](https://blackrock.industryswarm.com/docs/Server.Modules.Sandbox.html "Sandbox Specification")                            | Provides a sandbox environment to execute un-trusted Javascript code within your application server                                                                                      |
| [Services Module](https://blackrock.industryswarm.com/docs/Server.Modules.Services.html "Services Specification")                         | Loads, manages and provides access to and between all services running on your application server                                                                                        |
| [Universe Module](https://blackrock.industryswarm.com/docs/Server.Modules.Universe.html "Universe Specification")                         | Provides the Universe object to your services, giving you access to a world of real-time data. Make your service environmentally reactive!                                               |
| [Utilities Module](https://blackrock.industryswarm.com/docs/Server.Modules.Utilities.html "Utilities Specification")                      | Provides a collection of popular Utility methods that you can access within the application server (modules) or from your services                                                       |



<br/>

### Interface Specifications

*Below you can find the specifications for each Blackrock interface:*

| Module                                                                                                                            | Description                                                                                          |
| -----------                                                                                                                       | -----------------------------------------------------------------------------------------------------|
| [Axon Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.Axon.html "Axon Specification")                       | Provides an interface for the Axon protocol                                                          |
| [HTTP Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.HTTP.html "HTTP Specification")                       | Provides an interface for the HTTP and HTTPS protocol                                                |
| [NanoMSG Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.NanoMSG.html "NanoMSG Specification")              | Provides an interface for the NanoMSG protocol                                                       |
| [SSH Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.SSH.html "SSH Specification")                          | Provides an interface for the SSH protocol                                                           |
| [WebSockets Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.WebSockets.html "WebSockets Specification")     | Provides an interface for the WebSockets protocol                                                    |
| [ZeroMQ Interface](https://blackrock.industryswarm.com/docs/Server.Interfaces.ZeroMQ.html "ZeroMQ Specification")                 | Provides an interface for the ZeroMQ protocol                                                        |

<br/><br/>



### Gratitude

Thanks for downloading the Blackrock Framework. We look forward to seeing what you build with it.

<br/>
