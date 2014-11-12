// The Cmacs Project.

goog.provide('ccc.ProcedureGenerator');

goog.require('ccc.core');
goog.require('goog.array');
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
 * @param {!Array.<!ccc.LocalLocation>=} opt_argLocations Compiled locations of
 *     arguments for the generated procedure.
 * @param {ccc.LocalLocation=} opt_argTailLocation Compiled location of the
 *     generated procedure's argument tail, if any.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.ProcedureGenerator = function(
    formalNames, formalTail, body, opt_argLocations, opt_argTailLocation) {
  /** @private {!Array.<string>} */
  this.formalNames_ = formalNames;

  /** @private {?string} */
  this.formalTail_ = formalTail;

  /** @private {!ccc.Pair} */
  this.body_ = body;

  /** @private {!Array.<!ccc.LocalLocation>} */
  this.argLocations_ = goog.isDef(opt_argLocations) ? opt_argLocations : [];

  /** @private {ccc.LocalLocation} */
  this.argTailLocation_ = (goog.isDef(opt_argTailLocation)
      ? opt_argTailLocation : null);
};
goog.inherits(ccc.ProcedureGenerator, ccc.Object);


/** @override */
ccc.ProcedureGenerator.prototype.toString = function() {
  return '#<procedure-generator>';
};


/** @override */
ccc.ProcedureGenerator.prototype.compile = function(environment, continuation) {
  var compileScope = new ccc.Environment(environment);
  this.argLocations_ = [];
  goog.array.forEach(this.formalNames_, function(name, index) {
    var location = new ccc.LocalLocation(compileScope, index);
    location.setName(name);
    compileScope.set(name, location);
    this.argLocations_[index] = location;
  }, this);
  this.argTailLocation_ = null;
  if (!goog.isNull(this.formalTail_)) {
    this.argTailLocation_ = new ccc.LocalLocation(compileScope,
        this.formalNames_.length);
    this.argTailLocation_.setName(this.formalTail_);
    compileScope.set(this.formalTail_, this.argTailLocation_);
  }
  return this.compileBody_(this.body_, compileScope, goog.bind(
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
      this.formalTail_, /** @type {!ccc.Pair} */ (compiledBody),
      this.argLocations_, this.argTailLocation_));
};


/** @override */
ccc.ProcedureGenerator.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.ProcedureGenerator.prototype.apply = function(
    environment, args, continuation) {
  var scope = new ccc.Environment(environment);
  goog.array.forEach(this.argLocations_, function(location, index) {
    scope.set(this.formalNames_[index], location);
    location.setEnvironment(scope);
  }, this);
  if (!goog.isNull(this.argTailLocation_)) {
    goog.asserts.assert(!goog.isNull(this.formalTail_));
    scope.set(this.formalTail_, this.argTailLocation_);
    this.argTailLocation_.setEnvironment(scope);
  }
  return continuation(new ccc.Procedure(scope, this.argLocations_,
      this.argTailLocation_, this.body_));
};
