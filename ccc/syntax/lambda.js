// The Cmacs Project.

goog.provide('ccc.syntax.LAMBDA');

goog.require('ccc.base');
goog.require('goog.Promise');
goog.require('goog.asserts');



/**
 * The LAMBDA transformer produces a native generator which itself evaluates to
 * new procedure objects when applied. Any generated procedure will execute in
 * the context of the environment in which the generator was applied.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.LambdaTransformer_ = function() {
};
goog.inherits(ccc.syntax.LambdaTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.LambdaTransformer_.prototype.toString = function() {
  return '#<lambda-transformer>';
};


/** @override */
ccc.syntax.LambdaTransformer_.prototype.transform = function(
    environment, args) {
  if (!args.isPair() || args.cdr().isNil())
    return goog.Promise.reject(new Error('lambda: Invalid syntax'));
  var formals = args.car();
  if (!formals.isSymbol() && !formals.isPair() && !formals.isNil())
    return goog.Promise.reject(new Error('lambda: Invalid syntax'));
  var compileBody = function(body) {
    if (body.isNil())
      return goog.Promise.resolve(ccc.base.NIL);
    if (!body.isPair())
      return goog.Promise.reject(new Error('lambda: Invalid syntax'));
    return compileBody(body.cdr()).then(function(cdr) {
      return body.car().compile(environment).then(function(car) {
        return new ccc.base.Pair(car, cdr);
      });
    });
  };
  return compileBody(args.cdr()).then(function(args) {
    var generatingProcedure = new ccc.base.NativeProcedure(goog.partial(
        ccc.syntax.LambdaTransformer_.generateProcedure_, formals, args));
    return new ccc.base.Pair(generatingProcedure, ccc.base.NIL);
  });
};


/**
 * Generate a new {@code ccc.base.Procedure} for a lambda form.
 *
 * @param {!ccc.base.Object} formals
 * @param {!ccc.base.Object} body
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @param {!ccc.base.Continuation} continuation
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.syntax.LambdaTransformer_.generateProcedure_ = function(
    formals, body, environment, args, continuation) {
  goog.asserts.assert(args.isNil(),
      'Compiled procedure generator should never receive arguments.');
  return continuation(new ccc.base.Procedure(environment, formals, body));
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LAMBDA = new ccc.syntax.LambdaTransformer_();
