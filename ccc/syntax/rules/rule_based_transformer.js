// The Cmacs Project.

goog.provide('ccc.syntax.Rule');
goog.provide('ccc.syntax.RuleBasedTransformer');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Template');
goog.require('goog.Promise');


/**
 * A RuleBasedTransformer tries to match its input against one or more patterns.
 * If a match is found, the input is tranformed according to the matching
 * pattern's corresponding template. Each pattern-template pair is provided as a
 * {@code ccc.syntax.Rule}.
 *
 * @param {!Array.<!ccc.syntax.Rule>} rules
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.RuleBasedTransformer = function(rules) {
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
  return new goog.Promise(function(resolve, reject) {
    for (var i = 0; i < this.rules_.length; ++i) {
      var rule = this.rules_[i];
      var match = rule.pattern.match(args);
      if (match.success) {
        return resolve(rule.template.expand(match.captures));
      }
    }
    reject(new Error('Special form did not match any syntax rules'));
  }, this);
};



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
