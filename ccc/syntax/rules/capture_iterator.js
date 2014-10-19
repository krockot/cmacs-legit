// The Cmacs Project.

goog.provide('ccc.syntax.CaptureIterator');
goog.provide('ccc.syntax.CaptureIteratorSet');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture');



/**
 * A CaptureIterator is used to iterate over a single {@code ccc.syntax.Capture}
 * during template expansion.
 *
 * @param {!ccc.syntax.Capture} capture
 * @constructor
 * @public
 */
ccc.syntax.CaptureIterator = function(capture) {
  /** @private {!ccc.syntax.Capture} */
  this.capture_ = capture;

  /** @private {number} */
  this.index_ = 0;
};


/**
 * Gets the current child capture. It is an error to call this if the iterator
 * is at the end of the capture. Singular captures return themselves
 * indefinitely.
 *
 * @return {!ccc.syntax.Capture}
 * @public
 */
ccc.syntax.CaptureIterator.prototype.get = function() {
  if (this.capture_.isSingular()) {
    return this.capture_;
  }
  var children = this.capture_.children();
  goog.asserts.assert(this.index_ < children.length);
  return children[this.index_];
};


/**
 * Advances the iterator.
 *
 * @public
 */
ccc.syntax.CaptureIterator.prototype.advance = function() {
  if (this.capture_.isSingular())
    return;
  var children = this.capture_.children();
  if (this.index_ < children.length)
    ++this.index_;
};


/**
 * Indicates if the iterator is at the end of its capture.
 *
 * @return {boolean}
 * @public
 */
ccc.syntax.CaptureIterator.prototype.isAtEnd = function() {
  return !this.capture_.isSingular() &&
      this.index_ >= this.capture_.children().length;
};


/**
 * Resets the iterator to its starting position.
 *
 * @public
 */
ccc.syntax.CaptureIterator.prototype.reset = function() {
  this.index_ = 0;
};


/**
 * Gets the iterator's underlying {@code ccc.syntax.Capture}.
 *
 * @return {!ccc.syntax.Capture}
 * @public
 */
ccc.syntax.CaptureIterator.prototype.capture = function() {
  return this.capture_;
};



/**
 * A CaptureIteratorSet is a map from symbol names to
 * {@code ccc.syntax.CaptureIterator} objects.
 *
 * @typedef {!Object.<string, !ccc.syntax.CaptureIterator>}
 * @public
 */
ccc.syntax.CaptureIteratorSet;
