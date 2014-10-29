// The Cmacs Project.

goog.provide('ccc.Transformer');

goog.require('ccc.Environment');
goog.require('ccc.Error');
goog.require('ccc.Object');
goog.require('goog.Promise');



/**
 * A Transformer is used to implemenent compile-time syntax transformations.
 *
 * @constructor
 * @extends {ccc.Object}
 * @public
 */
ccc.Transformer = function() {
};
goog.inherits(ccc.Transformer, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Transformer}.
 *
 * @param {ccc.Data} data
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
 * If a Transformer occurs at the head of a list at compile time, its
 * {@code transform} is called on the remainder of the list. The entire list is
 * replaced by the result.
 *
 * @param {!ccc.Environment} environment
 * @param {!ccc.Object} args
 * @return {!goog.Promise}
 */
ccc.Transformer.prototype.transform = function(environment, args) {
  return goog.Promise.reject(new ccc.Error('Invalid Transformer'));
};
