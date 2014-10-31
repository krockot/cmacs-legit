// The Cmacs Project.

goog.provide('ccc.Syntax');

goog.require('ccc.Object');
goog.require('ccc.core.stringify');



/**
 * A Syntax object wraps a {@code ccc.Data} with additional contextual
 * information to aid in the processes of expansion, compilation, and source
 * reflection.
 *
 * @param {ccc.Data} data The data to wrap.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Syntax = function(data) {
  /** @private {ccc.Data} */
  this.data_ = data;
};
goog.inherits(ccc.Syntax, ccc.Object);


/** @override */
ccc.Syntax.prototype.toString = function() {
  return '(syntax ' + ccc.core.stringify(this.data_) + ')';
};


/** @override */
ccc.Syntax.prototype.expand = function(environment, continuation) {
  return continuation(this.data_);
};
