// The Cmacs Project.

goog.provide('ccc.Evaluator');

goog.require('ccc.Error');
goog.require('goog.Promise');
goog.require('goog.promise.Resolver');
goog.require('goog.Timer');



/**
 * An Evaluator provides a promise-based interface for evaluating objects
 * within a single environment.
 *
 * @param {!ccc.Environment} environment
 * @constructor
 * @public
 */
ccc.Evaluator = function(environment) {
  /** @private {!ccc.Environment} */
  this.environment_ = environment;
};


/**
 * The number of consecutive thunks to execute synchronously before yielding
 * control.
 * @private {number}
 * @const
 */
ccc.Evaluator.THUNKS_PER_SLICE_ = 1000;


/**
 * Evaluates a data object.
 *
 * @param {ccc.Data} data
 * @return {!goog.Promise.<ccc.Data, !ccc.Error>}
 * @public
 */
ccc.Evaluator.prototype.evalData = function(data) {
  var resolver = goog.Promise.withResolver();
  var thunk = ccc.eval(data, this.environment_, goog.partial(
      ccc.Evaluator.evalDataContinuationImpl_, resolver));
  ccc.Evaluator.runSlice_(thunk);
  return resolver.promise;
};


/**
 * Termination thunk. This returns itself, effectively halting computation.
 *
 * @type {ccc.Thunk}
 * @private
 */
ccc.Evaluator.terminate_ = function() {
  return ccc.Evaluator.terminate_;
};


/**
 * Unbound toplevel continuation for a single {@code evalData} call.
 *
 * @param {!goog.promise.Resolver.<ccc.Data>} resolver
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Evaluator.evalDataContinuationImpl_ = function(resolver, result) {
  if (ccc.isError(result)) {
    resolver.reject(result);
  } else {
    resolver.resolve(result)
  }
  return ccc.Evaluator.terminate_;
};


/**
 * Executes at most {@code ccc.Evaluator.THUNKS_PER_SLICE_} thunks
 * synchronously. May terminate early if the termination thunk is hit. If the
 * maximum number of thunks is reached without termination, a timeout is set to
 * run another slice asynchronously.
 *
 * @param {!ccc.Thunk} thunk
 * @private
 */
ccc.Evaluator.runSlice_ = function(thunk) {
  var thunksRemaining = ccc.Evaluator.THUNKS_PER_SLICE_;
  while (thunk !== ccc.Evaluator.terminate_ && thunksRemaining--) {
    thunk = thunk();
  }
  if (thunk !== ccc.Evaluator.terminate_)
    goog.Timer.callOnce(goog.partial(ccc.Evaluator.runSlice_, thunk));
};
