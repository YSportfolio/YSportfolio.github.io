/* exported Handlebars */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Handlebars = root.Handlebars || factory();
  }
}(this, function () {
// handlebars/safe-string.js
var __module4__ = (function() {
  "use strict";
  var __exports__;
  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = function() {
    return "" + this.string;
  };

  __exports__ = SafeString;
  return __exports__;
})();

// handlebars/utils.js
var __module3__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  /*jshint -W004 */
  var SafeString = __dependency1__;

  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr];
  }

  function extend(obj /* , ...source */) {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          obj[key] = arguments[i][key];
        }
      }
    }

    return obj;
  }

  __exports__.extend = extend;var toString = Object.prototype.toString;
  __exports__.toString = toString;
  // Sourced from lodash
  // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
  var isFunction = function(value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  /* istanbul ignore next */
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  __exports__.isFunction = isFunction;
  /* istanbul ignore next */
  var isArray = Array.isArray || function(value) {
    return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
  };
  __exports__.isArray = isArray;

  function escapeExpression(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof SafeString) {
      return string.toString();
    } else if (string == null) {
      return "";
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = "" + string;

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

  __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  __exports__.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
    return (contextPath ? contextPath + '.' : '') + id;
  }

  __exports__.appendContextPath = appendContextPath;
  return __exports__;
})(__module4__);

// handlebars/exception.js
var __module5__ = (function() {
  "use strict";
  var __exports__;

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(message, node) {
    var line;
    if (node && node.firstLine) {
      line = node.firstLine;

      message += ' - ' + line + ':' + node.firstColumn;
    }

    var tmp = Error.prototype.constructor.call(this, message);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }

    if (line) {
      this.lineNumber = line;
      this.column = node.firstColumn;
    }
  }

  Exception.prototype = new Error();

  __exports__ = Exception;
  return __exports__;
})();

// handlebars/base.js
var __module2__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;

  var VERSION = "2.0.0";
  __exports__.VERSION = VERSION;var COMPILER_REVISION = 6;
  __exports__.COMPILER_REVISION = COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
    2: '== 1.0.0-rc.3',
    3: '== 1.0.0-rc.4',
    4: '== 1.x.x',
    5: '== 2.0.0-alpha.x',
    6: '>= 2.0.0-beta.1'
  };
  __exports__.REVISION_CHANGES = REVISION_CHANGES;
  var isArray = Utils.isArray,
      isFunction = Utils.isFunction,
      toString = Utils.toString,
      objectType = '[object Object]';

  function HandlebarsEnvironment(helpers, partials) {
    this.helpers = helpers || {};
    this.partials = partials || {};

    registerDefaultHelpers(this);
  }

  __exports__.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,

    logger: logger,
    log: log,

    registerHelper: function(name, fn) {
      if (toString.call(name) === objectType) {
        if (fn) { throw new Exception('Arg not supported with multiple helpers'); }
        Utils.extend(this.helpers, name);
      } else {
        this.helpers[name] = fn;
      }
    },
    unregisterHelper: function(name) {
      delete this.helpers[name];
    },

    registerPartial: function(name, partial) {
      if (toString.call(name) === objectType) {
        Utils.extend(this.partials,  name);
      } else {
        this.partials[name] = partial;
      }
    },
    unregisterPartial: function(name) {
      delete this.partials[name];
    }
  };

  function registerDefaultHelpers(instance) {
    instance.registerHelper('helperMissing', function(/* [args, ]options */) {
      if(arguments.length === 1) {
        // A missing field in a {{foo}} constuct.
        return undefined;
      } else {
        // Someone is actually trying to call something, blow up.
        throw new Exception("Missing helper: '" + arguments[arguments.length-1].name + "'");
      }
    });

    instance.registerHelper('blockHelperMissing', function(context, options) {
      var inverse = options.inverse,
          fn = options.fn;

      if(context === true) {
        return fn(this);
      } else if(context === false || context == null) {
        return inverse(this);
      } else if (isArray(context)) {
        if(context.length > 0) {
          if (options.ids) {
            options.ids = [options.name];
          }

          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        if (options.data && options.ids) {
          var data = createFrame(options.data);
          data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
          options = {data: data};
        }

        return fn(context, options);
      }
    });

    instance.registerHelper('each', function(context, options) {
      if (!options) {
        throw new Exception('Must pass iterator to #each');
      }

      var fn = options.fn, inverse = options.inverse;
      var i = 0, ret = "", data;

      var contextPath;
      if (options.data && options.ids) {
        contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
      }

      if (isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = createFrame(options.data);
      }

      if(context && typeof context === 'object') {
        if (isArray(context)) {
          for(var j = context.length; i<j; i++) {
            if (data) {
              data.index = i;
              data.first = (i === 0);
              data.last  = (i === (context.length-1));

              if (contextPath) {
                data.contextPath = contextPath + i;
              }
            }
            ret = ret + fn(context[i], { data: data });
          }
        } else {
          for(var key in context) {
            if(context.hasOwnProperty(key)) {
              if(data) {
                data.key = key;
                data.index = i;
                data.first = (i === 0);

                if (contextPath) {
                  data.contextPath = contextPath + key;
                }
              }
              ret = ret + fn(context[key], {data: data});
              i++;
            }
          }
        }
      }

      if(i === 0){
        ret = inverse(this);
      }

      return ret;
    });

    instance.registerHelper('if', function(conditional, options) {
      if (isFunction(conditional)) { conditional = conditional.call(this); }

      // Default behavior is to render the positive path if the value is truthy and not empty.
      // The `includeZero` option may be set to treat the condtional as purely not empty based on the
      // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
      if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    instance.registerHelper('unless', function(conditional, options) {
      return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
    });

    instance.registerHelper('with', function(context, options) {
      if (isFunction(context)) { context = context.call(this); }

      var fn = options.fn;

      if (!Utils.isEmpty(context)) {
        if (options.data && options.ids) {
          var data = createFrame(options.data);
          data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
          options = {data:data};
        }

        return fn(context, options);
      } else {
        return options.inverse(this);
      }
    });

    instance.registerHelper('log', function(message, options) {
      var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
      instance.log(level, message);
    });

    instance.registerHelper('lookup', function(obj, field) {
      return obj && obj[field];
    });
  }

  var logger = {
    methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

    // State enum
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    level: 3,

    // can be overridden in the host environment
    log: function(level, message) {
      if (logger.level <= level) {
        var method = logger.methodMap[level];
        if (typeof console !== 'undefined' && console[method]) {
          console[method].call(console, message);
        }
      }
    }
  };
  __exports__.logger = logger;
  var log = logger.log;
  __exports__.log = log;
  var createFrame = function(object) {
    var frame = Utils.extend({}, object);
    frame._parent = object;
    return frame;
  };
  __exports__.createFrame = createFrame;
  return __exports__;
})(__module3__, __module5__);

// handlebars/runtime.js
var __module6__ = (function(__dependency1__, __dependency2__, __dependency3__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;
  var COMPILER_REVISION = __dependency3__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency3__.REVISION_CHANGES;
  var createFrame = __dependency3__.createFrame;

  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1,
        currentRevision = COMPILER_REVISION;

    if (compilerRevision !== currentRevision) {
      if (compilerRevision < currentRevision) {
        var runtimeVersions = REVISION_CHANGES[currentRevision],
            compilerVersions = REVISION_CHANGES[compilerRevision];
        throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
              "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
      } else {
        // Use the embedded version info since the runtime doesn't know about this revision yet
        throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
              "Please update your runtime to a newer version ("+compilerInfo[1]+").");
      }
    }
  }

  __exports__.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

  function template(templateSpec, env) {
    /* istanbul ignore next */
    if (!env) {
      throw new Exception("No environment passed to template");
    }
    if (!templateSpec || !templateSpec.main) {
      throw new Exception('Unknown template object: ' + typeof templateSpec);
    }

    // Note: Using env.VM references rather than local var references throughout this section to allow
    // for external users to override these as psuedo-supported APIs.
    env.VM.checkRevision(templateSpec.compiler);

    var invokePartialWrapper = function(partial, indent, name, context, hash, helpers, partials, data, depths) {
      if (hash) {
        context = Utils.extend({}, context, hash);
      }

      var result = env.VM.invokePartial.call(this, partial, name, context, helpers, partials, data, depths);

      if (result == null && env.compile) {
        var options = { helpers: helpers, partials: partials, data: data, depths: depths };
        partials[name] = env.compile(partial, { data: data !== undefined, compat: templateSpec.compat }, env);
        result = partials[name](context, options);
      }
      if (result != null) {
        if (indent) {
          var lines = result.split('\n');
          for (var i = 0, l = lines.length; i < l; i++) {
            if (!lines[i] && i + 1 === l) {
              break;
            }

            lines[i] = indent + lines[i];
          }
          result = lines.join('\n');
        }
        return result;
      } else {
        throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
      }
    };

    // Just add water
    var container = {
      lookup: function(depths, name) {
        var len = depths.length;
        for (var i = 0; i < len; i++) {
          if (depths[i] && depths[i][name] != null) {
            return depths[i][name];
          }
        }
      },
      lambda: function(current, context) {
        return typeof current === 'function' ? current.call(context) : current;
      },

      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,

      fn: function(i) {
        return templateSpec[i];
      },

      programs: [],
      program: function(i, data, depths) {
        var programWrapper = this.programs[i],
            fn = this.fn(i);
        if (data || depths) {
          programWrapper = program(this, i, fn, data, depths);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = program(this, i, fn);
        }
        return programWrapper;
      },

      data: function(data, depth) {
        while (data && depth--) {
          data = data._parent;
        }
        return data;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common && (param !== common)) {
          ret = Utils.extend({}, common, param);
        }

        return ret;
      },

      noop: env.VM.noop,
      compilerInfo: templateSpec.compiler
    };

    var ret = function(context, options) {
      options = options || {};
      var data = options.data;

      ret._setup(options);
      if (!options.partial && templateSpec.useData) {
        data = initData(context, data);
      }
      var depths;
      if (templateSpec.useDepths) {
        depths = options.depths ? [context].concat(options.depths) : [context];
      }

      return templateSpec.main.call(container, context, container.helpers, container.partials, data, depths);
    };
    ret.isTop = true;

    ret._setup = function(options) {
      if (!options.partial) {
        container.helpers = container.merge(options.helpers, env.helpers);

        if (templateSpec.usePartial) {
          container.partials = container.merge(options.partials, env.partials);
        }
      } else {
        container.helpers = options.helpers;
        container.partials = options.partials;
      }
    };

    ret._child = function(i, data, depths) {
      if (templateSpec.useDepths && !depths) {
        throw new Exception('must pass parent depths');
      }

      return program(container, i, templateSpec[i], data, depths);
    };
    return ret;
  }

  __exports__.template = template;function program(container, i, fn, data, depths) {
    var prog = function(context, options) {
      options = options || {};

      return fn.call(container, context, container.helpers, container.partials, options.data || data, depths && [context].concat(depths));
    };
    prog.program = i;
    prog.depth = depths ? depths.length : 0;
    return prog;
  }

  __exports__.program = program;function invokePartial(partial, name, context, helpers, partials, data, depths) {
    var options = { partial: true, helpers: helpers, partials: partials, data: data, depths: depths };

    if(partial === undefined) {
      throw new Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    }
  }

  __exports__.invokePartial = invokePartial;function noop() { return ""; }

  __exports__.noop = noop;function initData(context, data) {
    if (!data || !('root' in data)) {
      data = data ? createFrame(data) : {};
      data.root = context;
    }
    return data;
  }
  return __exports__;
})(__module3__, __module5__, __module2__);

// handlebars.runtime.js
var __module1__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var base = __dependency1__;

  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  var SafeString = __dependency2__;
  var Exception = __dependency3__;
  var Utils = __dependency4__;
  var runtime = __dependency5__;

  // For compatibility and usage outside of module systems, make the Handlebars object a namespace
  var create = function() {
    var hb = new base.HandlebarsEnvironment();

    Utils.extend(hb, base);
    hb.SafeString = SafeString;
    hb.Exception = Exception;
    hb.Utils = Utils;
    hb.escapeExpression = Utils.escapeExpression;

    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };

    return hb;
  };

  var Handlebars = create();
  Handlebars.create = create;

  Handlebars['default'] = Handlebars;

  __exports__ = Handlebars;
  return __exports__;
})(__module2__, __module4__, __module5__, __module3__, __module6__);

// handlebars/compiler/ast.js
var __module7__ = (function(__dependency1__) {
  "use strict";
  var __exports__;
  var Exception = __dependency1__;

  function LocationInfo(locInfo) {
    locInfo = locInfo || {};
    this.firstLine   = locInfo.first_line;
    this.firstColumn = locInfo.first_column;
    this.lastColumn  = locInfo.last_column;
    this.lastLine    = locInfo.last_line;
  }

  var AST = {
    ProgramNode: function(statements, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "program";
      this.statements = statements;
      this.strip = strip;
    },

    MustacheNode: function(rawParams, hash, open, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "mustache";
      this.strip = strip;

      // Open may be a string parsed from the parser or a passed boolean flag
      if (open != null && open.charAt) {
        // Must use charAt to support IE pre-10
        var escapeFlag = open.charAt(3) || open.charAt(2);
        this.escaped = escapeFlag !== '{' && escapeFlag !== '&';
      } else {
        this.escaped = !!open;
      }

      if (rawParams instanceof AST.SexprNode) {
        this.sexpr = rawParams;
      } else {
        // Support old AST API
        this.sexpr = new AST.SexprNode(rawParams, hash);
      }

      // Support old AST API that stored this info in MustacheNode
      this.id = this.sexpr.id;
      this.params = this.sexpr.params;
      this.hash = this.sexpr.hash;
      this.eligibleHelper = this.sexpr.eligibleHelper;
      this.isHelper = this.sexpr.isHelper;
    },

    SexprNode: function(rawParams, hash, locInfo) {
      LocationInfo.call(this, locInfo);

      this.type = "sexpr";
      this.hash = hash;

      var id = this.id = rawParams[0];
      var params = this.params = rawParams.slice(1);

      // a mustache is definitely a helper if:
      // * it is an eligible helper, and
      // * it has at least one parameter or hash segment
      this.isHelper = !!(params.length || hash);

      // a mustache is an eligible helper if:
      // * its id is simple (a single part, not `this` or `..`)
      this.eligibleHelper = this.isHelper || id.isSimple;

      // if a mustache is an eligible helper but not a definite
      // helper, it is ambiguous, and will be resolved in a later
      // pass or at runtime.
    },

    PartialNode: function(partialName, context, hash, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type         = "partial";
      this.partialName  = partialName;
      this.context      = context;
      this.hash = hash;
      this.strip = strip;

      this.strip.inlineStandalone = true;
    },

    BlockNode: function(mustache, program, inverse, strip, locInfo) {
      LocationInfo.call(this, locInfo);

      this.type = 'block';
      this.mustache = mustache;
      this.program  = program;
      this.inverse  = inverse;
      this.strip = strip;

      if (inverse && !program) {
        this.isInverse = true;
      }
    },

    RawBlockNode: function(mustache, content, close, locInfo) {
      LocationInfo.call(this, locInfo);

      if (mustache.sexpr.id.original !== close) {
        throw new Exception(mustache.sexpr.id.original + " doesn't match " + close, this);
      }

      content = new AST.ContentNode(content, locInfo);

      this.type = 'block';
      this.mustache = mustache;
      this.program = new AST.ProgramNode([content], {}, locInfo);
    },

    ContentNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "content";
      this.original = this.string = string;
    },

    HashNode: function(pairs, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "hash";
      this.pairs = pairs;
    },

    IdNode: function(parts, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "ID";

      var original = "",
          dig = [],
          depth = 0,
          depthString = '';

      for(var i=0,l=parts.length; i<l; i++) {
        var part = parts[i].part;
        original += (parts[i].separator || '') + part;

        if (part === ".." || part === "." || part === "this") {
          if (dig.length > 0) {
            throw new Exception("Invalid path: " + original, this);
          } else if (part === "..") {
            depth++;
            depthString += '../';
          } else {
            this.isScoped = true;
          }
        } else {
          dig.push(part);
        }
      }

      this.original = original;
      this.parts    = dig;
      this.string   = dig.join('.');
      this.depth    = depth;
      this.idName   = depthString + this.string;

      // an ID is simple if it only has one part, and that part is not
      // `..` or `this`.
      this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;

      this.stringModeValue = this.string;
    },

    PartialNameNode: function(name, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "PARTIAL_NAME";
      this.name = name.original;
    },

    DataNode: function(id, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "DATA";
      this.id = id;
      this.stringModeValue = id.stringModeValue;
      this.idName = '@' + id.stringModeValue;
    },

    StringNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "STRING";
      this.original =
        this.string =
        this.stringModeValue = string;
    },

    NumberNode: function(number, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "NUMBER";
      this.original =
        this.number = number;
      this.stringModeValue = Number(number);
    },

    BooleanNode: function(bool, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "BOOLEAN";
      this.bool = bool;
      this.stringModeValue = bool === "true";
    },

    CommentNode: function(comment, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "comment";
      this.comment = comment;

      this.strip = {
        inlineStandalone: true
      };
    }
  };


  // Must be exported as an object rather than the root of the module as the jison lexer
  // most modify the object to operate properly.
  __exports__ = AST;
  return __exports__;
})(__module5__);

