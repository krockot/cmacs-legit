// The Cmacs Project.

goog.provide('ccc.Procedure');

goog.require('ccc.Environment');
goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.Pair');
goog.require('ccc.Symbol');
goog.require('goog.asserts');



/**
 * A Procedure object is a compiled, applicable closure.
 *
 * @param {!ccc.Environment} scope The innermost environment at the point
 *     of this Procedure's construction.
 * @param {!Array.<!ccc.Location>} argLocations
 * @param {ccc.Location} argTailLocation
 * @param {!ccc.Pair} body A proper list of one or more compiled objects.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Procedure = function(scope, argLocations, argTailLocation, body) {
  /** @private {!ccc.Environment} */
  this.scope_ = scope;

  /** @private {!Array.<!ccc.Location>} */
  this.argLocations_ = argLocations;

  /** @private {ccc.Location} */
  this.argTailLocation_ = argTailLocation;

  /** @private {!ccc.Pair} */
  this.body_ = body;
};
goog.inherits(ccc.Procedure, ccc.Object);


/** @override */
ccc.Procedure.prototype.toString = function() {
  return '#<procedure>';
};


/** @override */
ccc.Procedure.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.Procedure.prototype.apply = function(environment, args, continuation) {
  var locals = [];
  var arg = args;
  for (var i = 0; i < this.argLocations_.length; ++i) {
    if (!ccc.isPair(arg))
      return continuation(new ccc.Error('Not enough arguments'));
    locals[i] = arg.car();
    arg = arg.cdr();
  }
  if (!ccc.isNil(arg) && goog.isNull(this.formalTail_))
    return continuation(new ccc.Error('Too many arguments'));
  if (!goog.isNull(this.argTailLocation_))
    locals[this.argLocations_.length] = arg;
  return goog.partial(ccc.Procedure.evalBodyContinuationImpl_,
      this.scope_, locals, continuation, this.body_, ccc.NIL);
};


/**
 * Unbound continuation used to step through expressions in the procedure's
 * body. The tail expression is passed the calling continuation.
 *
 * @param {!ccc.Environment} environment
 * @param {!Array.<ccc.Data>} locals
 * @param {!ccc.Continuation} continuation
 * @param {ccc.Data} form
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Procedure.evalBodyContinuationImpl_ = function(
    environment, locals, continuation, form, result) {
  if (ccc.isError(result))
    return continuation(result.pass());
  goog.asserts.assert(ccc.isPair(form));
  environment.setActiveLocals(locals);
  if (ccc.isNil(form.cdr()))
    return goog.partial(ccc.eval(form.car(), environment), continuation);
  return goog.partial(ccc.eval(form.car(), environment), goog.partial(
      ccc.Procedure.evalBodyContinuationImpl_, environment, locals,
      continuation, form.cdr()));
};
