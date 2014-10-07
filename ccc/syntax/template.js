// The Cmacs Project.

goog.provide('ccc.syntax.Template');

goog.require('ccc.base');



/**
 * Syntax template which can be used to stamp out new forms when given data from
 * a corresponding {@code ccc.syntax.Pattern} match.
 *
 * @param {!ccc.base.Object} form The template form.
 * @constructor
 * @public
 */
ccc.syntax.Template = function(form) {
  /** @private {!ccc.base.Object} */
  this.form_ = form;
};
