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

  // TODO(krockot): Better source tracking. This class could provide an
  // interface for continuations to append tracking data as they pass the Error
  // back to the original execution context. Capturing a JS stack dump is mostly
  // useless.

  /** @private {string} */
  this.stack_ = (new Error()).stack;
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
