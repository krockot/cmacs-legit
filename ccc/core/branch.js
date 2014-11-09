// The Cmacs Project.

goog.provide('ccc.Branch');

goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * Branches are emitted by conditional syntax to capture native branching
 * behavior.
 *
 * @param {ccc.Data} consequent The consequent for this branch.
 * @param {ccc.Data} alternate The alternate for this branch.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Branch = function(consequent, alternate) {
  /** @private {ccc.Data} */
  this.consequent_ = consequent;

  /** @private {ccc.Data} */
  this.alternate_ = alternate;
};
goog.inherits(ccc.Branch, ccc.Object);


/** @override */
ccc.Branch.prototype.toString = function() {
  return '#<branch>';
};


/** @override */
ccc.Branch.prototype.compile = function(environment, continuation) {
  return ccc.compile(this.consequent_, environment)(goog.bind(
      this.onConsequentCompiled_, this, environment, continuation));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledConsequent
 * @return {ccc.Thunk}
 * @private
 */
ccc.Branch.prototype.onConsequentCompiled_ = function(
    environment, continuation, compiledConsequent) {
  if (ccc.isError(compiledConsequent))
    return continuation(compiledConsequent.pass());
  return ccc.compile(this.alternate_, environment)(goog.partial(
      ccc.Branch.onAlternateCompiled_, environment, continuation,
      compiledConsequent));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledConsequent
 * @param {ccc.Data} compiledAlternate
 * @return {ccc.Thunk}
 * @private
 */
ccc.Branch.onAlternateCompiled_ = function(
    environment, continuation, compiledConsequent, compiledAlternate) {
  if (ccc.isError(compiledAlternate))
    return continuation(compiledAlternate.pass());
  return continuation(new ccc.Branch(compiledConsequent, compiledAlternate));
};


/** @override */
ccc.Branch.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.Branch.prototype.apply = function(environment, args, continuation) {
  goog.asserts.assert(ccc.isPair(args));
  goog.asserts.assert(ccc.isNil(args.cdr()));
  return ccc.eval(args.car(), environment)(goog.partial(
      ccc.Branch.onConditionEvaluated_, environment, continuation,
      this.consequent_, this.alternate_));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} consequent
 * @param {ccc.Data} alternate
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Branch.onConditionEvaluated_ = function(
    environment, continuation, consequent, alternate, result) {
  if (ccc.isError(result))
    return continuation(result.pass());
  if (result === false)
    return goog.partial(ccc.eval(alternate, environment), continuation);
  return goog.partial(ccc.eval(consequent, environment), continuation);
};
