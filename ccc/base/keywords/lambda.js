// The Cmacs Project.

goog.provide('ccc.base.lambda');

goog.require('ccc.ProcedureGenerator');
goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * The LAMBDA transformer produces a procedure generator which yields new
 * procedure objects when applied. Any generated procedure will execute in the
 * context of the environment in which the generator was applied.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var LambdaTransformer_ = function() {
};
goog.inherits(LambdaTransformer_, ccc.Transformer);


/** @override */
LambdaTransformer_.prototype.toString = function() {
  return '#<lambda-transformer>';
};


/** @override */
LambdaTransformer_.prototype.transform = function(
    environment, args) {
  return function (continuation) {
    if (!ccc.isPair(args) || ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('lambda: Invalid syntax'));
    var formals = args.car();
    if (!ccc.isSymbol(formals) && !ccc.isPair(formals) && !ccc.isNil(formals))
      return continuation(new ccc.Error('lambda: Invalid syntax'));
    var formalNames = [];
    var formalTail = null;
    var formal = formals;
    while (ccc.isPair(formal)) {
      if (!ccc.isSymbol(formal.car()))
        return continuation(new ccc.Error('lambda: Invalid syntax'));
      formalNames.push(formal.car().name());
      formal = formal.cdr();
    }
    if (ccc.isSymbol(formal))
      formalTail = formal.name();
    var body = args.cdr();
    if (!ccc.isPair(body))
      return continuation(new ccc.Error('lambda: Invalid syntax'));
    return LambdaTransformer_.expandBody_(
        /** @type {!ccc.Pair} */ (body), environment,
        goog.partial(LambdaTransformer_.onBodyExpanded_, formalNames,
            formalTail, environment, continuation));
  };
};


/**
 * @param {(!ccc.Pair|!ccc.Nil)} body
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
LambdaTransformer_.expandBody_ = function(
    body, environment, continuation) {
  if (ccc.isNil(body))
    return continuation(ccc.NIL);
  return goog.partial(LambdaTransformer_.expandBody_, body.cdr(), environment,
      goog.partial(LambdaTransformer_.onBodyTailExpanded_, body.car(),
          environment, continuation));
};


/**
 * @param {ccc.Data} bodyHead
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBodyTail
 * @return {ccc.Thunk}
 * @private
 */
LambdaTransformer_.onBodyTailExpanded_ = function(
    bodyHead, environment, continuation, expandedBodyTail) {
  return ccc.expand(bodyHead, environment)(goog.partial(
      LambdaTransformer_.onBodyHeadExpanded_, expandedBodyTail, environment,
      continuation));
};


/**
 * @param {ccc.Data} expandedBodyTail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBodyHead
 * @return {ccc.Thunk}
 * @private
 */
LambdaTransformer_.onBodyHeadExpanded_ = function(
    expandedBodyTail, environment, continuation, expandedBodyHead) {
  if (ccc.isError(expandedBodyHead))
    return continuation(expandedBodyHead.pass());
  return continuation(new ccc.Pair(expandedBodyHead, expandedBodyTail));
};


/**
 * @param {!Array.<string>} formalNames
 * @param {?string} formalTail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBody
 * @return {ccc.Thunk}
 * @private
 */
LambdaTransformer_.onBodyExpanded_ = function(
    formalNames, formalTail, environment, continuation, expandedBody) {
  if (ccc.isError(expandedBody))
    return continuation(expandedBody.pass());
  goog.asserts.assert(ccc.isPair(expandedBody));
  return continuation(new ccc.Pair(
      new ccc.ProcedureGenerator(formalNames, formalTail,
      /** @type {!ccc.Pair} */ (expandedBody)), ccc.NIL));
};


/** @const {!ccc.Transformer} */
ccc.base.lambda = new LambdaTransformer_();

/** @const */
ccc.base['\u03bb'] = ccc.base.lambda;
