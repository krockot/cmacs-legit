// The Cmacs Project.

goog.provide('ccc.base.quote');

goog.require('ccc.base');
goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * QUOTE transformer.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var QuoteTransformer_ = function() {
};
goog.inherits(QuoteTransformer_, ccc.Transformer);


/** @override */
QuoteTransformer_.prototype.toString = function() {
  return '#<quote-transformer>';
};


/** @override */
QuoteTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args) || !ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('quote: Invalid syntax'));
    var quoteProcedure = new ccc.NativeProcedure(goog.partial(
        QuoteTransformer_.nativeImpl_, args.car()));
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
QuoteTransformer_.nativeImpl_ = function(
    data, environment, args, continuation) {
  goog.asserts.assert(ccc.isNil(args),
      'Expanded QUOTE procedure should never received arguments');
  return continuation(data);
};


ccc.base.registerBinding('quote', new QuoteTransformer_());
