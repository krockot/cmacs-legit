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
  if (parentIndex < parent.getNumChildren() - 1) {
    this.setFragment(parent.getChild(parentIndex + 1));
  } else {
    this.setFragment(parent.appendData(ccc.NIL));
  }
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
 * Moves the cursor down (really, in) one level.
 */
cmacs.Cursor.prototype.moveDown = function() {
  // Special case for entering an empty list: replace with a non-empty list.
  if (this.fragment_.getType() == cmacs.FragmentType.LEAF &&
      ccc.isNil(this.fragment_.getData())) {
    this.fragment_.setData(new ccc.Pair(ccc.NIL, ccc.NIL));
  }

  if (this.fragment_.getNumChildren() > 0) {
    this.setFragment(this.fragment_.getChild(0));
  }
};
