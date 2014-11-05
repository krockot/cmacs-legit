// The Cmacs Project.

goog.provide('ccc.Error');



/**
 * An exception type which can be propagated to continuations in lieu of a
 * result value.
 *
 * @constructor
 * @param {string} message
 */
ccc.Error = function(message) {
  /** @private {string} */
  this.message_ = message;

  /** @private {string} */
  this.stack_ = (new Error()).stack.split('\n')[2];
};


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Error}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isError = function(data) {
  return data instanceof ccc.Error;
};


/**
 * @return {string}
 */
ccc.Error.prototype.toString = function() {
  return this.message_ + '\n' + this.stack_;
};


/**
 * Passes the error on to another continuation. This captures additional stack
 * data to make error tracing easier.
 *
 * @return {!ccc.Error}
 */
ccc.Error.prototype.pass = function() {
  this.stack_ += '\n' + (new Error()).stack.split('\n')[2];
  return this;
};
