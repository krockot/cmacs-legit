// The Cmacs Project.

goog.provide('ccc.Syntax');

goog.require('ccc.Object');
goog.require('ccc.Symbol');
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
  if (ccc.isSymbol(this.data_)) {
    var value = environment.get(this.data_.name());
    if (ccc.isTransformer(value))
      return continuation(/** @type {ccc.Data} */(value));
    return continuation(this.data_);
  }
  return goog.partial(ccc.expand(this.data_, environment), continuation);
};


/** @override */
ccc.Syntax.prototype.compile = function(environment, continuation) {
  return goog.partial(ccc.compile(this.data_, environment), continuation);
};
