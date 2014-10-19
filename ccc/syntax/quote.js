// The Cmacs Project.

goog.provide('ccc.syntax.QUOTE');

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * Quote syntax.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.QuoteTransformer_ = function() {
};
goog.inherits(ccc.syntax.QuoteTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.QuoteTransformer_.prototype.toString = function() {
  return '#<quote-transformer>';
};


/** @override */
ccc.syntax.QuoteTransformer_.prototype.transform = function(environment, args) {
  if (!args.isPair() || !args.cdr().isNil())
    return goog.Promise.reject(new Error('quote: Invalid syntax'));
  var quoteProcedure = new ccc.base.NativeProcedure(goog.partial(
      ccc.syntax.QuoteTransformer_.nativeImpl_, args.car()));
  return goog.Promise.resolve(new ccc.base.Pair(quoteProcedure, ccc.base.NIL));
};


/**
 * This just returns its first argument, which should be captured and bound
 * during transformation.
 *
 * @param {!ccc.base.Object} object
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @param {!ccc.base.Continuation} continuation
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.syntax.QuoteTransformer_.nativeImpl_ = function(
    object, environment, args, continuation) {
  goog.asserts.assert(args.isNil(),
      'Compiled quote should never received arguments');
  return continuation(object);
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.QUOTE = new ccc.syntax.QuoteTransformer_();
