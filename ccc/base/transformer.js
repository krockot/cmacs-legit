// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Transformer');

goog.require('ccc.base.Object');
goog.require('goog.Promise');



/**
 * A Transformer is used to implemenent compile-time syntax transformations.
 *
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Transformer = function() {
};
goog.inherits(ccc.base.Transformer, ccc.base.Object);


/** @override */
ccc.base.Transformer.prototype.toString = function() {
  return '#<transformer>';
};


/** @override */
ccc.base.Transformer.prototype.isTransformer = function() {
  return true;
};


/**
 * If a Transformer occurs at the head of a list at compile time, its
 * {@code transform} is called on the remainder of the list. The entire list is
 * replaced by the result.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Object} args
 * @return {!goog.Promise.<!ccc.base.Object>}
 */
ccc.base.Transformer.prototype.transform = function(environment, args) {
  return goog.Promise.reject('Invalid Transformer');
};
