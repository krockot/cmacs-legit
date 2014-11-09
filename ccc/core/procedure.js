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
 * @param {!Array.<string>} formalNames
 * @param {?string} formalTail
 * @param {!ccc.Pair} body A proper list of one or more compiled objects.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Procedure = function(scope, formalNames, formalTail, body) {
  /** @private {!ccc.Environment} */
  this.scope_ = scope;

  /** @private {!Array.<string>} */
  this.formalNames_ = formalNames;

  /** @private {?string} */
  this.formalTail_ = formalTail;

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
  var innerScope = new ccc.Environment(this.scope_);
  var arg = args;
  for (var i = 0; i < this.formalNames_.length; ++i) {
    if (!ccc.isPair(arg))
      return continuation(new ccc.Error('Not enough arguments'));
    innerScope.set(this.formalNames_[i], arg.car());
    arg = arg.cdr();
  }
  if (!ccc.isNil(arg) && goog.isNull(this.formalTail_))
    return continuation(new ccc.Error('Too many arguments'));
  if (!goog.isNull(this.formalTail_))
    innerScope.set(this.formalTail_, arg);
  return goog.partial(ccc.Procedure.evalBodyContinuationImpl_,
      this.scope_, innerScope, continuation, this.body_, ccc.NIL);
};


/**
 * Unbound continuation used to step through expressions in the procedure's
 * body. The tail expression is passed the calling continuation.
 *
 * @param {!ccc.Environment} outerEnvironment
 * @param {!ccc.Environment} innerEnvironment
 * @param {!ccc.Continuation} continuation
 * @param {ccc.Data} form
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Procedure.evalBodyContinuationImpl_ = function(
    outerEnvironment, innerEnvironment, continuation, form, result) {
  if (ccc.isError(result))
    return continuation(result.pass());
  goog.asserts.assert(ccc.isPair(form));
  if (ccc.isNil(form.cdr()))
    return goog.partial(ccc.eval(form.car(), innerEnvironment), continuation);
  return goog.partial(ccc.eval(form.car(), innerEnvironment), goog.partial(
      ccc.Procedure.evalBodyContinuationImpl_,
      outerEnvironment, innerEnvironment, continuation, form.cdr()));
};
