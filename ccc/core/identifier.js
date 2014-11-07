// The Cmacs Project.

goog.provide('ccc.Identifier');

goog.require('ccc.Object');



/**
 * An Identifier is a symbol with attached binding metadata. All symbol syntax
 * objects are replaced by Identifiers at expansion time.
 *
 * TODO(krockot): Decide what binding metadata looks like.
 *
 * @param {string} name
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Identifier = function(name) {
  /** @private {string} */
  this.name_ = name;
};
goog.inherits(ccc.Identifier, ccc.Object);


/**
 * Indicates if a {@code ccc.Data} is a {@code ccc.Identifier}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isIdentifier = function(data) {
  return data instanceof ccc.Identifier;
};


/** @override */
ccc.Identifier.prototype.toString = function() {
  return '#<identifier:' + this.name_ + '>';
};


/** @override */
ccc.Identifier.prototype.eq = function(other) {
  return ccc.isIdentifier(other) && other.name_ == this.name_;
};
