// The Cmacs Project.

goog.provide('cmacs.Cursor');

goog.require('cmacs.Fragment');
goog.require('goog.asserts');
goog.require('goog.events.EventTarget');
goog.require('goog.functions');



/**
 * A Cursor points into the contents of some {@code cmacs.Fragment}.
 *
 * @param {!cmacs.Fragment} fragment
 * @extends {goog.events.EventTarget}
 * @constructor
 */
cmacs.Cursor = function(fragment) {
  cmacs.Cursor.base(this, 'constructor');

  /** @private {!cmacs.Fragment} */
  this.fragment_ = fragment;
};
goog.inherits(cmacs.Cursor, goog.events.EventTarget);


/**
 * Event types that can be dispatched by a cursor.
 *
 * The CHANGE event is dispatched any time the cursor points to a new Fragment.
 *
 * @enum {string}
 */
cmacs.Cursor.EventType = {
  CHANGE: 'change'
};


/**
 * Gets the fragment to which this cursor points.
 *
 * @return {!cmacs.Fragment}
 */
cmacs.Cursor.prototype.getFragment = function() {
  return this.fragment_;
};


/**
 * Points the cursor to a new fragment.
 *
 * @param {!cmacs.Fragment} fragment
 */
cmacs.Cursor.prototype.setFragment = function(fragment) {
  if (fragment === this.fragment_)
    return;
  this.fragment_ = fragment;
  this.dispatchEvent(cmacs.Cursor.EventType.CHANGE);
};


/**
 * Moves the cursor left.
 */
cmacs.Cursor.prototype.moveLeft = function() {
  var parent = this.fragment_.getParent();
  if (goog.isNull(parent))
    return;
  var parentIndex = this.fragment_.getParentIndex();
  if (parentIndex == 0)
    return;
  this.setFragment(parent.getChild(parentIndex - 1));
};


/**
 * Moves the cursor right.
 */
cmacs.Cursor.prototype.moveRight = function() {
  var parent = this.fragment_.getParent();
  if (goog.isNull(parent))
    return;
  var parentIndex = this.fragment_.getParentIndex();
  goog.asserts.assert(parentIndex < parent.getNumChildren());
  if (parentIndex == parent.getNumChildren() - 1)
    return;
  this.setFragment(parent.getChild(parentIndex + 1));
};


/**
 * Moves the cursor up (really, out) one level.
 */
cmacs.Cursor.prototype.moveUp = function() {
  var parent = this.fragment_.getParent();
  if (goog.isNull(parent))
    return;
  this.setFragment(parent);
};


/**
 * Moves the cursor down (really, in) one level. This may have the side-effect
 * of injecting a new NIL element in the newly entered data structure if it was
 * previously empty.
 */
cmacs.Cursor.prototype.moveDown = function() {
  if (this.fragment_.getNumChildren() == 0)
    return;
  this.setFragment(this.fragment_.getChild(0));
};