// handlebars/compiler/parser.js
var __module9__ = (function() {
  "use strict";
  var __exports__;
  /* jshint ignore:start */
  /* istanbul ignore next */
  /* Jison generated parser */
  var handlebars = (function(){
  var parser = {trace: function trace() { },
  yy: {},
  symbols_: {"error":2,"root":3,"program":4,"EOF":5,"program_repetition0":6,"statement":7,"mustache":8,"block":9,"rawBlock":10,"partial":11,"CONTENT":12,"COMMENT":13,"openRawBlock":14,"END_RAW_BLOCK":15,"OPEN_RAW_BLOCK":16,"sexpr":17,"CLOSE_RAW_BLOCK":18,"openBlock":19,"block_option0":20,"closeBlock":21,"openInverse":22,"block_option1":23,"OPEN_BLOCK":24,"CLOSE":25,"OPEN_INVERSE":26,"inverseAndProgram":27,"INVERSE":28,"OPEN_ENDBLOCK":29,"path":30,"OPEN":31,"OPEN_UNESCAPED":32,"CLOSE_UNESCAPED":33,"OPEN_PARTIAL":34,"partialName":35,"param":36,"partial_option0":37,"partial_option1":38,"sexpr_repetition0":39,"sexpr_option0":40,"dataName":41,"STRING":42,"NUMBER":43,"BOOLEAN":44,"OPEN_SEXPR":45,"CLOSE_SEXPR":46,"hash":47,"hash_repetition_plus0":48,"hashSegment":49,"ID":50,"EQUALS":51,"DATA":52,"pathSegments":53,"SEP":54,"$accept":0,"$end":1},
  terminals_: {2:"error",5:"EOF",12:"CONTENT",13:"COMMENT",15:"END_RAW_BLOCK",16:"OPEN_RAW_BLOCK",18:"CLOSE_RAW_BLOCK",24:"OPEN_BLOCK",25:"CLOSE",26:"OPEN_INVERSE",28:"INVERSE",29:"OPEN_ENDBLOCK",31:"OPEN",32:"OPEN_UNESCAPED",33:"CLOSE_UNESCAPED",34:"OPEN_PARTIAL",42:"STRING",43:"NUMBER",44:"BOOLEAN",45:"OPEN_SEXPR",46:"CLOSE_SEXPR",50:"ID",51:"EQUALS",52:"DATA",54:"SEP"},
  productions_: [0,[3,2],[4,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[10,3],[14,3],[9,4],[9,4],[19,3],[22,3],[27,2],[21,3],[8,3],[8,3],[11,5],[11,4],[17,3],[17,1],[36,1],[36,1],[36,1],[36,1],[36,1],[36,3],[47,1],[49,3],[35,1],[35,1],[35,1],[41,2],[30,1],[53,3],[53,1],[6,0],[6,2],[20,0],[20,1],[23,0],[23,1],[37,0],[37,1],[38,0],[38,1],[39,0],[39,2],[40,0],[40,1],[48,1],[48,2]],
  performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

  var $0 = $$.length - 1;
  switch (yystate) {
  case 1: yy.prepareProgram($$[$0-1].statements, true); return $$[$0-1]; 
  break;
  case 2:this.$ = new yy.ProgramNode(yy.prepareProgram($$[$0]), {}, this._$);
  break;
  case 3:this.$ = $$[$0];
  break;
  case 4:this.$ = $$[$0];
  break;
  case 5:this.$ = $$[$0];
  break;
  case 6:this.$ = $$[$0];
  break;
  case 7:this.$ = new yy.ContentNode($$[$0], this._$);
  break;
  case 8:this.$ = new yy.CommentNode($$[$0], this._$);
  break;
  case 9:this.$ = new yy.RawBlockNode($$[$0-2], $$[$0-1], $$[$0], this._$);
  break;
  case 10:this.$ = new yy.MustacheNode($$[$0-1], null, '', '', this._$);
  break;
  case 11:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], false, this._$);
  break;
  case 12:this.$ = yy.prepareBlock($$[$0-3], $$[$0-2], $$[$0-1], $$[$0], true, this._$);
  break;
  case 13:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 14:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 15:this.$ = { strip: yy.stripFlags($$[$0-1], $$[$0-1]), program: $$[$0] };
  break;
  case 16:this.$ = {path: $$[$0-1], strip: yy.stripFlags($$[$0-2], $$[$0])};
  break;
  case 17:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 18:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], yy.stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 19:this.$ = new yy.PartialNode($$[$0-3], $$[$0-2], $$[$0-1], yy.stripFlags($$[$0-4], $$[$0]), this._$);
  break;
  case 20:this.$ = new yy.PartialNode($$[$0-2], undefined, $$[$0-1], yy.stripFlags($$[$0-3], $$[$0]), this._$);
  break;
  case 21:this.$ = new yy.SexprNode([$$[$0-2]].concat($$[$0-1]), $$[$0], this._$);
  break;
  case 22:this.$ = new yy.SexprNode([$$[$0]], null, this._$);
  break;
  case 23:this.$ = $$[$0];
  break;
  case 24:this.$ = new yy.StringNode($$[$0], this._$);
  break;
  case 25:this.$ = new yy.NumberNode($$[$0], this._$);
  break;
  case 26:this.$ = new yy.BooleanNode($$[$0], this._$);
  break;
  case 27:this.$ = $$[$0];
  break;
  case 28:$$[$0-1].isHelper = true; this.$ = $$[$0-1];
  break;
  case 29:this.$ = new yy.HashNode($$[$0], this._$);
  break;
  case 30:this.$ = [$$[$0-2], $$[$0]];
  break;
  case 31:this.$ = new yy.PartialNameNode($$[$0], this._$);
  break;
  case 32:this.$ = new yy.PartialNameNode(new yy.StringNode($$[$0], this._$), this._$);
  break;
  case 33:this.$ = new yy.PartialNameNode(new yy.NumberNode($$[$0], this._$));
  break;
  case 34:this.$ = new yy.DataNode($$[$0], this._$);
  break;
  case 35:this.$ = new yy.IdNode($$[$0], this._$);
  break;
  case 36: $$[$0-2].push({part: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
  break;
  case 37:this.$ = [{part: $$[$0]}];
  break;
  case 38:this.$ = [];
  break;
  case 39:$$[$0-1].push($$[$0]);
  break;
  case 48:this.$ = [];
  break;
  case 49:$$[$0-1].push($$[$0]);
  break;
  case 52:this.$ = [$$[$0]];
  break;
  case 53:$$[$0-1].push($$[$0]);
  break;
  }
  },
  table: [{3:1,4:2,5:[2,38],6:3,12:[2,38],13:[2,38],16:[2,38],24:[2,38],26:[2,38],31:[2,38],32:[2,38],34:[2,38]},{1:[3]},{5:[1,4]},{5:[2,2],7:5,8:6,9:7,10:8,11:9,12:[1,10],13:[1,11],14:16,16:[1,20],19:14,22:15,24:[1,18],26:[1,19],28:[2,2],29:[2,2],31:[1,12],32:[1,13],34:[1,17]},{1:[2,1]},{5:[2,39],12:[2,39],13:[2,39],16:[2,39],24:[2,39],26:[2,39],28:[2,39],29:[2,39],31:[2,39],32:[2,39],34:[2,39]},{5:[2,3],12:[2,3],13:[2,3],16:[2,3],24:[2,3],26:[2,3],28:[2,3],29:[2,3],31:[2,3],32:[2,3],34:[2,3]},{5:[2,4],12:[2,4],13:[2,4],16:[2,4],24:[2,4],26:[2,4],28:[2,4],29:[2,4],31:[2,4],32:[2,4],34:[2,4]},{5:[2,5],12:[2,5],13:[2,5],16:[2,5],24:[2,5],26:[2,5],28:[2,5],29:[2,5],31:[2,5],32:[2,5],34:[2,5]},{5:[2,6],12:[2,6],13:[2,6],16:[2,6],24:[2,6],26:[2,6],28:[2,6],29:[2,6],31:[2,6],32:[2,6],34:[2,6]},{5:[2,7],12:[2,7],13:[2,7],16:[2,7],24:[2,7],26:[2,7],28:[2,7],29:[2,7],31:[2,7],32:[2,7],34:[2,7]},{5:[2,8],12:[2,8],13:[2,8],16:[2,8],24:[2,8],26:[2,8],28:[2,8],29:[2,8],31:[2,8],32:[2,8],34:[2,8]},{17:21,30:22,41:23,50:[1,26],52:[1,25],53:24},{17:27,30:22,41:23,50:[1,26],52:[1,25],53:24},{4:28,6:3,12:[2,38],13:[2,38],16:[2,38],24:[2,38],26:[2,38],28:[2,38],29:[2,38],31:[2,38],32:[2,38],34:[2,38]},{4:29,6:3,12:[2,38],13:[2,38],16:[2,38],24:[2,38],26:[2,38],28:[2,38],29:[2,38],31:[2,38],32:[2,38],34:[2,38]},{12:[1,30]},{30:32,35:31,42:[1,33],43:[1,34],50:[1,26],53:24},{17:35,30:22,41:23,50:[1,26],52:[1,25],53:24},{17:36,30:22,41:23,50:[1,26],52:[1,25],53:24},{17:37,30:22,41:23,50:[1,26],52:[1,25],53:24},{25:[1,38]},{18:[2,48],25:[2,48],33:[2,48],39:39,42:[2,48],43:[2,48],44:[2,48],45:[2,48],46:[2,48],50:[2,48],52:[2,48]},{18:[2,22],25:[2,22],33:[2,22],46:[2,22]},{18:[2,35],25:[2,35],33:[2,35],42:[2,35],43:[2,35],44:[2,35],45:[2,35],46:[2,35],50:[2,35],52:[2,35],54:[1,40]},{30:41,50:[1,26],53:24},{18:[2,37],25:[2,37],33:[2,37],42:[2,37],43:[2,37],44:[2,37],45:[2,37],46:[2,37],50:[2,37],52:[2,37],54:[2,37]},{33:[1,42]},{20:43,27:44,28:[1,45],29:[2,40]},{23:46,27:47,28:[1,45],29:[2,42]},{15:[1,48]},{25:[2,46],30:51,36:49,38:50,41:55,42:[1,52],43:[1,53],44:[1,54],45:[1,56],47:57,48:58,49:60,50:[1,59],52:[1,25],53:24},{25:[2,31],42:[2,31],43:[2,31],44:[2,31],45:[2,31],50:[2,31],52:[2,31]},{25:[2,32],42:[2,32],43:[2,32],44:[2,32],45:[2,32],50:[2,32],52:[2,32]},{25:[2,33],42:[2,33],43:[2,33],44:[2,33],45:[2,33],50:[2,33],52:[2,33]},{25:[1,61]},{25:[1,62]},{18:[1,63]},{5:[2,17],12:[2,17],13:[2,17],16:[2,17],24:[2,17],26:[2,17],28:[2,17],29:[2,17],31:[2,17],32:[2,17],34:[2,17]},{18:[2,50],25:[2,50],30:51,33:[2,50],36:65,40:64,41:55,42:[1,52],43:[1,53],44:[1,54],45:[1,56],46:[2,50],47:66,48:58,49:60,50:[1,59],52:[1,25],53:24},{50:[1,67]},{18:[2,34],25:[2,34],33:[2,34],42:[2,34],43:[2,34],44:[2,34],45:[2,34],46:[2,34],50:[2,34],52:[2,34]},{5:[2,18],12:[2,18],13:[2,18],16:[2,18],24:[2,18],26:[2,18],28:[2,18],29:[2,18],31:[2,18],32:[2,18],34:[2,18]},{21:68,29:[1,69]},{29:[2,41]},{4:70,6:3,12:[2,38],13:[2,38],16:[2,38],24:[2,38],26:[2,38],29:[2,38],31:[2,38],32:[2,38],34:[2,38]},{21:71,29:[1,69]},{29:[2,43]},{5:[2,9],12:[2,9],13:[2,9],16:[2,9],24:[2,9],26:[2,9],28:[2,9],29:[2,9],31:[2,9],32:[2,9],34:[2,9]},{25:[2,44],37:72,47:73,48:58,49:60,50:[1,74]},{25:[1,75]},{18:[2,23],25:[2,23],33:[2,23],42:[2,23],43:[2,23],44:[2,23],45:[2,23],46:[2,23],50:[2,23],52:[2,23]},{18:[2,24],25:[2,24],33:[2,24],42:[2,24],43:[2,24],44:[2,24],45:[2,24],46:[2,24],50:[2,24],52:[2,24]},{18:[2,25],25:[2,25],33:[2,25],42:[2,25],43:[2,25],44:[2,25],45:[2,25],46:[2,25],50:[2,25],52:[2,25]},{18:[2,26],25:[2,26],33:[2,26],42:[2,26],43:[2,26],44:[2,26],45:[2,26],46:[2,26],50:[2,26],52:[2,26]},{18:[2,27],25:[2,27],33:[2,27],42:[2,27],43:[2,27],44:[2,27],45:[2,27],46:[2,27],50:[2,27],52:[2,27]},{17:76,30:22,41:23,50:[1,26],52:[1,25],53:24},{25:[2,47]},{18:[2,29],25:[2,29],33:[2,29],46:[2,29],49:77,50:[1,74]},{18:[2,37],25:[2,37],33:[2,37],42:[2,37],43:[2,37],44:[2,37],45:[2,37],46:[2,37],50:[2,37],51:[1,78],52:[2,37],54:[2,37]},{18:[2,52],25:[2,52],33:[2,52],46:[2,52],50:[2,52]},{12:[2,13],13:[2,13],16:[2,13],24:[2,13],26:[2,13],28:[2,13],29:[2,13],31:[2,13],32:[2,13],34:[2,13]},{12:[2,14],13:[2,14],16:[2,14],24:[2,14],26:[2,14],28:[2,14],29:[2,14],31:[2,14],32:[2,14],34:[2,14]},{12:[2,10]},{18:[2,21],25:[2,21],33:[2,21],46:[2,21]},{18:[2,49],25:[2,49],33:[2,49],42:[2,49],43:[2,49],44:[2,49],45:[2,49],46:[2,49],50:[2,49],52:[2,49]},{18:[2,51],25:[2,51],33:[2,51],46:[2,51]},{18:[2,36],25:[2,36],33:[2,36],42:[2,36],43:[2,36],44:[2,36],45:[2,36],46:[2,36],50:[2,36],52:[2,36],54:[2,36]},{5:[2,11],12:[2,11],13:[2,11],16:[2,11],24:[2,11],26:[2,11],28:[2,11],29:[2,11],31:[2,11],32:[2,11],34:[2,11]},{30:79,50:[1,26],53:24},{29:[2,15]},{5:[2,12],12:[2,12],13:[2,12],16:[2,12],24:[2,12],26:[2,12],28:[2,12],29:[2,12],31:[2,12],32:[2,12],34:[2,12]},{25:[1,80]},{25:[2,45]},{51:[1,78]},{5:[2,20],12:[2,20],13:[2,20],16:[2,20],24:[2,20],26:[2,20],28:[2,20],29:[2,20],31:[2,20],32:[2,20],34:[2,20]},{46:[1,81]},{18:[2,53],25:[2,53],33:[2,53],46:[2,53],50:[2,53]},{30:51,36:82,41:55,42:[1,52],43:[1,53],44:[1,54],45:[1,56],50:[1,26],52:[1,25],53:24},{25:[1,83]},{5:[2,19],12:[2,19],13:[2,19],16:[2,19],24:[2,19],26:[2,19],28:[2,19],29:[2,19],31:[2,19],32:[2,19],34:[2,19]},{18:[2,28],25:[2,28],33:[2,28],42:[2,28],43:[2,28],44:[2,28],45:[2,28],46:[2,28],50:[2,28],52:[2,28]},{18:[2,30],25:[2,30],33:[2,30],46:[2,30],50:[2,30]},{5:[2,16],12:[2,16],13:[2,16],16:[2,16],24:[2,16],26:[2,16],28:[2,16],29:[2,16],31:[2,16],32:[2,16],34:[2,16]}],
  defaultActions: {4:[2,1],44:[2,41],47:[2,43],57:[2,47],63:[2,10],70:[2,15],73:[2,45]},
  parseError: function parseError(str, hash) {
      throw new Error(str);
  },
  parse: function parse(input) {
      var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      this.yy.parser = this;
      if (typeof this.lexer.yylloc == "undefined")
          this.lexer.yylloc = {};
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      var ranges = this.lexer.options && this.lexer.options.ranges;
      if (typeof this.yy.parseError === "function")
          this.parseError = this.yy.parseError;
      function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
      }
      function lex() {
          var token;
          token = self.lexer.lex() || 1;
          if (typeof token !== "number") {
              token = self.symbols_[token] || token;
          }
          return token;
      }
      var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
      while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
              action = this.defaultActions[state];
          } else {
              if (symbol === null || typeof symbol == "undefined") {
                  symbol = lex();
              }
              action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
              var errStr = "";
              if (!recovering) {
                  expected = [];
                  for (p in table[state])
                      if (this.terminals_[p] && p > 2) {
                          expected.push("'" + this.terminals_[p] + "'");
                      }
                  if (this.lexer.showPosition) {
                      errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                  } else {
                      errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                  }
                  this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
              }
          }
          if (action[0] instanceof Array && action.length > 1) {
              throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
          case 1:
              stack.push(symbol);
              vstack.push(this.lexer.yytext);
              lstack.push(this.lexer.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                  yyleng = this.lexer.yyleng;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  yyloc = this.lexer.yylloc;
                  if (recovering > 0)
                      recovering--;
              } else {
                  symbol = preErrorSymbol;
                  preErrorSymbol = null;
              }
              break;
          case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
              if (ranges) {
                  yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
              if (typeof r !== "undefined") {
                  return r;
              }
              if (len) {
                  stack = stack.slice(0, -1 * len * 2);
                  vstack = vstack.slice(0, -1 * len);
                  lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
          case 3:
              return true;
          }
      }
      return true;
  }
  };
  /* Jison generated lexer */
  var lexer = (function(){
  var lexer = ({EOF:1,
  parseError:function parseError(str, hash) {
          if (this.yy.parser) {
              this.yy.parser.parseError(str, hash);
          } else {
              throw new Error(str);
          }
      },
  setInput:function (input) {
          this._input = input;
          this._more = this._less = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = '';
          this.conditionStack = ['INITIAL'];
          this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
          if (this.options.ranges) this.yylloc.range = [0,0];
          this.offset = 0;
          return this;
      },
  input:function () {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
              this.yylineno++;
              this.yylloc.last_line++;
          } else {
              this.yylloc.last_column++;
          }
          if (this.options.ranges) this.yylloc.range[1]++;

          this._input = this._input.slice(1);
          return ch;
      },
  unput:function (ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);

          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
          //this.yyleng -= len;
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length-1);
          this.matched = this.matched.substr(0, this.matched.length-1);

          if (lines.length-1) this.yylineno -= lines.length-1;
          var r = this.yylloc.range;

          this.yylloc = {first_line: this.yylloc.first_line,
            last_line: this.yylineno+1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
                this.yylloc.first_column - len
            };

          if (this.options.ranges) {
              this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          return this;
      },
  more:function () {
          this._more = true;
          return this;
      },
  less:function (n) {
          this.unput(this.match.slice(n));
      },
  pastInput:function () {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
      },
  upcomingInput:function () {
          var next = this.match;
          if (next.length < 20) {
              next += this._input.substr(0, 20-next.length);
          }
          return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
      },
  showPosition:function () {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + "\n" + c+"^";
      },
  next:function () {
          if (this.done) {
              return this.EOF;
          }
          if (!this._input) this.done = true;

          var token,
              match,
              tempMatch,
              index,
              col,
              lines;
          if (!this._more) {
              this.yytext = '';
              this.match = '';
          }
          var rules = this._currentRules();
          for (var i=0;i < rules.length; i++) {
              tempMatch = this._input.match(this.rules[rules[i]]);
              if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                  match = tempMatch;
                  index = i;
                  if (!this.options.flex) break;
              }
          }
          if (match) {
              lines = match[0].match(/(?:\r\n?|\n).*/g);
              if (lines) this.yylineno += lines.length;
              this.yylloc = {first_line: this.yylloc.last_line,
                             last_line: this.yylineno+1,
                             first_column: this.yylloc.last_column,
                             last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
              this.yytext += match[0];
              this.match += match[0];
              this.matches = match;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                  this.yylloc.range = [this.offset, this.offset += this.yyleng];
              }
              this._more = false;
              this._input = this._input.slice(match[0].length);
              this.matched += match[0];
              token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
              if (this.done && this._input) this.done = false;
              if (token) return token;
              else return;
          }
          if (this._input === "") {
              return this.EOF;
          } else {
              return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                      {text: "", token: null, line: this.yylineno});
          }
      },
  lex:function lex() {
          var r = this.next();
          if (typeof r !== 'undefined') {
              return r;
          } else {
              return this.lex();
          }
      },
  begin:function begin(condition) {
          this.conditionStack.push(condition);
      },
  popState:function popState() {
          return this.conditionStack.pop();
      },
  _currentRules:function _currentRules() {
          return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
      },
  topState:function () {
          return this.conditionStack[this.conditionStack.length-2];
      },
  pushState:function begin(condition) {
          this.begin(condition);
      }});
  lexer.options = {};
  lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {


  function strip(start, end) {
    return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
  }


  var YYSTATE=YY_START
  switch($avoiding_name_collisions) {
  case 0:
                                     if(yy_.yytext.slice(-2) === "\\\\") {
                                       strip(0,1);
                                       this.begin("mu");
                                     } else if(yy_.yytext.slice(-1) === "\\") {
                                       strip(0,1);
                                       this.begin("emu");
                                     } else {
                                       this.begin("mu");
                                     }
                                     if(yy_.yytext) return 12;
                                   
  break;
  case 1:return 12;
  break;
  case 2:
                                     this.popState();
                                     return 12;
                                   
  break;
  case 3:
                                    yy_.yytext = yy_.yytext.substr(5, yy_.yyleng-9);
                                    this.popState();
                                    return 15;
                                   
  break;
  case 4: return 12; 
  break;
  case 5:strip(0,4); this.popState(); return 13;
  break;
  case 6:return 45;
  break;
  case 7:return 46;
  break;
  case 8: return 16; 
  break;
  case 9:
                                    this.popState();
                                    this.begin('raw');
                                    return 18;
                                   
  break;
  case 10:return 34;
  break;
  case 11:return 24;
  break;
  case 12:return 29;
  break;
  case 13:this.popState(); return 28;
  break;
  case 14:this.popState(); return 28;
  break;
  case 15:return 26;
  break;
  case 16:return 26;
  break;
  case 17:return 32;
  break;
  case 18:return 31;
  break;
  case 19:this.popState(); this.begin('com');
  break;
  case 20:strip(3,5); this.popState(); return 13;
  break;
  case 21:return 31;
  break;
  case 22:return 51;
  break;
  case 23:return 50;
  break;
  case 24:return 50;
  break;
  case 25:return 54;
  break;
  case 26:// ignore whitespace
  break;
  case 27:this.popState(); return 33;
  break;
  case 28:this.popState(); return 25;
  break;
  case 29:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 42;
  break;
  case 30:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 42;
  break;
  case 31:return 52;
  break;
  case 32:return 44;
  break;
  case 33:return 44;
  break;
  case 34:return 43;
  break;
  case 35:return 50;
  break;
  case 36:yy_.yytext = strip(1,2); return 50;
  break;
  case 37:return 'INVALID';
  break;
  case 38:return 5;
  break;
  }
  };
  lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/,/^(?:[^\x00]*?(?=(\{\{\{\{\/)))/,/^(?:[\s\S]*?--\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{\{\{)/,/^(?:\}\}\}\})/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^\s*(~)?\}\})/,/^(?:\{\{(~)?\s*else\s*(~)?\}\})/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{!--)/,/^(?:\{\{![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];
  lexer.conditions = {"mu":{"rules":[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[5],"inclusive":false},"raw":{"rules":[3,4],"inclusive":false},"INITIAL":{"rules":[0,1,38],"inclusive":true}};
  return lexer;})()
  parser.lexer = lexer;
  function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
  return new Parser;
  })();__exports__ = handlebars;
  /* jshint ignore:end */
  return __exports__;
})();

// handlebars/compiler/helpers.js
var __module10__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;

  function stripFlags(open, close) {
    return {
      left: open.charAt(2) === '~',
      right: close.charAt(close.length-3) === '~'
    };
  }

  __exports__.stripFlags = stripFlags;
  function prepareBlock(mustache, program, inverseAndProgram, close, inverted, locInfo) {
    /*jshint -W040 */
    if (mustache.sexpr.id.original !== close.path.original) {
      throw new Exception(mustache.sexpr.id.original + ' doesn\'t match ' + close.path.original, mustache);
    }

    var inverse = inverseAndProgram && inverseAndProgram.program;

    var strip = {
      left: mustache.strip.left,
      right: close.strip.right,

      // Determine the standalone candiacy. Basically flag our content as being possibly standalone
      // so our parent can determine if we actually are standalone
      openStandalone: isNextWhitespace(program.statements),
      closeStandalone: isPrevWhitespace((inverse || program).statements)
    };

    if (mustache.strip.right) {
      omitRight(program.statements, null, true);
    }

    if (inverse) {
      var inverseStrip = inverseAndProgram.strip;

      if (inverseStrip.left) {
        omitLeft(program.statements, null, true);
      }
      if (inverseStrip.right) {
        omitRight(inverse.statements, null, true);
      }
      if (close.strip.left) {
        omitLeft(inverse.statements, null, true);
      }

      // Find standalone else statments
      if (isPrevWhitespace(program.statements)
          && isNextWhitespace(inverse.statements)) {

        omitLeft(program.statements);
        omitRight(inverse.statements);
      }
    } else {
      if (close.strip.left) {
        omitLeft(program.statements, null, true);
      }
    }

    if (inverted) {
      return new this.BlockNode(mustache, inverse, program, strip, locInfo);
    } else {
      return new this.BlockNode(mustache, program, inverse, strip, locInfo);
    }
  }

  __exports__.prepareBlock = prepareBlock;
  function prepareProgram(statements, isRoot) {
    for (var i = 0, l = statements.length; i < l; i++) {
      var current = statements[i],
          strip = current.strip;

      if (!strip) {
        continue;
      }

      var _isPrevWhitespace = isPrevWhitespace(statements, i, isRoot, current.type === 'partial'),
          _isNextWhitespace = isNextWhitespace(statements, i, isRoot),

          openStandalone = strip.openStandalone && _isPrevWhitespace,
          closeStandalone = strip.closeStandalone && _isNextWhitespace,
          inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

      if (strip.right) {
        omitRight(statements, i, true);
      }
      if (strip.left) {
        omitLeft(statements, i, true);
      }

      if (inlineStandalone) {
        omitRight(statements, i);

        if (omitLeft(statements, i)) {
          // If we are on a standalone node, save the indent info for partials
          if (current.type === 'partial') {
            current.indent = (/([ \t]+$)/).exec(statements[i-1].original) ? RegExp.$1 : '';
          }
        }
      }
      if (openStandalone) {
        omitRight((current.program || current.inverse).statements);

        // Strip out the previous content node if it's whitespace only
        omitLeft(statements, i);
      }
      if (closeStandalone) {
        // Always strip the next node
        omitRight(statements, i);

        omitLeft((current.inverse || current.program).statements);
      }
    }

    return statements;
  }

  __exports__.prepareProgram = prepareProgram;function isPrevWhitespace(statements, i, isRoot) {
    if (i === undefined) {
      i = statements.length;
    }

    // Nodes that end with newlines are considered whitespace (but are special
    // cased for strip operations)
    var prev = statements[i-1],
        sibling = statements[i-2];
    if (!prev) {
      return isRoot;
    }

    if (prev.type === 'content') {
      return (sibling || !isRoot ? (/\r?\n\s*?$/) : (/(^|\r?\n)\s*?$/)).test(prev.original);
    }
  }
  function isNextWhitespace(statements, i, isRoot) {
    if (i === undefined) {
      i = -1;
    }

    var next = statements[i+1],
        sibling = statements[i+2];
    if (!next) {
      return isRoot;
    }

    if (next.type === 'content') {
      return (sibling || !isRoot ? (/^\s*?\r?\n/) : (/^\s*?(\r?\n|$)/)).test(next.original);
    }
  }

  // Marks the node to the right of the position as omitted.
  // I.e. {{foo}}' ' will mark the ' ' node as omitted.
  //
  // If i is undefined, then the first child will be marked as such.
  //
  // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
  // content is met.
  function omitRight(statements, i, multiple) {
    var current = statements[i == null ? 0 : i + 1];
    if (!current || current.type !== 'content' || (!multiple && current.rightStripped)) {
      return;
    }

    var original = current.string;
    current.string = current.string.replace(multiple ? (/^\s+/) : (/^[ \t]*\r?\n?/), '');
    current.rightStripped = current.string !== original;
  }

  // Marks the node to the left of the position as omitted.
  // I.e. ' '{{foo}} will mark the ' ' node as omitted.
  //
  // If i is undefined then the last child will be marked as such.
  //
  // If mulitple is truthy then all whitespace will be stripped out until non-whitespace
  // content is met.
  function omitLeft(statements, i, multiple) {
    var current = statements[i == null ? statements.length - 1 : i - 1];
    if (!current || current.type !== 'content' || (!multiple && current.leftStripped)) {
      return;
    }

    // We omit the last node if it's whitespace only and not preceeded by a non-content node.
    var original = current.string;
    current.string = current.string.replace(multiple ? (/\s+$/) : (/[ \t]+$/), '');
    current.leftStripped = current.string !== original;
    return current.leftStripped;
  }
  return __exports__;
})(__module5__);

// handlebars/compiler/base.js
var __module8__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
  "use strict";
  var __exports__ = {};
  var parser = __dependency1__;
  var AST = __dependency2__;
  var Helpers = __dependency3__;
  var extend = __dependency4__.extend;

  __exports__.parser = parser;

  var yy = {};
  extend(yy, Helpers, AST);

  function parse(input) {
    // Just return if an already-compile AST was passed in.
    if (input.constructor === AST.ProgramNode) { return input; }

    parser.yy = yy;

    return parser.parse(input);
  }

  __exports__.parse = parse;
  return __exports__;
})(__module9__, __module7__, __module10__, __module3__);

