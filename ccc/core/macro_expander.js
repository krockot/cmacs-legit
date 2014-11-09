// The Cmacs Project.

goog.provide('ccc.MacroExpander');

goog.require('ccc.core');
goog.require('goog.asserts');



/**
 * A MacroExpander behaves as a {@code ccc.Transformer} and rewrites its
 * arguments at expansion time according to the result of its evaluated body.
 * MacroExpanders are emitted by DEFMACRO syntax at expansion time.
 *
 * @param {!Array.<string>} formalNames
 * @param {?string} formalTail
 * @param {!ccc.Pair} body
 * @constructor
 * @extends {ccc.Transformer}
 */
ccc.MacroExpander = function(formalNames, formalTail, body) {
  /** @private {!Array.<string>} */
  this.formalNames_ = formalNames;

  /** @private {?string} */
  this.formalTail_ = formalTail;

  /** @private {!ccc.Pair} */
  this.body_ = body;
};
goog.inherits(ccc.MacroExpander, ccc.Transformer);


/** @override */
ccc.MacroExpander.prototype.toString = function() {
  return '#<macro-expander>';
};


/** @override */
ccc.MacroExpander.prototype.transform = function(environment, args) {
  return function(continuation) {
    var innerEnvironment = new ccc.Environment(environment);
    var arg = args;
    for (var i = 0; i < this.formalNames_.length; ++i) {
      if (ccc.isNil(arg))
        return continuation(new ccc.Error('Macro use missing arguments'));
      innerEnvironment.set(this.formalNames_[i], arg.car());
      arg = arg.cdr();
    }
    if (!ccc.isNil(arg) && goog.isNull(this.formalTail_))
      return continuation(new ccc.Error('Macro use has too many arguments'));
    if (!goog.isNull(this.formalTail_))
      environment.set(this.formalTail_, arg);
    return this.expandBody_(this.body_, innerEnvironment, goog.bind(
        this.onBodyExpanded_, this, innerEnvironment, continuation));
  }.bind(this);
};


/**
 * @param {(!ccc.Pair|!ccc.Nil)} body
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.expandBody_ = function(
    body, environment, continuation) {
  if (ccc.isNil(body))
    return continuation(ccc.NIL);
  return goog.bind(this.expandBody_, this, body.cdr(), environment, goog.bind(
      this.onBodyTailExpanded_, this, body.car(), environment, continuation));
};


/**
 * @param {ccc.Data} bodyHead
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBodyTail
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.onBodyTailExpanded_ = function(
    bodyHead, environment, continuation, expandedBodyTail) {
  if (ccc.isError(expandedBodyTail))
    return continuation(expandedBodyTail.pass());
  return ccc.expand(bodyHead, environment)(goog.bind(this.onBodyHeadExpanded_,
      this, expandedBodyTail, environment, continuation));
};


/**
 * @param {ccc.Data} expandedBodyTail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBodyHead
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.onBodyHeadExpanded_ = function(
    expandedBodyTail, environment, continuation, expandedBodyHead) {
  if (ccc.isError(expandedBodyHead))
    return continuation(expandedBodyHead.pass());
  return continuation(new ccc.Pair(expandedBodyHead, expandedBodyTail));
};


/**
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedBody
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.onBodyExpanded_ = function(
    environment, continuation, expandedBody) {
  if (ccc.isError(expandedBody))
    return continuation(expandedBody.pass());
  goog.asserts.assert(ccc.isPair(expandedBody));
  return this.compileBody_(/** @type {!ccc.Pair} */ (expandedBody), environment,
      goog.bind(this.onBodyCompiled_, this, environment, continuation));
};


/**
 * @param {(!ccc.Pair|!ccc.Nil)} body
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.compileBody_ = function(
    body, environment, continuation) {
  if (ccc.isNil(body))
    return continuation(ccc.NIL);
  return goog.bind(this.compileBody_, this, body.cdr(), environment, goog.bind(
      this.onBodyTailCompiled_, this, body.car(), environment, continuation));
};


/**
 * @param {ccc.Data} bodyHead
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledBodyTail
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.onBodyTailCompiled_ = function(
    bodyHead, environment, continuation, compiledBodyTail) {
  if (ccc.isError(compiledBodyTail))
    return continuation(compiledBodyTail.pass());
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
ccc.MacroExpander.prototype.onBodyHeadCompiled_ = function(
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
ccc.MacroExpander.prototype.onBodyCompiled_ = function(
    environment, continuation, compiledBody) {
  if (ccc.isError(compiledBody))
    return continuation(compiledBody.pass());
  goog.asserts.assert(ccc.isPair(compiledBody));
  return this.evalBody_(/** @type {!ccc.Pair} */ (compiledBody), environment,
      continuation);
};


/**
 * @param {!ccc.Pair} body
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.MacroExpander.prototype.evalBody_ = function(
    body, environment, continuation) {
  var headEval = ccc.eval(body.car(), environment);
  if (ccc.isNil(body.cdr()))
    return goog.partial(headEval, continuation);
  var tail = body.cdr();
  goog.asserts.assert(ccc.isPair(tail));
  return goog.partial(headEval, goog.bind(this.evalBody_, this,
      /** @type {!ccc.Pair} */ (tail), environment, continuation));
};
