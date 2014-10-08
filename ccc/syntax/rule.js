// The Cmacs Project.

goog.provide('ccc.syntax.Rule');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Template');



/**
 * A Rule consists of a single pattern and template.
 *
 * @param {!ccc.syntax.Pattern} pattern
 * @param {!ccc.syntax.Template} template
 * @constructor
 * @struct
 * @public
 */
ccc.syntax.Rule = function(pattern, template) {
  /** @public {!ccc.syntax.Pattern} */
  this.pattern = pattern;

  /** @public {!ccc.syntax.Template} */
  this.template = template;
};