// handlebars/compiler/compiler.js
var __module11__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;
  var isArray = __dependency2__.isArray;

  var slice = [].slice;

  function Compiler() {}

  __exports__.Compiler = Compiler;// the foundHelper register will disambiguate helper lookup from finding a
  // function in a context. This is necessary for mustache compatibility, which
  // requires that context functions in blocks are evaluated by blockHelperMissing,
  // and then proceed as if the resulting value was provided to blockHelperMissing.

  Compiler.prototype = {
    compiler: Compiler,

    equals: function(other) {
      var len = this.opcodes.length;
      if (other.opcodes.length !== len) {
        return false;
      }

      for (var i = 0; i < len; i++) {
        var opcode = this.opcodes[i],
            otherOpcode = other.opcodes[i];
        if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) {
          return false;
        }
      }

      // We know that length is the same between the two arrays because they are directly tied
      // to the opcode behavior above.
      len = this.children.length;
      for (i = 0; i < len; i++) {
        if (!this.children[i].equals(other.children[i])) {
          return false;
        }
      }

      return true;
    },

    guid: 0,

    compile: function(program, options) {
      this.opcodes = [];
      this.children = [];
      this.depths = {list: []};
      this.options = options;
      this.stringParams = options.stringParams;
      this.trackIds = options.trackIds;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true,
        'lookup': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.accept(program);
    },

    accept: function(node) {
      return this[node.type](node);
    },

    program: function(program) {
      var statements = program.statements;

      for(var i=0, l=statements.length; i<l; i++) {
        this.accept(statements[i]);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++, depth;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache,
          program = block.program,
          inverse = block.inverse;

      if (program) {
        program = this.compileProgram(program);
      }

      if (inverse) {
        inverse = this.compileProgram(inverse);
      }

      var sexpr = mustache.sexpr;
      var type = this.classifySexpr(sexpr);

      if (type === "helper") {
        this.helperSexpr(sexpr, program, inverse);
      } else if (type === "simple") {
        this.simpleSexpr(sexpr);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('blockValue', sexpr.id.original);
      } else {
        this.ambiguousSexpr(sexpr, program, inverse);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('ambiguousBlockValue');
      }

      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, i, l;

      this.opcode('pushHash');

      for(i=0, l=pairs.length; i<l; i++) {
        this.pushParam(pairs[i][1]);
      }
      while(i--) {
        this.opcode('assignToHash', pairs[i][0]);
      }
      this.opcode('popHash');
    },

    partial: function(partial) {
      var partialName = partial.partialName;
      this.usePartial = true;

      if (partial.hash) {
        this.accept(partial.hash);
      } else {
        this.opcode('push', 'undefined');
      }

      if (partial.context) {
        this.accept(partial.context);
      } else {
        this.opcode('getContext', 0);
        this.opcode('pushContext');
      }

      this.opcode('invokePartial', partialName.name, partial.indent || '');
      this.opcode('append');
    },

    content: function(content) {
      if (content.string) {
        this.opcode('appendContent', content.string);
      }
    },

    mustache: function(mustache) {
      this.sexpr(mustache.sexpr);

      if(mustache.escaped && !this.options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ambiguousSexpr: function(sexpr, program, inverse) {
      var id = sexpr.id,
          name = id.parts[0],
          isBlock = program != null || inverse != null;

      this.opcode('getContext', id.depth);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      this.ID(id);

      this.opcode('invokeAmbiguous', name, isBlock);
    },

    simpleSexpr: function(sexpr) {
      var id = sexpr.id;

      if (id.type === 'DATA') {
        this.DATA(id);
      } else if (id.parts.length) {
        this.ID(id);
      } else {
        // Simplified ID for `this`
        this.addDepth(id.depth);
        this.opcode('getContext', id.depth);
        this.opcode('pushContext');
      }

      this.opcode('resolvePossibleLambda');
    },

    helperSexpr: function(sexpr, program, inverse) {
      var params = this.setupFullMustacheParams(sexpr, program, inverse),
          id = sexpr.id,
          name = id.parts[0];

      if (this.options.knownHelpers[name]) {
        this.opcode('invokeKnownHelper', params.length, name);
      } else if (this.options.knownHelpersOnly) {
        throw new Exception("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
      } else {
        id.falsy = true;

        this.ID(id);
        this.opcode('invokeHelper', params.length, id.original, id.isSimple);
      }
    },

    sexpr: function(sexpr) {
      var type = this.classifySexpr(sexpr);

      if (type === "simple") {
        this.simpleSexpr(sexpr);
      } else if (type === "helper") {
        this.helperSexpr(sexpr);
      } else {
        this.ambiguousSexpr(sexpr);
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);
      this.opcode('getContext', id.depth);

      var name = id.parts[0];
      if (!name) {
        // Context reference, i.e. `{{foo .}}` or `{{foo ..}}`
        this.opcode('pushContext');
      } else {
        this.opcode('lookupOnContext', id.parts, id.falsy, id.isScoped);
      }
    },

    DATA: function(data) {
      this.options.data = true;
      this.opcode('lookupData', data.id.depth, data.id.parts);
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    NUMBER: function(number) {
      this.opcode('pushLiteral', number.number);
    },

    BOOLEAN: function(bool) {
      this.opcode('pushLiteral', bool.bool);
    },

    comment: function() {},

    // HELPERS
    opcode: function(name) {
      this.opcodes.push({ opcode: name, args: slice.call(arguments, 1) });
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    classifySexpr: function(sexpr) {
      var isHelper   = sexpr.isHelper;
      var isEligible = sexpr.eligibleHelper;
      var options    = this.options;

      // if ambiguous, we can possibly resolve the ambiguity now
      // An eligible helper is one that does not have a complex path, i.e. `this.foo`, `../foo` etc.
      if (isEligible && !isHelper) {
        var name = sexpr.id.parts[0];

        if (options.knownHelpers[name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }

      if (isHelper) { return "helper"; }
      else if (isEligible) { return "ambiguous"; }
      else { return "simple"; }
    },

    pushParams: function(params) {
      for(var i=0, l=params.length; i<l; i++) {
        this.pushParam(params[i]);
      }
    },

    pushParam: function(val) {
      if (this.stringParams) {
        if(val.depth) {
          this.addDepth(val.depth);
        }
        this.opcode('getContext', val.depth || 0);
        this.opcode('pushStringParam', val.stringModeValue, val.type);

        if (val.type === 'sexpr') {
          // Subexpressions get evaluated and passed in
          // in string params mode.
          this.sexpr(val);
        }
      } else {
        if (this.trackIds) {
          this.opcode('pushId', val.type, val.idName || val.stringModeValue);
        }
        this.accept(val);
      }
    },

    setupFullMustacheParams: function(sexpr, program, inverse) {
      var params = sexpr.params;
      this.pushParams(params);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      if (sexpr.hash) {
        this.hash(sexpr.hash);
      } else {
        this.opcode('emptyHash');
      }

      return params;
    }
  };

  function precompile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
    }

    options = options || {};
    if (!('data' in options)) {
      options.data = true;
    }
    if (options.compat) {
      options.useDepths = true;
    }

    var ast = env.parse(input);
    var environment = new env.Compiler().compile(ast, options);
    return new env.JavaScriptCompiler().compile(environment, options);
  }

  __exports__.precompile = precompile;function compile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
    }

    options = options || {};

    if (!('data' in options)) {
      options.data = true;
    }
    if (options.compat) {
      options.useDepths = true;
    }

    var compiled;

    function compileInput() {
      var ast = env.parse(input);
      var environment = new env.Compiler().compile(ast, options);
      var templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
      return env.template(templateSpec);
    }

    // Template is only compiled on first use and cached after that point.
    var ret = function(context, options) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled.call(this, context, options);
    };
    ret._setup = function(options) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled._setup(options);
    };
    ret._child = function(i, data, depths) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled._child(i, data, depths);
    };
    return ret;
  }

  __exports__.compile = compile;function argEquals(a, b) {
    if (a === b) {
      return true;
    }

    if (isArray(a) && isArray(b) && a.length === b.length) {
      for (var i = 0; i < a.length; i++) {
        if (!argEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
  }
  return __exports__;
})(__module5__, __module3__);

// handlebars/compiler/javascript-compiler.js
var __module12__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__;
  var COMPILER_REVISION = __dependency1__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency1__.REVISION_CHANGES;
  var Exception = __dependency2__;

  function Literal(value) {
    this.value = value;
  }

  function JavaScriptCompiler() {}

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name /* , type*/) {
      if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
        return parent + "." + name;
      } else {
        return parent + "['" + name + "']";
      }
    },
    depthedLookup: function(name) {
      this.aliases.lookup = 'this.lookup';

      return 'lookup(depths, "' + name + '")';
    },

    compilerInfo: function() {
      var revision = COMPILER_REVISION,
          versions = REVISION_CHANGES[revision];
      return [revision, versions];
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return {
          appendToBuffer: true,
          content: string,
          toString: function() { return "buffer += " + string + ";"; }
        };
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options;
      this.stringParams = this.options.stringParams;
      this.trackIds = this.options.trackIds;
      this.precompile = !asObject;

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        environments: []
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.aliases = {};
      this.registers = { list: [] };
      this.hashes = [];
      this.compileStack = [];
      this.inlineStack = [];

      this.compileChildren(environment, options);

      this.useDepths = this.useDepths || environment.depths.list.length || this.options.compat;

      var opcodes = environment.opcodes,
          opcode,
          i,
          l;

      for (i = 0, l = opcodes.length; i < l; i++) {
        opcode = opcodes[i];

        this[opcode.opcode].apply(this, opcode.args);
      }

      // Flush any trailing content that might be pending.
      this.pushSource('');

      /* istanbul ignore next */
      if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
        throw new Exception('Compile completed with content left on stack');
      }

      var fn = this.createFunctionContext(asObject);
      if (!this.isChild) {
        var ret = {
          compiler: this.compilerInfo(),
          main: fn
        };
        var programs = this.context.programs;
        for (i = 0, l = programs.length; i < l; i++) {
          if (programs[i]) {
            ret[i] = programs[i];
          }
        }

        if (this.environment.usePartial) {
          ret.usePartial = true;
        }
        if (this.options.data) {
          ret.useData = true;
        }
        if (this.useDepths) {
          ret.useDepths = true;
        }
        if (this.options.compat) {
          ret.compat = true;
        }

        if (!asObject) {
          ret.compiler = JSON.stringify(ret.compiler);
          ret = this.objectLiteral(ret);
        }

        return ret;
      } else {
        return fn;
      }
    },

    preamble: function() {
      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = [];
    },

    createFunctionContext: function(asObject) {
      var varDeclarations = '';

      var locals = this.stackVars.concat(this.registers.list);
      if(locals.length > 0) {
        varDeclarations += ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      for (var alias in this.aliases) {
        if (this.aliases.hasOwnProperty(alias)) {
          varDeclarations += ', ' + alias + '=' + this.aliases[alias];
        }
      }

      var params = ["depth0", "helpers", "partials", "data"];

      if (this.useDepths) {
        params.push('depths');
      }

      // Perform a second pass over the output to merge content when possible
      var source = this.mergeSource(varDeclarations);

      if (asObject) {
        params.push(source);

        return Function.apply(this, params);
      } else {
        return 'function(' + params.join(',') + ') {\n  ' + source + '}';
      }
    },
    mergeSource: function(varDeclarations) {
      var source = '',
          buffer,
          appendOnly = !this.forceBuffer,
          appendFirst;

      for (var i = 0, len = this.source.length; i < len; i++) {
        var line = this.source[i];
        if (line.appendToBuffer) {
          if (buffer) {
            buffer = buffer + '\n    + ' + line.content;
          } else {
            buffer = line.content;
          }
        } else {
          if (buffer) {
            if (!source) {
              appendFirst = true;
              source = buffer + ';\n  ';
            } else {
              source += 'buffer += ' + buffer + ';\n  ';
            }
            buffer = undefined;
          }
          source += line + '\n  ';

          if (!this.environment.isSimple) {
            appendOnly = false;
          }
        }
      }

      if (appendOnly) {
        if (buffer || !source) {
          source += 'return ' + (buffer || '""') + ';\n';
        }
      } else {
        varDeclarations += ", buffer = " + (appendFirst ? '' : this.initializeBuffer());
        if (buffer) {
          source += 'return buffer + ' + buffer + ';\n';
        } else {
          source += 'return buffer;\n';
        }
      }

      if (varDeclarations) {
        source = 'var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n  ') + source;
      }

      return source;
    },

    // [blockValue]
    //
    // On stack, before: hash, inverse, program, value
    // On stack, after: return value of blockHelperMissing
    //
    // The purpose of this opcode is to take a block of the form
    // `{{#this.foo}}...{{/this.foo}}`, resolve the value of `foo`, and
    // replace it on the stack with the result of properly
    // invoking blockHelperMissing.
    blockValue: function(name) {
      this.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = [this.contextName(0)];
      this.setupParams(name, 0, params);

      var blockName = this.popStack();
      params.splice(1, 0, blockName);

      this.push('blockHelperMissing.call(' + params.join(', ') + ')');
    },

    // [ambiguousBlockValue]
    //
    // On stack, before: hash, inverse, program, value
    // Compiler value, before: lastHelper=value of last found helper, if any
    // On stack, after, if no lastHelper: same as [blockValue]
    // On stack, after, if lastHelper: value
    ambiguousBlockValue: function() {
      this.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      // We're being a bit cheeky and reusing the options value from the prior exec
      var params = [this.contextName(0)];
      this.setupParams('', 0, params, true);

      this.flushInline();

      var current = this.topStack();
      params.splice(1, 0, current);

      this.pushSource("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
    },

    // [appendContent]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Appends the string value of `content` to the current buffer
    appendContent: function(content) {
      if (this.pendingContent) {
        content = this.pendingContent + content;
      }

      this.pendingContent = content;
    },

    // [append]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Coerces `value` to a String and appends it to the current buffer.
    //
    // If `value` is truthy, or 0, it is coerced into a string and appended
    // Otherwise, the empty string is appended
    append: function() {
      // Force anything that is inlined onto the stack so we don't have duplication
      // when we examine local
      this.flushInline();
      var local = this.popStack();
      this.pushSource('if (' + local + ' != null) { ' + this.appendToBuffer(local) + ' }');
      if (this.environment.isSimple) {
        this.pushSource("else { " + this.appendToBuffer("''") + " }");
      }
    },

    // [appendEscaped]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Escape `value` and append it to the buffer
    appendEscaped: function() {
      this.aliases.escapeExpression = 'this.escapeExpression';

      this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
    },

    // [getContext]
    //
    // On stack, before: ...
    // On stack, after: ...
    // Compiler value, after: lastContext=depth
    //
    // Set the value of the `lastContext` compiler value to the depth
    getContext: function(depth) {
      this.lastContext = depth;
    },

    // [pushContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext, ...
    //
    // Pushes the value of the current context onto the stack.
    pushContext: function() {
      this.pushStackLiteral(this.contextName(this.lastContext));
    },

    // [lookupOnContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext[name], ...
    //
    // Looks up the value of `name` on the current context and pushes
    // it onto the stack.
    lookupOnContext: function(parts, falsy, scoped) {
      /*jshint -W083 */
      var i = 0,
          len = parts.length;

      if (!scoped && this.options.compat && !this.lastContext) {
        // The depthed query is expected to handle the undefined logic for the root level that
        // is implemented below, so we evaluate that directly in compat mode
        this.push(this.depthedLookup(parts[i++]));
      } else {
        this.pushContext();
      }

      for (; i < len; i++) {
        this.replaceStack(function(current) {
          var lookup = this.nameLookup(current, parts[i], 'context');
          // We want to ensure that zero and false are handled properly if the context (falsy flag)
          // needs to have the special handling for these values.
          if (!falsy) {
            return ' != null ? ' + lookup + ' : ' + current;
          } else {
            // Otherwise we can use generic falsy handling
            return ' && ' + lookup;
          }
        });
      }
    },

    // [lookupData]
    //
    // On stack, before: ...
    // On stack, after: data, ...
    //
    // Push the data lookup operator
    lookupData: function(depth, parts) {
      /*jshint -W083 */
      if (!depth) {
        this.pushStackLiteral('data');
      } else {
        this.pushStackLiteral('this.data(data, ' + depth + ')');
      }

      var len = parts.length;
      for (var i = 0; i < len; i++) {
        this.replaceStack(function(current) {
          return ' && ' + this.nameLookup(current, parts[i], 'data');
        });
      }
    },

    // [resolvePossibleLambda]
    //
    // On stack, before: value, ...
    // On stack, after: resolved value, ...
    //
    // If the `value` is a lambda, replace it on the stack by
    // the return value of the lambda
    resolvePossibleLambda: function() {
      this.aliases.lambda = 'this.lambda';

      this.push('lambda(' + this.popStack() + ', ' + this.contextName(0) + ')');
    },

    // [pushStringParam]
    //
    // On stack, before: ...
    // On stack, after: string, currentContext, ...
    //
    // This opcode is designed for use in string mode, which
    // provides the string value of a parameter along with its
    // depth rather than resolving it immediately.
    pushStringParam: function(string, type) {
      this.pushContext();
      this.pushString(type);

      // If it's a subexpression, the string result
      // will be pushed after this opcode.
      if (type !== 'sexpr') {
        if (typeof string === 'string') {
          this.pushString(string);
        } else {
          this.pushStackLiteral(string);
        }
      }
    },

    emptyHash: function() {
      this.pushStackLiteral('{}');

      if (this.trackIds) {
        this.push('{}'); // hashIds
      }
      if (this.stringParams) {
        this.push('{}'); // hashContexts
        this.push('{}'); // hashTypes
      }
    },
    pushHash: function() {
      if (this.hash) {
        this.hashes.push(this.hash);
      }
      this.hash = {values: [], types: [], contexts: [], ids: []};
    },
    popHash: function() {
      var hash = this.hash;
      this.hash = this.hashes.pop();

      if (this.trackIds) {
        this.push('{' + hash.ids.join(',') + '}');
      }
      if (this.stringParams) {
        this.push('{' + hash.contexts.join(',') + '}');
        this.push('{' + hash.types.join(',') + '}');
      }

      this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
    },

    // [pushString]
    //
    // On stack, before: ...
    // On stack, after: quotedString(string), ...
    //
    // Push a quoted version of `string` onto the stack
    pushString: function(string) {
      this.pushStackLiteral(this.quotedString(string));
    },

    // [push]
    //
    // On stack, before: ...
    // On stack, after: expr, ...
    //
    // Push an expression onto the stack
    push: function(expr) {
      this.inlineStack.push(expr);
      return expr;
    },

    // [pushLiteral]
    //
    // On stack, before: ...
    // On stack, after: value, ...
    //
    // Pushes a value onto the stack. This operation prevents
    // the compiler from creating a temporary variable to hold
    // it.
    pushLiteral: function(value) {
      this.pushStackLiteral(value);
    },

    // [pushProgram]
    //
    // On stack, before: ...
    // On stack, after: program(guid), ...
    //
    // Push a program expression onto the stack. This takes
    // a compile-time guid and converts it into a runtime-accessible
    // expression.
    pushProgram: function(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },

    // [invokeHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // Pops off the helper's parameters, invokes the helper,
    // and pushes the helper's return value onto the stack.
    //
    // If the helper is not found, `helperMissing` is called.
    invokeHelper: function(paramSize, name, isSimple) {
      this.aliases.helperMissing = 'helpers.helperMissing';

      var nonHelper = this.popStack();
      var helper = this.setupHelper(paramSize, name);

      var lookup = (isSimple ? helper.name + ' || ' : '') + nonHelper + ' || helperMissing';
      this.push('((' + lookup + ').call(' + helper.callParams + '))');
    },

    // [invokeKnownHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // This operation is used when the helper is known to exist,
    // so a `helperMissing` fallback is not required.
    invokeKnownHelper: function(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.push(helper.name + ".call(" + helper.callParams + ")");
    },

    // [invokeAmbiguous]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of disambiguation
    //
    // This operation is used when an expression like `{{foo}}`
    // is provided, but we don't know at compile-time whether it
    // is a helper or a path.
    //
    // This operation emits more code than the other options,
    // and can be avoided by passing the `knownHelpers` and
    // `knownHelpersOnly` flags at compile-time.
    invokeAmbiguous: function(name, helperCall) {
      this.aliases.functionType = '"function"';
      this.aliases.helperMissing = 'helpers.helperMissing';
      this.useRegister('helper');

      var nonHelper = this.popStack();

      this.emptyHash();
      var helper = this.setupHelper(0, name, helperCall);

      var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

      this.push(
        '((helper = (helper = ' + helperName + ' || ' + nonHelper + ') != null ? helper : helperMissing'
          + (helper.paramsInit ? '),(' + helper.paramsInit : '') + '),'
        + '(typeof helper === functionType ? helper.call(' + helper.callParams + ') : helper))');
    },

    // [invokePartial]
    //
    // On stack, before: context, ...
    // On stack after: result of partial invocation
    //
    // This operation pops off a context, invokes a partial with that context,
    // and pushes the result of the invocation back.
    invokePartial: function(name, indent) {
      var params = [this.nameLookup('partials', name, 'partial'), "'" + indent + "'", "'" + name + "'", this.popStack(), this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      } else if (this.options.compat) {
        params.push('undefined');
      }
      if (this.options.compat) {
        params.push('depths');
      }

      this.push("this.invokePartial(" + params.join(", ") + ")");
    },

    // [assignToHash]
    //
    // On stack, before: value, ..., hash, ...
    // On stack, after: ..., hash, ...
    //
    // Pops a value off the stack and assigns it to the current hash
    assignToHash: function(key) {
      var value = this.popStack(),
          context,
          type,
          id;

      if (this.trackIds) {
        id = this.popStack();
      }
      if (this.stringParams) {
        type = this.popStack();
        context = this.popStack();
      }

      var hash = this.hash;
      if (context) {
        hash.contexts.push("'" + key + "': " + context);
      }
      if (type) {
        hash.types.push("'" + key + "': " + type);
      }
      if (id) {
        hash.ids.push("'" + key + "': " + id);
      }
      hash.values.push("'" + key + "': (" + value + ")");
    },

    pushId: function(type, name) {
      if (type === 'ID' || type === 'DATA') {
        this.pushString(name);
      } else if (type === 'sexpr') {
        this.pushStackLiteral('true');
      } else {
        this.pushStackLiteral('null');
      }
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        var index = this.matchExistingProgram(child);

        if (index == null) {
          this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
          index = this.context.programs.length;
          child.index = index;
          child.name = 'program' + index;
          this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
          this.context.environments[index] = child;

          this.useDepths = this.useDepths || compiler.useDepths;
        } else {
          child.index = index;
          child.name = 'program' + index;
        }
      }
    },
    matchExistingProgram: function(child) {
      for (var i = 0, len = this.context.environments.length; i < len; i++) {
        var environment = this.context.environments[i];
        if (environment && environment.equals(child)) {
          return i;
        }
      }
    },

    programExpression: function(guid) {
      var child = this.environment.children[guid],
          depths = child.depths.list,
          useDepths = this.useDepths,
          depth;

      var programParams = [child.index, 'data'];

      if (useDepths) {
        programParams.push('depths');
      }

      return 'this.program(' + programParams.join(', ') + ')';
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStackLiteral: function(item) {
      return this.push(new Literal(item));
    },

    pushSource: function(source) {
      if (this.pendingContent) {
        this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
        this.pendingContent = undefined;
      }

      if (source) {
        this.source.push(source);
      }
    },

    pushStack: function(item) {
      this.flushInline();

      var stack = this.incrStack();
      this.pushSource(stack + " = " + item + ";");
      this.compileStack.push(stack);
      return stack;
    },

    replaceStack: function(callback) {
      var prefix = '',
          inline = this.isInline(),
          stack,
          createdStack,
          usedLiteral;

      /* istanbul ignore next */
      if (!this.isInline()) {
        throw new Exception('replaceStack on non-inline');
      }

      // We want to merge the inline statement into the replacement statement via ','
      var top = this.popStack(true);

      if (top instanceof Literal) {
        // Literals do not need to be inlined
        prefix = stack = top.value;
        usedLiteral = true;
      } else {
        // Get or create the current stack name for use by the inline
        createdStack = !this.stackSlot;
        var name = !createdStack ? this.topStackName() : this.incrStack();

        prefix = '(' + this.push(name) + ' = ' + top + ')';
        stack = this.topStack();
      }

      var item = callback.call(this, stack);

      if (!usedLiteral) {
        this.popStack();
      }
      if (createdStack) {
        this.stackSlot--;
      }
      this.push('(' + prefix + item + ')');
    },

    incrStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return this.topStackName();
    },
    topStackName: function() {
      return "stack" + this.stackSlot;
    },
    flushInline: function() {
      var inlineStack = this.inlineStack;
      if (inlineStack.length) {
        this.inlineStack = [];
        for (var i = 0, len = inlineStack.length; i < len; i++) {
          var entry = inlineStack[i];
          if (entry instanceof Literal) {
            this.compileStack.push(entry);
          } else {
            this.pushStack(entry);
          }
        }
      }
    },
    isInline: function() {
      return this.inlineStack.length;
    },

    popStack: function(wrapped) {
      var inline = this.isInline(),
          item = (inline ? this.inlineStack : this.compileStack).pop();

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        if (!inline) {
          /* istanbul ignore next */
          if (!this.stackSlot) {
            throw new Exception('Invalid stack pop');
          }
          this.stackSlot--;
        }
        return item;
      }
    },

    topStack: function() {
      var stack = (this.isInline() ? this.inlineStack : this.compileStack),
          item = stack[stack.length - 1];

      if (item instanceof Literal) {
        return item.value;
      } else {
        return item;
      }
    },

    contextName: function(context) {
      if (this.useDepths && context) {
        return 'depths[' + context + ']';
      } else {
        return 'depth' + context;
      }
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\u2028/g, '\\u2028')   // Per Ecma-262 7.3 + 7.8.4
        .replace(/\u2029/g, '\\u2029') + '"';
    },

    objectLiteral: function(obj) {
      var pairs = [];

      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          pairs.push(this.quotedString(key) + ':' + obj[key]);
        }
      }

      return '{' + pairs.join(',') + '}';
    },

    setupHelper: function(paramSize, name, blockHelper) {
      var params = [],
          paramsInit = this.setupParams(name, paramSize, params, blockHelper);
      var foundHelper = this.nameLookup('helpers', name, 'helper');

      return {
        params: params,
        paramsInit: paramsInit,
        name: foundHelper,
        callParams: [this.contextName(0)].concat(params).join(", ")
      };
    },

    setupOptions: function(helper, paramSize, params) {
      var options = {}, contexts = [], types = [], ids = [], param, inverse, program;

      options.name = this.quotedString(helper);
      options.hash = this.popStack();

      if (this.trackIds) {
        options.hashIds = this.popStack();
      }
      if (this.stringParams) {
        options.hashTypes = this.popStack();
        options.hashContexts = this.popStack();
      }

      inverse = this.popStack();
      program = this.popStack();

      // Avoid setting fn and inverse if neither are set. This allows
      // helpers to do a check for `if (options.fn)`
      if (program || inverse) {
        if (!program) {
          program = 'this.noop';
        }

        if (!inverse) {
          inverse = 'this.noop';
        }

        options.fn = program;
        options.inverse = inverse;
      }

      // The parameters go on to the stack in order (making sure that they are evaluated in order)
      // so we need to pop them off the stack in reverse order
      var i = paramSize;
      while (i--) {
        param = this.popStack();
        params[i] = param;

        if (this.trackIds) {
          ids[i] = this.popStack();
        }
        if (this.stringParams) {
          types[i] = this.popStack();
          contexts[i] = this.popStack();
        }
      }

      if (this.trackIds) {
        options.ids = "[" + ids.join(",") + "]";
      }
      if (this.stringParams) {
        options.types = "[" + types.join(",") + "]";
        options.contexts = "[" + contexts.join(",") + "]";
      }

      if (this.options.data) {
        options.data = "data";
      }

      return options;
    },

    // the params and contexts arguments are passed in arrays
    // to fill in
    setupParams: function(helperName, paramSize, params, useRegister) {
      var options = this.objectLiteral(this.setupOptions(helperName, paramSize, params));

      if (useRegister) {
        this.useRegister('options');
        params.push('options');
        return 'options=' + options;
      } else {
        params.push(options);
        return '';
      }
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
  };

  __exports__ = JavaScriptCompiler;
  return __exports__;
})(__module2__, __module5__);

