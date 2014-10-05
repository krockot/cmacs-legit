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
  continuation.resolve(this);
};


/** @override */
ccc.base.Procedure.prototype.apply = function(environment, args, continuation) {
  var innerScope = new ccc.base.Environment(this.scope_);
  if (this.formals_.isNil()) {
    if (!args.isNil()) {
      continuation.reject(new Error('Too many arguments'));
      return;
    }
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
    if (formal.isNil() && !arg.isNil()) {
      continuation.reject(new Error('Too many arguments'));
      return;
    }
    if (arg.isNil() && formal.isPair()) {
      continuation.reject(new Error('Not enough arguments'));
      return;
    }
    goog.asserts.assert(arg.isPair() || arg.isNil(), 'Invalid argument list');
    if (formal.isSymbol())
      innerScope.set(formal.name(), arg);
  }

  ccc.base.Procedure.evalBody_(innerScope, continuation, this.body_);
};


/**
 * Evaluates a procedure body one expression at a time. If in the tail position,
 * the result of evaluation is passed to the given continuation.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!goog.promise.Resolver} continuation
 * @param {!ccc.base.Object} body
 * @private
 */
ccc.base.Procedure.evalBody_ = function(environment, continuation, body) {
  goog.asserts.assert(body.isPair(), 'Invalid procedure body. Y u do dis?');
  if (body.cdr().isNil()) {
    body.car().eval(environment, continuation);
    return;
  }
  var resolver = goog.Promise.withResolver();
  body.car().eval(environment, resolver);
  resolver.promise.then(goog.partial(ccc.base.Procedure.evalBody_,
      environment, continuation, body.cdr()));
};
