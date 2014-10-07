// The Cmacs Project.

goog.provide('ccc.syntax.Pattern');

goog.require('ccc.base');



/**
 * Syntax pattern which can match an input form and extract data for template
 * expansion.
 *
 * @param {!ccc.base.Object} form The pattern form.
 * @constructor
 * @public
 */
ccc.syntax.Pattern = function(form) {
  /** @private {!ccc.base.Object} */
  this.form_ = form;
};
