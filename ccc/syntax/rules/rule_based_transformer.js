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
 * @param {!ccc.base.Environment=} opt_environment
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.RuleBasedTransformer = function(rules, opt_environment) {
  /** @private {!Array.<!ccc.syntax.Rule>} */
  this.rules_ = rules;

  /** @private {!ccc.base.Environment|undefined} */
  this.capturedEnvironment_ = opt_environment;
};
goog.inherits(ccc.syntax.RuleBasedTransformer, ccc.base.Transformer);


/** @override */
ccc.syntax.RuleBasedTransformer.prototype.toString = function() {
  return '#<rules-based-transformer>';
};


/** @override */
ccc.syntax.RuleBasedTransformer.prototype.transform = function(
    environment, args) {
  for (var i = 0; i < this.rules_.length; ++i) {
    var rule = this.rules_[i];
    var match = rule.pattern.match(environment, args);
    if (match.success) {
      var expansion = rule.template.expand(match.captures);
      if (goog.isDef(this.capturedEnvironment_)) {
        var lambda = ccc.base.Pair.makeList([ccc.syntax.LAMBDA, ccc.base.NIL,
            expansion]);
        var call = new ccc.base.Pair(lambda, ccc.base.NIL);
        return call.compile(this.capturedEnvironment_);
      }
      return goog.Promise.resolve(expansion);
    }
  }
  return goog.Promise.reject(new Error(
      'Special form did not match any syntax rules'));
};


/**
 * Adds a rule to this transformer. Useful in constructing transformers which
 * must recursively refer to themselves in one or more templates.
 *
 * @param {!Array.<!ccc.syntax.Rule>} rules
 * @public
 */
ccc.syntax.RuleBasedTransformer.prototype.addRules = function(rules) {
  this.rules_.push.apply(this.rules_, rules);
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
