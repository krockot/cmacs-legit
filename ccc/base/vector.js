// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Vector');

goog.require('ccc.base.Object');
goog.require('goog.array');



/**
 * Vector type.
 *
 * @param {!Array.<!ccc.base.Object>} elements
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Vector = function(elements) {
  /** @private {!Array.<!ccc.base.Object>} */
  this.elements_ = elements;
};
goog.inherits(ccc.base.Vector, ccc.base.Object);


/** @override */
ccc.base.Vector.prototype.toString = function() {
  return '#(' + goog.array.map(this.elements_, function(element) {
      return element.toString();
    }).join(' ') + ')';
};


/** @override */
ccc.base.Vector.prototype.equal = function(other) {
  return other.isVector() &&
      other.elements_.length == this.elements_.length &&
      goog.array.every(this.elements_,
          function(value, index) {
            return value.equal(other.elements_[index]);
          });
};


/** @override */
ccc.base.Vector.prototype.isVector = function() {
  return true;
};


/**
 * Returns the underlying Array of elements.
 *
 * @return {!Array.<!ccc.base.Object>}
 */
ccc.base.Vector.prototype.elements = function() {
  return this.elements_;
};
