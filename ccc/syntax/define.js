// The Cmacs Project.

goog.provide('ccc.syntax.DEFINE');

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * The builtin Define syntax transformer binds variables in the innermost
 * environment.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.DefineTransformer_ = function() {
};
goog.inherits(ccc.syntax.DefineTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.DefineTransformer_.prototype.toString = function() {
  return '#<define-transformer>';
};


/** @override */
ccc.syntax.DefineTransformer_.prototype.transform = function(
    environment, args) {
  if (!args.isPair())
    return goog.Promise.reject(new Error('define: Invalid argument list'));
  if (!args.car().isSymbol())
    return goog.Promise.reject(new Error(
        'define: Symbol expected in first argument'));
  if (args.cdr().isNil())
    return goog.Promise.reject(new Error('define: Missing binding value'));
  if (!args.cdr().isPair())
    return goog.Promise.reject(new Error('define: Invalid syntax'));
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject(new Error('define: Too many arguments'));
  return goog.Promise.resolve(
      new ccc.base.Pair(
          new ccc.base.NativeProcedure(
              goog.partial(ccc.syntax.DefineTransformer_.bindSymbol_,
                           args.car())),
          args.cdr()));
};


/**
 * Binds the value of the second argument to the symbol named by the first
 * argument within the given environment.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @param {!ccc.base.Continuation} continuation
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.syntax.DefineTransformer_.bindSymbol_ = function(
    symbol, environment, args, continuation) {
  goog.asserts.assert(args.isPair() && args.cdr().isNil(),
      'Compiled define should always receive exactly one argument.');
  environment.set(symbol.name(), args.car());
  return continuation(ccc.base.UNSPECIFIED);
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.DEFINE = new ccc.syntax.DefineTransformer_();
