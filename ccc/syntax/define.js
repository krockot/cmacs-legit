// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.syntax.Define');

goog.require('ccc.base.NIL');
goog.require('ccc.base.NativeProcedure');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');



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
  return goog.Promise.resolve(
      new ccc.base.Pair(
          new ccc.base.NativeProcedure(ccc.syntax.Define.nativeImpl_),
          args));
};


/**
 * Binds the value of the second argument to the symbol named by the first
 * argument within the given environment.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Define.nativeImpl_ = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject('define: Invalid argument list');
  if (!args.car().isSymbol())
    return goog.Promise.reject('define: Symbol expected in first argument');
  if (args.cdr().isNil())
    return goog.Promise.reject('define: Missing binding value');
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject('define: Too many arguments');
  environment.set(args.car().name(), args.cdr().car());
  return goog.Promise.resolve(ccc.base.UNSPECIFIED);
};
