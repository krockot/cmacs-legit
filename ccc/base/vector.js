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
 * @public
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
 * @public
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
 * @public
 */
ccc.Vector.prototype.size = function() {
  return this.elements_.length;
};


/**
 * Retrieves the element at a given index, or {@code null} if out of bounds.
 *
 * @param {number} index
 * @return {?ccc.Data}
 * @public
 */
ccc.Vector.prototype.get = function(index) {
  if (index < 0 || index >= this.elements_.length)
    return null;
  return this.elements_[index];
};

