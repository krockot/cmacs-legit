// The Cmacs Project.

goog.provide('ccc.syntax.buildRule');
goog.provide('ccc.syntax.buildTransformer');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern')
goog.require('ccc.syntax.Rule')
goog.require('ccc.syntax.RuleBasedTransformer')
goog.require('ccc.syntax.Template')
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');



/**
 * Builds a single transformer rule form pattern and template object specs.
 *
 * @param {*} patternSpec
 * @param {*} templateSpec
 * @param {!Array.<string>=} opt_literals
 * @return {!ccc.syntax.Rule}
 * @public
 */
ccc.syntax.buildRule = function(patternSpec, templateSpec, opt_literals) {
  var literals = (goog.isDef(opt_literals)
      ? goog.object.createSet(opt_literals)
      : {});
  var pattern = new ccc.syntax.Pattern(literals, ccc.base.build(patternSpec));
  var template = new ccc.syntax.Template(ccc.base.build(templateSpec));
  return new ccc.syntax.Rule(pattern, template);
};


/**
 * Builds a rule-based transformer from a set of patterns and templates given
 * as base objects. Object specs in each pattern and template spec should use
 * the declarative format support by {@code ccc.base.build}.
 *
 * @param {!Array.<!Array>} ruleSpecs
 * @param {!Array.<string>=} opt_literals
 * @return {!ccc.syntax.RuleBasedTransformer}
 * @public
 */
ccc.syntax.buildTransformer = function(ruleSpecs, opt_literals) {
  goog.asserts.assert(ruleSpecs.length > 0,
      'At least one rule is required to build a syntax transformer');
  var rules = goog.array.map(ruleSpecs, function(spec) {
    goog.asserts.assert(spec.length == 2,
        'Each builder rule must be of the form [pattern, template]');
    return ccc.syntax.buildRule(spec[0], spec[1], opt_literals);
  });
  return new ccc.syntax.RuleBasedTransformer(rules);
};