// handlebars.js
var __module0__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var Handlebars = __dependency1__;

  // Compiler imports
  var AST = __dependency2__;
  var Parser = __dependency3__.parser;
  var parse = __dependency3__.parse;
  var Compiler = __dependency4__.Compiler;
  var compile = __dependency4__.compile;
  var precompile = __dependency4__.precompile;
  var JavaScriptCompiler = __dependency5__;

  var _create = Handlebars.create;
  var create = function() {
    var hb = _create();

    hb.compile = function(input, options) {
      return compile(input, options, hb);
    };
    hb.precompile = function (input, options) {
      return precompile(input, options, hb);
    };

    hb.AST = AST;
    hb.Compiler = Compiler;
    hb.JavaScriptCompiler = JavaScriptCompiler;
    hb.Parser = Parser;
    hb.parse = parse;

    return hb;
  };

  Handlebars = create();
  Handlebars.create = create;

  Handlebars['default'] = Handlebars;

  __exports__ = Handlebars;
  return __exports__;
})(__module1__, __module7__, __module8__, __module11__, __module12__);

  return __module0__;
}));


/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("wolfy87-eventemitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(window,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function f(e){this.img=e}function c(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);var i=n.nodeType;if(i&&(1===i||9===i||11===i))for(var r=n.querySelectorAll("img"),o=0,s=r.length;s>o;o++){var f=r[o];this.addImage(f)}}},s.prototype.addImage=function(e){var t=new f(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoaded=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),f.prototype=new t,f.prototype.check=function(){var e=v[this.img.src]||new c(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},f.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return c.prototype=new t,c.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},c.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},c.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},c.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},c.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},c.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});



/* jquery.nicescroll
-- version 3.4.0
-- copyright 2011-12-13 InuYaksa*2013
-- licensed under the MIT
--
-- http://areaaperta.com/nicescroll
-- https://github.com/inuyaksa/jquery.nicescroll
--
*/

(function(jQuery){

  // globals
  var domfocus = false;
  var mousefocus = false;
  var zoomactive = false;
  var tabindexcounter = 5000;
  var ascrailcounter = 2000;
  var globalmaxzindex = 0;
  
  var $ = jQuery;  // sandbox
 
  // http://stackoverflow.com/questions/2161159/get-script-path
  function getScriptPath() {
    var scripts=document.getElementsByTagName('script');
    var path=scripts[scripts.length-1].src.split('?')[0];
    return (path.split('/').length>0) ? path.split('/').slice(0,-1).join('/')+'/' : '';
  }
  var scriptpath = getScriptPath();

// derived by Paul Irish https://gist.github.com/paulirish/1579671 - thanks for your code!

  if (!Array.prototype.forEach) {  // JS 1.6 polyfill
    Array.prototype.forEach = function(fn, scope) {
      for(var i = 0, len = this.length; i < len; ++i) {
        fn.call(scope, this[i], i, this);
      }
    }
  }
  
  var vendors = ['ms','moz','webkit','o'];
  
  var setAnimationFrame = window.requestAnimationFrame||false;
  var clearAnimationFrame = window.cancelAnimationFrame||false;

  vendors.forEach(function(v){
    if (!setAnimationFrame) setAnimationFrame = window[v+'RequestAnimationFrame'];
    if (!clearAnimationFrame) clearAnimationFrame = window[v+'CancelAnimationFrame']||window[v+'CancelRequestAnimationFrame'];    
  });
  
  var clsMutationObserver = window.MutationObserver || window.WebKitMutationObserver || false;
  
  var _globaloptions = {
      zindex:"10000",
      cursoropacitymin:0,
      cursoropacitymax:1,
      cursorcolor:"#333333",
      cursorwidth:"5px",
      cursorborder:"0px solid #fff",
      cursorborderradius:"0px",
      scrollspeed:60,
      mousescrollstep:8*3,
      touchbehavior:false,
      hwacceleration:true,
      usetransition:true,
      boxzoom:false,
      dblclickzoom:true,
      gesturezoom:true,
      grabcursorenabled:true,
      autohidemode:true,
      background:"",
      iframeautoresize:true,
      cursorminheight:32,
      preservenativescrolling:true,
      railoffset:false,
      bouncescroll:true,
      spacebarenabled:true,
      railpadding:{top:0,right:0,left:0,bottom:0},
      disableoutline:true,
      horizrailenabled:true,
      railalign:"right",
      railvalign:"bottom",
      enabletranslate3d:true,
      enablemousewheel:true,
      enablekeyboard:true,
      smoothscroll:true,
      sensitiverail:true,
      enablemouselockapi:true,
//      cursormaxheight:false,
      cursorfixedheight:false,      
      directionlockdeadzone:6,
      hidecursordelay:400,
      nativeparentscrolling:true,
      enablescrollonselection:true,
      overflowx:true,
      overflowy:true,
      cursordragspeed:0.3,
      rtlmode:false,
      cursordragontouch:false
  }
  
  var browserdetected = false;
  
  var getBrowserDetection = function() {
  
    if (browserdetected) return browserdetected;
  
    var domtest = document.createElement('DIV');

    var d = {};
    
    d.haspointerlock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
    
    d.isopera = ("opera" in window);
    d.isopera12 = (d.isopera&&("getUserMedia" in navigator));
    
    d.isie = (("all" in document) && ("attachEvent" in domtest) && !d.isopera);
    d.isieold = (d.isie && !("msInterpolationMode" in domtest.style));  // IE6 and older
    d.isie7 = d.isie&&!d.isieold&&(!("documentMode" in document)||(document.documentMode==7));
    d.isie8 = d.isie&&("documentMode" in document)&&(document.documentMode==8);
    d.isie9 = d.isie&&("performance" in window)&&(document.documentMode>=9);
    d.isie10 = d.isie&&("performance" in window)&&(document.documentMode>=10);
    
    d.isie9mobile = /iemobile.9/i.test(navigator.userAgent);  //wp 7.1 mango
    if (d.isie9mobile) d.isie9 = false;
    d.isie7mobile = (!d.isie9mobile&&d.isie7) && /iemobile/i.test(navigator.userAgent);  //wp 7.0
    
    d.ismozilla = ("MozAppearance" in domtest.style);
    
    d.iswebkit = ("WebkitAppearance" in domtest.style);
    
    d.ischrome = ("chrome" in window);
    d.ischrome22 = (d.ischrome&&d.haspointerlock);
    d.ischrome26 = (d.ischrome&&("transition" in domtest.style));  // issue with transform detection (maintain prefix)
    
    d.cantouch = ("ontouchstart" in document.documentElement)||("ontouchstart" in window);  // detection for Chrome Touch Emulation
    d.hasmstouch = (window.navigator.msPointerEnabled||false);  // IE10+ pointer events
    
    d.ismac = /^mac$/i.test(navigator.platform);
    
    d.isios = (d.cantouch && /iphone|ipad|ipod/i.test(navigator.platform));
    d.isios4 = ((d.isios)&&!("seal" in Object));
    
    d.isandroid = (/android/i.test(navigator.userAgent));
    
    d.trstyle = false;
    d.hastransform = false;
    d.hastranslate3d = false;
    d.transitionstyle = false;
    d.hastransition = false;
    d.transitionend = false;
    
    var check = ['transform','msTransform','webkitTransform','MozTransform','OTransform'];
    for(var a=0;a<check.length;a++){
      if (typeof domtest.style[check[a]] != "undefined") {
        d.trstyle = check[a];
        break;
      }
    }
    d.hastransform = (d.trstyle != false);
    if (d.hastransform) {
      domtest.style[d.trstyle] = "translate3d(1px,2px,3px)";
      d.hastranslate3d = /translate3d/.test(domtest.style[d.trstyle]);
    }
    
    d.transitionstyle = false;
    d.prefixstyle = '';
    d.transitionend = false;
    var check = ['transition','webkitTransition','MozTransition','OTransition','OTransition','msTransition','KhtmlTransition'];
    var prefix = ['','-webkit-','-moz-','-o-','-o','-ms-','-khtml-'];
    var evs = ['transitionend','webkitTransitionEnd','transitionend','otransitionend','oTransitionEnd','msTransitionEnd','KhtmlTransitionEnd'];
    for(var a=0;a<check.length;a++) {
      if (check[a] in domtest.style) {
        d.transitionstyle = check[a];
        d.prefixstyle = prefix[a];
        d.transitionend = evs[a];
        break;
      }
    }
    if (d.ischrome26) {  // use always prefix
      d.prefixstyle = prefix[1];
    }
    
    d.hastransition = (d.transitionstyle);
    
    function detectCursorGrab() {      
      var lst = ['-moz-grab','-webkit-grab','grab'];
      if ((d.ischrome&&!d.ischrome22)||d.isie) lst=[];  // force setting for IE returns false positive and chrome cursor bug
      for(var a=0;a<lst.length;a++) {
        var p = lst[a];
        domtest.style['cursor']=p;
        if (domtest.style['cursor']==p) return p;
      }
      return 'url(http://www.google.com/intl/en_ALL/mapfiles/openhand.cur),n-resize';  // thank you google for custom cursor!
    }
    d.cursorgrabvalue = detectCursorGrab();

    d.hasmousecapture = ("setCapture" in domtest);
    
    d.hasMutationObserver = (clsMutationObserver !== false);
    
    domtest = null;  //memory released

    browserdetected = d;
    
    return d;  
  }
  
  var NiceScrollClass = function(myopt,me) {

    var self = this;

    this.version = '3.4.0';
    this.name = 'nicescroll';
    
    this.me = me;
    
    this.opt = {
      doc:$("body"),
      win:false
    };
    
    $.extend(this.opt,_globaloptions);
    
// Options for internal use
    this.opt.snapbackspeed = 80;
    
    if (myopt||false) {
      for(var a in self.opt) {
        if (typeof myopt[a] != "undefined") self.opt[a] = myopt[a];
      }
    }
    
    this.doc = self.opt.doc;
    this.iddoc = (this.doc&&this.doc[0])?this.doc[0].id||'':'';    
    this.ispage = /BODY|HTML/.test((self.opt.win)?self.opt.win[0].nodeName:this.doc[0].nodeName);
    this.haswrapper = (self.opt.win!==false);
    this.win = self.opt.win||(this.ispage?$(window):this.doc);
    this.docscroll = (this.ispage&&!this.haswrapper)?$(window):this.win;
    this.body = $("body");
    this.viewport = false;
    
    this.isfixed = false;
    
    this.iframe = false;
    this.isiframe = ((this.doc[0].nodeName == 'IFRAME') && (this.win[0].nodeName == 'IFRAME'));
    
    this.istextarea = (this.win[0].nodeName == 'TEXTAREA');
    
    this.forcescreen = false; //force to use screen position on events

    this.canshowonmouseevent = (self.opt.autohidemode!="scroll");
    
// Events jump table    
    this.onmousedown = false;
    this.onmouseup = false;
    this.onmousemove = false;
    this.onmousewheel = false;
    this.onkeypress = false;
    this.ongesturezoom = false;
    this.onclick = false;
    
// Nicescroll custom events
    this.onscrollstart = false;
    this.onscrollend = false;
    this.onscrollcancel = false;    
    
    this.onzoomin = false;
    this.onzoomout = false;
    
// Let's start!  
    this.view = false;
    this.page = false;
    
    this.scroll = {x:0,y:0};
    this.scrollratio = {x:0,y:0};    
    this.cursorheight = 20;
    this.scrollvaluemax = 0;
    
    this.checkrtlmode = false;
    
    this.scrollrunning = false;
    
    this.scrollmom = false;
    
    this.observer = false;
    this.observerremover = false;  // observer on parent for remove detection
    
    do {
      this.id = "ascrail"+(ascrailcounter++);
    } while (document.getElementById(this.id));
    
    this.rail = false;
    this.cursor = false;
    this.cursorfreezed = false;  
    this.selectiondrag = false;
    
    this.zoom = false;
    this.zoomactive = false;
    
    this.hasfocus = false;
    this.hasmousefocus = false;
    
    this.visibility = true;
    this.locked = false;
    this.hidden = false; // rails always hidden
    this.cursoractive = true; // user can interact with cursors
    
    this.overflowx = self.opt.overflowx;
    this.overflowy = self.opt.overflowy;
    
    this.nativescrollingarea = false;
    this.checkarea = 0;
    
    this.events = [];  // event list for unbind
    
    this.saved = {};
    
    this.delaylist = {};
    this.synclist = {};
    
    this.lastdeltax = 0;
    this.lastdeltay = 0;
    
    this.detected = getBrowserDetection(); 
    
    var cap = $.extend({},this.detected);
 
    this.canhwscroll = (cap.hastransform&&self.opt.hwacceleration);
    this.ishwscroll = (this.canhwscroll&&self.haswrapper);
    
    this.istouchcapable = false;  // desktop devices with touch screen support
    
//## Check Chrome desktop with touch support
    if (cap.cantouch&&cap.ischrome&&!cap.isios&&!cap.isandroid) {
      this.istouchcapable = true;
      cap.cantouch = false;  // parse normal desktop events
    }    

//## Firefox 18 nightly build (desktop) false positive (or desktop with touch support)
    if (cap.cantouch&&cap.ismozilla&&!cap.isios) {
      this.istouchcapable = true;
      cap.cantouch = false;  // parse normal desktop events
    }    
    
//## disable MouseLock API on user request

    if (!self.opt.enablemouselockapi) {
      cap.hasmousecapture = false;
      cap.haspointerlock = false;
    }
    
    this.delayed = function(name,fn,tm,lazy) {
      var dd = self.delaylist[name];
      var nw = (new Date()).getTime();
      if (!lazy&&dd&&dd.tt) return false;
      if (dd&&dd.tt) clearTimeout(dd.tt);
      if (dd&&dd.last+tm>nw&&!dd.tt) {      
        self.delaylist[name] = {
          last:nw+tm,
          tt:setTimeout(function(){self.delaylist[name].tt=0;fn.call();},tm)
        }
      }
      else if (!dd||!dd.tt) {
        self.delaylist[name] = {
          last:nw,
          tt:0
        }
        setTimeout(function(){fn.call();},0);
      }
    };
    
    this.debounced = function(name,fn,tm) {
      var dd = self.delaylist[name];
      var nw = (new Date()).getTime();      
      self.delaylist[name] = fn;
      if (!dd) {        
        setTimeout(function(){var fn=self.delaylist[name];self.delaylist[name]=false;fn.call();},tm);
      }
    }
    
    this.synched = function(name,fn) {
    
      function requestSync() {
        if (self.onsync) return;
        setAnimationFrame(function(){
          self.onsync = false;
          for(name in self.synclist){
            var fn = self.synclist[name];
            if (fn) fn.call(self);
            self.synclist[name] = false;
          }
        });
        self.onsync = true;
      };    
    
      self.synclist[name] = fn;
      requestSync();
      return name;
    };
    
    this.unsynched = function(name) {
      if (self.synclist[name]) self.synclist[name] = false;
    }
    
    this.css = function(el,pars) {  // save & set
      for(var n in pars) {
        self.saved.css.push([el,n,el.css(n)]);
        el.css(n,pars[n]);
      }
    };
    
    this.scrollTop = function(val) {
      return (typeof val == "undefined") ? self.getScrollTop() : self.setScrollTop(val);
    };

    this.scrollLeft = function(val) {
      return (typeof val == "undefined") ? self.getScrollLeft() : self.setScrollLeft(val);
    };
    
// derived by by Dan Pupius www.pupius.net
    BezierClass = function(st,ed,spd,p1,p2,p3,p4) {
      this.st = st;
      this.ed = ed;
      this.spd = spd;
      
      this.p1 = p1||0;
      this.p2 = p2||1;
      this.p3 = p3||0;
      this.p4 = p4||1;
      
      this.ts = (new Date()).getTime();
      this.df = this.ed-this.st;
    };
    BezierClass.prototype = {
      B2:function(t){ return 3*t*t*(1-t) },
      B3:function(t){ return 3*t*(1-t)*(1-t) },
      B4:function(t){ return (1-t)*(1-t)*(1-t) },
      getNow:function(){
        var nw = (new Date()).getTime();
        var pc = 1-((nw-this.ts)/this.spd);
        var bz = this.B2(pc) + this.B3(pc) + this.B4(pc);
        return (pc<0) ? this.ed : this.st+Math.round(this.df*bz);
      },
      update:function(ed,spd){
        this.st = this.getNow();
        this.ed = ed;
        this.spd = spd;
        this.ts = (new Date()).getTime();
        this.df = this.ed-this.st;
        return this;
      }
    };
    
    if (this.ishwscroll) {  
    // hw accelerated scroll
      this.doc.translate = {x:0,y:0,tx:"0px",ty:"0px"};
      
      //this one can help to enable hw accel on ios6 http://indiegamr.com/ios6-html-hardware-acceleration-changes-and-how-to-fix-them/
      if (cap.hastranslate3d&&cap.isios) this.doc.css("-webkit-backface-visibility","hidden");  // prevent flickering http://stackoverflow.com/questions/3461441/      
      
      //derived from http://stackoverflow.com/questions/11236090/
      function getMatrixValues() {
        var tr = self.doc.css(cap.trstyle);
        if (tr&&(tr.substr(0,6)=="matrix")) {
          return tr.replace(/^.*\((.*)\)$/g, "$1").replace(/px/g,'').split(/, +/);
        }
        return false;
      }
      
      this.getScrollTop = function(last) {
        if (!last) {
          var mtx = getMatrixValues();
          if (mtx) return (mtx.length==16) ? -mtx[13] : -mtx[5];  //matrix3d 16 on IE10
          if (self.timerscroll&&self.timerscroll.bz) return self.timerscroll.bz.getNow();
        }
        return self.doc.translate.y;
      };

      this.getScrollLeft = function(last) {
        if (!last) {
          var mtx = getMatrixValues();          
          if (mtx) return (mtx.length==16) ? -mtx[12] : -mtx[4];  //matrix3d 16 on IE10
          if (self.timerscroll&&self.timerscroll.bh) return self.timerscroll.bh.getNow();
        }
        return self.doc.translate.x;
      };
      
      if (document.createEvent) {
        this.notifyScrollEvent = function(el) {
          var e = document.createEvent("UIEvents");
          e.initUIEvent("scroll", false, true, window, 1);
          el.dispatchEvent(e);
        };
      }
      else if (document.fireEvent) {
        this.notifyScrollEvent = function(el) {
          var e = document.createEventObject();
          el.fireEvent("onscroll");
          e.cancelBubble = true; 
        };
      }
      else {
        this.notifyScrollEvent = function(el,add) {}; //NOPE
      }
      
      if (cap.hastranslate3d&&self.opt.enabletranslate3d) {
        this.setScrollTop = function(val,silent) {
          self.doc.translate.y = val;
          self.doc.translate.ty = (val*-1)+"px";
          self.doc.css(cap.trstyle,"translate3d("+self.doc.translate.tx+","+self.doc.translate.ty+",0px)");          
          if (!silent) self.notifyScrollEvent(self.win[0]);
        };
        this.setScrollLeft = function(val,silent) {          
          self.doc.translate.x = val;
          self.doc.translate.tx = (val*-1)+"px";
          self.doc.css(cap.trstyle,"translate3d("+self.doc.translate.tx+","+self.doc.translate.ty+",0px)");          
          if (!silent) self.notifyScrollEvent(self.win[0]);
        };
      } else {
        this.setScrollTop = function(val,silent) {
          self.doc.translate.y = val;
          self.doc.translate.ty = (val*-1)+"px";
          self.doc.css(cap.trstyle,"translate("+self.doc.translate.tx+","+self.doc.translate.ty+")");
          if (!silent) self.notifyScrollEvent(self.win[0]);          
        };
        this.setScrollLeft = function(val,silent) {        
          self.doc.translate.x = val;
          self.doc.translate.tx = (val*-1)+"px";
          self.doc.css(cap.trstyle,"translate("+self.doc.translate.tx+","+self.doc.translate.ty+")");
          if (!silent) self.notifyScrollEvent(self.win[0]);
        };
      }
    } else {
    // native scroll
      this.getScrollTop = function() {
        return self.docscroll.scrollTop();
      };
      this.setScrollTop = function(val) {        
        return self.docscroll.scrollTop(val);
      };
      this.getScrollLeft = function() {
        return self.docscroll.scrollLeft();
      };
      this.setScrollLeft = function(val) {
        return self.docscroll.scrollLeft(val);
      };
    }
    
    this.getTarget = function(e) {
      if (!e) return false;
      if (e.target) return e.target;
      if (e.srcElement) return e.srcElement;
      return false;
    };
    
    this.hasParent = function(e,id) {
      if (!e) return false;
      var el = e.target||e.srcElement||e||false;
      while (el && el.id != id) {
        el = el.parentNode||false;
      }
      return (el!==false);
    };
    
    function getZIndex() {
      var dom = self.win;
      if ("zIndex" in dom) return dom.zIndex();  // use jQuery UI method when available
      while (dom.length>0) {        
        if (dom[0].nodeType==9) return false;
        var zi = dom.css('zIndex');        
        if (!isNaN(zi)&&zi!=0) return parseInt(zi);
        dom = dom.parent();
      }
      return false;
    };
    
//inspired by http://forum.jquery.com/topic/width-includes-border-width-when-set-to-thin-medium-thick-in-ie
    var _convertBorderWidth = {"thin":1,"medium":3,"thick":5};
    function getWidthToPixel(dom,prop,chkheight) {
      var wd = dom.css(prop);
      var px = parseFloat(wd);
      if (isNaN(px)) {
        px = _convertBorderWidth[wd]||0;
        var brd = (px==3) ? ((chkheight)?(self.win.outerHeight() - self.win.innerHeight()):(self.win.outerWidth() - self.win.innerWidth())) : 1; //DON'T TRUST CSS
        if (self.isie8&&px) px+=1;
        return (brd) ? px : 0; 
      }
      return px;
    };
    
    this.getOffset = function() {
      if (self.isfixed) return {top:parseFloat(self.win.css('top')),left:parseFloat(self.win.css('left'))};
      if (!self.viewport) return self.win.offset();
      var ww = self.win.offset();
      var vp = self.viewport.offset();
      return {top:ww.top-vp.top+self.viewport.scrollTop(),left:ww.left-vp.left+self.viewport.scrollLeft()};
    };
    
    this.updateScrollBar = function(len) {
      if (self.ishwscroll) {
        self.rail.css({height:self.win.innerHeight()});
        if (self.railh) self.railh.css({width:self.win.innerWidth()});
      } else {
        var wpos = self.getOffset();
        var pos = {top:wpos.top,left:wpos.left};
        pos.top+= getWidthToPixel(self.win,'border-top-width',true);
        var brd = (self.win.outerWidth() - self.win.innerWidth())/2;
        pos.left+= (self.rail.align) ? self.win.outerWidth() - getWidthToPixel(self.win,'border-right-width') - self.rail.width : getWidthToPixel(self.win,'border-left-width');
        
        var off = self.opt.railoffset;
        if (off) {
          if (off.top) pos.top+=off.top;
          if (self.rail.align&&off.left) pos.left+=off.left;
        }
        
        if (!self.locked) self.rail.css({top:pos.top,left:pos.left,height:(len)?len.h:self.win.innerHeight()});
        
        if (self.zoom) {          
          self.zoom.css({top:pos.top+1,left:(self.rail.align==1) ? pos.left-20 : pos.left+self.rail.width+4});
        }
        
        if (self.railh&&!self.locked) {
          var pos = {top:wpos.top,left:wpos.left};
          var y = (self.railh.align) ? pos.top + getWidthToPixel(self.win,'border-top-width',true) + self.win.innerHeight() - self.railh.height : pos.top + getWidthToPixel(self.win,'border-top-width',true);
          var x = pos.left + getWidthToPixel(self.win,'border-left-width');
          self.railh.css({top:y,left:x,width:self.railh.width});
        }
    
        
      }
    };
    
    this.doRailClick = function(e,dbl,hr) {

      var fn,pg,cur,pos;
      
//      if (self.rail.drag&&self.rail.drag.pt!=1) return;
      if (self.locked) return;
//      if (self.rail.drag) return;

//      self.cancelScroll();       
      
      self.cancelEvent(e);
      
      if (dbl) {
        fn = (hr) ? self.doScrollLeft : self.doScrollTop;
        cur = (hr) ? ((e.pageX - self.railh.offset().left - (self.cursorwidth/2)) * self.scrollratio.x) : ((e.pageY - self.rail.offset().top - (self.cursorheight/2)) * self.scrollratio.y);
        fn(cur);
      } else {
//        console.log(e.pageY);
        fn = (hr) ? self.doScrollLeftBy : self.doScrollBy;
        cur = (hr) ? self.scroll.x : self.scroll.y;
        pos = (hr) ? e.pageX - self.railh.offset().left : e.pageY - self.rail.offset().top;
        pg = (hr) ? self.view.w : self.view.h;        
        (cur>=pos) ? fn(pg) : fn(-pg);
      }
    
    }
    
    self.hasanimationframe = (setAnimationFrame);
    self.hascancelanimationframe = (clearAnimationFrame);
    
    if (!self.hasanimationframe) {
      setAnimationFrame=function(fn){return setTimeout(fn,15-Math.floor((+new Date)/1000)%16)}; // 1000/60)};
      clearAnimationFrame=clearInterval;
    } 
    else if (!self.hascancelanimationframe) clearAnimationFrame=function(){self.cancelAnimationFrame=true};
    
    this.init = function() {

      self.saved.css = [];
      
      if (cap.isie7mobile) return true; // SORRY, DO NOT WORK!
      
      if (cap.hasmstouch) self.css((self.ispage)?$("html"):self.win,{'-ms-touch-action':'none'});
      
      self.zindex = "auto";
      if (!self.ispage&&self.opt.zindex=="auto") {
        self.zindex = getZIndex()||"auto";
      } else {
        self.zindex = self.opt.zindex;
      }
      
      if (!self.ispage&&self.zindex!="auto") {
        if (self.zindex>globalmaxzindex) globalmaxzindex=self.zindex;
      }
      
      if (self.isie&&self.zindex==0&&self.opt.zindex=="auto") {  // fix IE auto == 0
        self.zindex="auto";
      }
      
/*      
      self.ispage = true;
      self.haswrapper = true;
//      self.win = $(window);
      self.docscroll = $("body");
//      self.doc = $("body");
*/
      
      if (!self.ispage || (!cap.cantouch && !cap.isieold && !cap.isie9mobile)) {
      
        var cont = self.docscroll;
        if (self.ispage) cont = (self.haswrapper)?self.win:self.doc;
        
        if (!cap.isie9mobile) self.css(cont,{'overflow-y':'hidden'});      
        
        if (self.ispage&&cap.isie7) {
          if (self.doc[0].nodeName=='BODY') self.css($("html"),{'overflow-y':'hidden'});  //IE7 double scrollbar issue
          else if (self.doc[0].nodeName=='HTML') self.css($("body"),{'overflow-y':'hidden'});  //IE7 double scrollbar issue
        }
        
        if (cap.isios&&!self.ispage&&!self.haswrapper) self.css($("body"),{"-webkit-overflow-scrolling":"touch"});  //force hw acceleration
        
        var cursor = $(document.createElement('div'));
        cursor.css({
          position:"relative",top:0,"float":"right",width:self.opt.cursorwidth,height:"0px",
          'background-color':self.opt.cursorcolor,
          border:self.opt.cursorborder,
          'background-clip':'padding-box',
          '-webkit-border-radius':self.opt.cursorborderradius,
          '-moz-border-radius':self.opt.cursorborderradius,
          'border-radius':self.opt.cursorborderradius
        });   
        
        cursor.hborder = parseFloat(cursor.outerHeight() - cursor.innerHeight());        
        self.cursor = cursor;        
        
        var rail = $(document.createElement('div'));
        rail.attr('id',self.id);
        rail.addClass('nicescroll-rails');
        
        var v,a,kp = ["left","right"];  //"top","bottom"
        for(var n in kp) {
          a=kp[n];
          v = self.opt.railpadding[a];
          (v) ? rail.css("padding-"+a,v+"px") : self.opt.railpadding[a] = 0;
        }
        
        rail.append(cursor);
        
        rail.width = Math.max(parseFloat(self.opt.cursorwidth),cursor.outerWidth()) + self.opt.railpadding['left'] + self.opt.railpadding['right'];
        rail.css({width:rail.width+"px",'zIndex':self.zindex,"background":self.opt.background,cursor:"default"});        
        
        rail.visibility = true;
        rail.scrollable = true;
        
        rail.align = (self.opt.railalign=="left") ? 0 : 1;
        
        self.rail = rail;
        
        self.rail.drag = false;
        
        var zoom = false;
        if (self.opt.boxzoom&&!self.ispage&&!cap.isieold) {
          zoom = document.createElement('div');          
          self.bind(zoom,"click",self.doZoom);
          self.zoom = $(zoom);
          self.zoom.css({"cursor":"pointer",'z-index':self.zindex,'backgroundImage':'url('+scriptpath+'zoomico.png)','height':18,'width':18,'backgroundPosition':'0px 0px'});
          if (self.opt.dblclickzoom) self.bind(self.win,"dblclick",self.doZoom);
          if (cap.cantouch&&self.opt.gesturezoom) {
            self.ongesturezoom = function(e) {
              if (e.scale>1.5) self.doZoomIn(e);
              if (e.scale<0.8) self.doZoomOut(e);
              return self.cancelEvent(e);
            };
            self.bind(self.win,"gestureend",self.ongesturezoom);             
          }
        }
        
// init HORIZ

        self.railh = false;

        if (self.opt.horizrailenabled) {

          self.css(cont,{'overflow-x':'hidden'});

          var cursor = $(document.createElement('div'));
          cursor.css({
            position:"relative",top:0,height:self.opt.cursorwidth,width:"0px",
            'background-color':self.opt.cursorcolor,
            border:self.opt.cursorborder,
            'background-clip':'padding-box',
            '-webkit-border-radius':self.opt.cursorborderradius,
            '-moz-border-radius':self.opt.cursorborderradius,
            'border-radius':self.opt.cursorborderradius
          });   
          
          cursor.wborder = parseFloat(cursor.outerWidth() - cursor.innerWidth());
          self.cursorh = cursor;
          
          var railh = $(document.createElement('div'));
          railh.attr('id',self.id+'-hr');
          railh.addClass('nicescroll-rails');
          railh.height = Math.max(parseFloat(self.opt.cursorwidth),cursor.outerHeight());
          railh.css({height:railh.height+"px",'zIndex':self.zindex,"background":self.opt.background});
          
          railh.append(cursor);
          
          railh.visibility = true;
          railh.scrollable = true;
          
          railh.align = (self.opt.railvalign=="top") ? 0 : 1;
          
          self.railh = railh;
          
          self.railh.drag = false;
          
        }
        
//        
        
        if (self.ispage) {
          rail.css({position:"fixed",top:"0px",height:"100%"});
          (rail.align) ? rail.css({right:"0px"}) : rail.css({left:"0px"});
          self.body.append(rail);
          if (self.railh) {
            railh.css({position:"fixed",left:"0px",width:"100%"});
            (railh.align) ? railh.css({bottom:"0px"}) : railh.css({top:"0px"});
            self.body.append(railh);
          }
        } else {          
          if (self.ishwscroll) {
            if (self.win.css('position')=='static') self.css(self.win,{'position':'relative'});
            var bd = (self.win[0].nodeName == 'HTML') ? self.body : self.win;
            if (self.zoom) {
              self.zoom.css({position:"absolute",top:1,right:0,"margin-right":rail.width+4});
              bd.append(self.zoom);
            }
            rail.css({position:"absolute",top:0});
            (rail.align) ? rail.css({right:0}) : rail.css({left:0});
            bd.append(rail);
            if (railh) {
              railh.css({position:"absolute",left:0,bottom:0});
              (railh.align) ? railh.css({bottom:0}) : railh.css({top:0});
              bd.append(railh);
            }
          } else {
            self.isfixed = (self.win.css("position")=="fixed");
            var rlpos = (self.isfixed) ? "fixed" : "absolute";
            
            if (!self.isfixed) self.viewport = self.getViewport(self.win[0]);
            if (self.viewport) {
              self.body = self.viewport;              
              if ((/relative|absolute/.test(self.viewport.css("position")))==false) self.css(self.viewport,{"position":"relative"});
            }            
            
            rail.css({position:rlpos});
            if (self.zoom) self.zoom.css({position:rlpos});
            self.updateScrollBar();
            self.body.append(rail);
            if (self.zoom) self.body.append(self.zoom);
            if (self.railh) {
              railh.css({position:rlpos});
              self.body.append(railh);           
            }
          }
          
          if (cap.isios) self.css(self.win,{'-webkit-tap-highlight-color':'rgba(0,0,0,0)','-webkit-touch-callout':'none'});  // prevent grey layer on click
          
          if (cap.isie&&self.opt.disableoutline) self.win.attr("hideFocus","true");  // IE, prevent dotted rectangle on focused div
          if (cap.iswebkit&&self.opt.disableoutline) self.win.css({"outline":"none"});
          
        }
        
        if (self.opt.autohidemode===false) {
          self.autohidedom = false;
          self.rail.css({opacity:self.opt.cursoropacitymax});          
          if (self.railh) self.railh.css({opacity:self.opt.cursoropacitymax});
        }
        else if (self.opt.autohidemode===true) {
          self.autohidedom = $().add(self.rail);          
          if (cap.isie8) self.autohidedom=self.autohidedom.add(self.cursor);
          if (self.railh) self.autohidedom=self.autohidedom.add(self.railh);
          if (self.railh&&cap.isie8) self.autohidedom=self.autohidedom.add(self.cursorh);
        }
        else if (self.opt.autohidemode=="scroll") {
          self.autohidedom = $().add(self.rail);
          if (self.railh) self.autohidedom=self.autohidedom.add(self.railh);
        }
        else if (self.opt.autohidemode=="cursor") {
          self.autohidedom = $().add(self.cursor);
          if (self.railh) self.autohidedom=self.autohidedom.add(self.cursorh);
        }
        else if (self.opt.autohidemode=="hidden") {
          self.autohidedom = false;
          self.hide();
          self.locked = false;
        }
        
        if (cap.isie9mobile) {

          self.scrollmom = new ScrollMomentumClass2D(self);        

          /*
          var trace = function(msg) {
            var db = $("#debug");
            if (isNaN(msg)&&(typeof msg != "string")) {
              var x = [];
              for(var a in msg) {
                x.push(a+":"+msg[a]);
              }
              msg ="{"+x.join(",")+"}";
            }
            if (db.children().length>0) {
              db.children().eq(0).before("<div>"+msg+"</div>");
            } else {
              db.append("<div>"+msg+"</div>");
            }
          }
          window.onerror = function(msg,url,ln) {
            trace("ERR: "+msg+" at "+ln);
          }
*/          
  
          self.onmangotouch = function(e) {
            var py = self.getScrollTop();
            var px = self.getScrollLeft();
            
            if ((py == self.scrollmom.lastscrolly)&&(px == self.scrollmom.lastscrollx)) return true;
//            $("#debug").html('DRAG:'+py);

            var dfy = py-self.mangotouch.sy;
            var dfx = px-self.mangotouch.sx;            
            var df = Math.round(Math.sqrt(Math.pow(dfx,2)+Math.pow(dfy,2)));            
            if (df==0) return;
            
            var dry = (dfy<0)?-1:1;
            var drx = (dfx<0)?-1:1;
            
            var tm = +new Date();
            if (self.mangotouch.lazy) clearTimeout(self.mangotouch.lazy);
            
            if (((tm-self.mangotouch.tm)>80)||(self.mangotouch.dry!=dry)||(self.mangotouch.drx!=drx)) {
//              trace('RESET+'+(tm-self.mangotouch.tm));
              self.scrollmom.stop();
              self.scrollmom.reset(px,py);
              self.mangotouch.sy = py;
              self.mangotouch.ly = py;
              self.mangotouch.sx = px;
              self.mangotouch.lx = px;
              self.mangotouch.dry = dry;
              self.mangotouch.drx = drx;
              self.mangotouch.tm = tm;
            } else {
              
              self.scrollmom.stop();
              self.scrollmom.update(self.mangotouch.sx-dfx,self.mangotouch.sy-dfy);
              var gap = tm - self.mangotouch.tm;              
              self.mangotouch.tm = tm;
              
//              trace('MOVE:'+df+" - "+gap);
              
              var ds = Math.max(Math.abs(self.mangotouch.ly-py),Math.abs(self.mangotouch.lx-px));
              self.mangotouch.ly = py;
              self.mangotouch.lx = px;
              
              if (ds>2) {
                self.mangotouch.lazy = setTimeout(function(){
//                  trace('END:'+ds+'+'+gap);                  
                  self.mangotouch.lazy = false;
                  self.mangotouch.dry = 0;
                  self.mangotouch.drx = 0;
                  self.mangotouch.tm = 0;                  
                  self.scrollmom.doMomentum(30);
                },100);
              }
            }
          }
          
          var top = self.getScrollTop();
          var lef = self.getScrollLeft();
          self.mangotouch = {sy:top,ly:top,dry:0,sx:lef,lx:lef,drx:0,lazy:false,tm:0};
          
          self.bind(self.docscroll,"scroll",self.onmangotouch);
        
        } else {
        
          if (cap.cantouch||self.istouchcapable||self.opt.touchbehavior||cap.hasmstouch) {
          
            self.scrollmom = new ScrollMomentumClass2D(self);
          
            self.ontouchstart = function(e) {
              if (e.pointerType&&e.pointerType!=2) return false;
              
              if (!self.locked) {
              
                if (cap.hasmstouch) {
                  var tg = (e.target) ? e.target : false;
                  while (tg) {
                    var nc = $(tg).getNiceScroll();
                    if ((nc.length>0)&&(nc[0].me == self.me)) break;
                    if (nc.length>0) return false;
                    if ((tg.nodeName=='DIV')&&(tg.id==self.id)) break;
                    tg = (tg.parentNode) ? tg.parentNode : false;
                  }
                }
              
                self.cancelScroll();
                
                var tg = self.getTarget(e);
                
                if (tg) {
                  var skp = (/INPUT/i.test(tg.nodeName))&&(/range/i.test(tg.type));
                  if (skp) return self.stopPropagation(e);
                }
                
                if (!("clientX" in e) && ("changedTouches" in e)) {
                  e.clientX = e.changedTouches[0].clientX;
                  e.clientY = e.changedTouches[0].clientY;
                }
                
                if (self.forcescreen) {
                  var le = e;
                  var e = {"original":(e.original)?e.original:e};
                  e.clientX = le.screenX;
                  e.clientY = le.screenY;    
                }
                
                self.rail.drag = {x:e.clientX,y:e.clientY,sx:self.scroll.x,sy:self.scroll.y,st:self.getScrollTop(),sl:self.getScrollLeft(),pt:2,dl:false};
                
                if (self.ispage||!self.opt.directionlockdeadzone) {
                  self.rail.drag.dl = "f";
                } else {
                
                  var view = {
                    w:$(window).width(),
                    h:$(window).height()
                  };
                  
                  var page = {
                    w:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),
                    h:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)
                  }
                  
                  var maxh = Math.max(0,page.h - view.h);
                  var maxw = Math.max(0,page.w - view.w);                
                
                  if (!self.rail.scrollable&&self.railh.scrollable) self.rail.drag.ck = (maxh>0) ? "v" : false;
                  else if (self.rail.scrollable&&!self.railh.scrollable) self.rail.drag.ck = (maxw>0) ? "h" : false;
                  else self.rail.drag.ck = false;
                  if (!self.rail.drag.ck) self.rail.drag.dl = "f";
                }
                
                if (self.opt.touchbehavior&&self.isiframe&&cap.isie) {
                  var wp = self.win.position();
                  self.rail.drag.x+=wp.left;
                  self.rail.drag.y+=wp.top;
                }
                
                self.hasmoving = false;
                self.lastmouseup = false;
                self.scrollmom.reset(e.clientX,e.clientY);
                if (!cap.cantouch&&!this.istouchcapable&&!cap.hasmstouch) {
                  
                  var ip = (tg)?/INPUT|SELECT|TEXTAREA/i.test(tg.nodeName):false;
                  if (!ip) {
                    if (!self.ispage&&cap.hasmousecapture) tg.setCapture();
                    return self.cancelEvent(e);
                  }
                  if (/SUBMIT|CANCEL|BUTTON/i.test($(tg).attr('type'))) {
                    pc = {"tg":tg,"click":false};
                    self.preventclick = pc;
                  }
                  
                }
              }
              
            };
            
            self.ontouchend = function(e) {
              if (e.pointerType&&e.pointerType!=2) return false;
              if (self.rail.drag&&(self.rail.drag.pt==2)) {
                self.scrollmom.doMomentum();
                self.rail.drag = false;
                if (self.hasmoving) {
                  self.hasmoving = false;
                  self.lastmouseup = true;
                  self.hideCursor();
                  if (cap.hasmousecapture) document.releaseCapture();
                  if (!cap.cantouch) return self.cancelEvent(e);
                }                            
              }                        
              
            };
            
            var moveneedoffset = (self.opt.touchbehavior&&self.isiframe&&!cap.hasmousecapture);
            
            self.ontouchmove = function(e,byiframe) {
              
              if (e.pointerType&&e.pointerType!=2) return false;
    
              if (self.rail.drag&&(self.rail.drag.pt==2)) {
                if (cap.cantouch&&(typeof e.original == "undefined")) return true;  // prevent ios "ghost" events by clickable elements
              
                self.hasmoving = true;

                if (self.preventclick&&!self.preventclick.click) {
                  self.preventclick.click = self.preventclick.tg.onclick||false;                
                  self.preventclick.tg.onclick = self.onpreventclick;
                }

                var ev = $.extend({"original":e},e);
                e = ev;
                
                if (("changedTouches" in e)) {
                  e.clientX = e.changedTouches[0].clientX;
                  e.clientY = e.changedTouches[0].clientY;
                }                
                
                if (self.forcescreen) {
                  var le = e;
                  var e = {"original":(e.original)?e.original:e};
                  e.clientX = le.screenX;
                  e.clientY = le.screenY;      
                }
                
                var ofx = ofy = 0;
                
                if (moveneedoffset&&!byiframe) {
                  var wp = self.win.position();
                  ofx=-wp.left;
                  ofy=-wp.top;
                }                
                
                var fy = e.clientY + ofy;
                var my = (fy-self.rail.drag.y);
                var fx = e.clientX + ofx;
                var mx = (fx-self.rail.drag.x);
                
                var ny = self.rail.drag.st-my;
                
                if (self.ishwscroll&&self.opt.bouncescroll) {
                  if (ny<0) {
                    ny = Math.round(ny/2);
//                    fy = 0;
                  }
                  else if (ny>self.page.maxh) {
                    ny = self.page.maxh+Math.round((ny-self.page.maxh)/2);
//                    fy = 0;
                  }
                } else {
                  if (ny<0) {ny=0;fy=0}
                  if (ny>self.page.maxh) {ny=self.page.maxh;fy=0}
                }
                  
                if (self.railh&&self.railh.scrollable) {
                  var nx = self.rail.drag.sl-mx;
                  
                  if (self.ishwscroll&&self.opt.bouncescroll) {                  
                    if (nx<0) {
                      nx = Math.round(nx/2);
//                      fx = 0;
                    }
                    else if (nx>self.page.maxw) {
                      nx = self.page.maxw+Math.round((nx-self.page.maxw)/2);
//                      fx = 0;
                    }
                  } else {
                    if (nx<0) {nx=0;fx=0}
                    if (nx>self.page.maxw) {nx=self.page.maxw;fx=0}
                  }
                
                }
                
                var grabbed = false;
                if (self.rail.drag.dl) {
                  grabbed = true;
                  if (self.rail.drag.dl=="v") nx = self.rail.drag.sl;
                  else if (self.rail.drag.dl=="h") ny = self.rail.drag.st;                  
                } else {
                  var ay = Math.abs(my);
                  var ax = Math.abs(mx);
                  var dz = self.opt.directionlockdeadzone;
                  if (self.rail.drag.ck=="v") {    
                    if (ay>dz&&(ax<=(ay*0.3))) {
                      self.rail.drag = false;                      
                      return true;
                    }
                    else if (ax>dz) {
                      self.rail.drag.dl="f";                      
                      $("body").scrollTop($("body").scrollTop());  // stop iOS native scrolling (when active javascript has blocked)
                    }
                  }
                  else if (self.rail.drag.ck=="h") {
                    if (ax>dz&&(ay<=(az*0.3))) {
                      self.rail.drag = false;                      
                      return true;
                    }
                    else if (ay>dz) {                      
                      self.rail.drag.dl="f";
                      $("body").scrollLeft($("body").scrollLeft());  // stop iOS native scrolling (when active javascript has blocked)
                    }
                  }  
                }
                
                self.synched("touchmove",function(){
                  if (self.rail.drag&&(self.rail.drag.pt==2)) {
                    if (self.prepareTransition) self.prepareTransition(0);
                    if (self.rail.scrollable) self.setScrollTop(ny);
                    self.scrollmom.update(fx,fy);
                    if (self.railh&&self.railh.scrollable) {
                      self.setScrollLeft(nx);
                      self.showCursor(ny,nx);
                    } else {
                      self.showCursor(ny);
                    }
                    if (cap.isie10) document.selection.clear();
                  }
                });
                
                if (cap.ischrome&&self.istouchcapable) grabbed=false;  //chrome touch emulation doesn't like!
                if (grabbed) return self.cancelEvent(e);
              }
              
            };
          
          }
          
          self.onmousedown = function(e,hronly) {    
            if (self.rail.drag&&self.rail.drag.pt!=1) return;
            if (self.locked) return self.cancelEvent(e);            
            self.cancelScroll();              
            self.rail.drag = {x:e.clientX,y:e.clientY,sx:self.scroll.x,sy:self.scroll.y,pt:1,hr:(!!hronly)};
            var tg = self.getTarget(e);
            if (!self.ispage&&cap.hasmousecapture) tg.setCapture();
            if (self.isiframe&&!cap.hasmousecapture) {
              self.saved["csspointerevents"] = self.doc.css("pointer-events");
              self.css(self.doc,{"pointer-events":"none"});
            }
            return self.cancelEvent(e);
          };
          
          self.onmouseup = function(e) {
            if (self.rail.drag) {
              if (cap.hasmousecapture) document.releaseCapture();
              if (self.isiframe&&!cap.hasmousecapture) self.doc.css("pointer-events",self.saved["csspointerevents"]);
              if(self.rail.drag.pt!=1)return;
              self.rail.drag = false;
              //if (!self.rail.active) self.hideCursor();
              return self.cancelEvent(e);
            }
          };        
          
          self.onmousemove = function(e) {
            if (self.rail.drag) {
              if(self.rail.drag.pt!=1)return;
              
              if (cap.ischrome&&e.which==0) return self.onmouseup(e);
              
              self.cursorfreezed = true;
                  
              if (self.rail.drag.hr) {
                self.scroll.x = self.rail.drag.sx + (e.clientX-self.rail.drag.x);
                if (self.scroll.x<0) self.scroll.x=0;
                var mw = self.scrollvaluemaxw;
                if (self.scroll.x>mw) self.scroll.x=mw;
              } else {                
                self.scroll.y = self.rail.drag.sy + (e.clientY-self.rail.drag.y);
                if (self.scroll.y<0) self.scroll.y=0;
                var my = self.scrollvaluemax;
                if (self.scroll.y>my) self.scroll.y=my;
              }
              
              self.synched('mousemove',function(){
                if (self.rail.drag&&(self.rail.drag.pt==1)) {
                  self.showCursor();
                  if (self.rail.drag.hr) self.doScrollLeft(Math.round(self.scroll.x*self.scrollratio.x),self.opt.cursordragspeed);
                  else self.doScrollTop(Math.round(self.scroll.y*self.scrollratio.y),self.opt.cursordragspeed);
                }
              });
              
              return self.cancelEvent(e);
            } 
/*              
            else {
              self.checkarea = true;
            }
*/              
          };          
         
          if (cap.cantouch||self.opt.touchbehavior) {
          
            self.onpreventclick = function(e) {
              if (self.preventclick) {
                self.preventclick.tg.onclick = self.preventclick.click;
                self.preventclick = false;            
                return self.cancelEvent(e);
              }
            }
          
//            self.onmousedown = self.ontouchstart;            
//            self.onmouseup = self.ontouchend;
//            self.onmousemove = self.ontouchmove;

            self.bind(self.win,"mousedown",self.ontouchstart);  // control content dragging

            self.onclick = (cap.isios) ? false : function(e) { 
              if (self.lastmouseup) {
                self.lastmouseup = false;
                return self.cancelEvent(e);
              } else {
                return true;
              }
            }; 
            
            if (self.opt.grabcursorenabled&&cap.cursorgrabvalue) {
              self.css((self.ispage)?self.doc:self.win,{'cursor':cap.cursorgrabvalue});            
              self.css(self.rail,{'cursor':cap.cursorgrabvalue});
            }
            
          } else {

            function checkSelectionScroll(e) {
              if (!self.selectiondrag) return;
              
              if (e) {
                var ww = self.win.outerHeight();
                var df = (e.pageY - self.selectiondrag.top);
                if (df>0&&df<ww) df=0;
                if (df>=ww) df-=ww;
                self.selectiondrag.df = df;                
              }
              if (self.selectiondrag.df==0) return;
              
              var rt = -Math.floor(self.selectiondrag.df/6)*2;              
//              self.doScrollTop(self.getScrollTop(true)+rt);
              self.doScrollBy(rt);
              
              self.debounced("doselectionscroll",function(){checkSelectionScroll()},50);
            }
            
            if ("getSelection" in document) {  // A grade - Major browsers
              self.hasTextSelected = function() {  
                return (document.getSelection().rangeCount>0);
              }
            } 
            else if ("selection" in document) {  //IE9-
              self.hasTextSelected = function() {
                return (document.selection.type != "None");
              }
            } 
            else {
              self.hasTextSelected = function() {  // no support
                return false;
              }
            }            
            
            self.onselectionstart = function(e) {
              if (self.ispage) return;
              self.selectiondrag = self.win.offset();
            }
            self.onselectionend = function(e) {
              self.selectiondrag = false;
            }
            self.onselectiondrag = function(e) {              
              if (!self.selectiondrag) return;
              if (self.hasTextSelected()) self.debounced("selectionscroll",function(){checkSelectionScroll(e)},250);
            }
            
            
          }
          
          if (cap.hasmstouch) {
            self.css(self.rail,{'-ms-touch-action':'none'});
            self.css(self.cursor,{'-ms-touch-action':'none'});
            
            self.bind(self.win,"MSPointerDown",self.ontouchstart);
            self.bind(document,"MSPointerUp",self.ontouchend);
            self.bind(document,"MSPointerMove",self.ontouchmove);
            self.bind(self.cursor,"MSGestureHold",function(e){e.preventDefault()});
            self.bind(self.cursor,"contextmenu",function(e){e.preventDefault()});
          }

          if (this.istouchcapable) {  //desktop with screen touch enabled
            self.bind(self.win,"touchstart",self.ontouchstart);
            self.bind(document,"touchend",self.ontouchend);
            self.bind(document,"touchcancel",self.ontouchend);
            self.bind(document,"touchmove",self.ontouchmove);            
          }
          
          self.bind(self.cursor,"mousedown",self.onmousedown);
          self.bind(self.cursor,"mouseup",self.onmouseup);

          if (self.railh) {
            self.bind(self.cursorh,"mousedown",function(e){self.onmousedown(e,true)});
            self.bind(self.cursorh,"mouseup",function(e){
              if (self.rail.drag&&self.rail.drag.pt==2) return;
              self.rail.drag = false;
              self.hasmoving = false;
              self.hideCursor();
              if (cap.hasmousecapture) document.releaseCapture();
              return self.cancelEvent(e);
            });
          }
    
          if (self.opt.cursordragontouch||!cap.cantouch&&!self.opt.touchbehavior) {

            self.rail.css({"cursor":"default"});
            self.railh&&self.railh.css({"cursor":"default"});          
          
            self.jqbind(self.rail,"mouseenter",function() {
              if (self.canshowonmouseevent) self.showCursor();
              self.rail.active = true;
            });
            self.jqbind(self.rail,"mouseleave",function() { 
              self.rail.active = false;
              if (!self.rail.drag) self.hideCursor();
            });
            
            if (self.opt.sensitiverail) {
              self.bind(self.rail,"click",function(e){self.doRailClick(e,false,false)});
              self.bind(self.rail,"dblclick",function(e){self.doRailClick(e,true,false)});
              self.bind(self.cursor,"click",function(e){self.cancelEvent(e)});
              self.bind(self.cursor,"dblclick",function(e){self.cancelEvent(e)});
            }

            if (self.railh) {
              self.jqbind(self.railh,"mouseenter",function() {
                if (self.canshowonmouseevent) self.showCursor();
                self.rail.active = true;
              });          
              self.jqbind(self.railh,"mouseleave",function() { 
                self.rail.active = false;
                if (!self.rail.drag) self.hideCursor();
              });
              
              if (self.opt.sensitiverail) {
                self.bind(self.railh, "click", function(e){self.doRailClick(e,false,true)});
                self.bind(self.railh, "dblclick", function(e){self.doRailClick(e, true, true) });
                self.bind(self.cursorh, "click", function (e) { self.cancelEvent(e) });
                self.bind(self.cursorh, "dblclick", function (e) { self.cancelEvent(e) });
              }
              
            }
          
          }
    
          if (!cap.cantouch&&!self.opt.touchbehavior) {

            self.bind((cap.hasmousecapture)?self.win:document,"mouseup",self.onmouseup);            
            self.bind(document,"mousemove",self.onmousemove);
            if (self.onclick) self.bind(document,"click",self.onclick);
            
            if (!self.ispage&&self.opt.enablescrollonselection) {
              self.bind(self.win[0],"mousedown",self.onselectionstart);
              self.bind(document,"mouseup",self.onselectionend);
              self.bind(self.cursor,"mouseup",self.onselectionend);
              if (self.cursorh) self.bind(self.cursorh,"mouseup",self.onselectionend);
              self.bind(document,"mousemove",self.onselectiondrag);
            }

            if (self.zoom) {
              self.jqbind(self.zoom,"mouseenter",function() {
                if (self.canshowonmouseevent) self.showCursor();
                self.rail.active = true;
              });          
              self.jqbind(self.zoom,"mouseleave",function() { 
                self.rail.active = false;
                if (!self.rail.drag) self.hideCursor();
              });
            }

          } else {
            
            self.bind((cap.hasmousecapture)?self.win:document,"mouseup",self.ontouchend);
            self.bind(document,"mousemove",self.ontouchmove);
            if (self.onclick) self.bind(document,"click",self.onclick);
            
            if (self.opt.cursordragontouch) {
              self.bind(self.cursor,"mousedown",self.onmousedown);
              self.bind(self.cursor,"mousemove",self.onmousemove);
              self.cursorh&&self.bind(self.cursorh,"mousedown",self.onmousedown);
              self.cursorh&&self.bind(self.cursorh,"mousemove",self.onmousemove);
            }
          
          }
            
          if (self.opt.enablemousewheel) {
            if (!self.isiframe) self.bind((cap.isie&&self.ispage) ? document : self.docscroll,"mousewheel",self.onmousewheel);
            self.bind(self.rail,"mousewheel",self.onmousewheel);
            if (self.railh) self.bind(self.railh,"mousewheel",self.onmousewheelhr);
          }           
            
          if (!self.ispage&&!cap.cantouch&&!(/HTML|BODY/.test(self.win[0].nodeName))) {
            if (!self.win.attr("tabindex")) self.win.attr({"tabindex":tabindexcounter++});
            
            self.jqbind(self.win,"focus",function(e) {
              domfocus = (self.getTarget(e)).id||true;
              self.hasfocus = true;
              if (self.canshowonmouseevent) self.noticeCursor();
            });
            self.jqbind(self.win,"blur",function(e) {
              domfocus = false;
              self.hasfocus = false;
            });
            
            self.jqbind(self.win,"mouseenter",function(e) {
              mousefocus = (self.getTarget(e)).id||true;
              self.hasmousefocus = true;
              if (self.canshowonmouseevent) self.noticeCursor();
            });
            self.jqbind(self.win,"mouseleave",function() {
              mousefocus = false;
              self.hasmousefocus = false;
            });
            
          };
          
        }  // !ie9mobile
        
        //Thanks to http://www.quirksmode.org !!
        self.onkeypress = function(e) {
          if (self.locked&&self.page.maxh==0) return true;
          
          e = (e) ? e : window.e;
          var tg = self.getTarget(e);
          if (tg&&/INPUT|TEXTAREA|SELECT|OPTION/.test(tg.nodeName)) {
            var tp = tg.getAttribute('type')||tg.type||false;            
            if ((!tp)||!(/submit|button|cancel/i.tp)) return true;
          }
          
          if (self.hasfocus||(self.hasmousefocus&&!domfocus)||(self.ispage&&!domfocus&&!mousefocus)) {
            var key = e.keyCode;
            
            if (self.locked&&key!=27) return self.cancelEvent(e);

            var ctrl = e.ctrlKey||false;
            var shift = e.shiftKey || false;
            
            var ret = false;
            switch (key) {
              case 38:
              case 63233: //safari
                self.doScrollBy(24*3);
                ret = true;
                break;
              case 40:
              case 63235: //safari
                self.doScrollBy(-24*3);
                ret = true;
                break;
              case 37:
              case 63232: //safari
                if (self.railh) {
                  (ctrl) ? self.doScrollLeft(0) : self.doScrollLeftBy(24*3);
                  ret = true;
                }
                break;
              case 39:
              case 63234: //safari
                if (self.railh) {
                  (ctrl) ? self.doScrollLeft(self.page.maxw) : self.doScrollLeftBy(-24*3);
                  ret = true;
                }
                break;
              case 33:
              case 63276: // safari
                self.doScrollBy(self.view.h);
                ret = true;
                break;
              case 34:
              case 63277: // safari
                self.doScrollBy(-self.view.h);
                ret = true;
                break;
              case 36:
              case 63273: // safari                
                (self.railh&&ctrl) ? self.doScrollPos(0,0) : self.doScrollTo(0);
                ret = true;
                break;
              case 35:
              case 63275: // safari
                (self.railh&&ctrl) ? self.doScrollPos(self.page.maxw,self.page.maxh) : self.doScrollTo(self.page.maxh);
                ret = true;
                break;
              case 32:
                if (self.opt.spacebarenabled) {
                  (shift) ? self.doScrollBy(self.view.h) : self.doScrollBy(-self.view.h);
                  ret = true;
                }
                break;
              case 27: // ESC
                if (self.zoomactive) {
                  self.doZoom();
                  ret = true;
                }
                break;
            }
            if (ret) return self.cancelEvent(e);
          }
        };
        
        if (self.opt.enablekeyboard) self.bind(document,(cap.isopera&&!cap.isopera12)?"keypress":"keydown",self.onkeypress);
        
        self.bind(window,'resize',self.lazyResize);
        self.bind(window,'orientationchange',self.lazyResize);
        
        self.bind(window,"load",self.lazyResize);
    
        if (cap.ischrome&&!self.ispage&&!self.haswrapper) { //chrome void scrollbar bug - it persists in version 26
          var tmp=self.win.attr("style");
          var ww = parseFloat(self.win.css("width"))+1;
          self.win.css('width',ww);
          self.synched("chromefix",function(){self.win.attr("style",tmp)});
        }
        
        
// Trying a cross-browser implementation - good luck!

        self.onAttributeChange = function(e) {
          self.lazyResize(250);
        }
        
        if (!self.ispage&&!self.haswrapper) {
          // redesigned MutationObserver for Chrome18+/Firefox14+/iOS6+ with support for: remove div, add/remove content
          if (clsMutationObserver !== false) {
            self.observer = new clsMutationObserver(function(mutations) {            
              mutations.forEach(self.onAttributeChange);
            });
            self.observer.observe(self.win[0],{childList: true, characterData: false, attributes: true, subtree: false});
            
            self.observerremover = new clsMutationObserver(function(mutations) {
               mutations.forEach(function(mo){
                 if (mo.removedNodes.length>0) {
                   for (var dd in mo.removedNodes) {
                     if (mo.removedNodes[dd]==self.win[0]) return self.remove();
                   }
                 }
               });
            });
            self.observerremover.observe(self.win[0].parentNode,{childList: true, characterData: false, attributes: false, subtree: false});
            
          } else {        
            self.bind(self.win,(cap.isie&&!cap.isie9)?"propertychange":"DOMAttrModified",self.onAttributeChange);            
            if (cap.isie9) self.win[0].attachEvent("onpropertychange",self.onAttributeChange); //IE9 DOMAttrModified bug
            self.bind(self.win,"DOMNodeRemoved",function(e){
              if (e.target==self.win[0]) self.remove();
            });
          }
        }
        
//

        if (!self.ispage&&self.opt.boxzoom) self.bind(window,"resize",self.resizeZoom);
        if (self.istextarea) self.bind(self.win,"mouseup",self.lazyResize);
        
        self.checkrtlmode = true;
        self.lazyResize(30);
        
      }
      
      if (this.doc[0].nodeName == 'IFRAME') {
        function oniframeload(e) {
          self.iframexd = false;
          try {
            var doc = 'contentDocument' in this ? this.contentDocument : this.contentWindow.document;
            var a = doc.domain;            
          } catch(e){self.iframexd = true;doc=false};
          
          if (self.iframexd) {
            if ("console" in window) console.log('NiceScroll error: policy restriced iframe');
            return true;  //cross-domain - I can't manage this        
          }
          
          self.forcescreen = true;
          
          if (self.isiframe) {            
            self.iframe = {
              "doc":$(doc),
              "html":self.doc.contents().find('html')[0],
              "body":self.doc.contents().find('body')[0]
            };
            self.getContentSize = function(){
              return {
                w:Math.max(self.iframe.html.scrollWidth,self.iframe.body.scrollWidth),
                h:Math.max(self.iframe.html.scrollHeight,self.iframe.body.scrollHeight)
              }
            }            
            self.docscroll = $(self.iframe.body);//$(this.contentWindow);
          }
          
          if (!cap.isios&&self.opt.iframeautoresize&&!self.isiframe) {
            self.win.scrollTop(0); // reset position
            self.doc.height("");  //reset height to fix browser bug
            var hh=Math.max(doc.getElementsByTagName('html')[0].scrollHeight,doc.body.scrollHeight);
            self.doc.height(hh);          
          }
          self.lazyResize(30);
          
          if (cap.isie7) self.css($(self.iframe.html),{'overflow-y':'hidden'});
          //self.css($(doc.body),{'overflow-y':'hidden'});
          self.css($(self.iframe.body),{'overflow-y':'hidden'});
          
          if ('contentWindow' in this) {
            self.bind(this.contentWindow,"scroll",self.onscroll);  //IE8 & minor
          } else {          
            self.bind(doc,"scroll",self.onscroll);
          }                    
          
          if (self.opt.enablemousewheel) {
            self.bind(doc,"mousewheel",self.onmousewheel);
          }
          
          if (self.opt.enablekeyboard) self.bind(doc,(cap.isopera)?"keypress":"keydown",self.onkeypress);
          
          if (cap.cantouch||self.opt.touchbehavior) {
            self.bind(doc,"mousedown",self.onmousedown);
            self.bind(doc,"mousemove",function(e){self.onmousemove(e,true)});
            if (self.opt.grabcursorenabled&&cap.cursorgrabvalue) self.css($(doc.body),{'cursor':cap.cursorgrabvalue});
          }
          
          self.bind(doc,"mouseup",self.onmouseup);
          
          if (self.zoom) {
            if (self.opt.dblclickzoom) self.bind(doc,'dblclick',self.doZoom);
            if (self.ongesturezoom) self.bind(doc,"gestureend",self.ongesturezoom);             
          }
        };
        
        if (this.doc[0].readyState&&this.doc[0].readyState=="complete"){
          setTimeout(function(){oniframeload.call(self.doc[0],false)},500);
        }
        self.bind(this.doc,"load",oniframeload);
        
      }
      
    };
    
    this.showCursor = function(py,px) {
      if (self.cursortimeout) {
        clearTimeout(self.cursortimeout);
        self.cursortimeout = 0;
      }
      if (!self.rail) return;
      if (self.autohidedom) {
        self.autohidedom.stop().css({opacity:self.opt.cursoropacitymax});
        self.cursoractive = true;
      }
      
      if (!self.rail.drag||self.rail.drag.pt!=1) {      
        if ((typeof py != "undefined")&&(py!==false)) {
          self.scroll.y = Math.round(py * 1/self.scrollratio.y);
        }
        if (typeof px != "undefined") {
          self.scroll.x = Math.round(px * 1/self.scrollratio.x);
        }
      }
      
      self.cursor.css({height:self.cursorheight,top:self.scroll.y}); 
      if (self.cursorh) {
        (!self.rail.align&&self.rail.visibility) ? self.cursorh.css({width:self.cursorwidth,left:self.scroll.x+self.rail.width}) : self.cursorh.css({width:self.cursorwidth,left:self.scroll.x});
        self.cursoractive = true;
      }
      
      if (self.zoom) self.zoom.stop().css({opacity:self.opt.cursoropacitymax});      
    };
    
    this.hideCursor = function(tm) {
      if (self.cursortimeout) return;
      if (!self.rail) return;
      if (!self.autohidedom) return;
      self.cursortimeout = setTimeout(function() {
         if (!self.rail.active||!self.showonmouseevent) {
           self.autohidedom.stop().animate({opacity:self.opt.cursoropacitymin});
           if (self.zoom) self.zoom.stop().animate({opacity:self.opt.cursoropacitymin});
           self.cursoractive = false;
         }
         self.cursortimeout = 0;
      },tm||self.opt.hidecursordelay);
    };
    
    this.noticeCursor = function(tm,py,px) {
      self.showCursor(py,px);
      if (!self.rail.active) self.hideCursor(tm);
    };
        
    this.getContentSize = 
      (self.ispage) ?
        function(){
          return {
            w:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),
            h:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)
          }
        }
      : (self.haswrapper) ?
        function(){
          return {
            w:self.doc.outerWidth()+parseInt(self.win.css('paddingLeft'))+parseInt(self.win.css('paddingRight')),
            h:self.doc.outerHeight()+parseInt(self.win.css('paddingTop'))+parseInt(self.win.css('paddingBottom'))
          }
        }
      : function() {        
        return {
          w:self.docscroll[0].scrollWidth,
          h:self.docscroll[0].scrollHeight
        }
      };
  
    this.onResize = function(e,page) {
    
    if (!self.win) return false;
  
      if (!self.haswrapper&&!self.ispage) {
        if (self.win.css('display')=='none') {
          if (self.visibility) self.hideRail().hideRailHr();
          return false;
        } else {          
          if (!self.hidden&&!self.visibility) self.showRail().showRailHr();
        }        
      }
    
      var premaxh = self.page.maxh;
      var premaxw = self.page.maxw;

      var preview = {h:self.view.h,w:self.view.w};   
      
      self.view = {
        w:(self.ispage) ? self.win.width() : parseInt(self.win[0].clientWidth),
        h:(self.ispage) ? self.win.height() : parseInt(self.win[0].clientHeight)
      };
      
      self.page = (page) ? page : self.getContentSize();
      
      self.page.maxh = Math.max(0,self.page.h - self.view.h);
      self.page.maxw = Math.max(0,self.page.w - self.view.w);
      
      if ((self.page.maxh==premaxh)&&(self.page.maxw==premaxw)&&(self.view.w==preview.w)) {
        // test position        
        if (!self.ispage) {
          var pos = self.win.offset();
          if (self.lastposition) {
            var lst = self.lastposition;
            if ((lst.top==pos.top)&&(lst.left==pos.left)) return self; //nothing to do            
          }
          self.lastposition = pos;
        } else {
          return self; //nothing to do
        }
      }
      
      if (self.page.maxh==0) {
        self.hideRail();        
        self.scrollvaluemax = 0;
        self.scroll.y = 0;
        self.scrollratio.y = 0;
        self.cursorheight = 0;
        self.setScrollTop(0);
        self.rail.scrollable = false;
      } else {       
        self.rail.scrollable = true;
      }
      
      if (self.page.maxw==0) {
        self.hideRailHr();
        self.scrollvaluemaxw = 0;
        self.scroll.x = 0;
        self.scrollratio.x = 0;
        self.cursorwidth = 0;
        self.setScrollLeft(0);
        self.railh.scrollable = false;
      } else {        
        self.railh.scrollable = true;
      }
  
      self.locked = (self.page.maxh==0)&&(self.page.maxw==0);
      if (self.locked) {
        if (!self.ispage) self.updateScrollBar(self.view);
        return false;
      }

      if (!self.hidden&&!self.visibility) {
        self.showRail().showRailHr();
      }      
      else if (!self.hidden&&!self.railh.visibility) self.showRailHr();
      
      if (self.istextarea&&self.win.css('resize')&&self.win.css('resize')!='none') self.view.h-=20;      

      self.cursorheight = Math.min(self.view.h,Math.round(self.view.h * (self.view.h / self.page.h)));
      self.cursorheight = (self.opt.cursorfixedheight) ? self.opt.cursorfixedheight : Math.max(self.opt.cursorminheight,self.cursorheight);

      self.cursorwidth = Math.min(self.view.w,Math.round(self.view.w * (self.view.w / self.page.w)));
      self.cursorwidth = (self.opt.cursorfixedheight) ? self.opt.cursorfixedheight : Math.max(self.opt.cursorminheight,self.cursorwidth);
      
      self.scrollvaluemax = self.view.h-self.cursorheight-self.cursor.hborder;
      
      if (self.railh) {
        self.railh.width = (self.page.maxh>0) ? (self.view.w-self.rail.width) : self.view.w;
        self.scrollvaluemaxw = self.railh.width-self.cursorwidth-self.cursorh.wborder;
      }
      
      if (self.checkrtlmode&&self.railh) {
        self.checkrtlmode = false;
        if (self.opt.rtlmode&&self.scroll.x==0) self.setScrollLeft(self.page.maxw);
      }
      
      if (!self.ispage) self.updateScrollBar(self.view);
      
      self.scrollratio = {
        x:(self.page.maxw/self.scrollvaluemaxw),
        y:(self.page.maxh/self.scrollvaluemax)
      };
     
      var sy = self.getScrollTop();
      if (sy>self.page.maxh) {
        self.doScrollTop(self.page.maxh);
      } else {     
        self.scroll.y = Math.round(self.getScrollTop() * (1/self.scrollratio.y));
        self.scroll.x = Math.round(self.getScrollLeft() * (1/self.scrollratio.x));
        if (self.cursoractive) self.noticeCursor();     
      }      
      
      if (self.scroll.y&&(self.getScrollTop()==0)) self.doScrollTo(Math.floor(self.scroll.y*self.scrollratio.y));
      
      return self;
    };
    
    this.resize = self.onResize;
    
    this.lazyResize = function(tm) {   // event debounce
      tm = (isNaN(tm)) ? 30 : tm;
      self.delayed('resize',self.resize,tm);
      return self;
    }
   
