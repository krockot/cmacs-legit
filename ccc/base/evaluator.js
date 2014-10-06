// The Cmacs Project.

goog.provide('ccc.base.Evaluator');

goog.require('ccc.base.Continuation');
goog.require('ccc.base.Environment');
goog.require('ccc.base.Object');
goog.require('ccc.base.Thunk');
goog.require('goog.Promise');
goog.require('goog.promise.Resolver');



/**
 * An Evaluator provides a promise-based interface for evaluating objects
 * within a single environment.
 *
 * @param {!ccc.base.Environment} environment
 * @constructor
 * @public
 */
ccc.base.Evaluator = function(environment) {
  /** @private {!ccc.base.Environment} */
  this.environment_ = environment;
};


/**
 * Evaluates an object.
 *
 * @param {!ccc.base.Object} object
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.base.Evaluator.prototype.evalObject = function(object) {
  var resolver = goog.Promise.withResolver();
  var continuation = goog.partial(
      ccc.base.Evaluator.evalObjectContinuationImpl_,
      resolver);
  var thunk = object.eval(this.environment_, continuation);
  while (thunk !== ccc.base.Evaluator.terminate_) {
    thunk = thunk();
  }
  return resolver.promise;
};


/**
 * Termination thunk.
 * @type {ccc.base.Thunk}
 * @private
 */
ccc.base.Evaluator.terminate_ = function() {
  return ccc.base.Evaluator.terminate_;
};


/**
 * Unbound toplevel continuation for a single {@code evalObject} call.
 *
 * @param {!goog.promise.Resolver.<!ccc.base.Object>} resolver
 * @param {ccc.base.Object} result
 * @param {Error=} opt_error
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.base.Evaluator.evalObjectContinuationImpl_ = function(
    resolver, result, opt_error) {
  if (goog.isDef(opt_error)) {
    resolver.reject(opt_error);
  } else {
    goog.asserts.assert(!goog.isNull(result));
    resolver.resolve(result);
  }
  return ccc.base.Evaluator.terminate_;
};
