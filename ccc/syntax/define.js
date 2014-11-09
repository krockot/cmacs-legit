// The Cmacs Project.

goog.provide('ccc.syntax.DEFINE');

goog.require('ccc.core');



/**
 * The builtin DEFINE syntax transformer binds variables in the innermost
 * environment.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
ccc.syntax.DefineTransformer_ = function() {
};
goog.inherits(ccc.syntax.DefineTransformer_, ccc.Transformer);


/** @override */
ccc.syntax.DefineTransformer_.prototype.toString = function() {
  return '#<define-transformer>';
};


/** @override */
ccc.syntax.DefineTransformer_.prototype.transform = function(
    environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args))
      return continuation(new ccc.Error('define: Invalid argument list'));
    if (!ccc.isSymbol(args.car()))
      return continuation(new ccc.Error(
          'define: Symbol expected in first argument'));
    if (ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('define: Missing binding value'));
    if (!ccc.isPair(args.cdr()))
      return continuation(new ccc.Error('define: Invalid syntax'));
    if (!ccc.isNil(args.cdr().cdr()))
      return continuation(new ccc.Error('define: Too many arguments'));
    var bindProcedure = new ccc.NativeProcedure(goog.partial(
        ccc.syntax.DefineTransformer_.bindSymbol_, args.car()));
    return continuation(new ccc.Pair(bindProcedure, args.cdr()));
  };
};


/**
 * Binds the value of the second argument to the symbol named by the first
 * argument within the given environment.
 *
 * @param {!ccc.Symbol} symbol
 * @param {!ccc.Environment} environment
 * @param {(!ccc.Pair|!ccc.Nil)} args
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.syntax.DefineTransformer_.bindSymbol_ = function(
    symbol, environment, args, continuation) {
  goog.asserts.assert(ccc.isPair(args) && ccc.isNil(args.cdr()),
      'Expanded DEFINE procedure should always receive exactly one argument.');
  environment.set(symbol.name(), args.car());
  return continuation(ccc.UNSPECIFIED);
};


/**
 * @public {!ccc.Transformer}
 * @const
 */
ccc.syntax.DEFINE = new ccc.syntax.DefineTransformer_();
