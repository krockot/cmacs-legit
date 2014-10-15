  // The Cmacs Project.

goog.provide('ccc.syntax.Template');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture');
goog.require('ccc.syntax.CaptureSet');



/**
 * Syntax template which can be used to stamp out new forms when given the
 * {@code ccc.syntax.CaptureSet} of a corresponding {@code ccc.syntax.Pattern}
 * match.
 *
 * @param {!ccc.base.Object} form The template form.
 * @constructor
 * @public
 */
ccc.syntax.Template = function(form) {
  /** @private {!ccc.base.Object} */
  this.form_ = form;
};


/**
 * Fully expands this template given a {@code ccc.syntax.CaptureSet}. Returns
 * {@code null} if expansion fails.
 *
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 */
ccc.syntax.Template.prototype.expand = function(captures) {
  return ccc.base.NIL;
};
