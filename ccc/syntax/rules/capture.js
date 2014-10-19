// The Cmacs Project.

goog.provide('ccc.syntax.Capture');
goog.provide('ccc.syntax.CaptureSet');

goog.require('ccc.base');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * A Capture holds information about a single pattern variable captured during
 * a syntax pattern matching operation. Captures may represent single values or
 * nested value series with arbitrary depth.
 *
 * @param {!ccc.base.Object|!Array.<!ccc.syntax.Capture>} contents The contents
 *     of the capture, which may be a single object for terminal captures or
 *     an array of child captures.
 * @constructor
 * @public
 */
ccc.syntax.Capture = function(contents) {
  /** @private {ccc.base.Object} */
  this.object_ = contents instanceof ccc.base.Object ? contents : null;

  /** @private {!Array.<!ccc.syntax.Capture>} */
  this.children_ = contents instanceof Array ? contents : [];
};


/**
 * Indicates if this capture is has a single object associated with it.
 *
 * @return {boolean}
 * @public
 */
ccc.syntax.Capture.prototype.isSingular = function() {
  return !goog.isNull(this.object_);
};


/**
 * Returns the object contents of this capture, or {@code null} for captures
 * with no directly associated object.
 *
 * @return {ccc.base.Object}
 */
ccc.syntax.Capture.prototype.object = function() {
  return this.object_;
};


/**
 * Returns the children of this capture.
 *
 * @return {!Array.<!ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.Capture.prototype.children = function() {
  return this.children_;
};


/**
 * Indicates if another Capture is equivalent to this one.
 *
 * @param {!ccc.syntax.Capture} other
 * @return {boolean}
 */
ccc.syntax.Capture.prototype.equal = function(other) {
  if (this.isSingular() != other.isSingular())
    return false;
  if (this.isSingular()) {
    goog.asserts.assert(!goog.isNull(other.object_));
    return this.object_.equal(other.object_);
  }
  if (this.children_.length != other.children_.length)
    return false;
  return goog.array.every(this.children_, function(capture, i) {
    return capture.equal(other.children_[i]);
  });
};


/**
 * Stringification for test and debug output.
 *
 * @return {string}
 */
ccc.syntax.Capture.prototype.toString = function() {
  return (goog.isNull(this.object_)
      ? ('<' + this.children_.join(', ') + '>')
      : this.object_.toString());
};



/**
 * A CaptureSet is a map from symbol name to {@code ccc.syntax.Capture} objects.
 * This is the output of a successful match operation.
 *
 * @typedef {!Object.<string, !ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.CaptureSet;
