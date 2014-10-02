// The Cmacs Project.


goog.provide('ccc.syntax.If')

goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Object');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');
goog.require('goog.Promise');



/**
 * The If transformer produces a native conditional procedure which evaluates
 * a test express and then either the consequent or the alternate, but never
 * both.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.If = function() {};


/** @override */
ccc.syntax.If.prototype.toString = function() {
  return '#<if-transformer>';
};


/** @override */
ccc.syntax.If.prototype.transform = function(environment, args) {
  if (!args.isPair() || !args.cdr().isPair())
    return goog.Promise.reject('if: Not enough arguments');
  var condition = args.car();
  var consequent = args.cdr().car();
  var alternate = args.cdr().cdr();
  if (alternate.isNil()) {
    alternate = ccc.base.UNSPECIFIED;
  } else if (alternate.isPair()) {
    if (!alternate.cdr().isNil())
      return goog.Promise.reject('if: Too many arguments');
    alternate = alternate.car();
  } else {
    return goog.Promise.reject('if: Invalid syntax');
  }
  return alternate.compile(environment).then(function(alternate) {
    return consequent.compile(environment).then(function(consequent) {
      return new ccc.base.Pair(
          new ccc.base.NativeProcedure(
              goog.partial(ccc.syntax.If.nativeImpl_,
                           consequent, alternate)),
              new ccc.base.Pair(condition, ccc.base.NIL));
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
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.syntax.If.nativeImpl_ = function(consequent, alternate, environment, args) {
  if (args.car().isFalse()) {
    return alternate.eval(environment);
  }
  return consequent.eval(environment);
};
