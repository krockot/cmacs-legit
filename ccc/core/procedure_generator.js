// The Cmacs Project.

goog.provide('ccc.ProcedureGenerator');

goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * ProcedureGenerators are emitted by lambda transformers. When applied, they
 * yield a new procedure whose body is evaluated in a lexical environment
 * derived from that of the ProcedureGenerator.
 *
 * @param {!Array.<string>} formalNames The list of formal argument names to
 *     which individual arguments should be bound within the generated procedure
 *     body.
 * @param {?string} formalTail The name of the tail argument name to capture
 *     the rest of the argument list, or {@code null} if the generated procedure
 *     takes a fixed number of arguments.
 * @param {!ccc.Pair} body The procedure body
 * @constructor
 * @extends {ccc.Object}
 */
ccc.ProcedureGenerator = function(formalNames, formalTail, body) {
  /** @private {!Array.<string>} */
  this.formalNames_ = formalNames;

  /** @private {?string} */
  this.formalTail_ = formalTail;

  /** @private {!ccc.Pair} */
  this.body_ = body;
};
goog.inherits(ccc.ProcedureGenerator, ccc.Object);


/** @override */
ccc.ProcedureGenerator.prototype.toString = function() {
  return '#<procedure-generator>';
};


/** @override */
ccc.ProcedureGenerator.prototype.compile = function(environment, continuation) {
  return this.compileBody_(this.body_, environment, goog.bind(
      this.onBodyCompiled_, this, environment, continuation));
};


/**
 * @param {(!ccc.Pair|!ccc.Nil)} body
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.ProcedureGenerator.prototype.compileBody_ = function(
    body, environment, continuation) {
  if (ccc.isNil(body))
    return continuation(ccc.NIL);
  return goog.bind(this.compileBody_, this, body.cdr(), environment,
      goog.bind(this.onBodyTailCompiled_, this, body.car(), environment,
          continuation));
};


/**
 * @param {ccc.Data} bodyHead
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledBodyTail
 * @return {ccc.Thunk}
 * @private
 */
ccc.ProcedureGenerator.prototype.onBodyTailCompiled_ = function(
    bodyHead, environment, continuation, compiledBodyTail) {
  return ccc.compile(bodyHead, environment)(goog.bind(this.onBodyHeadCompiled_,
      this, compiledBodyTail, environment, continuation));
};


/**
 * @param {ccc.Data} compiledBodyTail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledBodyHead
 * @return {ccc.Thunk}
 * @private
 */
ccc.ProcedureGenerator.prototype.onBodyHeadCompiled_ = function(
    compiledBodyTail, environment, continuation, compiledBodyHead) {
  if (ccc.isError(compiledBodyHead))
    return continuation(compiledBodyHead.pass());
  return continuation(new ccc.Pair(compiledBodyHead, compiledBodyTail));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledBody
 * @return {ccc.Thunk}
 * @private
 */
ccc.ProcedureGenerator.prototype.onBodyCompiled_ = function(
    environment, continuation, compiledBody) {
  if (ccc.isError(compiledBody))
    return continuation(compiledBody.pass());
  goog.asserts.assert(ccc.isPair(compiledBody));
  return continuation(new ccc.ProcedureGenerator(this.formalNames_,
      this.formalTail_, /** @type {!ccc.Pair} */ (compiledBody)));
};


/** @override */
ccc.ProcedureGenerator.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.ProcedureGenerator.prototype.apply = function(
    environment, args, continuation) {
  return continuation(new ccc.Procedure(environment, this.formalNames_,
      this.formalTail_, this.body_));
};