// modified by MDN https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/wheel
    function _modernWheelEvent(dom,name,fn,bubble) {      
      self._bind(dom,name,function(e){
        var  e = (e) ? e : window.event;
        var event = {
          original: e,
          target: e.target || e.srcElement,
          type: "wheel",
          deltaMode: e.type == "MozMousePixelScroll" ? 0 : 1,
          deltaX: 0,
          deltaZ: 0,
          preventDefault: function() {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            return false;
          },
          stopImmediatePropagation: function() {
            (e.stopImmediatePropagation) ? e.stopImmediatePropagation() : e.cancelBubble = true;
          }
        };
            
        if (name=="mousewheel") {
          event.deltaY = - 1/40 * e.wheelDelta;
          e.wheelDeltaX && (event.deltaX = - 1/40 * e.wheelDeltaX);
        } else {
          event.deltaY = e.detail;
        }

        return fn.call(dom,event);      
      },bubble);
    };     
   
    this._bind = function(el,name,fn,bubble) {  // primitive bind
      self.events.push({e:el,n:name,f:fn,b:bubble,q:false});
      if (el.addEventListener) {
        el.addEventListener(name,fn,bubble||false);
      }
      else if (el.attachEvent) {
        el.attachEvent("on"+name,fn);
      }
      else {
        el["on"+name] = fn;        
      }        
    };
   
    this.jqbind = function(dom,name,fn) {  // use jquery bind for non-native events (mouseenter/mouseleave)
      self.events.push({e:dom,n:name,f:fn,q:true});
      $(dom).bind(name,fn);
    }
   
    this.bind = function(dom,name,fn,bubble) {  // touch-oriented & fixing jquery bind
      var el = ("jquery" in dom) ? dom[0] : dom;
      
      if (name=='mousewheel') {
        if ("onwheel" in self.win) {            
          self._bind(el,"wheel",fn,bubble||false);
        } else {            
          var wname = (typeof document.onmousewheel != "undefined") ? "mousewheel" : "DOMMouseScroll";  // older IE/Firefox
          _modernWheelEvent(el,wname,fn,bubble||false);
          if (wname=="DOMMouseScroll") _modernWheelEvent(el,"MozMousePixelScroll",fn,bubble||false);  // Firefox legacy
        }
      } 
      else if (el.addEventListener) {
        if (cap.cantouch && /mouseup|mousedown|mousemove/.test(name)) {  // touch device support
          var tt=(name=='mousedown')?'touchstart':(name=='mouseup')?'touchend':'touchmove';
          self._bind(el,tt,function(e){
            if (e.touches) {
              if (e.touches.length<2) {var ev=(e.touches.length)?e.touches[0]:e;ev.original=e;fn.call(this,ev);}
            } 
            else if (e.changedTouches) {var ev=e.changedTouches[0];ev.original=e;fn.call(this,ev);}  //blackberry
          },bubble||false);
        }
        self._bind(el,name,fn,bubble||false);
        if (cap.cantouch && name=="mouseup") self._bind(el,"touchcancel",fn,bubble||false);
      }
      else {
        self._bind(el,name,function(e) {
          e = e||window.event||false;
          if (e) {
            if (e.srcElement) e.target=e.srcElement;
          }
          if (!("pageY" in e)) {
            e.pageX = e.clientX + document.documentElement.scrollLeft;
            e.pageY = e.clientY + document.documentElement.scrollTop; 
          }
          return ((fn.call(el,e)===false)||bubble===false) ? self.cancelEvent(e) : true;
        });
      } 
    };
    
    this._unbind = function(el,name,fn,bub) {  // primitive unbind
      if (el.removeEventListener) {
        el.removeEventListener(name,fn,bub);
      }
      else if (el.detachEvent) {
        el.detachEvent('on'+name,fn);
      } else {
        el['on'+name] = false;
      }
    };
    
    this.unbindAll = function() {
      for(var a=0;a<self.events.length;a++) {
        var r = self.events[a];        
        (r.q) ? r.e.unbind(r.n,r.f) : self._unbind(r.e,r.n,r.f,r.b);
      }
    };
    
    // Thanks to http://www.switchonthecode.com !!
    this.cancelEvent = function(e) {
      var e = (e.original) ? e.original : (e) ? e : window.event||false;
      if (!e) return false;      
      if(e.preventDefault) e.preventDefault();
      if(e.stopPropagation) e.stopPropagation();
      if(e.preventManipulation) e.preventManipulation();  //IE10
      e.cancelBubble = true;
      e.cancel = true;
      e.returnValue = false;
      return false;
    };

    this.stopPropagation = function(e) {
      var e = (e.original) ? e.original : (e) ? e : window.event||false;
      if (!e) return false;
      if (e.stopPropagation) return e.stopPropagation();
      if (e.cancelBubble) e.cancelBubble=true;
      return false;
    }
    
    this.showRail = function() {
      if ((self.page.maxh!=0)&&(self.ispage||self.win.css('display')!='none')) {
        self.visibility = true;
        self.rail.visibility = true;
        self.rail.css('display','block');
      }
      return self;
    };

    this.showRailHr = function() {
      if (!self.railh) return self;
      if ((self.page.maxw!=0)&&(self.ispage||self.win.css('display')!='none')) {
        self.railh.visibility = true;
        self.railh.css('display','block');
      }
      return self;
    };
    
    this.hideRail = function() {
      self.visibility = false;
      self.rail.visibility = false;
      self.rail.css('display','none');
      return self;
    };

    this.hideRailHr = function() {
      if (!self.railh) return self;
      self.railh.visibility = false;
      self.railh.css('display','none');
      return self;
    };
    
    this.show = function() {
      self.hidden = false;
      self.locked = false;
      return self.showRail().showRailHr();
    };

    this.hide = function() {
      self.hidden = true;
      self.locked = true;
      return self.hideRail().hideRailHr();
    };
    
    this.toggle = function() {
      return (self.hidden) ? self.show() : self.hide();
    };
    
    this.remove = function() {
      self.stop();
      if (self.cursortimeout) clearTimeout(self.cursortimeout);
      self.doZoomOut();
      self.unbindAll();      
      if (self.observer !== false) self.observer.disconnect();
      if (self.observerremover !== false) self.observerremover.disconnect();      
      self.events = [];
      if (self.cursor) {
        self.cursor.remove();
        self.cursor = null;
      }
      if (self.cursorh) {
        self.cursorh.remove();
        self.cursorh = null;
      }
      if (self.rail) {
        self.rail.remove();
        self.rail = null;
      }
      if (self.railh) {
        self.railh.remove();
        self.railh = null;
      }
      if (self.zoom) {
        self.zoom.remove();
        self.zoom = null;
      }
      for(var a=0;a<self.saved.css.length;a++) {
        var d=self.saved.css[a];
        d[0].css(d[1],(typeof d[2]=="undefined") ? '' : d[2]);
      }
      self.saved = false;      
      self.me.data('__nicescroll',''); //erase all traces
    self.me = null;
    self.doc = null;
    self.docscroll = null;
    self.win = null;
      return self;
    };
    
    this.scrollstart = function(fn) {
      this.onscrollstart = fn;
      return self;
    }
    this.scrollend = function(fn) {
      this.onscrollend = fn;
      return self;
    }
    this.scrollcancel = function(fn) {
      this.onscrollcancel = fn;
      return self;
    }
    
    this.zoomin = function(fn) {
      this.onzoomin = fn;
      return self;
    }
    this.zoomout = function(fn) {
      this.onzoomout = fn;
      return self;
    }
    
    this.isScrollable = function(e) {      
      var dom = (e.target) ? e.target : e;
      if (dom.nodeName == 'OPTION') return true;
      while (dom&&(dom.nodeType==1)&&!(/BODY|HTML/.test(dom.nodeName))) {
        var dd = $(dom);
        var ov = dd.css('overflowY')||dd.css('overflowX')||dd.css('overflow')||'';
        if (/scroll|auto/.test(ov)) return (dom.clientHeight!=dom.scrollHeight);
        dom = (dom.parentNode) ? dom.parentNode : false;        
      }
      return false;
    };

    this.getViewport = function(me) {      
      var dom = (me&&me.parentNode) ? me.parentNode : false;
      while (dom&&(dom.nodeType==1)&&!(/BODY|HTML/.test(dom.nodeName))) {
        var dd = $(dom);
        var ov = dd.css('overflowY')||dd.css('overflowX')||dd.css('overflow')||'';
        if ((/scroll|auto/.test(ov))&&(dom.clientHeight!=dom.scrollHeight)) return dd;
        if (dd.getNiceScroll().length>0) return dd;
        dom = (dom.parentNode) ? dom.parentNode : false;
      }
      return false;
    };
    
    function execScrollWheel(e,hr,chkscroll) {
      var px,py;
      var rt = 1;

      if (e.deltaMode==0) {  // PIXEL
        px = -Math.floor(e.deltaX*(self.opt.mousescrollstep/(18*3)));
        py = -Math.floor(e.deltaY*(self.opt.mousescrollstep/(18*3)));
      }
      else if (e.deltaMode==1) {  // LINE
        px = -Math.floor(e.deltaX*self.opt.mousescrollstep);
        py = -Math.floor(e.deltaY*self.opt.mousescrollstep);
      }
      
      if (hr&&(px==0)&&py) {  // classic vertical-only mousewheel + browser with x/y support 
        px = py;
        py = 0;
      }

      if (px) {
        if (self.scrollmom) {self.scrollmom.stop()}
        self.lastdeltax+=px;
        self.debounced("mousewheelx",function(){var dt=self.lastdeltax;self.lastdeltax=0;if(!self.rail.drag){self.doScrollLeftBy(dt)}},120);
      }
      if (py) {
        if (self.opt.nativeparentscrolling&&chkscroll&&!self.ispage&&!self.zoomactive) {
          if (py<0) {
            if (self.getScrollTop()>=self.page.maxh) return true;
          } else {
            if (self.getScrollTop()<=0) return true;
          }
        }
        if (self.scrollmom) {self.scrollmom.stop()}
        self.lastdeltay+=py;
        self.debounced("mousewheely",function(){var dt=self.lastdeltay;self.lastdeltay=0;if(!self.rail.drag){self.doScrollBy(dt)}},120);
      }
      
      e.stopImmediatePropagation();
      return e.preventDefault();
//      return self.cancelEvent(e);
    };
    
    this.onmousewheel = function(e) {
      if (self.locked) return true;
      if (self.rail.drag) return self.cancelEvent(e);
      
      if (!self.rail.scrollable) {
        if (self.railh&&self.railh.scrollable) {
          return self.onmousewheelhr(e);
        } else {
          return true;
        }
      }
      
      var nw = +(new Date());
      var chk = false;
      if (self.opt.preservenativescrolling&&((self.checkarea+600)<nw)) {
//        self.checkarea = false;
        self.nativescrollingarea = self.isScrollable(e);
        chk = true;
      }
      self.checkarea = nw;
      if (self.nativescrollingarea) return true; // this isn't my business
//      if (self.locked) return self.cancelEvent(e);
      var ret = execScrollWheel(e,false,chk);
      if (ret) self.checkarea = 0;
      return ret;
    };

    this.onmousewheelhr = function(e) {
      if (self.locked||!self.railh.scrollable) return true;
      if (self.rail.drag) return self.cancelEvent(e);
      
      var nw = +(new Date());
      var chk = false;
      if (self.opt.preservenativescrolling&&((self.checkarea+600)<nw)) {
//        self.checkarea = false;
        self.nativescrollingarea = self.isScrollable(e); 
        chk = true;
      }
      self.checkarea = nw;
      if (self.nativescrollingarea) return true; // this isn't my business
      if (self.locked) return self.cancelEvent(e);

      return execScrollWheel(e,true,chk);
    };
    
    this.stop = function() {
      self.cancelScroll();
      if (self.scrollmon) self.scrollmon.stop();
      self.cursorfreezed = false;
      self.scroll.y = Math.round(self.getScrollTop() * (1/self.scrollratio.y));      
      self.noticeCursor();
      return self;
    };
    
    this.getTransitionSpeed = function(dif) {
      var sp = Math.round(self.opt.scrollspeed*10);
      var ex = Math.min(sp,Math.round((dif / 20) * self.opt.scrollspeed));
      return (ex>20) ? ex : 0;
    }
    
    if (!self.opt.smoothscroll) {
      this.doScrollLeft = function(x,spd) {  //direct
        var y = self.getScrollTop();
        self.doScrollPos(x,y,spd);
      }      
      this.doScrollTop = function(y,spd) {   //direct
        var x = self.getScrollLeft();
        self.doScrollPos(x,y,spd);
      }
      this.doScrollPos = function(x,y,spd) {  //direct
        var nx = (x>self.page.maxw) ? self.page.maxw : x;
        if (nx<0) nx=0;
        var ny = (y>self.page.maxh) ? self.page.maxh : y;
        if (ny<0) ny=0;
        self.synched('scroll',function(){
          self.setScrollTop(ny);
          self.setScrollLeft(nx);
        });
      }
      this.cancelScroll = function() {}; // direct
    } 
    else if (self.ishwscroll&&cap.hastransition&&self.opt.usetransition) {
      this.prepareTransition = function(dif,istime) {
        var ex = (istime) ? ((dif>20)?dif:0) : self.getTransitionSpeed(dif);        
        var trans = (ex) ? cap.prefixstyle+'transform '+ex+'ms ease-out' : '';
        if (!self.lasttransitionstyle||self.lasttransitionstyle!=trans) {
          self.lasttransitionstyle = trans;
          self.doc.css(cap.transitionstyle,trans);
        }
        return ex;
      };
      
      this.doScrollLeft = function(x,spd) {  //trans
        var y = (self.scrollrunning) ? self.newscrolly : self.getScrollTop();
        self.doScrollPos(x,y,spd);
      }      
      
      this.doScrollTop = function(y,spd) {   //trans
        var x = (self.scrollrunning) ? self.newscrollx : self.getScrollLeft();
        self.doScrollPos(x,y,spd);
      }
      
      this.doScrollPos = function(x,y,spd) {  //trans
   
        var py = self.getScrollTop();
        var px = self.getScrollLeft();        
      
        if (((self.newscrolly-py)*(y-py)<0)||((self.newscrollx-px)*(x-px)<0)) self.cancelScroll();  //inverted movement detection      
        
        if (self.opt.bouncescroll==false) {
          if (y<0) y=0;
          else if (y>self.page.maxh) y=self.page.maxh;
          if (x<0) x=0;
          else if (x>self.page.maxw) x=self.page.maxw;
        }
        
        if (self.scrollrunning&&x==self.newscrollx&&y==self.newscrolly) return false;
        
        self.newscrolly = y;
        self.newscrollx = x;
        
        self.newscrollspeed = spd||false;
        
        if (self.timer) return false;
        
        self.timer = setTimeout(function(){
        
          var top = self.getScrollTop();
          var lft = self.getScrollLeft();
          
          var dst = {};
          dst.x = x-lft;
          dst.y = y-top;
          dst.px = lft;
          dst.py = top;
          
          var dd = Math.round(Math.sqrt(Math.pow(dst.x,2)+Math.pow(dst.y,2)));          
          
//          var df = (self.newscrollspeed) ? self.newscrollspeed : dd;
          
          var ms = (self.newscrollspeed && self.newscrollspeed>1) ? self.newscrollspeed : self.getTransitionSpeed(dd);
          if (self.newscrollspeed&&self.newscrollspeed<=1) ms*=self.newscrollspeed;
          
          self.prepareTransition(ms,true);
          
          if (self.timerscroll&&self.timerscroll.tm) clearInterval(self.timerscroll.tm);    
          
          if (ms>0) {
          
            if (!self.scrollrunning&&self.onscrollstart) {
              var info = {"type":"scrollstart","current":{"x":lft,"y":top},"request":{"x":x,"y":y},"end":{"x":self.newscrollx,"y":self.newscrolly},"speed":ms};
              self.onscrollstart.call(self,info);
            }
            
            if (cap.transitionend) {
              if (!self.scrollendtrapped) {
                self.scrollendtrapped = true;
                self.bind(self.doc,cap.transitionend,self.onScrollEnd,false); //I have got to do something usefull!!
              }
            } else {              
              if (self.scrollendtrapped) clearTimeout(self.scrollendtrapped);
              self.scrollendtrapped = setTimeout(self.onScrollEnd,ms);  // simulate transitionend event
            }
            
            var py = top;
            var px = lft;
            self.timerscroll = {
              bz: new BezierClass(py,self.newscrolly,ms,0,0,0.58,1),
              bh: new BezierClass(px,self.newscrollx,ms,0,0,0.58,1)
            };            
            if (!self.cursorfreezed) self.timerscroll.tm=setInterval(function(){self.showCursor(self.getScrollTop(),self.getScrollLeft())},60);
            
          }
          
          self.synched("doScroll-set",function(){
            self.timer = 0;
            if (self.scrollendtrapped) self.scrollrunning = true;
            self.setScrollTop(self.newscrolly);
            self.setScrollLeft(self.newscrollx);
            if (!self.scrollendtrapped) self.onScrollEnd();
          });
          
          
        },50);
        
      };
      
      this.cancelScroll = function() {
        if (!self.scrollendtrapped) return true;        
        var py = self.getScrollTop();
        var px = self.getScrollLeft();
        self.scrollrunning = false;
        if (!cap.transitionend) clearTimeout(cap.transitionend);
        self.scrollendtrapped = false;
        self._unbind(self.doc,cap.transitionend,self.onScrollEnd);        
        self.prepareTransition(0);
        self.setScrollTop(py); // fire event onscroll
        if (self.railh) self.setScrollLeft(px);
        if (self.timerscroll&&self.timerscroll.tm) clearInterval(self.timerscroll.tm);
        self.timerscroll = false;
        
        self.cursorfreezed = false;

        //self.noticeCursor(false,py,px);
        self.showCursor(py,px);
        return self;
      };
      this.onScrollEnd = function() {                
        if (self.scrollendtrapped) self._unbind(self.doc,cap.transitionend,self.onScrollEnd);
        self.scrollendtrapped = false;        
        self.prepareTransition(0);
        if (self.timerscroll&&self.timerscroll.tm) clearInterval(self.timerscroll.tm);
        self.timerscroll = false;        
        var py = self.getScrollTop();
        var px = self.getScrollLeft();
        self.setScrollTop(py);  // fire event onscroll        
        if (self.railh) self.setScrollLeft(px);  // fire event onscroll left
        
        self.noticeCursor(false,py,px);     
        
        self.cursorfreezed = false;
        
        if (py<0) py=0
        else if (py>self.page.maxh) py=self.page.maxh;
        if (px<0) px=0
        else if (px>self.page.maxw) px=self.page.maxw;
        if((py!=self.newscrolly)||(px!=self.newscrollx)) return self.doScrollPos(px,py,self.opt.snapbackspeed);
        
        if (self.onscrollend&&self.scrollrunning) {
          var info = {"type":"scrollend","current":{"x":px,"y":py},"end":{"x":self.newscrollx,"y":self.newscrolly}};
          self.onscrollend.call(self,info);
        } 
        self.scrollrunning = false;
        
      };

    } else {

      this.doScrollLeft = function(x,spd) {  //no-trans
        var y = (self.scrollrunning) ? self.newscrolly : self.getScrollTop();
        self.doScrollPos(x,y,spd);
      }

      this.doScrollTop = function(y,spd) {  //no-trans
        var x = (self.scrollrunning) ? self.newscrollx : self.getScrollLeft();
        self.doScrollPos(x,y,spd);
      }

      this.doScrollPos = function(x,y,spd) {  //no-trans
        var y = ((typeof y == "undefined")||(y===false)) ? self.getScrollTop(true) : y;
      
        if  ((self.timer)&&(self.newscrolly==y)&&(self.newscrollx==x)) return true;
      
        if (self.timer) clearAnimationFrame(self.timer);
        self.timer = 0;      

        var py = self.getScrollTop();
        var px = self.getScrollLeft();
        
        if (((self.newscrolly-py)*(y-py)<0)||((self.newscrollx-px)*(x-px)<0)) self.cancelScroll();  //inverted movement detection
        
        self.newscrolly = y;
        self.newscrollx = x;
        
        if (!self.bouncescroll||!self.rail.visibility) {
          if (self.newscrolly<0) {
            self.newscrolly = 0;
          }
          else if (self.newscrolly>self.page.maxh) {
            self.newscrolly = self.page.maxh;
          }
        }
        if (!self.bouncescroll||!self.railh.visibility) {
          if (self.newscrollx<0) {
            self.newscrollx = 0;
          }
          else if (self.newscrollx>self.page.maxw) {
            self.newscrollx = self.page.maxw;
          }
        }

        self.dst = {};
        self.dst.x = x-px;
        self.dst.y = y-py;
        self.dst.px = px;
        self.dst.py = py;
        
        var dst = Math.round(Math.sqrt(Math.pow(self.dst.x,2)+Math.pow(self.dst.y,2)));
        
        self.dst.ax = self.dst.x / dst;
        self.dst.ay = self.dst.y / dst;
        
        var pa = 0;
        var pe = dst;
        
        if (self.dst.x==0) {
          pa = py;
          pe = y;
          self.dst.ay = 1;
          self.dst.py = 0;
        } else if (self.dst.y==0) {
          pa = px;
          pe = x;
          self.dst.ax = 1;
          self.dst.px = 0;
        }

        var ms = self.getTransitionSpeed(dst);
        if (spd&&spd<=1) ms*=spd;
        if (ms>0) {
          self.bzscroll = (self.bzscroll) ? self.bzscroll.update(pe,ms) : new BezierClass(pa,pe,ms,0,1,0,1);
        } else {
          self.bzscroll = false;
        }
        
        if (self.timer) return;
        
        if ((py==self.page.maxh&&y>=self.page.maxh)||(px==self.page.maxw&&x>=self.page.maxw)) self.checkContentSize();
        
        var sync = 1;
        
        function scrolling() {          
          if (self.cancelAnimationFrame) return true;
          
          self.scrollrunning = true;
          
          sync = 1-sync;
          if (sync) return (self.timer = setAnimationFrame(scrolling)||1);

          var done = 0;
          
          var sc = sy = self.getScrollTop();
          if (self.dst.ay) {            
            sc = (self.bzscroll) ? self.dst.py + (self.bzscroll.getNow()*self.dst.ay) : self.newscrolly;
            var dr=sc-sy;          
            if ((dr<0&&sc<self.newscrolly)||(dr>0&&sc>self.newscrolly)) sc = self.newscrolly;
            self.setScrollTop(sc);
            if (sc == self.newscrolly) done=1;
          } else {
            done=1;
          }
          
          var scx = sx = self.getScrollLeft();
          if (self.dst.ax) {            
            scx = (self.bzscroll) ? self.dst.px + (self.bzscroll.getNow()*self.dst.ax) : self.newscrollx;            
            var dr=scx-sx;
            if ((dr<0&&scx<self.newscrollx)||(dr>0&&scx>self.newscrollx)) scx = self.newscrollx;
            self.setScrollLeft(scx);
            if (scx == self.newscrollx) done+=1;
          } else {
            done+=1;
          }
          
          if (done==2) {
            self.timer = 0;
            self.cursorfreezed = false;
            self.bzscroll = false;
            self.scrollrunning = false;
            if (sc<0) sc=0;
            else if (sc>self.page.maxh) sc=self.page.maxh;
            if (scx<0) scx=0;
            else if (scx>self.page.maxw) scx=self.page.maxw;
            if ((scx!=self.newscrollx)||(sc!=self.newscrolly)) self.doScrollPos(scx,sc);
            else {
              if (self.onscrollend) {
                var info = {"type":"scrollend","current":{"x":sx,"y":sy},"end":{"x":self.newscrollx,"y":self.newscrolly}};
                self.onscrollend.call(self,info);
              }             
            } 
          } else {
            self.timer = setAnimationFrame(scrolling)||1;
          }
        };
        self.cancelAnimationFrame=false;
        self.timer = 1;

        if (self.onscrollstart&&!self.scrollrunning) {
          var info = {"type":"scrollstart","current":{"x":px,"y":py},"request":{"x":x,"y":y},"end":{"x":self.newscrollx,"y":self.newscrolly},"speed":ms};
          self.onscrollstart.call(self,info);
        }        

        scrolling();
        
        if ((py==self.page.maxh&&y>=py)||(px==self.page.maxw&&x>=px)) self.checkContentSize();
        
        self.noticeCursor();
      };
  
      this.cancelScroll = function() {        
        if (self.timer) clearAnimationFrame(self.timer);
        self.timer = 0;
        self.bzscroll = false;
        self.scrollrunning = false;
        return self;
      };
      
    }
    
    this.doScrollBy = function(stp,relative) {
      var ny = 0;
      if (relative) {
        ny = Math.floor((self.scroll.y-stp)*self.scrollratio.y)
      } else {        
        var sy = (self.timer) ? self.newscrolly : self.getScrollTop(true);
        ny = sy-stp;
      }
      if (self.bouncescroll) {
        var haf = Math.round(self.view.h/2);
        if (ny<-haf) ny=-haf
        else if (ny>(self.page.maxh+haf)) ny = (self.page.maxh+haf);
      }
      self.cursorfreezed = false;      

      py = self.getScrollTop(true);
      if (ny<0&&py<=0) return self.noticeCursor();      
      else if (ny>self.page.maxh&&py>=self.page.maxh) {
        self.checkContentSize();
        return self.noticeCursor();
      }
      
      self.doScrollTop(ny);
    };

    this.doScrollLeftBy = function(stp,relative) {
      var nx = 0;
      if (relative) {
        nx = Math.floor((self.scroll.x-stp)*self.scrollratio.x)
      } else {
        var sx = (self.timer) ? self.newscrollx : self.getScrollLeft(true);
        nx = sx-stp;
      }
      if (self.bouncescroll) {
        var haf = Math.round(self.view.w/2);
        if (nx<-haf) nx=-haf
        else if (nx>(self.page.maxw+haf)) nx = (self.page.maxw+haf);
      }
      self.cursorfreezed = false;    

      px = self.getScrollLeft(true);
      if (nx<0&&px<=0) return self.noticeCursor();      
      else if (nx>self.page.maxw&&px>=self.page.maxw) return self.noticeCursor();
      
      self.doScrollLeft(nx);
    };
    
    this.doScrollTo = function(pos,relative) {
      var ny = (relative) ? Math.round(pos*self.scrollratio.y) : pos;
      if (ny<0) ny=0
      else if (ny>self.page.maxh) ny = self.page.maxh;
      self.cursorfreezed = false;
      self.doScrollTop(pos);
    };
    
    this.checkContentSize = function() {      
      var pg = self.getContentSize();
      if ((pg.h!=self.page.h)||(pg.w!=self.page.w)) self.resize(false,pg);
    };
    
    self.onscroll = function(e) {    
      if (self.rail.drag) return;
      if (!self.cursorfreezed) {
        self.synched('scroll',function(){
          self.scroll.y = Math.round(self.getScrollTop() * (1/self.scrollratio.y));
          if (self.railh) self.scroll.x = Math.round(self.getScrollLeft() * (1/self.scrollratio.x));
          self.noticeCursor();
        });
      }
    };
    self.bind(self.docscroll,"scroll",self.onscroll);
    
    this.doZoomIn = function(e) {
      if (self.zoomactive) return;
      self.zoomactive = true;
      
      self.zoomrestore = {
        style:{}
      };
      var lst = ['position','top','left','zIndex','backgroundColor','marginTop','marginBottom','marginLeft','marginRight'];
      var win = self.win[0].style;
      for(var a in lst) {
        var pp = lst[a];
        self.zoomrestore.style[pp] = (typeof win[pp] != "undefined") ? win[pp] : '';        
      }
      
      self.zoomrestore.style.width = self.win.css('width');
      self.zoomrestore.style.height = self.win.css('height');
      
      self.zoomrestore.padding = {
        w:self.win.outerWidth()-self.win.width(),
        h:self.win.outerHeight()-self.win.height()
      };
      
      if (cap.isios4) {
        self.zoomrestore.scrollTop = $(window).scrollTop();
        $(window).scrollTop(0);
      }
      
      self.win.css({
        "position":(cap.isios4)?"absolute":"fixed",
        "top":0,
        "left":0,
        "z-index":globalmaxzindex+100,
        "margin":"0px"
      });
      var bkg = self.win.css("backgroundColor");      
      if (bkg==""||/transparent|rgba\(0, 0, 0, 0\)|rgba\(0,0,0,0\)/.test(bkg)) self.win.css("backgroundColor","#fff");
      self.rail.css({"z-index":globalmaxzindex+101});
      self.zoom.css({"z-index":globalmaxzindex+102});      
      self.zoom.css('backgroundPosition','0px -18px');
      self.resizeZoom();
      
      if (self.onzoomin) self.onzoomin.call(self);
      
      return self.cancelEvent(e);
    };

    this.doZoomOut = function(e) {
      if (!self.zoomactive) return;
      self.zoomactive = false;
      
      self.win.css("margin","");
      self.win.css(self.zoomrestore.style);
      
      if (cap.isios4) {
        $(window).scrollTop(self.zoomrestore.scrollTop);
      }
      
      self.rail.css({"z-index":self.zindex});
      self.zoom.css({"z-index":self.zindex});
      self.zoomrestore = false;
      self.zoom.css('backgroundPosition','0px 0px');
      self.onResize();
      
      if (self.onzoomout) self.onzoomout.call(self);
      
      return self.cancelEvent(e);
    };
    
    this.doZoom = function(e) {
      return (self.zoomactive) ? self.doZoomOut(e) : self.doZoomIn(e);
    };
    
    this.resizeZoom = function() {
      if (!self.zoomactive) return;

      var py = self.getScrollTop(); //preserve scrolling position
      self.win.css({
        width:$(window).width()-self.zoomrestore.padding.w+"px",
        height:$(window).height()-self.zoomrestore.padding.h+"px"
      });
      self.onResize();
      
      self.setScrollTop(Math.min(self.page.maxh,py));
    };
   
    this.init();
    
    $.nicescroll.push(this);

  };
  
