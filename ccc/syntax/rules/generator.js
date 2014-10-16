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
 * @constructor
 * @public
 */
ccc.syntax.Generator = function(capture) {
  /** @private {!ccc.syntax.Capture} */
  this.capture_ = capture;

  /** @private {number} */
  this.index_ = 0;
};


/**
 * Gets the next object in the generator's stream, or {@code null} if there are
 * no more objects available.
 *
 * @return {ccc.base.Object|!ccc.syntax.Generator}
 */
ccc.syntax.Generator.prototype.getNext = function() {
  // Rank 0 captures always generate the same output.
  if (this.capture_.rank() == 0) {
    goog.asserts.assert(!(this.capture_.contents() instanceof Array));
    return /** @type {!ccc.base.Object} */ (this.capture_.contents());
  }
  goog.asserts.assert(this.capture_.contents() instanceof Array);
  if (this.index_ >= this.capture_.contents().length)
    return null;
  var next = this.capture_.contents()[this.index_++];
  if (this.capture_.rank() > 1)
    return new ccc.syntax.Generator(next);
  return next;
};



/**
 * A GeneratorSet is a map from symbol names to {@code ccc.syntax.Generator}
 * objects.
 *
 * @typedef {!Object.<string, !ccc.syntax.Generator>}
 * @public
 */
ccc.syntax.GeneratorSet;
