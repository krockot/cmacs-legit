// The Cmacs Project.

goog.provide('ccc.syntax.QUOTE');

goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * QUOTE transformer.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
ccc.syntax.QuoteTransformer_ = function() {
};
goog.inherits(ccc.syntax.QuoteTransformer_, ccc.Transformer);


/** @override */
ccc.syntax.QuoteTransformer_.prototype.toString = function() {
  return '#<quote-transformer>';
};


/** @override */
ccc.syntax.QuoteTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args) || !ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('quote: Invalid syntax'));
    var quoteProcedure = new ccc.NativeProcedure(goog.partial(
        ccc.syntax.QuoteTransformer_.nativeImpl_, args.car()));
    return continuation(new ccc.Pair(quoteProcedure, ccc.NIL));
  };
};


/**
 * This just returns its first argument, which should be captured and bound
 * during transformation.
 *
 * @param {ccc.Data} data
 * @param {!ccc.Environment} environment
 * @param {(!ccc.Pair|!ccc.Nil)} args
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.syntax.QuoteTransformer_.nativeImpl_ = function(
    data, environment, args, continuation) {
  goog.asserts.assert(ccc.isNil(args),
      'Expanded QUOTE procedure should never received arguments');
  return continuation(data);
};


/**
 * @public {!ccc.Transformer}
 * @const
 */
ccc.syntax.QUOTE = new ccc.syntax.QuoteTransformer_();
