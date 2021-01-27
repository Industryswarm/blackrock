'use strict';

const fs = require('fs');
const vm = require('vm');
const pa = require('path');
const {EventEmitter} = require('events');
const {INSPECT_MAX_BYTES} = require('buffer');
const helpers = require('./helpers.js');

const loadAndCompileScript = function loadAndCompileScript(filename, prefix, suffix) {
  const data = fs.readFileSync(filename, 'utf8');
  return new vm.Script(prefix + data + suffix, {
    filename,
    displayErrors: false,
  });
};

const CACHE = {
  coffeeScriptCompiler: null,
  timeoutContext: null,
  timeoutScript: null,
  contextifyScript: loadAndCompileScript(`${__dirname}/contextify.js`, '(function(require, host) { ', '\n})'),
  sandboxScript: null,
  hookScript: null,
  getGlobalScript: null,
  getGeneratorFunctionScript: null,
  getAsyncFunctionScript: null,
  getAsyncGeneratorFunctionScript: null,
};

const DEFAULT_RUN_OPTIONS = {displayErrors: false};

const getCoffeeScriptCompiler = function getCoffeeScriptCompiler() {
  if (!CACHE.coffeeScriptCompiler) {
    try {
      const coffeeScript = require('coffee-script');
      CACHE.coffeeScriptCompiler = (code, filename) => {
        return coffeeScript.compile(code, {header: false, bare: true});
      };
    } catch (e) {
      throw new VMError('Coffee-Script compiler is not installed.');
    }
  }
  return CACHE.coffeeScriptCompiler;
};

const jsCompiler = function jsCompiler(code, filename) {
  return removeShebang(code);
};

const lookupCompiler = function lookupCompiler(compiler) {
  if ('function' === typeof compiler) return compiler;
  switch (compiler) {
    case 'coffeescript':
    case 'coffee-script':
    case 'cs':
    case 'text/coffeescript':
      return getCoffeeScriptCompiler();
    case 'javascript':
    case 'java-script':
    case 'js':
    case 'text/javascript':
      return jsCompiler;
    default:
      throw new VMError(`Unsupported compiler '${compiler}'.`);
  }
};

const removeShebang = function removeShebang(code) {
  if (!code.startsWith('#!')) return code;
  return '//' + code.substr(2);
};

