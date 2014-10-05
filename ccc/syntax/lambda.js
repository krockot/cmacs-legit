// The Cmacs Project.

goog.provide('ccc.syntax.Lambda');

goog.require('ccc.base');
goog.require('goog.Promise');
goog.require('goog.asserts');



/**
 * The Lambda transformer produces a native generator which itself evaluates to
 * new procedure objects when applied. Any generated procedure will execute in
 * the context of the environment in which the generator was applied.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Lambda = function() {
};
goog.inherits(ccc.syntax.Lambda, ccc.base.Transformer);


/** @override */
ccc.syntax.Lambda.prototype.toString = function() {
  return '#<lambda-transformer>';
};


/** @override */
ccc.syntax.Lambda.prototype.transform = function(environment, args) {
  if (!args.isPair() || args.cdr().isNil())
    return goog.Promise.reject(new Error('lambda: Invalid syntax'));
  var formals = args.car();
  if (!formals.isSymbol() && !formals.isPair() && !formals.isNil())
    return goog.Promise.reject(new Error('lambda: Invalid syntax'));
  var compile = function(body) {
    if (body.isNil())
      return goog.Promise.resolve(ccc.base.NIL);
    if (!body.isPair())
      return goog.Promise.reject(new Error('lambda: Invalid syntax'));
    return body.cdr().compile(environment).then(function(cdr) {
      return body.car().compile(environment).then(function(car) {
        return new ccc.base.Pair(car, cdr);
      });
    });
  };
  return compile(args.cdr()).then(function(args) {
    return new ccc.base.Pair(
        new ccc.base.NativeProcedure(
            goog.partial(ccc.syntax.Lambda.generateProcedure_, formals, args)),
        ccc.base.NIL);
  });
};


/**
 * Generate a new {@code ccc.base.Procedure} for a lambda form.
 *
 * @param {!ccc.base.Object} formals
 * @param {!ccc.base.Object} body
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise}
 */
ccc.syntax.Lambda.generateProcedure_ = function(
    formals, body, environment, args) {
  goog.asserts.assert(args.isNil(),
      'Procedure generators should never receive arguments.');
  return goog.Promise.resolve(new ccc.base.Procedure(
      environment, formals, body));
};
