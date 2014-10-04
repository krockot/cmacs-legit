// The Cmacs Project.

goog.provide('ccc.base.F');
goog.provide('ccc.base.NIL');
goog.provide('ccc.base.T');
goog.provide('ccc.base.UNSPECIFIED');
goog.provide('ccc.base.Object');

goog.require('goog.Promise');


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
 * @public
 */
ccc.base.Object.prototype.toString = function() {
  return '#<object>';
};


/**
 * Default strict equality implementation: native object identity.
 *
 * @param {!ccc.base.Object} other
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.eq = function(other) {
  return this === other;
};


/**
 * Default equivalence implementation: fallback to strict equality.
 *
 * @param {!ccc.base.Object} other
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.eqv = function(other) {
  return this.eq(other);
};


/**
 * Default non-strict equality implementation: fallback to equivalence.
 *
 * @param {!ccc.base.Other} other
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.equal = function(other) {
  return this.eqv(other);
};


/**
 * Evaluates this object

/**
 * Indicates if this object is a String.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isString = function() {
  return false;
};


/**
 * Indicates if this object is the global NIL object.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isNil = function() {
  return false;
};


/**
 * Indicates if this object is the global T object.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isTrue = function() {
  return false;
};


/**
 * Indicates if this object is the global F object.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isFalse = function() {
  return false;
};


/**
 * Indicates if this object is the global UNSPECIFIED object.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isUnspecified = function() {
  return false;
};


/**
 * Indicates if this object is a Symbol.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isSymbol = function() {
  return false;
};


/**
 * Indicates if this object is a Char.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isChar = function() {
  return false;
};


/**
 * Indicates if this object is a Number.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isNumber = function() {
  return false;
};


/**
 * Indicates if this object is a Pair.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isPair = function() {
  return false;
};


/**
 * Indicates if this object is a Vector.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isVector = function() {
  return false;
};


/**
 * Indicates if this object is an Environment.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isEnvironment = function() {
  return false;
};


/**
 * Indicates if this object is a compiled Procedure.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isProcedure = function() {
  return false;
};


/**
 * Indicates if this object is applicable (i.e. callable with {@code apply}).
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isApplicable = function() {
  return false;
};


/**
 * Indicates if this object is a Transformer.
 *
 * @return {boolean}
 * @public
 */
ccc.base.Object.prototype.isTransformer = function() {
  return false;
};


/**
 * Compile this object.
 *
 * @param {!ccc.base.Environment} environment The environment in which this
 *     object is to be compiled.
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.base.Object.prototype.compile = function(environment) {
  return goog.Promise.resolve(this);
};


/**
 * Apply this object. Should only be called if {@code isApplicable} returns
 * {@code true}.
 *
 * @param {!ccc.base.Environment} environment The environment in which this
 *     object application is to be initiated.
 * @param {!ccc.base.Object} args The arguments to apply. Guaranteed to be
 *     either a Pair or NIL.
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @public
 */
ccc.base.Object.prototype.apply = function(environment, args) {
  return goog.Promise.reject(new Error('Object is not applicable.'));
};


/**
 * Evaluate this object.
 *
 * @param {!ccc.base.Environment} environment The environment in which this
 *     object should be evaluated.
 * @return {!goog.Promise.<!ccc.base.Object>}
 * @public
 */
ccc.base.Object.prototype.eval = function(environment) {
  return goog.Promise.reject(
      new Error('Object ' + this.toString() + ' cannot be evaluated.'));
};


/**
 * The global NIL object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.NIL = new ccc.base.Object();


/** @override */
ccc.base.NIL.toString = function() { return '()'; };


/** @override */
ccc.base.NIL.isNil = function() { return true; };


/** @override */
ccc.base.NIL.eval = function(environment) {
  return goog.Promise.resolve(this);
};


/**
 * The global UNSPECIFIED object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.UNSPECIFIED = new ccc.base.Object();


/** @override */
ccc.base.UNSPECIFIED.toString = function() { return '#?'; };


/** @override */
ccc.base.UNSPECIFIED.isUnspecified = function() { return true; };


/** @override */
ccc.base.UNSPECIFIED.eval = function(environment) {
  return goog.Promise.resolve(this);
};


/**
 * The global T (#t) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.T = new ccc.base.Object();


/** @override */
ccc.base.T.toString = function() { return '#t'; };


/** @override */
ccc.base.T.isTrue = function() { return true; };


/** @override */
ccc.base.T.eval = function(environment) { return goog.Promise.resolve(this); };


/**
 * The global F (#f) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.F = new ccc.base.Object();


/** @override */
ccc.base.F.toString = function() { return '#f'; };


/** @override */
ccc.base.F.isFalse = function() { return true; };


/** @override */
ccc.base.F.eval = function(environment) { return goog.Promise.resolve(this); };
