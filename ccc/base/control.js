// The Cmacs Project.

goog.provide('ccc.base.control');

goog.require('ccc.baseUtil');
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


ccc.baseUtil.makeSimpleProcedures({
  'call/cc': {
    args: [ccc.isApplicable],
    thunk: true,
    impl: /** @this {ccc.baseUtil.ProcedureContext} */ function(procedure) {
      return procedure.apply(this.environment,
          new ccc.Pair(new ContinuationWrapper_(this.continuation), ccc.NIL),
          this.continuation);
    }
  },
});