class VMScript {
  constructor(code, options) {
    const sCode = `${code}`;
    let useFileName;
    let useOptions;
    if (arguments.length === 2) {
      if (typeof options === 'object' && options.toString === Object.prototype.toString) {
        useOptions = options || {};
        useFileName = useOptions.filename;
      } else {
        useOptions = {};
        useFileName = options;
      }
    } else if (arguments.length > 2) {
      // We do it this way so that there are no more arguments in the function.
      // eslint-disable-next-line prefer-rest-params
      useOptions = arguments[2] || {};
      useFileName = options || useOptions.filename;
    } else {
      useOptions = {};
    }

    const {
      compiler = 'javascript',
      lineOffset = 0,
      columnOffset = 0,
    } = useOptions;

    // Throw if the compiler is unknown.
    const resolvedCompiler = lookupCompiler(compiler);

    Object.defineProperties(this, {
      code: {
        // Put this here so that it is enumerable, and looks like a property.
        get() {
          return this._prefix + this._code + this._suffix;
        },
        set(value) {
          const strNewCode = String(value);
          if (strNewCode === this._code && this._prefix === '' && this._suffix === '') return;
          this._code = strNewCode;
          this._prefix = '';
          this._suffix = '';
          this._compiledVM = null;
          this._compiledNodeVM = null;
          this._compiledCode = null;
        },
        enumerable: true,
      },
      filename: {
        value: useFileName || 'vm.js',
        enumerable: true,
      },
      lineOffset: {
        value: lineOffset,
        enumerable: true,
      },
      columnOffset: {
        value: columnOffset,
        enumerable: true,
      },
      compiler: {
        value: compiler,
        enumerable: true,
      },
      _code: {
        value: sCode,
        writable: true,
      },
      _prefix: {
        value: '',
        writable: true,
      },
      _suffix: {
        value: '',
        writable: true,
      },
      _compiledVM: {
        value: null,
        writable: true,
      },
      _compiledNodeVM: {
        value: null,
        writable: true,
      },
      _compiledCode: {
        value: null,
        writable: true,
      },
      _compiler: {value: resolvedCompiler},
    });
  }
  wrap(prefix, suffix) {
    const strPrefix = `${prefix}`;
    const strSuffix = `${suffix}`;
    if (this._prefix === strPrefix && this._suffix === strSuffix) return this;
    this._prefix = strPrefix;
    this._suffix = strSuffix;
    this._compiledVM = null;
    this._compiledNodeVM = null;
    return this;
  }
  compile() {
    this._compileVM();
    return this;
  }
  getCompiledCode() {
    if (!this._compiledCode) {
      this._compiledCode = this._compiler(this._prefix + removeShebang(this._code) + this._suffix, this.filename);
    }
    return this._compiledCode;
  }
  _compile(prefix, suffix) {
    return new vm.Script(prefix + this.getCompiledCode() + suffix, {
      filename: this.filename,
      displayErrors: false,
      lineOffset: this.lineOffset,
      columnOffset: this.columnOffset,
    });
  }
  _compileVM() {
    let script = this._compiledVM;
    if (!script) {
      this._compiledVM = script = this._compile('', '');
    }
    return script;
  }
  _compileNodeVM() {
    let script = this._compiledNodeVM;
    if (!script) {
      this._compiledNodeVM = script = this._compile('(function (exports, require, module, __filename, __dirname) { ', '\n})');
    }
    return script;
  }
}
function doWithTimeout(fn, timeout) {
  let ctx = CACHE.timeoutContext;
  let script = CACHE.timeoutScript;
  if (!ctx) {
    CACHE.timeoutContext = ctx = vm.createContext();
    CACHE.timeoutScript = script = new vm.Script('fn()', {
      filename: 'timeout_bridge.js',
      displayErrors: false,
    });
  }
  ctx.fn = fn;
  try {
    return script.runInContext(ctx, {
      displayErrors: false,
      timeout,
    });
  } finally {
    ctx.fn = null;
  }
}
function makeCheckAsync(internal) {
  return (hook, args) => {
    if (hook === 'function' || hook === 'generator_function' || hook === 'eval' || hook === 'run') {
      const funcConstructor = internal.Function;
      if (hook === 'eval') {
        const script = args[0];
        args = [script];
        if (typeof(script) !== 'string') return args;
      } else {
        // Next line throws on Symbol, this is the same behavior as function constructor calls
        args = args.map((arg) => `${arg}`);
      }
      if (args.findIndex((arg) => /\basync\b/.test(arg)) === -1) return args;
      const asyncMapped = args.map((arg) => arg.replace(/async/g, 'a\\u0073ync'));
      try {
        // Note: funcConstructor is a Sandbox object, however, asyncMapped are only strings.
        funcConstructor(...asyncMapped);
      } catch (u) {
        // u is a sandbox object
        // Some random syntax error or error because of async.

        // First report real syntax errors
        try {
          // Note: funcConstructor is a Sandbox object, however, args are only strings.
          funcConstructor(...args);
        } catch (e) {
          throw internal.Decontextify.value(e);
        }
        // Then async error
        throw new VMError('Async not available');
      }
      return args;
    }
    throw new VMError('Async not available');
  };
}

