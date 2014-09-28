// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.F');
goog.provide('ccc.base.NIL');
goog.provide('ccc.base.T');
goog.provide('ccc.base.UNSPECIFIED');
goog.provide('ccc.base.Object');



/**
 * Base ccc runtime object.
 *
 * @constructor
 * @public
 */
ccc.base.Object = function() {};


/**
 * Returns a string representation of this object for logging and debugging
 * display. All derived object types should override this.
 *
 * @return {string}
 */
ccc.base.Object.prototype.toString = function() {
  return '#<object>';
};


/**
 * Default strict equality implementation: native object identity.
 *
 * @param {!ccc.base.Object} other
 * @return {boolean}
 */
ccc.base.Object.prototype.eq = function(other) {
  return this === other;
};


/**
 * Default equivalence implementation: fallback to strict equality.
 *
 * @param {!ccc.base.Object} other
 * @return {boolean}
 */
ccc.base.Object.prototype.eqv = function(other) {
  return this.eq(other);
};


/**
 * Default non-strict equality implementation: fallback to equivalence.
 *
 * @param {!ccc.base.Other} other
 * @return {boolean}
 */
ccc.base.Object.prototype.equal = function(other) {
  return this.eqv(other);
};


/**
 * Indicates if this object is a String.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isString = function() {
  return false;
};


/**
 * Indicates if this object is a Symbol.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isSymbol = function() {
  return false;
};


/**
 * Indicates if this object is a Char.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isChar = function() {
  return false;
};


/**
 * Indicates if this object is a Number.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isNumber = function() {
  return false;
};


/**
 * Indicates if this object is a Pair.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isPair = function() {
  return false;
};


/**
 * Indicates if this object is a Vector.
 *
 * @return {boolean}
 */
ccc.base.Object.prototype.isVector = function() {
  return false;
};


/**
 * The global NIL object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.NIL = new ccc.base.Object();


ccc.base.NIL.toString = function() { return '()'; };


/**
 * The global UNSPECIFIED object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.UNSPECIFIED = new ccc.base.Object();


ccc.base.UNSPECIFIED.toString = function() { return '#?'; };


/**
 * The global T (#t) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.T = new ccc.base.Object();


ccc.base.T.toString = function() { return '#t'; };


/**
 * The global F (#f) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.F = new ccc.base.Object();


ccc.base.F.toString = function() { return '#f'; };
