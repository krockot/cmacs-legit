// The Cmacs Project.

goog.provide('ccc.syntax.build');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern')
goog.require('ccc.syntax.Rule')
goog.require('ccc.syntax.RuleBasedTransformer')
goog.require('ccc.syntax.Template')
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');



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
ccc.syntax.build = function(ruleSpecs, opt_literals) {
  goog.asserts.assert(ruleSpecs.length > 0,
      'At least one rule is required to build a syntax transformer');
  var literals = (goog.isDef(opt_literals)
      ? goog.object.createSet(opt_literals)
      : {});
  var rules = goog.array.map(ruleSpecs, function(spec) {
    goog.asserts.assert(spec.length == 2,
        'Each builder rule must be of the form [pattern, template]');
    var pattern = new ccc.syntax.Pattern(literals, ccc.base.build(spec[0]));
    var template = new ccc.syntax.Template(ccc.base.build(spec[1]));
    return new ccc.syntax.Rule(pattern, template);
  });
  return new ccc.syntax.RuleBasedTransformer(rules);
};
