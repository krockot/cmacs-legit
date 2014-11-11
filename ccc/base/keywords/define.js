// The Cmacs Project.

goog.provide('ccc.base.define');

goog.require('ccc.base');
goog.require('ccc.core');



/**
 * The builtin DEFINE syntax transformer binds variables in the innermost
 * environment.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var DefineTransformer_ = function() {
};
goog.inherits(DefineTransformer_, ccc.Transformer);


/** @override */
DefineTransformer_.prototype.toString = function() {
  return '#<define-transformer>';
};


/** @override */
DefineTransformer_.prototype.transform = function(environment, args) {
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
        DefineTransformer_.bindSymbol_, args.car()));
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
DefineTransformer_.bindSymbol_ = function(
    symbol, environment, args, continuation) {
  goog.asserts.assert(ccc.isPair(args) && ccc.isNil(args.cdr()),
      'Expanded DEFINE procedure should always receive exactly one argument.');
  var location = environment.get(symbol.name());
  if (goog.isNull(location)) {
    location = new ccc.ImmediateLocation();
    environment.set(symbol.name(), location);
  }
  location.setValue(args.car());
  return continuation(ccc.UNSPECIFIED);
};


ccc.base.registerBinding('define', new DefineTransformer_());
