// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Evaluator');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Object');
goog.require('goog.Promise');



/**
 * Evaluator unsurprisingly evaluates objects in the context of a single
 * {@code ccc.base.Environment}.
 *
 * @param {!ccc.base.Environment=} opt_environment The environment to use in
 *     this evaluator. If omitted, a new standard environment will be used.
 * @constructor
 * @public
 */
ccc.base.Evaluator = function(opt_environment) {
  /** {!ccc.base.Environment} */
  this.environment_ = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment());
};


/**
 * Evaluates a {@code ccc.base.Object}.
 *
 * @param {!ccc.base.Object} object
 * @return {!goog.Promise.<!ccc.base.Object>} The result of the evaluation.
 */
ccc.base.Evaluator.prototype.eval = function(object) {
  return object.eval(this.environment_);
};
