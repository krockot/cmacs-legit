// The Cmacs Project.

goog.provide('ccc.syntax.RuleBasedTransformer');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Rule');
goog.require('ccc.syntax.Template');



/**
 * A RuleBasedTransformer tries to match its input against one or more patterns.
 * If a match is found, the input is tranformed according to the matching
 * pattern's corresponding template. Each pattern-template pair is provided as a
 * {@code ccc.syntax.Rule}.
 *
 * @param {!Array.<string>} literals The set of input symbol names which should
 *     be treated as syntax literals during pattern matching.
 * @param {!Array.<!ccc.syntax.Rule>} rules
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.RuleBasedTransformer = function(literals, rules) {
  /** @private {!Array.<string>} */
  this.literals_ = literals;

  /** @private {!Array.<!ccc.syntax.Rule>} */
  this.rules_ = rules;
};
goog.inherits(ccc.syntax.RuleBasedTransformer, ccc.base.Transformer);


/** @override */
ccc.syntax.RuleBasedTransformer.prototype.toString = function() {
  return '#<rules-based-transformer>';
};


/** @override */
ccc.syntax.RuleBasedTransformer.prototype.transform = function(
    environment, args) {
  return goog.Promise.resolve(ccc.base.NIL);
};
