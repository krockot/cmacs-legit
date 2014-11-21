// The Cmacs Project.

goog.provide('ccc.PromiseGenerator');



/**
 * A data type which generates new {@code ccc.Promise} objects upon evaluation.
 * This is used to implement delay syntax.
 *
 * @constructor
 * @extends {ccc.Object}
 * @param {ccc.Data} data
 */
ccc.PromiseGenerator = function(data) {
  /** @private {ccc.Data} */
  this.data_ = data;
};
goog.inherits(ccc.PromiseGenerator, ccc.Object);


/** @override */
ccc.PromiseGenerator.prototype.toString = function() {
  return '#<promise-generator>';
};


/** @override */
ccc.PromiseGenerator.prototype.compile = function(environment, continuation) {
  return ccc.compile(this.data_, environment)(function(result) {
    if (ccc.isError(result))
      return continuation(result);
    return continuation(new ccc.PromiseGenerator(result));
  });
};


/** @override */
ccc.PromiseGenerator.prototype.eval = function(environment, continuation) {
 return continuation(new ccc.Promise(this.data_));
};
