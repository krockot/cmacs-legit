// The Cmacs Project.

goog.provide('ccc.base.Procedure');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Object');
goog.require('goog.Promise');
goog.require('goog.asserts');



/**
 * A Procedure object is a compiled, applicable closure.
 *
 * @param {!ccc.base.Environment} scope The innermost environment at the point
 *     of this Procedure's construction.
 * @param {!ccc.base.Object} formals The argument specification; may be a single
 *     symbol, a symbol list (proper or improper), or NIL.
 * @param {!ccc.base.Object} body A proper list of one or more compiled objects.
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Procedure = function(scope, formals, body) {
  goog.asserts.assert(formals.isSymbol() || formals.isPair() || formals.isNil(),
      'Invalid Procedure argument specification.');
  goog.asserts.assert(body.isPair(), 'Invalid Procedure body.');

  /** @private {!ccc.base.Environment} */
  this.scope_ = scope;

  /** @private {!ccc.base.Object} */
  this.formals_ = formals;

  /** @private {!ccc.base.Object} */
  this.body_ = body;
};
goog.inherits(ccc.base.Procedure, ccc.base.Object);


/** @override */
ccc.base.Procedure.prototype.toString = function() {
  return '#<procedure>';
};


/** @override */
ccc.base.Procedure.prototype.isProcedure = function() {
  return true;
};


/** @override */
ccc.base.Procedure.prototype.isApplicable = function() {
  return true;
};


/** @override */
ccc.base.Procedure.prototype.eval = function(environment, continuation) {
  return continuation(this);
};


/** @override */
ccc.base.Procedure.prototype.apply = function(environment, args, continuation) {
  var innerScope = new ccc.base.Environment(this.scope_);
  if (this.formals_.isNil()) {
    if (!args.isNil())
      return continuation(null, new Error('Too many arguments'));
  } else if (this.formals_.isSymbol()) {
    innerScope.set(this.formals_.name(), args);
  } else {
    var formal = this.formals_;
    var arg = args;
    while (formal.isPair() && arg.isPair()) {
      var symbol = formal.car();
      goog.asserts.assert(symbol.isSymbol(), 'Invalid argument name');
      innerScope.set(symbol.name(), arg.car());
      formal = formal.cdr();
      arg = arg.cdr();
    }
    if (formal.isNil() && !arg.isNil())
      return continuation(null, new Error('Too many arguments'));
    if (arg.isNil() && formal.isPair())
      return continuation(null, new Error('Not enough arguments'));
    goog.asserts.assert(arg.isPair() || arg.isNil(), 'Invalid argument list');
    if (formal.isSymbol())
      innerScope.set(formal.name(), arg);
  }

  return goog.partial(ccc.base.Procedure.evalBodyContinuationImpl_,
      environment, continuation, this.body_, ccc.base.NIL);
};


/**
 * Unbound continuation used to step through expressions in the procedure's
 * body. The tail expression is passed the calling continuation.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Continuation} continuation
 * @param {!ccc.base.Object} form
 * @param {ccc.base.Object} unusedValue
 * @param {Error=} opt_error
 */
ccc.base.Procedure.evalBodyContinuationImpl_ = function(
    environment, continuation, form, unusedValue, opt_error) {
  if (goog.isDef(opt_error))
    return continuation(null, opt_error);
  goog.asserts.assert(form.isPair());
  if (form.cdr().isNil())
    return form.car().eval(environment, continuation)
  return form.car().eval(environment, goog.partial(
      ccc.base.Procedure.evalBodyContinuationImpl_,
      environment, continuation, form.cdr()));
};
