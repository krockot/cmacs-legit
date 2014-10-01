// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.syntax.Set');

goog.require('ccc.base.NativeProcedure');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');



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
  return goog.Promise.resolve(
      new ccc.base.Pair(
          new ccc.base.NativeProcedure(ccc.syntax.Set.nativeImpl_),
          args));
};


/**
 * Binds the value of the second argument to the symbol named by the first
 * argument. The binding nearest to the current environment is used.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Set.nativeImpl_ = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject('set!: Invalid argument list');
  if (!args.car().isSymbol())
    return goog.Promise.reject('set!: Symbol expected in first argument');
  if (args.cdr().isNil())
    return goog.Promise.reject('set!: Missing binding value');
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject('set!: Too many arguments');
  if (!environment.update(args.car().name(), args.cdr().car())) {
    return goog.Promise.reject('Cannot update binding for ubound symbol \'' +
        args.car().name());
  }
  return goog.Promise.resolve(ccc.base.UNSPECIFIED);
};
