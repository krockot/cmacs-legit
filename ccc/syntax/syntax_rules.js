// The Cmacs Project.

goog.provide('ccc.syntax.SYNTAX_RULES');

goog.require('ccc.base');
goog.require('ccc.syntax.Pattern');
goog.require('ccc.syntax.Rule')
goog.require('ccc.syntax.RuleBasedTransformer');
goog.require('ccc.syntax.Template');
goog.require('goog.Promise');



/**
 * SYNTAX_RULES generates a transformer at compile time using a given set of
 * literal symbols and pattern-template pairs.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.SyntaxRulesTransformer_ = function() {
};
goog.inherits(ccc.syntax.SyntaxRulesTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.SyntaxRulesTransformer_.prototype.toString = function() {
  return '#<syntax-rules-transformer>';
};


/** @override */
ccc.syntax.SyntaxRulesTransformer_.prototype.transform = function(
    environment, args) {
  if (!args.isPair() || !args.cdr().isPair())
    return goog.Promise.reject(new Error('syntax-rules: Not enough arguments'));
  var literals = [];
  var literalsList = args.car();
  while (literalsList.isPair()) {
    var item = literalsList.car();
    if (!item.isSymbol() ||
        item.name() === ccc.syntax.Pattern.ELLIPSIS_NAME) {
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
    rules.push(new ccc.syntax.Rule(
        new ccc.syntax.Pattern(literals, rule.car().cdr()),
        new ccc.syntax.Template(rule.cdr().car())));
    rulesList = rulesList.cdr();
  }
  if (!rulesList.isNil())
    return goog.Promise.reject(new Error('syntax-rules: Invalid rules list'));
  return goog.Promise.resolve(new ccc.syntax.RuleBasedTransformer(rules));
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.SYNTAX_RULES = new ccc.syntax.SyntaxRulesTransformer_();
