// The Cmacs Project.

goog.provide('ccc.Library');

goog.require('ccc.core');
goog.require('goog.asserts');
goog.require('goog.object');



/**
 * A Library is a collection of named objects that can be registered within an
 * environment. See {@code ccc.base} for an example.
 *
 * @constructor
 */
ccc.Library = function() {
  /** @private {!Object.<string, ccc.Data>} */
  this.bindings_ = {};
};


/**
 * Registers a new binding with this library.
 *
 * @param {string} name
 * @param {ccc.Data} data
 */
ccc.Library.prototype.registerBinding = function(name, data) {
  this.bindings_[name] = data;
};


/**
 * Adds this library to an environment.
 *
 * @param {!ccc.Environment} environment
 */
ccc.Library.prototype.addToEnvironment = function(environment) {
  goog.object.forEach(this.bindings_, function(data, name) {
    environment.setValue(name, data);
  });
};


/**
 * Gets a binding from the library.
 *
 * @param {string} name
 */
ccc.Library.prototype.get = function(name) {
  goog.asserts.assert(goog.object.containsKey(this.bindings_, name));
  return this.bindings_[name];
};


/**
 * Generates a simple NativeProcedure from a simplified procedure specification.
 * This provides a declarative means of configurating argument arity and type-
 * checking and returning direct values rather than dealing with continuation-
 * passing.
 *
 * Within the spec's implementation function, |this| is bound to an object with
 * fields referencing the current environment, continuation, and raw argument
 * list.
 *
 * @param {ccc.Library.SimpleProcedureSpec} spec
 */
ccc.Library.prototype.registerProcedure = function(name, spec) {
  var procedure = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    var argList = [];
    var argIndex = 0;
    var arg = args;
    if (goog.isDef(spec.args)) {
      for (var i = 0; i < spec.args.length; ++i) {
        if (!ccc.isPair(arg))
          return continuation(new ccc.Error(name + ': Not enough arguments'));
        var predicate = spec.args[i];
        if (!goog.isNull(predicate) && !predicate(arg.car()))
          return continuation(new ccc.Error(name +
              ': Incorrect type for argument ' + (argIndex + 1)));
        argList[argIndex++] = arg.car();
        arg = arg.cdr();
      }
    }
    if (goog.isDef(spec.optionalArgs)) {
      if (spec.optionalArgs instanceof Array) {
        for (var i = 0; i < spec.optionalArgs.length; ++i) {
          if (!ccc.isPair(arg))
            break;
          var predicate = spec.optionalArgs[i];
          if (!goog.isNull(predicate) && !predicate(arg.car()))
            return continuation(new ccc.Error(name +
                ': Incorrect type for argument ' + (argIndex + 1)));
          argList[argIndex++] = arg.car();
          arg = arg.cdr();
        }
      } else if (spec.optionalArgs instanceof Function ||
                 goog.isNull(spec.optionalArgs)) {
        var predicate = spec.optionalArgs;
        while (ccc.isPair(arg)) {
          if (!goog.isNull(predicate) && !predicate(arg.car()))
            return continuation(new ccc.Error(name +
                ': Incorrect type for argument ' + (argIndex + 1)));
          argList[argIndex++] = arg.car();
          arg = arg.cdr();
        }
      }
    }
    if (!ccc.isNil(arg))
      return continuation(new ccc.Error(name + ': Too many arguments'));
    var context = {
      environment: environment,
      args: args,
      continuation: continuation,
    };
    var result = spec.impl.apply(context, argList);
    if (!goog.isDef(result))
      result = ccc.UNSPECIFIED;
    if (!!spec.thunk)
      return /** @type {ccc.Thunk} */ (result);
    return continuation(/** @type {ccc.Data} */ (result));
  });
  this.registerBinding(name, procedure);
};


/**
 * Creates multiple simple procedure bindings given a mapping from name to
 * procedure spec.
 *
 * @param {!Object.<string, ccc.Library.SimpleProcedureSpec>} specMap
 */
ccc.Library.prototype.registerProcedures = function(specMap) {
  goog.object.forEach(specMap, function(spec, name) {
    this.registerProcedure(name, spec);
  }, this);
};



/**
 * Argument type validation predicate.
 *
 * @typedef {function(ccc.Data):boolean}
 * @private
 */
var TypePredicate_;



/**
 * Specification for a simple native procedure.
 *
 * If |args| is given it must be an Array, and each element is used as a type-
 * checking predicate for the argument in the corresponding position. If a
 * predicate is {@code null}, no automatic type-checking is done by the
 * generated procedure.
 *
 * The length of |args| determines the arity of the procedure. If |optionalArgs|
 * is unspecified, this is the exact arity; otherwise it's the minimum arity.
 *
 * |optionalArgs| may also be an Array, in which case the procedure takes a
 * finite number of optional arguments. If |args| is length N and |optionalArgs|
 * is length |M|, the procedure has an arity range of [N, N+M].
 *
 * If |optionalArgs| is a predicate or {@code null}, the procedure can take
 * any number of arguments which match the predicate. If {@code null}, the
 * procedure can take any number of arguments of any type.
 *
 * If |thunk| is {@code true} (default {@code false}), then the function
 * provided by |impl| must return a {@code ccc.Thunk} to continue computation.
 * If {@code false}, |impl| instead returns any {@code ccc.Data}, and
 * computation will continue in the thunk generated by passing data to the
 * calling continuation. IF |impl| returns {@code undefined}, it is converted
 * to {@code ccc.UNSPECIFIED} implicitly.
 *
 * Arguments when calling |impl| are destructured from their list form and
 * applied as real JS function arguments.
 *
 * @typedef {{
 *   args: (!Array.<?TypePredicate_>|undefined),
 *   optionalArgs: (!Array.<?TypePredicate_>|?TypePredicate_|undefined),
 *   thunk: (boolean|undefined),
 *   impl: (function(this:ccc.Library.ProcedureContext, *):*)
 * }}
 */
ccc.Library.SimpleProcedureSpec;



/**
 * Context to which |this| is bound within Library-generated procedure
 * implementations.
 *
 * |environment| is the calling environment.
 * |args| is the raw list of arguments provided by the caller.
 * |continuation| is the current (calling) continuation.
 *
 * @typedef {{
 *   environment: (!ccc.Environment),
 *   args: (!ccc.Pair|!ccc.Nil),
 *   continuation: (ccc.Continuation)
 * }}
 */
ccc.Library.ProcedureContext;
