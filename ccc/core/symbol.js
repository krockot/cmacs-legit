// The Cmacs Project.

goog.provide('ccc.Symbol');

goog.require('ccc.ImmediateLocation');
goog.require('ccc.Object');
goog.require('ccc.Transformer');



/**
 * The Symbol type.
 *
 * @param {string} name
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Symbol = function(name) {
  /** @private {string} */
  this.name_ = name;
};
goog.inherits(ccc.Symbol, ccc.Object);


/**
 * Indicates if a {@code ccc.Data} is a {@code ccc.Symbol}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isSymbol = function(data) {
  return data instanceof ccc.Symbol;
};


/** @override */
ccc.Symbol.prototype.toString = function() {
  // TODO(krockot): Escape line breaks, special characters, and '|'.
  return this.name_;
};


/** @override */
ccc.Symbol.prototype.eq = function(other) {
  return ccc.isSymbol(other) && other.name_ == this.name_;
};


/** @override */
ccc.Symbol.prototype.expand = function(environment, continuation) {
  var location = environment.get(this.name_);
  if (!goog.isNull(location)) {
    var value = location.getValue();
    if (ccc.isTransformer(value))
      return continuation(/** @type {!ccc.Transformer} */ (value));
  }
  return continuation(this);
};


/** @override */
ccc.Symbol.prototype.compile = function(environment, continuation) {
  var location = environment.get(this.name_);
  if (goog.isNull(location)) {
    location = new ccc.ImmediateLocation();
    location.setName(this.name_);
    environment.setGlobal(this.name_, location);
  }
  return continuation(location);
};


/**
 * Returns the name of this symbol.
 *
 * @return {string}
 */
ccc.Symbol.prototype.name = function() {
  return this.name_;
};
