// The Cmacs Project.

goog.provide('ccc.Transformer');

goog.require('ccc.Error');
goog.require('ccc.Object');



/**
 * A Transformer is used to implemenent compile-time syntax transformations.
 *
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Transformer = function() {
};
goog.inherits(ccc.Transformer, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Transformer}.
 *
 * @param {?ccc.Data} data
 * @return {boolean}
 */
ccc.isTransformer = function(data) {
  return data instanceof ccc.Transformer;
};


/** @override */
ccc.Transformer.prototype.toString = function() {
  return '#<transformer>';
};


/**
 * Performs transformation of syntax.
 *
 * @param {!ccc.Environment} environment
 * @param {(!ccc.Pair|!ccc.Nil)} args
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 */
ccc.Transformer.prototype.transform = function(
    environment, args, continuation) {
  return continuation(new ccc.Error('Invalid Transformer'));
};
