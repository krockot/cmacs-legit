// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Number');

goog.require('ccc.base.Object');



/**
 * Basic number type.
 *
 * @param {number} value
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Number = function(value) {
  /** @private {number} */
  this.value_ = value;
};
goog.inherits(ccc.base.Number, ccc.base.Object);


/** @override */
ccc.base.Number.prototype.toString = function() {
  return this.value_.toString();
};


/** @override */
ccc.base.Number.prototype.eq = function(other) {
  return other.isNumber() && this.value_ == other.value_;
};


/** @override */
ccc.base.Number.prototype.isNumber = function() {
  return true;
};


/**
 * Returns the underlying numeric value.
 *
 * @return {number}
 */
ccc.base.Number.prototype.value = function() {
  return this.value_;
};
