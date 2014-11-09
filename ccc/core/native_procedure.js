// The Cmacs Project.

goog.provide('ccc.NativeProcedure');

goog.require('ccc.Object');



/**
 * A NativeProcedure is an applicable object which executes native code when
 * applied.
 *
 * @param {ccc.NativeProcedure.FunctionType} nativeFunction
 * @constructor
 * @extends {ccc.Object}
 */
ccc.NativeProcedure = function(nativeFunction) {
  /** @private {ccc.NativeProcedure.FunctionType} */
  this.nativeFunction_ = nativeFunction;
};
goog.inherits(ccc.NativeProcedure, ccc.Object);



/**
 * A native function type which can be wrapped by NativeProcedure instances.
 *
 * @typedef {function(!ccc.Environment,
 *                    (!ccc.Pair|!ccc.Nil),
 *                    ccc.Continuation):ccc.Thunk}
 */
ccc.NativeProcedure.FunctionType;


/** @override */
ccc.NativeProcedure.prototype.toString = function() {
  return '#<native-procedure>';
};


/** @override */
ccc.NativeProcedure.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.NativeProcedure.prototype.apply = function(
    environment, args, continuation) {
  return this.nativeFunction_(environment, args, continuation);
};
