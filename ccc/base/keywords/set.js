// The Cmacs Project.

goog.provide('ccc.base.set');

goog.require('ccc.base');
goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * The SET transformer (spelled "set!") updates the value to which a symbol is
 * bound. It's an error to set the value of an unbound symbol.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var SetTransformer_ = function() {
};
goog.inherits(SetTransformer_, ccc.Transformer);


/** @override */
SetTransformer_.prototype.toString = function() {
  return '#<set-transformer>';
};


/** @override */
SetTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args))
      return continuation(new ccc.Error('set!: Invalid argument list'));
    if (!ccc.isSymbol(args.car()))
      return continuation(new ccc.Error(
          'set!: Symbol expected in first argument'));
    if (ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('set!: Missing binding value'));
    if (!ccc.isPair(args.cdr()))
      return continuation(new ccc.Error('set!: Invalid syntax'));
    if (!ccc.isNil(args.cdr().cdr()))
      return continuation(new ccc.Error('set!: Too many arguments'));
    var setProcedure = new ccc.NativeProcedure(goog.partial(
        SetTransformer_.updateBinding_, args.car()));
    return continuation(new ccc.Pair(setProcedure, args.cdr()));
  };
};


/**
 * Updates the binding of the symbol named by the first argument to the value of
 * the second argument. The binding nearest to the current environment is used.
 *
 * @param {!ccc.Symbol} symbol
 * @param {!ccc.Environment} environment
 * @param {(!ccc.Pair|!ccc.Nil)} args
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
SetTransformer_.updateBinding_ = function(
    symbol, environment, args, continuation) {
  goog.asserts.assert(ccc.isPair(args) && ccc.isNil(args.cdr()),
      'Expanded SET! procedure should always receive exactly one argument.');
  var location = environment.get(symbol.name());
  if (goog.isNull(location))
    return continuation(new ccc.Error(
        'Cannot update binding for unbound symbol \'' + symbol.name()));
  location.setValue(args.car());
  return continuation(ccc.UNSPECIFIED);
};


ccc.base.registerBinding('set!', new SetTransformer_());
