// The Cmacs Project.

goog.provide('ccc.Object');

goog.require('ccc.Error');



/**
 * Base ccc runtime object.
 *
 * @constructor
 */
ccc.Object = function() {};


/**
 * Returns a string representation of this object for logging and debugging
 * display. All derived object types should override this.
 *
 * @return {string}
 */
ccc.Object.prototype.toString = function() {
  return '#<object>';
};


/**
 * Default strict equality implementation: native object identity.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.eq = function(other) {
  return this === other;
};


/**
 * Default equivalence implementation: fallback to strict equality.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.eqv = function(other) {
  return this.eq(other);
};


/**
 * Default non-strict equality implementation: fallback to equivalence.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.equal = function(other) {
  return this.eqv(other);
};


/**
 * Indicates if this object is applicable (i.e. it implements {@code apply}).
 *
 * @return {boolean}
 */
ccc.Object.prototype.isApplicable = function() {
  return false;
};


/**
 * Expand this object.
 *
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.expand = function(continuation) {
  return continuation(this);
};


/**
 * Compile this object.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.compile = function(environment, continuation) {
  // Objects compile to themselves by default.
  return continuation(this);
};


/**
 * Evaluate this object.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object should be evaluated.
 * @param {ccc.Continuation} continuation The continuation which
 *     should receive the result of this evaluation.
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.eval = function(environment, continuation) {
  // All {@code ccc.Object} types are self-evaluating by default.
  return continuation(this);
};


/**
 * Apply this object to combine a list of data. Should only be called if
 * {@code isApplicable} returns {@code true}.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object application is to be initiated.
 * @param {(!ccc.Pair|!ccc.Nil)} args The arguments to apply.
 * @param {ccc.Continuation} continuation The continuation which should
 *     receive the result of this procedure application.
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.apply = function(environment, args, continuation) {
  return continuation(new ccc.Error('Object ' + this.toString() +
      ' is not applicable.'));
};
