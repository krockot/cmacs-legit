// The Cmacs Project.

goog.provide('ccc.Vector');

goog.require('ccc.Object');
goog.require('ccc.core.stringify');
goog.require('goog.array');



/**
 * Primitive Vector type.
 *
 * @param {!Array.<ccc.Data>} elements
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Vector = function(elements) {
  /** @private {!Array.<ccc.Data>} */
  this.elements_ = elements.slice();
};
goog.inherits(ccc.Vector, ccc.Object);


/**
 * Indicates if a {@code ccc.Data} object is a {@code ccc.Vector}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isVector = function(data) {
  return data instanceof ccc.Vector;
};


/** @override */
ccc.Vector.prototype.toString = function() {
  return '#(' + goog.array.map(this.elements_, ccc.core.stringify).join(' ') +
      ')';
};


/** @override */
ccc.Vector.prototype.equal = function(other) {
  return ccc.isVector(other) && goog.array.every(this.elements_,
    function(element, i) {
      return ccc.equal(element, other.elements_[i]);
    });
};


/**
 * Retrieves the number of elements in the vector.
 *
 * @return {number}
 */
ccc.Vector.prototype.size = function() {
  return this.elements_.length;
};


/**
 * Retrieves the element at a given index, or {@code null} if out of bounds.
 *
 * @param {number} index
 * @return {?ccc.Data}
 */
ccc.Vector.prototype.get = function(index) {
  if (index < 0 || index >= this.elements_.length)
    return null;
  return this.elements_[index];
};


/**
 * Sets the element at a given index.
 *
 * @param {number} index
 * @param {ccc.Data} data
 */
ccc.Vector.prototype.set = function(index, data) {
  goog.asserts.assert(index >= 0 && index < this.elements_.length);
  this.elements_[index] = data;
};


/**
 * Maps this vector to a new vector using the given transformation function.
 *
 * @param {function(ccc.Data):ccc.Data} transform
 * @return {!ccc.Vector}
 */
ccc.Vector.prototype.map = function(transform) {
  return new ccc.Vector(goog.array.map(this.elements_, transform));
};