class VM extends EventEmitter {
  constructor(options = {}) {
    super();

    // Read all options
    const {
      timeout,
      sandbox,
      compiler = 'javascript',
    } = options;
    const allowEval = options.eval !== false;
    const allowWasm = options.wasm !== false;
    const fixAsync = !!options.fixAsync;

    // Early error if sandbox is not an object.
    if (sandbox && 'object' !== typeof sandbox) {
      throw new VMError('Sandbox must be object.');
    }

    // Early error if compiler can't be found.
    const resolvedCompiler = lookupCompiler(compiler);

    // Create a new context for this vm.
    const _context = vm.createContext(undefined, {
      codeGeneration: {
        strings: allowEval,
        wasm: allowWasm,
      },
    });

    // Create the bridge between the host and the sandbox.
    const _internal = CACHE.contextifyScript.runInContext(_context, DEFAULT_RUN_OPTIONS).call(_context, require, HOST);

    const hook = fixAsync ? makeCheckAsync(_internal) : null;

    // Define the properties of this object.
    // Use Object.defineProperties here to be able to
    // hide and set properties write only.
    Object.defineProperties(this, {
      timeout: {
        value: timeout,
        writable: true,
        enumerable: true,
      },
      compiler: {
        value: compiler,
        enumerable: true,
      },
      sandbox: {
        value: _internal.sandbox,
        enumerable: true,
      },
      _context: {value: _context},
      _internal: {value: _internal},
      _compiler: {value: resolvedCompiler},
      _hook: {value: hook},
    });

    if (hook) {
      if (!CACHE.hookScript) {
        CACHE.hookScript = loadAndCompileScript(`${__dirname}/fixasync.js`, '(function() { ', '\n})');
        CACHE.getGlobalScript = new vm.Script('this', {
          filename: 'get_global.js',
          displayErrors: false,
        });
        try {
          CACHE.getGeneratorFunctionScript = new vm.Script('(function*(){}).constructor', {
            filename: 'get_generator_function.js',
            displayErrors: false,
          });
        } catch (ex) {}
        try {
          CACHE.getAsyncFunctionScript = new vm.Script('(async function(){}).constructor', {
            filename: 'get_async_function.js',
            displayErrors: false,
          });
        } catch (ex) {}
        try {
          CACHE.getAsyncGeneratorFunctionScript = new vm.Script('(async function*(){}).constructor', {
            filename: 'get_async_generator_function.js',
            displayErrors: false,
          });
        } catch (ex) {}
      }
      const internal = {
        __proto__: null,
        global: CACHE.getGlobalScript.runInContext(_context, DEFAULT_RUN_OPTIONS),
        internal: _internal,
        host: HOST,
        hook,
      };
      if (CACHE.getGeneratorFunctionScript) {
        try {
          internal.GeneratorFunction = CACHE.getGeneratorFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
        } catch (ex) {}
      }
      if (CACHE.getAsyncFunctionScript) {
        try {
          internal.AsyncFunction = CACHE.getAsyncFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
        } catch (ex) {}
      }
      if (CACHE.getAsyncGeneratorFunctionScript) {
        try {
          internal.AsyncGeneratorFunction = CACHE.getAsyncGeneratorFunctionScript.runInContext(_context, DEFAULT_RUN_OPTIONS);
        } catch (ex) {}
      }
      CACHE.hookScript.runInContext(_context, DEFAULT_RUN_OPTIONS).call(internal);
    }

    // prepare global sandbox
    if (sandbox) {
      this.setGlobals(sandbox);
    }
  }
  setGlobals(values) {
    for (const name in values) {
      if (Object.prototype.hasOwnProperty.call(values, name)) {
        this._internal.Contextify.setGlobal(name, values[name]);
      }
    }
    return this;
  }
  setGlobal(name, value) {
    this._internal.Contextify.setGlobal(name, value);
    return this;
  }
  getGlobal(name) {
    return this._internal.Contextify.getGlobal(name);
  }
  freeze(value, globalName) {
    this._internal.Contextify.readonly(value);
    if (globalName) this._internal.Contextify.setGlobal(globalName, value);
    return value;
  }
  protect(value, globalName) {
    this._internal.Contextify.protected(value);
    if (globalName) this._internal.Contextify.setGlobal(globalName, value);
    return value;
  }
  run(code, filename) {
    let script;
    if (code instanceof VMScript) {
      if (this._hook) {
        const scriptCode = code.getCompiledCode();
        const changed = this._hook('run', [scriptCode])[0];
        if (changed === scriptCode) {
          script = code._compileVM();
        } else {
          script = new vm.Script(changed, {
            filename: code.filename,
            displayErrors: false,
          });
        }
      } else {
        script = code._compileVM();
      }
    } else {
      const useFileName = filename || 'vm.js';
      let scriptCode = this._compiler(code, useFileName);
      if (this._hook) {
        scriptCode = this._hook('run', [scriptCode])[0];
      }
      // Compile the script here so that we don't need to create a instance of VMScript.
      script = new vm.Script(scriptCode, {
        filename: useFileName,
        displayErrors: false,
      });
    }

    if (!this.timeout) {
      // If no timeout is given, directly run the script.
      try {
        return this._internal.Decontextify.value(script.runInContext(this._context, DEFAULT_RUN_OPTIONS));
      } catch (e) {
        throw this._internal.Decontextify.value(e);
      }
    }

    return doWithTimeout(()=>{
      try {
        return this._internal.Decontextify.value(script.runInContext(this._context, DEFAULT_RUN_OPTIONS));
      } catch (e) {
        throw this._internal.Decontextify.value(e);
      }
    }, this.timeout);
  }
  runFile(filename) {
    const resolvedFilename = pa.resolve(filename);

    if (!fs.existsSync(resolvedFilename)) {
      throw new VMError(`Script '${filename}' not found.`);
    }

    if (fs.statSync(resolvedFilename).isDirectory()) {
      throw new VMError('Script must be file, got directory.');
    }

    return this.run(fs.readFileSync(resolvedFilename, 'utf8'), resolvedFilename);
  }
}


