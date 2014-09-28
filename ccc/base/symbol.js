// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Symbol');

goog.require('ccc.base.Object');
goog.require('goog.object');



/**
 * Basic symbol type.
 *
 * @param {string} name
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Symbol = function(name) {
  /** @private {string} */
  this.name_ = name;
};
goog.inherits(ccc.base.Symbol, ccc.base.Object);


/** @override */
ccc.base.Symbol.prototype.toString = function() {
  return ccc.base.Symbol.escapeName_(this.name_);
};


/** @override */
ccc.base.Symbol.prototype.eq = function(other) {
  return other.isSymbol() && this.name_ == other.name_;
};


/** @override */
ccc.base.Symbol.prototype.isSymbol = function() {
  return true;
};


/**
 * Returns the underlying symbol name as a native string value.
 *
 * @return {string}
 */
ccc.base.Symbol.prototype.name = function() {
  return this.name_;
};


/**
 * Used by toString. Returns a version of symbol name with newlines and
 * other special characters escaped. If any characters are escaped, the
 * resulting name is |-quoted.
 *
 * @param {string} name
 * @return {string}
 */
ccc.base.Symbol.escapeName_ = function(name) {
  var escaped = '';
  for (var i = 0; i < name.length; ++i) {
    var c = name.charAt(i);
    if (goog.object.containsKey(ccc.base.Symbol.ESCAPE_MAP_, c))
      escaped += ccc.base.Symbol.ESCAPE_MAP_[c];
    else
      escaped += c;
  }
  if (escaped.length > name.length)
    return '|' + escaped + '|';
  return escaped;
};


/**
 * Used by {@code ccc.base.Symbol.escapeName_} to map characters to escape
 * sequences.
 */
ccc.base.Symbol.ESCAPE_MAP_ = {
  '\\': '\\\\',
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\v': '\\v',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '|': '\\|',
};
