// The Cmacs Project.

goog.provide('ccc.syntax.BEGIN');

goog.require('ccc.core');
goog.require('ccc.syntax.LAMBDA')



/**
 * The builtin BEGIN performs a sequence of evaluations and yields the value of
 * the last one.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
ccc.syntax.BeginTransformer_ = function() {
};
goog.inherits(ccc.syntax.BeginTransformer_, ccc.Transformer);


/** @override */
ccc.syntax.BeginTransformer_.prototype.toString = function() {
  return '#<begin-transformer>';
};


/** @override */
ccc.syntax.BeginTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args))
      return continuation(
          new ccc.Error('begin: One or more expressions required'));
    return ccc.syntax.LAMBDA.transform(environment,
        ccc.Pair.makeList([ccc.NIL], args))(goog.partial(
            ccc.syntax.BeginTransformer_.onLambdaTransform_, environment,
            continuation));
  };
};


/**
 * Intermediate continuation to generate call syntax for a generated lambda
 * transform.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} procedure
 * @return {ccc.Thunk}
 * @private
 */
ccc.syntax.BeginTransformer_.onLambdaTransform_ = function(
    environment, continuation, procedure) {
  return continuation(new ccc.Pair(procedure, ccc.NIL));
};


/**
 * @public {!ccc.Transformer}
 * @const
 */
ccc.syntax.BEGIN = new ccc.syntax.BeginTransformer_();
