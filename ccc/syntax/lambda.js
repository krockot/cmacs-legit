// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.syntax.Lambda');

goog.require('ccc.base.Object');
goog.require('ccc.base.Pair');
goog.require('ccc.base.Procedure');
goog.require('ccc.base.Transformer');
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
ccc.syntax.Lambda = function() {};


/** @override */
ccc.syntax.Lambda.prototype.toString = function() {
  return '#<lambda-transformer>';
};


/** @override */
ccc.syntax.Lambda.prototype.transform = function(environment, args) {
  if (!args.isPair() || args.cdr().isNil())
    return goog.Promise.reject('lambda: Invalid syntax');
  var formals = args.car();
  if (!formals.isSymbol() && !formals.isPair() && !formals.isNil())
    return goog.Promise.reject('lambda: Invalid syntax');
  var body = args.cdr();
  var compiledBody = [];
  var step = function() {
    if (body.isNil()) {
      return goog.Promise.resolve(new ccc.base.Pair(
          new ccc.base.NativeProcedure(
              goog.partial(ccc.syntax.Lambda.generateProcedure_,
                           formals, ccc.base.Pair.makeList(compiledBody)))));
    }
    if (!body.isPair())
      return goog.Promise.reject('lambda: Invalid syntax');
    return body.car().compile(environment).then(function(compiledBodyItem) {
      compiledBody.push(compiledBodyItem);
      body = body.cdr();
      return step();
    });
  };
  return step();
};


/**
 * Generate a new {@code ccc.base.Procedure} for a lambda form.
 *
 * @param {!ccc.base.Object} formals
 * @param {!ccc.base.Object} body
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.syntax.Lambda.generateProcedure_ = function(
    formals, body, environment, args) {
  goog.asserts.assert(args.isNil(),
      'Procedure generators should never receive arguments.');
  return goog.Promise.resolve(new ccc.base.Procedure(
      environment, formals, body));
};
