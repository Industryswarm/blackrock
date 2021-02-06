<br/>

## Specification

This guide has been written to give you a comprehensive overview on the different aspects of the application
server that can be configured, and how to do it. To start with, let's have a look at the configuration file
specification:
<br/><br/>

| Attribute                            | {mod}        | Description                                                                                                                                                                                       |
| -----------                          | -----------  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| {mod}                                | N/A          | The first JSON key is the module name                                                                                                                                                             |
| {mod}.banner                         | core         | The text banner that is rendered on the console on server startup                                                                                                                                 |
| {mod}.maxObjectListeners             | core         | The max number of listeners on any module or interface (they are all event emitters)                                                                                                              |
| {mod}.modules[]                      | core         | An array of all modules that are available. Each array item is a string (containing module name). Precede the module name by a full stop (.) to disable it                                        |
| {mod}.interfaces[]                   | core         | An array of all interfaces that are available. Each array item is a string (containing interface name). Precede the interface name by a full stop (.) to disable it                               |
| {mod}.startupModules[]               | core         | An array of all modules that should be loaded on startup (in order of load)                                                                                                                       |
| {mod}.timeouts                       | core         | An object that describes the various server timeouts                                                                                                                                              |
| {mod}.timeouts.loadDependencies      | core         | The timeout period (in milliseconds) when loading dependencies (modules and interfaces)                                                                                                           |
| {mod}.timeouts.closeModules          | core         | The timeout period (in milliseconds) when closing modules (and interfaces)                                                                                                                        |
| {mod}.locations                      | core         | An object that describes the locations of key folders for when the server is operating in stand-alone mode                                                                                        |
| {mod}.locations.services             | core         | The path to the services folder                                                                                                                                                                   |
| {mod}.locations.cache                | core         | The path to the cache folder                                                                                                                                                                      |
| {mod}.enabled                        | errorhandler | (Boolean) true or false - Whether the ErrorHandler module is enabled or not                                                                                                                       |
| {mod}.timeout                        | errorhandler | The timeout in milliseconds between when an error is thrown and when it must be handled by                                                                                                        |
| {mod}.server                         | farm         | An object describing the current server within a server farm (or cluster)                                                                                                                         |
| {mod}.server.port                    | farm         | The port that the local farm node is listening on for cluster services                                                                                                                            |
| {mod}.server.cache                   | farm         | The path to the cache file for the cluster/farm                                                                                                                                                   |
| {mod}.server.seeds[]                 | farm         | An array of strings - each an IP address for another cluster/farm node (or server) that the current node can connect to                                                                           |



<br/><br/><br/>

## Example
Now, let's have a look at the an example - the default configuration file (is-blackrock-default.json):

<br/>

    {
        "cli": {},

        "configure": {},

        "core": {
            "banner": "Blackrock Application Server (Default)",
            "maxObjectListeners": 100,
            "modules": ["cli", "core", ".configure", "daemon", "errorhandler", ".farm", ".generator", ".i18n",
                ".installer", "jobs", "logger", "router", ".sandbox", "app-engine", "utilities"],
            "interfaces": [".axon", "http", ".nanomsg", ".ssh", "websockets", ".zeromq"],
            "startupModules": ["logger", "utilities", "daemon", "cli"],
            "timeouts": {
                "loadDependencies": 5000,
                "closeModules": 5000
            },
            "locations": {
                "services": "/opt/is-blackrock/services",
                "cache": "/opt/is-blackrock/cache"
            }
        },

        "daemon": {},

        "error-handler": {
            "enabled": true,
            "timeout": 5000
        },

        "farm": {
            "server": {
                "port": 8001,
                "cache": "scuttlebutt.dat"
            },
            "seeds": ["127.0.0.1:8001"]
        },

        "generator": {},

        "i18n": {},

        "installer": {},

        "interfaces": {
            "http": {
                "http": {
                    "enabled": true,
                    "ssl": false,
                    "port": 8080,
                    "requestTimeout": 10000,
                    "log": false,
                    "fileUploadPath": "/tmp/blackrock/upload",
                    "maxUploadFileSizeMb": 50
                }
            },
            "websockets": {
                "websockets": {
                    "enabled": true,
                    "httpInterface": "http"
                }
            },
            "axon": {},
            "nanomsg": {},
            "ssh": {},
            "zeromq": {}
        },

        "jobs": {},

        "logger": {
            "enabled": true,
            "levels": ["startup", "shutdown", "warning", "error", "fatal", "debug"],
            "logMetadataObjects": false,
            "sinks": {
                "console": {
                    "enabled": true
                },
                "file": {
                    "enabled": true,
                    "location": "/var/log/is-blackrock-log.txt"
                }
            },
            "heartbeat": {
                "console": false,
                "heartbeatFreq": 10000,
                "cacheFreq": 10000
            }
        },

        "router": {
            "instances": {
                "RouterOne": {
                    "interfaces": ["*"],
                    "services": ["*"]
                }
            }
        },

        "sandbox": {},
    
        "app-engine": {
            "allow": {
                "cfg": true,
                "pkg": true,
                "fetchBasePath": true,
                "shutdown": false,
                "globals": true,
                "modules": {
                    "cli": [],
                    "daemon": [],
                    "errorhandler": [],
                    "farm": [],
                    "generator": [],
                    "i18n": [
                        "init", "t", "use", "exists", "getFixedT", "changeLanguage", "loadNamespaces", "loadLanguages",
                        "reloadResources", "setDefaultNamespace", "dir", "format", "createInstance", "cloneInstance",
                        "on", "off", "getResource", "addResource", "addResources", "addResourceBundle", "hasResourceBundle",
                        "getDataByLanguage", "getResourceBundle", "removeResourceBundle", "createAppInstances"
                    ],
                    "identity": [],
                    "installer": [],
                    "jobs": ["add", "remove"],
                    "logger": ["log"],
                    "router": [],
                    "sandbox": [],
                    "app-engine": ["app(appName)", "appStats"],
                    "universe": [],
                    "utilities": [
                        "randomString", "uuid4", "isJSON", "objectLength", "getCurrentDateInISO", "validateString",
                        "cloneObject", "modules.loadModule", "csv.parse", "crypto.encrypt", "crypto.decrypt",
                        "xml", "system.getMemoryUse", "system.getCpuLoad", "system.getStartTime", "system.getEndTime",
                        "system.getObjectMemoryUsage", "isUndefined", "isNull", "isNil", "path", "prop", "assign"
                    ],
                    "http": [
                        "client.request", "client.get", "client.post", "client.put", "client.delete",
                        "get", "hook.add", "hook.remove"
                    ],
                    "websockets": [],
                    "axon": [],
                    "nanomsg": [],
                    "ssh": [],
                    "zeromq": []
                }
            },
            "runtime": {
                "apps": {
                    "allowLoad": true,
                    "allowUnload": true,
                    "allowOverride": false
                },
                "controllers": {
                    "allowLoad": true,
                    "allowUnload": true,
                    "allowOverride": false
                }
            },
            "sandbox": {
                "default": false,
                "allowOverride": false
            }
        },

        "universe": {},

        "utilities": {}
    }
