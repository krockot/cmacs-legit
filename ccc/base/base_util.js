// The Cmacs Project.

/** @fileoverview This provides utility functions for use by base library
 * implementation code.
 */

goog.provide('ccc.baseUtil');

goog.require('ccc.core');
goog.require('goog.object');



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
 * @param {ccc.baseUtil.SimpleProcedureSpec} spec
 */
ccc.baseUtil.makeSimpleProcedure = function(name, spec) {
  ccc.base[name] = new ccc.NativeProcedure(function(
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
    if (!!spec.thunk)
      return /** @type {ccc.Thunk} */ (result);
    return continuation(/** @type {ccc.Data} */ (result));
  });
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
 * @typedef {{
 *   args: (!Array.<?TypePredicate_>|undefined),
 *   optionalArgs: (!Array.<?TypePredicate_>|?TypePredicate_|undefined),
 *   thunk: (boolean|undefined),
 *   impl: (function(this:ccc.baseUtil.ProcedureContext, *):*)
 * }}
 */
ccc.baseUtil.SimpleProcedureSpec;


/**
 * Context to which |this| is bound within baseUtil-generated procedures.
 *
 * @typedef {{
 *   environment: (!ccc.Environment),
 *   args: (!ccc.Pair|!ccc.Nil),
 *   continuation: (ccc.Continuation)
 * }}
 */
ccc.baseUtil.ProcedureContext;


/**
 * Creates multiple simple procedure bindings given a mapping from name to
 * procedure spec.
 *
 * @param {!Object.<string, ccc.baseUtil.SimpleProcedureSpec>} specMap
 */
ccc.baseUtil.makeSimpleProcedures = function(specMap) {
  goog.object.forEach(specMap, function(spec, name) {
    ccc.baseUtil.makeSimpleProcedure(name, spec);
  });
};
