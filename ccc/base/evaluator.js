// The Cmacs Project.

goog.provide('ccc.base.Evaluator');

goog.require('ccc.base.Continuation');
goog.require('ccc.base.Environment');
goog.require('ccc.base.Object');
goog.require('ccc.base.Thunk');
goog.require('goog.Promise');
goog.require('goog.promise.Resolver');
goog.require('goog.Timer');



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
 * The number of consecutive thunks to execute synchronously before yielding
 * control.
 * @private {number}
 * @const
 */
ccc.base.Evaluator.THUNKS_PER_SLICE_ = 1000;


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
  ccc.base.Evaluator.runSlice_(thunk);
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


/**
 * Executes at most {@code ccc.base.Evaluator.THUNKS_PER_SLICE_} thunks
 * synchronously. May terminate early if the termination thunk is hit. If the
 * maximum number of thunks is reached without termination, a timeout is set to
 * run another slice asynchronously.
 *
 * @param {!ccc.base.Thunk} thunk
 */
ccc.base.Evaluator.runSlice_ = function(thunk) {
  var thunksRemaining = ccc.base.Evaluator.THUNKS_PER_SLICE_;
  while (thunk !== ccc.base.Evaluator.terminate_ && thunksRemaining--) {
    thunk = thunk();
  }
  if (thunk !== ccc.base.Evaluator.terminate_)
    goog.Timer.callOnce(goog.partial(ccc.base.Evaluator.runSlice_, thunk));
};
