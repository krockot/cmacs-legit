// The Cmacs Project.

goog.provide('ccc.Procedure');

goog.require('ccc.Environment');
goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.Pair');
goog.require('ccc.Symbol');
goog.require('goog.Promise');
goog.require('goog.asserts');



/**
 * A Procedure object is a compiled, applicable closure.
 *
 * @param {!ccc.Environment} scope The innermost environment at the point
 *     of this Procedure's construction.
 * @param {ccc.Data} formals The argument specification.
 * @param {!ccc.Pair} body A proper list of one or more compiled objects.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Procedure = function(scope, formals, body) {
  goog.asserts.assert(ccc.isSymbol(formals) || ccc.isNil(formals) ||
      ccc.isPair(formals), 'Invalid Procedure argument specification.');

  /** @private {!ccc.Environment} */
  this.scope_ = scope;

  /** @private {ccc.Data} */
  this.formals_ = formals;

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
  if (ccc.isNil(this.formals_)) {
    if (args !== ccc.NIL)
      return continuation(new ccc.Error('Too many arguments'));
  } else if (ccc.isSymbol(this.formals_)) {
    innerScope.set(this.formals_.name(), args);
  } else {
    goog.asserts.assert(ccc.isPair(this.formals_) ||
        ccc.isNil(this.formals_));
    var formal = this.formals_;
    var arg = args;
    while (ccc.isPair(formal) && ccc.isPair(arg)) {
      var symbol = formal.car();
      goog.asserts.assert(ccc.isSymbol(symbol), 'Invalid argument name');
      innerScope.set(symbol.name(), arg.car());
      formal = formal.cdr();
      arg = arg.cdr();
    }
    if (ccc.isNil(formal) && !ccc.isNil(arg))
      return continuation(new ccc.Error('Too many arguments'));
    if (ccc.isNil(arg) && ccc.isPair(formal))
      return continuation(new ccc.Error('Not enough arguments'));
    goog.asserts.assert(ccc.isPair(arg) || ccc.isNil(arg),
        'Invalid argument list');
    if (ccc.isSymbol(formal))
      innerScope.set(formal.name(), arg);
  }

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
    return continuation(result);
  goog.asserts.assert(ccc.isPair(form));
  if (ccc.isNil(form.cdr()))
    return form.car().eval(innerEnvironment, continuation)
  return form.car().eval(innerEnvironment, goog.partial(
      ccc.Procedure.evalBodyContinuationImpl_,
      outerEnvironment, innerEnvironment, continuation, form.cdr()));
};
