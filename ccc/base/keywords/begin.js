// The Cmacs Project.

goog.provide('ccc.base.begin');

goog.require('ccc.core');
goog.require('ccc.base.lambda')



/**
 * The builtin BEGIN performs a sequence of evaluations and yields the value of
 * the last one.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var BeginTransformer_ = function() {
};
goog.inherits(BeginTransformer_, ccc.Transformer);


/** @override */
BeginTransformer_.prototype.toString = function() {
  return '#<begin-transformer>';
};


/** @override */
BeginTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args))
      return continuation(
          new ccc.Error('begin: One or more expressions required'));
    return ccc.base.lambda.transform(environment,
        ccc.Pair.makeList([ccc.NIL], args))(goog.partial(
            BeginTransformer_.onLambdaTransform_, environment, continuation));
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
BeginTransformer_.onLambdaTransform_ = function(
    environment, continuation, procedure) {
  return continuation(new ccc.Pair(procedure, ccc.NIL));
};


/** @const {!ccc.Transformer} */
ccc.base.begin = new BeginTransformer_();
