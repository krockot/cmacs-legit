// The Cmacs Project.

goog.provide('ccc.syntax.Define');

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * The builtin Define syntax transformer binds variables in the innermost
 * environment.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Define = function() {
};
goog.inherits(ccc.syntax.Define, ccc.base.Transformer);


/** @override */
ccc.syntax.Define.prototype.toString = function() {
  return '#<define-transformer>';
};


/** @override */
ccc.syntax.Define.prototype.transform = function(environment, args) {
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
