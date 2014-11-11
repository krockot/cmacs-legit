// The Cmacs Project.

goog.provide('ccc.base.control');

goog.require('ccc.base');
goog.require('ccc.core');



/**
 * Wrapper object around a {@code ccc.Continuation}.
 *
 * @param {ccc.Continuation} continuation
 * @constructor
 * @extends {ccc.Object}
 * @private
 */
var ContinuationWrapper_ = function(continuation) {
  /** @private {ccc.Continuation} */
  this.continuation_ = continuation;
};
goog.inherits(ContinuationWrapper_, ccc.Object);


/** @override */
ContinuationWrapper_.prototype.toString = function() {
  return '#<continuation-wrapper>';
};


/** @override */
ContinuationWrapper_.prototype.isApplicable = function() {
  return true;
};


/** @override */
ContinuationWrapper_.prototype.apply =
    function(environment, args, continuation) {
  if (!ccc.isPair(args) || !ccc.isNil(args.cdr()))
    return continuation(new ccc.Error(
        'Continuation expects exactly one value'));
  return this.continuation_(args.car());
};


ccc.base.registerProcedures({
  'procedure?': {
    args: [null],
    impl: ccc.isApplicable
  },

  'call/cc': {
    args: [ccc.isApplicable],
    thunk: true,
    impl: /** @this {ccc.Library.ProcedureContext} */ function(procedure) {
      return procedure.apply(this.environment,
          new ccc.Pair(new ContinuationWrapper_(this.continuation), ccc.NIL),
          this.continuation);
    }
  },

  'apply': {
    args: [ccc.isApplicable, null],
    optionalArgs: null,
    thunk: true,
    impl: /** @this {ccc.Library.ProcedureContext} */ function(procedure) {
      var args = arguments[arguments.length - 1];
      if (!ccc.isNil(args) && (!ccc.isPair(args) ||
          !args.forEachProper(function() {})))
        return this.continuation(new ccc.Error('apply: Invalid argument list'));
      for (var i = arguments.length - 2; i >= 1; --i)
        args = new ccc.Pair(arguments[i], args);
      return procedure.apply(this.environment, args, this.continuation);
    }
  },

  'map': {
    args: [ccc.isApplicable, null],
    optionalArgs: null,
    thunk: true,
    impl: /** @this {ccc.Library.ProcedureContext} */ function(procedure) {
      var lists = Array.prototype.slice.call(arguments, 1);
      var environment = this.environment;
      var isList = function(x) { return ccc.isPair(x) || ccc.isNil(x); };
      var doNextApplication = function(continuation) {
        if (!goog.array.every(lists, isList))
          return continuation(new ccc.Error('map: Invalid list argument'));
        if (goog.array.some(lists, ccc.isNil))
          return continuation(ccc.NIL);
        var args = ccc.Pair.makeList(goog.array.map(lists,
            function(list) { return list.car(); }));
        lists = goog.array.map(lists, function(list) { return list.cdr(); });
        var yieldPair = function(cdr, car) {
          return continuation(new ccc.Pair(car, cdr));
        }
        var doThisApplication = function(nextResult) {
          if (ccc.isError(nextResult))
            return continuation(nextResult);
          return procedure.apply(environment, args, goog.partial(yieldPair,
              nextResult))
        };
        return goog.partial(doNextApplication, doThisApplication);
      };
      return doNextApplication(this.continuation);
    }
  },
});
