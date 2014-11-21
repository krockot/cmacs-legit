// The Cmacs Project.

goog.provide('ccc.base.delay');

goog.require('ccc.PromiseGenerator');
goog.require('ccc.base');
goog.require('ccc.base.lambda');
goog.require('ccc.core');
goog.require('goog.asserts');


/**
 * The DELAY transformer produces a promise generator which yields new promises
 * to capture the delayed evaluation of an expression sequence.
 *
 * @constructor
 * @extends {ccc.Transformer}
 * @private
 */
var DelayTransformer_ = function() {
};
goog.inherits(DelayTransformer_, ccc.Transformer);


/** @override */
DelayTransformer_.prototype.toString = function() {
  return '#<delay-transformer>';
};


/** @override */
DelayTransformer_.prototype.transform = function(environment, args) {
  return function (continuation) {
    if (!ccc.isPair(args))
      return continuation(new ccc.Error('delay: Invalid syntax'));
    var callForm = new ccc.Pair(new ccc.Pair(ccc.base.get('lambda'),
        new ccc.Pair(ccc.NIL, args)), ccc.NIL);
    return ccc.expand(callForm, environment)(goog.partial(
        DelayTransformer_.onCallExpanded_, continuation));
  };
};


/**
 * Emits a new {@code ccc.PromiseGenerator} which captures the transformed
 * expression sequence.
 *
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
DelayTransformer_.onCallExpanded_ = function(continuation, result) {
  if (ccc.isError(result))
    return continuation(result);
  return continuation(new ccc.PromiseGenerator(result));
};


ccc.base.registerBinding('delay', new DelayTransformer_());