// Inspired by the work of Kin Blas
// http://webpro.host.adobe.com/people/jblas/momentum/includes/jquery.momentum.0.7.js  
  
  
  var ScrollMomentumClass2D = function(nc) {
    var self = this;
    this.nc = nc;
    
    this.lastx = 0;
    this.lasty = 0;
    this.speedx = 0;
    this.speedy = 0;
    this.lasttime = 0;
    this.steptime = 0;
    this.snapx = false;
    this.snapy = false;
    this.demulx = 0;
    this.demuly = 0;
    
    this.lastscrollx = -1;
    this.lastscrolly = -1;
    
    this.chkx = 0;
    this.chky = 0;
    
    this.timer = 0;
    
    this.time = function() {
      return +new Date();//beautifull hack
    };
    
    this.reset = function(px,py) {
      self.stop();
      var now = self.time();
      self.steptime = 0;
      self.lasttime = now;
      self.speedx = 0;
      self.speedy = 0;
      self.lastx = px;
      self.lasty = py;
      self.lastscrollx = -1;
      self.lastscrolly = -1;
    };
    
    this.update = function(px,py) {
      var now = self.time();
      self.steptime = now - self.lasttime;
      self.lasttime = now;      
      var dy = py - self.lasty;
      var dx = px - self.lastx;
      var sy = self.nc.getScrollTop();
      var sx = self.nc.getScrollLeft();
      var newy = sy + dy;
      var newx = sx + dx;
      self.snapx = (newx<0)||(newx>self.nc.page.maxw);
      self.snapy = (newy<0)||(newy>self.nc.page.maxh);
      self.speedx = dx;
      self.speedy = dy;
      self.lastx = px;
      self.lasty = py;
    };
    
    this.stop = function() {
      self.nc.unsynched("domomentum2d");
      if (self.timer) clearTimeout(self.timer);
      self.timer = 0;
      self.lastscrollx = -1;
      self.lastscrolly = -1;
    };
    
    this.doSnapy = function(nx,ny) {
      var snap = false;
      
      if (ny<0) {
        ny=0;
        snap=true;        
      } 
      else if (ny>self.nc.page.maxh) {
        ny=self.nc.page.maxh;
        snap=true;
      }

      if (nx<0) {
        nx=0;
        snap=true;        
      } 
      else if (nx>self.nc.page.maxw) {
        nx=self.nc.page.maxw;
        snap=true;
      }
      
      if (snap) self.nc.doScrollPos(nx,ny,self.nc.opt.snapbackspeed);
    };
    
    this.doMomentum = function(gp) {
      var t = self.time();
      var l = (gp) ? t+gp : self.lasttime;

      var sl = self.nc.getScrollLeft();
      var st = self.nc.getScrollTop();
      
      var pageh = self.nc.page.maxh;
      var pagew = self.nc.page.maxw;
      
      self.speedx = (pagew>0) ? Math.min(60,self.speedx) : 0;
      self.speedy = (pageh>0) ? Math.min(60,self.speedy) : 0;
      
      var chk = l && (t - l) <= 50;
      
      if ((st<0)||(st>pageh)||(sl<0)||(sl>pagew)) chk = false;
      
      var sy = (self.speedy && chk) ? self.speedy : false;
      var sx = (self.speedx && chk) ? self.speedx : false;
      
      if (sy||sx) {
        var tm = Math.max(16,self.steptime); //timeout granularity
        
        if (tm>50) {  // do smooth
          var xm = tm/50;
          self.speedx*=xm;
          self.speedy*=xm;
          tm = 50;
        }
        
        self.demulxy = 0;

        self.lastscrollx = self.nc.getScrollLeft();
        self.chkx = self.lastscrollx;
        self.lastscrolly = self.nc.getScrollTop();
        self.chky = self.lastscrolly;
        
        var nx = self.lastscrollx;
        var ny = self.lastscrolly;
        
        var onscroll = function(){
          var df = ((self.time()-t)>600) ? 0.04 : 0.02;
        
          if (self.speedx) {
            nx = Math.floor(self.lastscrollx - (self.speedx*(1-self.demulxy)));
            self.lastscrollx = nx;
            if ((nx<0)||(nx>pagew)) df=0.10;
          }

          if (self.speedy) {
            ny = Math.floor(self.lastscrolly - (self.speedy*(1-self.demulxy)));
            self.lastscrolly = ny;
            if ((ny<0)||(ny>pageh)) df=0.10;
          }
          
          self.demulxy = Math.min(1,self.demulxy+df);
          
          self.nc.synched("domomentum2d",function(){

            if (self.speedx) {
              var scx = self.nc.getScrollLeft();
              if (scx!=self.chkx) self.stop();
              self.chkx=nx;
              self.nc.setScrollLeft(nx);
            }
          
            if (self.speedy) {
              var scy = self.nc.getScrollTop();
              if (scy!=self.chky) self.stop();          
              self.chky=ny;
              self.nc.setScrollTop(ny);
            }
            
            if(!self.timer) {
              self.nc.hideCursor();
              self.doSnapy(nx,ny);
            }
            
          });
          
          if (self.demulxy<1) {            
            self.timer = setTimeout(onscroll,tm);
          } else {
            self.stop();
            self.nc.hideCursor();
            self.doSnapy(nx,ny);
          }
        };
        
        onscroll();
        
      } else {
        self.doSnapy(self.nc.getScrollLeft(),self.nc.getScrollTop());
      }      
      
    }
    
  };

  
