// The Cmacs Project.

goog.provide('ccc.Promise');

goog.require('ccc.Object');



/**
 * A data type which captures a lazy computation to be executed and memoized on
 * first evaluation.
 *
 * @param {ccc.Data} data
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Promise = function(data) {
  /** @private {?ccc.Data} */
  this.value_ = null;

  /** @private {ccc.Data} */
  this.data_ = data;
};
goog.inherits(ccc.Promise, ccc.Object);


/**
 * Indicates if a {@code ccc.Data} is a {@code ccc.Promise}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isPromise = function(data) {
  return data instanceof ccc.Promise;
};


/** @override */
ccc.Promise.prototype.toString = function() {
  return '#<promise>';
};


/**
 * Forces the promise to evaluate its captured procedure if it hasn't yet been
 * evaluated.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 */
ccc.Promise.prototype.force = function(environment, continuation) {
  if (!goog.isNull(this.value_))
    return continuation(this.value_);
  return ccc.eval(this.data_, environment)(
      goog.bind(this.onForceComplete_, this, continuation));
};


/**
 * Handles the result of the promise's captured procedure evaluation.
 *
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Promise.prototype.onForceComplete_ = function(continuation, result) {
  if (ccc.isError(result))
    return continuation(result);
  this.value_ = result;
  return continuation(result);
};
