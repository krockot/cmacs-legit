// The Cmacs Project.

goog.provide('ccc.Syntax');

goog.require('ccc.Object');



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


/** @override */
ccc.Syntax.prototype.toString = function() {
  return '(syntax ' + this.data_.toString() + ')';
};