class NodeVM extends VM {
  constructor(options = {}) {
    const sandbox = options.sandbox;

    // Throw this early
    if (sandbox && 'object' !== typeof sandbox) {
      throw new VMError('Sandbox must be object.');
    }

    super({compiler: options.compiler, eval: options.eval, wasm: options.wasm});

    // defaults
    Object.defineProperty(this, 'options', {value: {
      console: options.console || 'inherit',
      require: options.require || false,
      nesting: options.nesting || false,
      wrapper: options.wrapper || 'commonjs',
      sourceExtensions: options.sourceExtensions || ['js'],
    }});

    let sandboxScript = CACHE.sandboxScript;
    if (!sandboxScript) {
      CACHE.sandboxScript = sandboxScript = loadAndCompileScript(`${__dirname}/sandbox.js`,
          '(function (vm, host, Contextify, Decontextify, Buffer, options) { ', '\n})');
    }

    const closure = sandboxScript.runInContext(this._context, DEFAULT_RUN_OPTIONS);

    Object.defineProperty(this, '_prepareRequire', {
      value: closure.call(this._context, this, HOST, this._internal.Contextify, this._internal.Decontextify, this._internal.Buffer, options),
    });

    // prepare global sandbox
    if (sandbox) {
      this.setGlobals(sandbox);
    }

    if (this.options.require && this.options.require.import) {
      if (Array.isArray(this.options.require.import)) {
        for (let i = 0, l = this.options.require.import.length; i < l; i++) {
          this.require(this.options.require.import[i]);
        }
      } else {
        this.require(this.options.require.import);
      }
    }
  }
  call(method, ...args) {
    if ('function' === typeof method) {
      return method(...args);
    } else {
      throw new VMError('Unrecognized method type.');
    }
  }
  require(module) {
    return this.run(`module.exports = require('${module}');`, 'vm.js');
  }
  run(code, filename) {
    let dirname;
    let resolvedFilename;
    let script;

    if (code instanceof VMScript) {
      script = code._compileNodeVM();
      resolvedFilename = pa.resolve(code.filename);
      dirname = pa.dirname(resolvedFilename);
    } else {
      const unresolvedFilename = filename || 'vm.js';
      if (filename) {
        resolvedFilename = pa.resolve(filename);
        dirname = pa.dirname(resolvedFilename);
      } else {
        resolvedFilename = null;
        dirname = null;
      }
      script = new vm.Script('(function (exports, require, module, __filename, __dirname) { ' +
					this._compiler(code, unresolvedFilename) + '\n})', {
        filename: unresolvedFilename,
        displayErrors: false,
      });
    }

    const wrapper = this.options.wrapper;
    const module = this._internal.Contextify.makeModule();

    try {
      const closure = script.runInContext(this._context, DEFAULT_RUN_OPTIONS);

      const returned = closure.call(this._context, module.exports, this._prepareRequire(dirname), module, resolvedFilename, dirname);

      return this._internal.Decontextify.value(wrapper === 'commonjs' ? module.exports : returned);
    } catch (e) {
      throw this._internal.Decontextify.value(e);
    }
  }
  static code(script, filename, options) {
    let unresolvedFilename;
    if (filename != null) {
      if ('object' === typeof filename) {
        options = filename;
        unresolvedFilename = options.filename;
      } else if ('string' === typeof filename) {
        unresolvedFilename = filename;
      } else {
        throw new VMError('Invalid arguments.');
      }
    } else if ('object' === typeof options) {
      unresolvedFilename = options.filename;
    }

    if (arguments.length > 3) {
      throw new VMError('Invalid number of arguments.');
    }

    const resolvedFilename = typeof unresolvedFilename === 'string' ? pa.resolve(unresolvedFilename) : undefined;

    return new NodeVM(options).run(script, resolvedFilename);
  }
  static file(filename, options) {
    const resolvedFilename = pa.resolve(filename);

    if (!fs.existsSync(resolvedFilename)) {
      throw new VMError(`Script '${filename}' not found.`);
    }

    if (fs.statSync(resolvedFilename).isDirectory()) {
      throw new VMError('Script must be file, got directory.');
    }

    return new NodeVM(options).run(fs.readFileSync(resolvedFilename, 'utf8'), resolvedFilename);
  }
}

class VMError extends Error {
  constructor(message) {
    super(message);

    this.name = 'VMError';

    Error.captureStackTrace(this, this.constructor);
  }
}

const HOST = {
  version: parseInt(process.versions.node.split('.')[0]),
  require,
  process,
  console,
  setTimeout,
  setInterval,
  setImmediate,
  clearTimeout,
  clearInterval,
  clearImmediate,
  String,
  Number,
  Buffer,
  Boolean,
  Array,
  Date,
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,
  RegExp,
  Function,
  Object,
  VMError,
  Proxy,
  Reflect,
  Map,
  WeakMap,
  Set,
  WeakSet,
  Promise,
  Symbol,
  INSPECT_MAX_BYTES,
  VM,
  NodeVM,
  helpers,
};

exports.VMError = VMError;
exports.NodeVM = NodeVM;
exports.VM = VM;
exports.VMScript = VMScript;
