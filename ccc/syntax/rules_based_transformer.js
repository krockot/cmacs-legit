// The Cmacs Project.

goog.provide('ccc.syntax.RulesBasedTransformer');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.SyntaxRule');
goog.require('ccc.syntax.Template');


/**
 * A RulesBasedTransformer tries to match its input against one or more
 * patterns. If a match is found, the input is tranformed according to the
 * matching pattern's corresponding template. Each pattern-template pair is
 * provided as a {@code ccc.syntax.SyntaxRule}.
 *
 * @param {!Array.<string>} literals The set of input symbol names which should
 *     be treated as syntax literals during pattern matching.
 * @param {!Array.<!ccc.syntax.SyntaxRule>} rules
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.RulesBasedTransformer = function(literals, rules) {
  /** @private {!Array.<string>} */
  this.literals_ = literals;

  /** @private {!Array.<!ccc.syntax.SyntaxRule>} */
  this.rules_ = rules;
};
goog.inherits(ccc.syntax.RulesBasedTransformer, ccc.base.Transformer);


/** @override */
ccc.syntax.RulesBasedTransformer.prototype.toString = function() {
  return '#<rules-based-transformer>';
};


/** @override */
ccc.syntax.RulesBasedTransformer.prototype.transform = function(
    environment, args) {
  return goog.Promise.resolve(ccc.base.NIL);
};