// override jQuery scrollTop
 
  var _scrollTop = jQuery.fn.scrollTop; // preserve original function
   
  jQuery.cssHooks["pageYOffset"] = {
    get: function(elem,computed,extra) {      
      var nice = $.data(elem,'__nicescroll')||false;
      return (nice&&nice.ishwscroll) ? nice.getScrollTop() : _scrollTop.call(elem);
    },
    set: function(elem,value) {
      var nice = $.data(elem,'__nicescroll')||false;    
      (nice&&nice.ishwscroll) ? nice.setScrollTop(parseInt(value)) : _scrollTop.call(elem,value);
      return this;
    }
  };
  
/*  
  $.fx.step["scrollTop"] = function(fx){    
    $.cssHooks["scrollTop"].set( fx.elem, fx.now + fx.unit );
  };
*/  
  
  jQuery.fn.scrollTop = function(value) {    
    if (typeof value == "undefined") {
      var nice = (this[0]) ? $.data(this[0],'__nicescroll')||false : false;
      return (nice&&nice.ishwscroll) ? nice.getScrollTop() : _scrollTop.call(this);
    } else {      
      return this.each(function() {
        var nice = $.data(this,'__nicescroll')||false;
        (nice&&nice.ishwscroll) ? nice.setScrollTop(parseInt(value)) : _scrollTop.call($(this),value);
      });
    }
  }

