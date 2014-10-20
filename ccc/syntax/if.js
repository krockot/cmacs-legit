// The Cmacs Project.

goog.provide('ccc.syntax.IF')

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * The IF transformer produces a native conditional procedure which evaluates
 * a test express and then either the consequent or the alternate, but never
 * both.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.IfTransformer_ = function() {
};
goog.inherits(ccc.syntax.IfTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.IfTransformer_.prototype.toString = function() {
  return '#<if-transformer>';
};


/** @override */
ccc.syntax.IfTransformer_.prototype.transform = function(environment, args) {
  if (!args.isPair() || !args.cdr().isPair())
    return goog.Promise.reject(new Error('if: Not enough arguments'));
  var condition = args.car();
  var consequent = args.cdr().car();
  var alternate = args.cdr().cdr();
  if (alternate.isNil()) {
    alternate = ccc.base.UNSPECIFIED;
  } else if (alternate.isPair()) {
    if (!alternate.cdr().isNil())
      return goog.Promise.reject(new Error('if: Too many arguments'));
    alternate = alternate.car();
  } else {
    return goog.Promise.reject(new Error('if: Invalid syntax'));
  }
  return alternate.compile(environment).then(function(alternate) {
    return consequent.compile(environment).then(function(consequent) {
      var branchProcedure = new ccc.base.NativeProcedure(goog.partial(
          ccc.syntax.IfTransformer_.nativeImpl_, consequent, alternate));
      return ccc.base.Pair.makeList([branchProcedure, condition]);
    });
  })
};


/**
 * Tests the argument value and forwards the evaluation of the alternate if
 * the argument value was #f or the evaluation of the consequent otherwise.
 *
 * @param {!ccc.base.Object} consequent
 * @param {!ccc.base.Object} alternate
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @param {!ccc.base.Continuation} continuation
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.syntax.IfTransformer_.nativeImpl_ = function(
    consequent, alternate, environment, args, continuation) {
  if (args.car().isFalse()) {
    return alternate.eval(environment, continuation);
  }
  return consequent.eval(environment, continuation);
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.IF = new ccc.syntax.IfTransformer_();
