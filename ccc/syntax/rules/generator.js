// The Cmacs Project.

goog.provide('ccc.syntax.Generator');
goog.provide('ccc.syntax.GeneratorSet');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture');



/**
 * A Generator provides a stream of objects from a {@code ccc.syntax.Capture}
 * to be used during template expansion.
 *
 * @param {!ccc.syntax.Capture} capture
 * @param {number} depth
 * @constructor
 * @public
 */
ccc.syntax.Generator = function(capture, depth) {
  /** @private {!ccc.syntax.Capture} */
  this.capture_ = capture;

  /** @private {number} */
  this.depth_ = capture.rank() == 0 ? 0 : 1;

  /** @private {number} */
  this.index_ = 0;

  /** @private {boolean} */
  this.consumed_ = false;
};


/**
 * Gets the current object in the generator's stream, or {@code null} if there
 * are no more objects available.
 *
 * @return {ccc.base.Object|!ccc.syntax.Generator}
 * @public
 */
ccc.syntax.Generator.prototype.get = function() {
  // Rank 0 captures always generate the same output.
  this.consumed_ = true;
  if (this.capture_.rank() == 0) {
    goog.asserts.assert(!(this.capture_.contents() instanceof Array));
    return /** @type {!ccc.base.Object} */ (this.capture_.contents());
  }
  goog.asserts.assert(this.capture_.contents() instanceof Array);
  if (this.index_ >= this.capture_.contents().length)
    return null;
  var next = this.capture_.contents()[this.index_];
  if (this.capture_.rank() > 1)
    return new ccc.syntax.Generator(next, this.depth_ + 1);
  return next.contents();
};


/**
 * Advances the generator.
 *
 * @public
 */
ccc.syntax.Generator.prototype.advance = function() {
  if (this.capture_.rank() > 0) {
    goog.asserts.assert(this.capture_.contents() instanceof Array);
    this.consumed_ = false;
    if (this.index_ < this.capture_.contents().length)
      ++this.index_;
  }
};


/**
 * Indicates if the generator should terminate.
 *
 * @return {boolean}
 * @public
 */
ccc.syntax.Generator.prototype.isAtEnd = function() {
  return this.capture_.rank() > 0 &&
      this.index_ >= this.capture_.contents().length;
};


/**
 * Duplicates this Generator in its current state.
 *
 * @return {!ccc.syntax.Generator}
 * @public
 */
ccc.syntax.Generator.prototype.clone = function() {
  var g = new ccc.syntax.Generator(this.capture_, this.depth_);
  g.index_ = this.index_;
  return g;
};


/**
 * Returns this Generator's depth.
 *
 * @return {number}
 * @public
 */
ccc.syntax.Generator.prototype.depth = function() {
  return this.depth_;
};


/**
 * Indicates if this generator's value has been consumer.
 *
 * @return {boolean}
 * public
 */
ccc.syntax.Generator.prototype.consumed = function() {
  return this.consumed_;
};



/**
 * A GeneratorSet is a map from symbol names to {@code ccc.syntax.Generator}
 * objects.
 *
 * @typedef {!Object.<string, !ccc.syntax.Generator>}
 * @public
 */
ccc.syntax.GeneratorSet;
