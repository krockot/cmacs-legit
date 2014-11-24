// The Cmacs Project.

goog.provide('cmacs.Cursor');

goog.require('cmacs.Fragment');
goog.require('goog.asserts');
goog.require('goog.functions');



/**
 * A Cursor points into the contents of some {@code cmacs.Fragment}.
 *
 * @param {!cmacs.Fragment} fragment
 * @constructor
 */
cmacs.Cursor = function(fragment) {
  /** @private {!cmacs.Fragment} */
  this.fragment_ = fragment;
};


/**
 * Moves the cursor left.
 */
cmacs.Cursor.prototype.moveLeft = function() {
};


/**
 * Moves the cursor right.
 */
cmacs.Cursor.prototype.moveRight = function() {
};


/**
 * Moves the cursor up (really, out) one level.
 */
cmacs.Cursor.prototype.moveUp = function() {
};


/**
 * Moves the cursor down (really, in) one level. This may have the side-effect
 * of injecting a new NIL element in the newly entered data structure if it was
 * previously empty.
 */
cmacs.Cursor.prototype.moveDown = function() {
};
