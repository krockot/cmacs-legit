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
  } else if (this.fragment_.getType() == cmacs.FragmentType.VECTOR &&
      this.fragment_.getNumChildren() == 0) {
    this.fragment_.appendData(ccc.NIL);
  }

  if (this.fragment_.getNumChildren() > 0) {
    this.setFragment(this.fragment_.getChild(0));
  }
};


/**
 * Erases whatever resides at the cursor position.
 *
 * If the cursor points to a top-level fragment, the fragment is replaced with
 * NIL.
 */
cmacs.Cursor.prototype.erase = function() {
  var parent = this.fragment_.getParent();
  if (goog.isNull(parent)) {
    this.fragment_.setData(ccc.NIL);
    this.dispatchEvent(cmacs.Cursor.EventType.CHANGE);
  } else {
    var parentIndex = this.fragment_.getParentIndex();
    parent.eraseChild(parentIndex);
    if (parent.getNumChildren() == 0) {
      this.setFragment(parent);
    } else {
      if (parentIndex == parent.getNumChildren())
        parentIndex--;
      this.setFragment(parent.getChild(parentIndex));
    }
  }
};
