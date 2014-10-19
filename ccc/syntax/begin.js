// The Cmacs Project.

goog.provide('ccc.syntax.BEGIN');

goog.require('ccc.base');
goog.require('ccc.syntax.LAMBDA')
goog.require('goog.Promise');



/**
 * The builtin Begin performs a sequence of evaluations and yields the value of
 * the last one.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.BeginTransformer_ = function() {
};
goog.inherits(ccc.syntax.BeginTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.BeginTransformer_.prototype.toString = function() {
  return '#<begin-transformer>';
};


/** @override */
ccc.syntax.BeginTransformer_.prototype.transform = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject(new Error(
        'begin: One or more expressions required'));
  return ccc.syntax.LAMBDA.transform(environment,
      ccc.base.Pair.makeList([ccc.base.NIL], args)).then(function(procedure) {
    return new ccc.base.Pair(procedure, ccc.base.NIL);
  });
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.BEGIN = new ccc.syntax.BeginTransformer_();
