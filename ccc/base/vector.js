// The Cmacs Project.

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
 * Returns the size of the vector.
 *
 * @return {number}
 */
ccc.base.Vector.prototype.size = function() {
  return this.elements_.length;
};


/**
 * Returns the value at the given index.
 *
 * @param {number} index
 * @return {!ccc.base.Object}
 */
ccc.base.Vector.prototype.get = function(index) {
  if (index >= this.elements_.length)
    throw new Error('Vector index out of bounds');
  return this.elements_[index];
};


/**
 * Sets the value at the given index.
 *
 * @param {number} index
 * @param {!ccc.base.Object} value
 */
ccc.base.Vector.prototype.set = function(index, value) {
  if (index >= this.elements_.length)
    throw new Error('Vector index out of bounds');
  this.elements_[index] = value;
};


/** @override */
ccc.base.Vector.prototype.eval = function(environment, continuation) {
  return continuation(this);
};
