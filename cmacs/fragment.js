// The Cmacs Project.

goog.provide('cmacs.Fragment');

goog.require('ccc.core');
goog.require('goog.array');



/**
 * A Fragment recursively wraps program data with metadata that's useful for
 * structural navigation and manipulation.
 *
 * @param {ccc.Data} data
 * @param {!cmacs.Fragment=} opt_parent The parent Fragment.
 * @param {number=} opt_parentIndex This child's index within its parent.
 * @constructor
 */
cmacs.Fragment = function(data, opt_parent, opt_parentIndex) {
  /** @private {cmacs.FragmentType} */
  this.type_ = cmacs.FragmentType.LEAF;

  // Neither or both of the optional args must be set.
  goog.asserts.assert(goog.isDef(opt_parent) === goog.isDef(opt_parentIndex));

  /** @private {cmacs.Fragment} */
  this.parent_ = goog.isDef(opt_parent) ? opt_parent : null;

  /** @private {number} */
  this.parentIndex_ = goog.isDef(opt_parentIndex) ? opt_parentIndex : 0;

  /** @private {?ccc.Data} */
  this.data_ = ccc.NIL;

  /** @private {!Array.<!cmacs.Fragment>} */
  this.children_ = [];

  this.setData(data);
};


/**
 * Fragment type.
 *
 * @enum {number}
 */
cmacs.FragmentType = {
  LEAF: 0,
  LIST: 1,
  IMPROPER_LIST: 2,
  VECTOR: 3,
};


/**
 * Retrieves the program data for this fragment.
 *
 * @return {ccc.Data}
 */
cmacs.Fragment.prototype.getData = function() {
  switch (this.type_) {
    case cmacs.FragmentType.LEAF:
      goog.asserts.assert(!goog.isNull(this.data_));
      return this.data_;
    case cmacs.FragmentType.LIST:
      return ccc.Pair.makeList(this.children_.map(
          cmacs.Fragment.getFragmentData));
    case cmacs.FragmentType.IMPROPER_LIST:
      goog.asserts.assert(this.children_.length >= 2);
      return ccc.Pair.makeList(
          this.children_.slice(0, -1).map(cmacs.Fragment.getFragmentData),
          this.children_.slice(-1)[0].getData());
    case cmacs.FragmentType.VECTOR:
      return new ccc.Vector(this.children_.map(cmacs.Fragment.getFragmentData));
    default:
      goog.asserts.assert(false, 'Not reached.');
      return ccc.NIL;
  }
};


/**
 * Static helper to get data for a fragment.
 *
 * @param {!cmacs.Fragment} fragment
 * @return {ccc.Data}
 */
cmacs.Fragment.getFragmentData = function(fragment) {
  return fragment.getData();
};


/**
 * Replaces the data in this fragment.
 *
 * @param {ccc.Data} data
 */
cmacs.Fragment.prototype.setData = function(data) {
  this.data_ = null;
  this.children_ = [];
  if (ccc.isPair(data)) {
    var element = data;
    var parentIndex = 0;
    while (ccc.isPair(element)) {
      this.children_.push(new cmacs.Fragment(element.car(), this, parentIndex));
      element = element.cdr();
      parentIndex++;
    }
    if (!ccc.isNil(element)) {
      this.type_ = cmacs.FragmentType.IMPROPER_LIST;
      this.children_.push(new cmacs.Fragment(element, this, parentIndex));
    } else {
      this.type_ = cmacs.FragmentType.LIST;
    }
  } else if (ccc.isVector(data)) {
    this.type_ = cmacs.FragmentType.VECTOR;
    for (var i = 0; i < data.size(); ++i) {
      var element = data.get(i);
      goog.asserts.assert(!goog.isNull(element));
      this.children_.push(new cmacs.Fragment(element, this, i));
    }
  } else {
    this.type_ = cmacs.FragmentType.LEAF;
    this.data_ = data;
  }
};


/**
 * Returns the type of this fragment.
 *
 * @return {cmacs.FragmentType}
 */
cmacs.Fragment.prototype.getType = function() {
  return this.type_;
};


/**
 * Returns a copy of this fragment's child collection.
 *
 * @return {!Array.<!cmacs.Fragment>}
 */
cmacs.Fragment.prototype.getChildren = function() {
  return this.children_.slice();
};


/**
 * Returns the number of children this fragment has.
 *
 * @return {number}
 */
cmacs.Fragment.prototype.getNumChildren = function() {
  return this.children_.length;
};


/**
 * Returns the i'th child of this fragment. This asserts if you use it wrong,
 * so don't.
 *
 * @param {number} index
 * @return {!cmacs.Fragment}
 */
cmacs.Fragment.prototype.getChild = function(index) {
  goog.asserts.assert(index >= 0 && index < this.children_.length);
  return this.children_[index];
};


/**
 * Replaces the i'th child with new data. Returns the new child fragment.
 *
 * @param {number} index
 * @param {ccc.Data} data
 * @return {!cmacs.Fragment}
 */
cmacs.Fragment.prototype.setChild = function(index, data) {
  goog.asserts.assert(index >= 0 && index < this.children_.length);
  var child = new cmacs.Fragment(data, this, index);
  this.children_[index] = child;
  return child;
};


/**
 * Erases the i'th child.
 *
 * @param {number} index
 */
cmacs.Fragment.prototype.eraseChild = function(index) {
  goog.asserts.assert(index >= 0 && index < this.children_.length);

  if (this.type_ == cmacs.FragmentType.LIST &&
      this.children_.length == 1) {
    this.type_ = cmacs.FragmentType.LEAF;
    this.data_ = ccc.NIL;
    this.children_ = [];
    return;
  }

  if (this.type_ == cmacs.FragmentType.IMPROPER_LIST &&
      this.children_.length == 2) {
    this.type_ = cmacs.FragmentType.LIST;
  }

  this.children_.splice(index, 1);
};


/**
 * Returns this fragment's parent, or {@code null} if it's a root fragment.
 *
 * @return {cmacs.Fragment}
 */
cmacs.Fragment.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Returns the fragment's index within its parent.
 *
 * @return {number}
 */
cmacs.Fragment.prototype.getParentIndex = function() {
  return this.parentIndex_;
};


/**
 * Appends a child to this fragment's children. It's invalid to call this on
 * a leaf fragment. Returns the new child fragment.
 *
 * @param {ccc.Data} data
 * @return {!cmacs.Fragment}
 */
cmacs.Fragment.prototype.appendData = function(data) {
  goog.asserts.assert(this.type_ != cmacs.FragmentType.LEAF);
  var child = new cmacs.Fragment(data, this, this.children_.length);
  this.children_.push(child);
  return child;
};


/**
 * Inserts a child in this fragment's children.
 *
 * @param {ccc.Data} data
 * @param {number} index
 * @return {!cmacs.Fragment}
 */
cmacs.Fragment.prototype.insertData = function(data, index) {
  goog.asserts.assert(this.type_ != cmacs.FragmentType.LEAF);
  var child = new cmacs.Fragment(data, this, index);
  for (var i = index; i < this.children_.length; ++i)
    this.children_[i].parentIndex_++;
  this.children_.splice(index, 0, child);
  return child;
};

