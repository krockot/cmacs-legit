// The Cmacs Project.


goog.provide('ccc.syntax.Set');

goog.require('ccc.base.NativeProcedure');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');
goog.require('goog.Promise');



/**
 * The builtin Set syntax transformer updates the value to which a symbol is
 * bound. It's an error to set the value of an unbound symbol.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Set = function() {};



/** @override */
ccc.syntax.Set.prototype.toString = function() {
  return '#<set-transformer>';
};


/** @override */
ccc.syntax.Set.prototype.transform = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject('set!: Invalid argument list');
  if (!args.car().isSymbol())
    return goog.Promise.reject('set!: Symbol expected in first argument');
  if (args.cdr().isNil())
    return goog.Promise.reject('set!: Missing binding value');
  if (!args.cdr().isPair())
    return goog.Promise.reject('set!: Invalid syntax');
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject('set!: Too many arguments');
  return goog.Promise.resolve(
      new ccc.base.Pair(
          new ccc.base.NativeProcedure(
              goog.partial(ccc.syntax.Set.updateBinding_, args.car())),
          args.cdr()));
};


/**
 * Updates the binding of the symbol named by the first argument to the value of
 * the second argument. The binding nearest to the current environment is used.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Set.updateBinding_ = function(symbol, environment, args) {
  if (!environment.update(symbol, args.car())) {
    return goog.Promise.reject('Cannot update binding for unbound symbol \'' +
        symbol.name());
  }
  return goog.Promise.resolve(ccc.base.UNSPECIFIED);
};
