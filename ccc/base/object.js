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
ccc.base.Object = function() {
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
 * The global NIL object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.NIL = new ccc.base.Object();


/**
 * The global UNSPECIFIED object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.UNSPECIFIED = new ccc.base.Object();


/**
 * The global T (#t) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.T = new ccc.base.Object();


/**
 * The global F (#f) object.
 *
 * @public {!ccc.base.Object}
 * @const
 */
ccc.base.F = new ccc.base.Object();
