// The Cmacs Project.

goog.provide('ccc.syntax.SET');

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * The SET transformer (spelled "set!") updates the value to which a symbol is
 * bound. It's an error to set the value of an unbound symbol.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.SetTransformer_ = function() {
};
goog.inherits(ccc.syntax.SetTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.SetTransformer_.prototype.toString = function() {
  return '#<set-transformer>';
};


/** @override */
ccc.syntax.SetTransformer_.prototype.transform = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject(new Error('set!: Invalid argument list'));
  if (!args.car().isSymbol())
    return goog.Promise.reject(new Error(
        'set!: Symbol expected in first argument'));
  if (args.cdr().isNil())
    return goog.Promise.reject(new Error('set!: Missing binding value'));
  if (!args.cdr().isPair())
    return goog.Promise.reject(new Error('set!: Invalid syntax'));
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject(new Error('set!: Too many arguments'));
  var setProcedure = new ccc.base.NativeProcedure(goog.partial(
      ccc.syntax.SetTransformer_.updateBinding_, args.car()));
  return goog.Promise.resolve(new ccc.base.Pair(setProcedure, args.cdr()));
};


/**
 * Updates the binding of the symbol named by the first argument to the value of
 * the second argument. The binding nearest to the current environment is used.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @param {!ccc.base.Continuation} continuation
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.syntax.SetTransformer_.updateBinding_ = function(
    symbol, environment, args, continuation) {
  goog.asserts.assert(args.isPair() && args.cdr().isNil(),
      'Compiled set! should always receive exactly one argument.');
  if (!environment.update(symbol.name(), args.car()))
    return continuation(null, new Error(
        'Cannot update binding for unbound symbol \'' + symbol.name()));
  return continuation(ccc.base.UNSPECIFIED);
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.SET = new ccc.syntax.SetTransformer_();
