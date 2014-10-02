// The Cmacs Project.


goog.provide('ccc.syntax.Define');

goog.require('ccc.base.NativeProcedure');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');
goog.require('goog.Promise');



/**
 * The builtin Define syntax transformer binds variables in the innermost
 * environment.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Define = function() {};



/** @override */
ccc.syntax.Define.prototype.toString = function() {
  return '#<define-transformer>';
};


/** @override */
ccc.syntax.Define.prototype.transform = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject('define: Invalid argument list');
  if (!args.car().isSymbol())
    return goog.Promise.reject('define: Symbol expected in first argument');
  if (args.cdr().isNil())
    return goog.Promise.reject('define: Missing binding value');
  if (!args.cdr().isPair())
    return goog.Promise.reject('define: Invalid syntax');
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject('define: Too many arguments');
  return goog.Promise.resolve(
      new ccc.base.Pair(
          new ccc.base.NativeProcedure(
              goog.partial(ccc.syntax.Define.bindSymbol_, args.car())),
          args.cdr()));
};


/**
 * Binds the value of the second argument to the symbol named by the first
 * argument within the given environment.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Define.bindSymbol_ = function(symbol, environment, args) {
  environment.set(symbol.name(), args.car());
  return goog.Promise.resolve(ccc.base.UNSPECIFIED);
};
