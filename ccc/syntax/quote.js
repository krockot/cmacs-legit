// The Cmacs Project.

goog.provide('ccc.syntax.Quote');

goog.require('ccc.base.Object');
goog.require('ccc.base.Symbol');
goog.require('goog.Promise');



/**
 * Quote syntax.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Quote = function() {};


/** @override */
ccc.syntax.Quote.prototype.toString = function() {
  return '#<quote-transformer>';
};


/** @override */
ccc.syntax.Quote.prototype.transform = function(environment, args) {
  if (!args.isPair() || !args.cdr().isNil())
    return goog.Promise.reject(new Error('quote: Invalid syntax'));
  return goog.Promise.resolve(new ccc.base.Pair(
      new ccc.base.NativeProcedure(
          goog.partial(ccc.syntax.Quote.nativeImpl_, args.car())),
      ccc.base.NIL));
};


/**
 * This just returns its first argument, which should be captured and bound
 * during transformation.
 *
 * @param {!ccc.base.Object} object
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.syntax.Quote.nativeImpl_ = function(object, environment, args) {
  return goog.Promise.resolve(object);
};
