// The Cmacs Project.

goog.provide('ccc.syntax.SyntaxRules');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Rule')
goog.require('ccc.syntax.RuleBasedTransformer');
goog.require('ccc.syntax.Template');
goog.require('goog.Promise');



/**
 * SyntaxRules generates a transformer at compile time using a given set of
 * literal symbols and pattern-template pairs.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.SyntaxRules = function() {
};
goog.inherits(ccc.syntax.SyntaxRules, ccc.base.Transformer);


/** @override */
ccc.syntax.SyntaxRules.prototype.toString = function() {
  return '#<syntax-rules-transformer>';
};


/** @override */
ccc.syntax.SyntaxRules.prototype.transform = function(environment, args) {
  if (!args.isPair() || !args.cdr().isPair())
    return goog.Promise.reject(new Error('syntax-rules: Not enough arguments'));
  var literals = [];
  var literalsList = args.car();
  while (literalsList.isPair()) {
    var item = literalsList.car();
    if (!item.isSymbol() ||
        item.name() === ccc.syntax.Rule.ELLIPSIS_NAME) {
      return goog.Promise.reject(new Error('syntax-rules: Invalid literal ' +
          literalsList.car().toString()));
    }
    literals.push(literalsList.car().name());
    literalsList = literalsList.cdr();
  }
  if (!literalsList.isNil())
    return goog.Promise.reject(new Error(
        'syntax-rules: Invalid literals list'));
  var rules = [];
  var rulesList = args.cdr();
  while (rulesList.isPair()) {
    var rule = rulesList.car();
    if (!rule.isPair() || !rule.car().isPair() || rule.cdr().isNil() ||
        !rule.cdr().cdr().isNil()) {
      return goog.Promise.reject(new Error('syntax-rules: Invalid rule form'));
  }
    rules.push(new ccc.syntax.Rule(new ccc.syntax.Pattern(rule.car()),
        new ccc.syntax.Template(rule.cdr().car())));
    rulesList = rulesList.cdr();
  }
  if (!rulesList.isNil())
    return goog.Promise.reject(new Error('syntax-rules: Invalid rules list'));
  return goog.Promise.resolve(new ccc.syntax.RuleBasedTransformer(
      literals, rules));
};
