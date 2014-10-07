// The Cmacs Project.

goog.provide('ccc.syntax.SyntaxRule');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Template');



/**
 * A SyntaxRule consists of a single pattern and template.
 *
 * @param {!ccc.syntax.Pattern} pattern
 * @param {!ccc.syntax.Template} template
 * @constructor
 * @struct
 * @public
 */
ccc.syntax.SyntaxRule = function(pattern, template) {
  /** @public {!ccc.syntax.Pattern} */
  this.pattern = pattern;

  /** @public {!ccc.syntax.Template} */
  this.template = template;
};


/**
 * The literal token used to represent a pattern repetition or template
 * expansion.
 *
 * @public {string}
 * @const
 */
ccc.syntax.SyntaxRule.ELLIPSIS_NAME = '...';