// override jQuery scrollLeft
 
  var _scrollLeft = jQuery.fn.scrollLeft; // preserve original function
   
  $.cssHooks.pageXOffset = {
    get: function(elem,computed,extra) {
      var nice = $.data(elem,'__nicescroll')||false;
      return (nice&&nice.ishwscroll) ? nice.getScrollLeft() : _scrollLeft.call(elem);
    },
    set: function(elem,value) {
      var nice = $.data(elem,'__nicescroll')||false;    
      (nice&&nice.ishwscroll) ? nice.setScrollLeft(parseInt(value)) : _scrollLeft.call(elem,value);
      return this;
    }
  };
  
/*  
  $.fx.step["scrollLeft"] = function(fx){
    $.cssHooks["scrollLeft"].set( fx.elem, fx.now + fx.unit );
  };  
*/  
 
  jQuery.fn.scrollLeft = function(value) {    
    if (typeof value == "undefined") {
      var nice = (this[0]) ? $.data(this[0],'__nicescroll')||false : false;
      return (nice&&nice.ishwscroll) ? nice.getScrollLeft() : _scrollLeft.call(this);
    } else {
      return this.each(function() {     
        var nice = $.data(this,'__nicescroll')||false;
        (nice&&nice.ishwscroll) ? nice.setScrollLeft(parseInt(value)) : _scrollLeft.call($(this),value);
      });
    }
  }
  
  var NiceScrollArray = function(doms) {
    var self = this;
    this.length = 0;
    this.name = "nicescrollarray";
  
    this.each = function(fn) {
      for(var a=0;a<self.length;a++) fn.call(self[a]);
      return self;
    };
    
    this.push = function(nice) {
      self[self.length]=nice;
      self.length++;
    };
    
    this.eq = function(idx) {
      return self[idx];
    };
    
    if (doms) {
      for(a=0;a<doms.length;a++) {
        var nice = $.data(doms[a],'__nicescroll')||false;
        if (nice) {
          this[this.length]=nice;
          this.length++;
        }
      };
    }
    
    return this;
  };
  
  function mplex(el,lst,fn) {
    for(var a=0;a<lst.length;a++) fn(el,lst[a]);
  };  
  mplex(
    NiceScrollArray.prototype,
    ['show','hide','toggle','onResize','resize','remove','stop','doScrollPos'],
    function(e,n) {
      e[n] = function(){
        var args = arguments;
        return this.each(function(){          
          this[n].apply(this,args);
        });
      };
    }
  );  
  
  jQuery.fn.getNiceScroll = function(index) {
    if (typeof index == "undefined") {
      return new NiceScrollArray(this);
    } else {
      var nice = $.data(this[index],'__nicescroll')||false;
      return nice;
    }
  };
  
  jQuery.extend(jQuery.expr[':'], {
    nicescroll: function(a) {
      return ($.data(a,'__nicescroll'))?true:false;
    }
  });  
  
  $.fn.niceScroll = function(wrapper,opt) {        
    if (typeof opt=="undefined") {
      if ((typeof wrapper=="object")&&!("jquery" in wrapper)) {
        opt = wrapper;
        wrapper = false;        
      }
    }
    var ret = new NiceScrollArray();
    if (typeof opt=="undefined") opt = {};
    
    if (wrapper||false) {      
      opt.doc = $(wrapper);
      opt.win = $(this);
    }    
    var docundef = !("doc" in opt);   
    if (!docundef&&!("win" in opt)) opt.win = $(this);    
    
    this.each(function() {
      var nice = $(this).data('__nicescroll')||false;
      if (!nice) {
        opt.doc = (docundef) ? $(this) : opt.doc;
        nice = new NiceScrollClass(opt,$(this));        
        $(this).data('__nicescroll',nice);
      }
      ret.push(nice);
    });
    return (ret.length==1) ? ret[0] : ret;
  };
  
  window.NiceScroll = {
    getjQuery:function(){return jQuery}
  };
  
  if (!$.nicescroll) {
   $.nicescroll = new NiceScrollArray();
   $.nicescroll.options = _globaloptions;
  }
  
})( jQuery );


/*
Plugin: jQuery Parallax
Version 1.1.3
Author: Ian Lunn
Twitter: @IanLunn
Author URL: http://www.ianlunn.co.uk/
Plugin URL: http://www.ianlunn.co.uk/plugins/jquery-parallax/

Dual licensed under the MIT and GPL licenses:
http://www.opensource.org/licenses/mit-license.php
http://www.gnu.org/licenses/gpl.html
*/

(function( $ ){
  var $window = $(window);
  var windowHeight = $window.height();

  $window.resize(function () {
    windowHeight = $window.height();
  });

  $.fn.parallax = function(xpos, speedFactor, outerHeight) {
    var $this = $(this);
    var getHeight;
    var firstTop;
    var paddingTop = 0;
    
    //get the starting position of each element to have parallax applied to it    
    $this.each(function(){
        firstTop = $this.offset().top;
    });

    if (outerHeight) {
      getHeight = function(jqo) {
        return jqo.outerHeight(true);
      };
    } else {
      getHeight = function(jqo) {
        return jqo.height();
      };
    }
      
    // setup defaults if arguments aren't specified
    if (arguments.length < 1 || xpos === null) xpos = "50%";
    if (arguments.length < 2 || speedFactor === null) speedFactor = 0.4;
    if (arguments.length < 3 || outerHeight === null) outerHeight = true;
    
    // function to be called whenever the window is scrolled or resized
    function update(){
      var pos = $window.scrollTop();        

      $this.each(function(){
        var $element = $(this);
        var top = $element.offset().top;
        var height = getHeight($element);

        // Check if totally above or totally below viewport
        if (top + height < pos || top > pos + windowHeight) {
          return;
        }

        $this.css('backgroundPosition', xpos + " " + Math.round((firstTop - pos) * speedFactor) + "px");
      });
    }   

    $window.bind('scroll', update).resize(update);
    update();
  };
})(jQuery);
// Sticky Plugin v1.0.0 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 2/14/2011
// Date: 2/12/2012
// Website: http://labs.anthonygarand.com/sticky
// Description: Makes an element on the page stick on the screen as you scroll
//       It will only set the 'top' and 'position' of your element, you
//       might need to adjust the width in some cases.

(function($) {
  var defaults = {
      topSpacing: 0,
      bottomSpacing: 0,
      className: 'is-sticky',
      wrapperClassName: 'sticky-wrapper',
      center: false,
      getWidthFrom: ''
    },
    $window = $(window),
    $document = $(document),
    sticked = [],
    windowHeight = $window.height(),
    scroller = function() {
      var scrollTop = $window.scrollTop(),
        documentHeight = $document.height(),
        dwh = documentHeight - windowHeight,
        extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i],
          elementTop = s.stickyWrapper.offset().top,
          etse = elementTop - s.topSpacing - extra;

        if (scrollTop <= etse) {
          if (s.currentTop !== null) {
            s.stickyElement
              .css('position', '')
              .css('top', '');
            s.stickyElement.parent().removeClass(s.className);
            s.currentTop = null;
          }
        }
        else {
          var newTop = documentHeight - s.stickyElement.outerHeight()
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
          if (newTop < 0) {
            newTop = newTop + s.topSpacing;
          } else {
            newTop = s.topSpacing;
          }
          if (s.currentTop != newTop) {
            s.stickyElement
              .css('position', 'fixed')
              .css('top', newTop);

            if (typeof s.getWidthFrom !== 'undefined') {
              s.stickyElement.css('width', $(s.getWidthFrom).width());
            }

            s.stickyElement.parent().addClass(s.className);
            s.currentTop = newTop;
          }
        }
      }
    },
    resizer = function() {
      windowHeight = $window.height();
    },
    methods = {
      init: function(options) {
        var o = $.extend(defaults, options);
        return this.each(function() {
          var stickyElement = $(this);

          var stickyId = stickyElement.attr('id');
          var wrapper = $('<div></div>')
            .attr('id', stickyId + '-sticky-wrapper')
            .addClass(o.wrapperClassName);
          stickyElement.wrapAll(wrapper);

          if (o.center) {
            stickyElement.parent().css({width:stickyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
          }

          if (stickyElement.css("float") == "right") {
            stickyElement.css({"float":"none"}).parent().css({"float":"right"});
          }

          var stickyWrapper = stickyElement.parent();
          stickyWrapper.css('height', stickyElement.outerHeight());
          sticked.push({
            topSpacing: o.topSpacing,
            bottomSpacing: o.bottomSpacing,
            stickyElement: stickyElement,
            currentTop: null,
            stickyWrapper: stickyWrapper,
            className: o.className,
            getWidthFrom: o.getWidthFrom
          });
        });
      },
      update: scroller
    };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.sticky = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };
  $(function() {
    setTimeout(scroller, 0);
  });
})(jQuery);
 // niceScroll
  $("html").niceScroll();
    
    
  // Stick menu
  $(".menu").sticky({topSpacing:0});




  // Menu Scroll to content and Active menu
  var lastId,
    topMenu = $("#menu"),
    topMenuHeight = topMenu.outerHeight()+145,
    menuItems = topMenu.find("a"),
    scrollItems = menuItems.map(function(){
      var item = $($(this).attr("href"));
      if (item.length) { return item; }
    });

   $('a[href*=#]').bind('click', function(e) {
  e.preventDefault();
       
  var target = $(this).attr("href");
      

  $('html, body').stop().animate({ scrollTop: $(target).offset().top-140 }, 1000, function() {

  });
      
  return false;
   });

  $(window).scroll(function(){
   var fromTop = $(this).scrollTop()+topMenuHeight;
   var cur = scrollItems.map(function(){
     if ($(this).offset().top < fromTop)
       return this;
   });

   cur = cur[cur.length-1];
   var id = cur && cur.length ? cur[0].id : "";
   
   if (lastId !== id) {
       lastId = id;
       menuItems
         .parent().removeClass("active")
         .end().filter("[href=#"+id+"]").parent().addClass("active");
   }                   
  });  
  

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    
    $(".footer").css( "position", "relative" );
    $(".contact").css( "marginBottom", "0" );

}
else 
{

  // FadeTo elements
  if ( $(window).width() > 1023) {  

    tiles = $("h2, h3, .column-one, .column-two, .column-three, .grid li, .contact .content .form, .contact .content .contact-text ").fadeTo(0, 0);

    $(window).scroll(function(d,h) {
      tiles.each(function(i) {
          a = $(this).offset().top + $(this).height();
          b = $(window).scrollTop() + $(window).height();
          if (a < b) $(this).fadeTo(1000,1);
      });
    });

  }

}



  //Menu mobile click
  $( ".icon" ).click(function() {
    $( " ul.menu-click" ).slideToggle( "slow", function() {
    // Animation complete.
    });
  });


$(window).load(function(){

$(".preloader").delay(1000).fadeOut("slow")

  // Parallax
  if ($('.parallax-background').length) {
    $(".parallax-background").parallax();
  }
  
  // Parallax
  if ($('.parallax-background-partners').length) {
    $(".parallax-background-partners").parallax();
  }  

});
jQuery(document).ready(function($){

    var apiKey  = 'YOUR-API';
    var userID  = 'USERNAME';

    (function() {
      var behanceUserAPI = 'http://www.behance.net/v2/users/'+ userID +'?callback=?&api_key='+ apiKey;

      function setUserTemplate() {
        var userData     = JSON.parse(sessionStorage.getItem('behanceUser')),
          getTemplate = $('#profile-template').html(),
          template     = Handlebars.compile(getTemplate),
          result       = template(userData);
          $('#home').html(result);
      };

      if(sessionStorage.getItem('behanceUser')) {
        setUserTemplate();
      } else {
        $.getJSON(behanceUserAPI, function(user) {
          var data = JSON.stringify(user);
          sessionStorage.setItem('behanceUser', data);
          setUserTemplate();
        });
      };
    })();

    (function() {
      var perPage = 15;
      var behanceProjectAPI = 'http://www.behance.net/v2/users/' + userID + '/projects?callback=?&api_key=' + apiKey + '&per_page=' + perPage;

      function setPortfolioTemplate() {
        var projectData = JSON.parse(sessionStorage.getItem('behanceProject')),
          getTemplate = $('#portfolio-template').html(),
          template    = Handlebars.compile(getTemplate),
          result      = template(projectData);
        $('#portfolio-grid').html(result);
      };

      if(sessionStorage.getItem('behanceProject')) {
        setPortfolioTemplate();
      } else {
        $.getJSON(behanceProjectAPI, function(project) {
          var data = JSON.stringify(project);
          sessionStorage.setItem('behanceProject', data);
          setPortfolioTemplate();
        });
      };
    })();
 
   
  
  // niceScroll
  $("html").niceScroll();
    
    
  // Stick menu
  $(".menu").sticky({topSpacing:0});


  //Menu mobile click
  $( ".icon" ).click(function() {
    $( " ul.menu-click" ).slideToggle( "slow", function() {
    // Animation complete.
    });
  });


  
});

$(window).load(function(){


  // Menu Scroll to content and Active menu
  var lastId,
    topMenu = $("#menu"),
    topMenuHeight = topMenu.outerHeight()+145,
    menuItems = topMenu.find("a"),
    scrollItems = menuItems.map(function(){
      var item = $($(this).attr("href"));
      if (item.length) { return item; }
    });

   $('a[href*=#]').bind('click', function(e) {
  e.preventDefault();
       
  var target = $(this).attr("href");
      

  $('html, body').stop().animate({ scrollTop: $(target).offset().top-140 }, 1000, function() {

  });
      
  return false;
   });

  $(window).scroll(function(){
   var fromTop = $(this).scrollTop()+topMenuHeight;
   var cur = scrollItems.map(function(){
     if ($(this).offset().top < fromTop)
       return this;
   });

   cur = cur[cur.length-1];
   var id = cur && cur.length ? cur[0].id : "";
   
   if (lastId !== id) {
       lastId = id;
       menuItems
         .parent().removeClass("active")
         .end().filter("[href=#"+id+"]").parent().addClass("active");
   }                   
  });  


$(".preloader").delay(1000).fadeOut("slow")

  // Parallax
  if ($('.parallax-background').length) {
    $(".parallax-background").parallax();
  }
  
  // Parallax
  if ($('.parallax-background-partners').length) {
    $(".parallax-background-partners").parallax();
  }  
  
  
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    
    $(".footer").css( "position", "relative" );
    $(".contact").css( "marginBottom", "0" );

}
else 
{

  // FadeTo elements
  if ( $(window).width() > 1023) {  

    tiles = $("h2, h3, .column-one, .column-two, .column-three, .grid li, .contact .content .form, .contact .content .contact-text ").fadeTo(0, 0);

    $(window).scroll(function(d,h) {
      tiles.each(function(i) {
          a = $(this).offset().top + $(this).height();
          b = $(window).scrollTop() + $(window).height();
          if (a < b) $(this).fadeTo(1000,1);
      });
    });

  }

}

});