// The Cmacs Project.

goog.provide('ccc.base.if_')

goog.require('ccc.Branch');
goog.require('ccc.core');



/**
 * The IF transformer produces a native conditional procedure which evaluates
 * a test expression and then either the consequent or the alternate, but never
 * both.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var IfTransformer_ = function() {
};
goog.inherits(IfTransformer_, ccc.Transformer);


/** @override */
IfTransformer_.prototype.toString = function() {
  return '#<if-transformer>';
};


/** @override */
IfTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args) || !ccc.isPair(args.cdr()))
      return continuation(new ccc.Error('if: Not enough arguments'));
    var condition = args.car();
    var consequent = args.cdr().car();
    var alternate = args.cdr().cdr();
    if (ccc.isNil(alternate)) {
      alternate = ccc.UNSPECIFIED;
    } else if (ccc.isPair(alternate)) {
      if (!ccc.isNil(alternate.cdr()))
        return continuation(new ccc.Error('if: Too many arguments'));
      alternate = alternate.car();
    } else {
      return continuation(new ccc.Error('if: Invalid syntax'));
    }
    return ccc.expand(consequent, environment)(goog.partial(
        IfTransformer_.onConsequentExpanded_, alternate, condition,
        environment, continuation));
  };
};


/**
 * @param {ccc.Data} alternate
 * @param {ccc.Data} condition
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedConsequent
 * @return {ccc.Thunk}
 * @private
 */
IfTransformer_.onConsequentExpanded_ = function(
    alternate, condition, environment, continuation, expandedConsequent) {
  if (ccc.isError(expandedConsequent))
    return continuation(expandedConsequent.pass());
  return ccc.expand(alternate, environment)(goog.partial(
      IfTransformer_.onAlternateExpanded_, environment, continuation,
      condition, expandedConsequent));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} condition
 * @param {ccc.Data} expandedConsequent
 * @param {ccc.Data} expandedAlternate
 * @return {ccc.Thunk}
 * @private
 */
IfTransformer_.onAlternateExpanded_ = function(
    environment, continuation, condition, expandedConsequent,
    expandedAlternate) {
  if (ccc.isError(expandedAlternate))
    return continuation(expandedAlternate.pass());
  return continuation(new ccc.Pair(
      new ccc.Branch(expandedConsequent, expandedAlternate),
      new ccc.Pair(condition, ccc.NIL)));
};


/** @const {!ccc.Transformer} */
ccc.base['if'] = new IfTransformer_();
