// The Cmacs Project.

goog.provide('ccc.base.NativeProcedure');

goog.require('ccc.base.Object');



/**
 * A NativeProcedure is an applicable object which executes native code when
 * applied.
 *
 * @param {ccc.base.NativeProcedure.FunctionType} nativeFunction
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.NativeProcedure = function(nativeFunction) {
  /** @private {ccc.base.NativeProcedure.FunctionType} */
  this.nativeFunction_ = nativeFunction;
};
goog.inherits(ccc.base.NativeProcedure, ccc.base.Object);



/**
 * A native function type which can be wrapped by NativeProcedure instances.
 *
 * @typedef {function(!ccc.base.Environment, !ccc.base.Object):
 *              !goog.Promise.<!ccc.base.Object>}
 * @public
 */
ccc.base.NativeProcedure.FunctionType;


/** @override */
ccc.base.NativeProcedure.prototype.toString = function() {
  return '#<native-procedure>';
};


/** @override */
ccc.base.NativeProcedure.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.base.NativeProcedure.prototype.eval = function(environment) {
  return goog.Promise.resolve(this);
};


/** @override */
ccc.base.NativeProcedure.prototype.apply = function(environment, args) {
  return this.nativeFunction_(environment, args);
};
