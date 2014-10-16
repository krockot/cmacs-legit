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
 *     of this new capture. May either be a single base Object or a collection
 *     of equal-rank captures.
 * @constructor
 * @public
 */
ccc.syntax.Capture = function(contents) {
  /** @private {number} */
  this.rank_ = 0;

  /** @private {!ccc.base.Object|!Array.<!ccc.syntax.Capture>} */
  this.contents_ = contents;

  if (contents instanceof Array) {
    if (contents.length > 0) {
      var baseRank = contents[0].rank_;
      goog.array.forEach(contents, function(capture) {
        goog.asserts.assert(capture.rank_ == baseRank);
      });
      this.rank_ = baseRank + 1;
    } else {
      this.rank_ = 1;
    }
  } else {
    goog.asserts.assert(this.rank_ == 0);
  }
};


/**
 * Returns the rank of this capture.
 *
 * @return {number}
 * @public
 */
ccc.syntax.Capture.prototype.rank = function() {
  return this.rank_;
};


/**
 * Return the contents of this capture.
 *
 * @return {!ccc.base.Object|!Array.<!ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.Capture.prototype.contents = function() {
  return this.contents_;
};


/**
 * Indicates if another Capture is equivalent to this one.
 *
 * @param {!ccc.syntax.Capture} other
 * @return {boolean}
 */
ccc.syntax.Capture.prototype.equal = function(other) {
  if (this.rank_ !== other.rank_)
    return false;
  if (!(this.contents_ instanceof Array) && !(other.contents_ instanceof Array))
    return this.contents_.equal(other.contents_);
  if (this.contents_.length !== other.contents_.length)
    return false;
  goog.asserts.assert(this.contents_ instanceof Array);
  return goog.array.every(this.contents_, function(capture, i) {
    return capture.equal(other.contents_[i]);
  });
};


/**
 * Stringification for test and debug output.
 *
 * @return {string}
 */
ccc.syntax.Capture.prototype.toString = function() {
  return ((this.contents_ instanceof Array)
      ? ('<' + this.contents_.join(', ') + '>')
      : this.contents_.toString());
};



/**
 * A CaptureSet is a map from symbol name to {@code ccc.syntax.Capture} objects.
 * This is the output of a successful match operation.
 *
 * @typedef {!Object.<string, !ccc.syntax.Capture>}
 * @public
 */
ccc.syntax.CaptureSet;
