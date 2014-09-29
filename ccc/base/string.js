// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.String');

goog.require('ccc.base.Object');
goog.require('goog.object');



/**
 * Basic string type.
 *
 * @param {string} value
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.String = function(value) {
  /** @private {string} */
  this.value_ = value;
};
goog.inherits(ccc.base.String, ccc.base.Object);


/** @override */
ccc.base.String.prototype.toString = function() {
  return '"' + ccc.base.String.escapeValue_(this.value_) + '"';
};


/** @override */
ccc.base.String.prototype.eq = function(other) {
  return other.isString() && this.value_ == other.value_;
};


/** @override */
ccc.base.String.prototype.isString = function() {
  return true;
};


/**
 * Returns the underlying native string value.
 *
 * @return {string}
 */
ccc.base.String.prototype.value = function() {
  return this.value_;
};


/**
 * Used by toString. Returns a version of a string value with newlines and
 * other special characters escaped.
 *
 * @param {string} value
 * @return {string}
 */
ccc.base.String.escapeValue_ = function(value) {
  var escaped = '';
  for (var i = 0; i < value.length; ++i) {
    var c = value.charAt(i);
    escaped += goog.object.get(ccc.base.String.ESCAPE_MAP_, c, c);
  }
  return escaped;
};


/**
 * Used by {@code ccc.base.String.escapeValue_} to map characters to escape
 * sequences.
 */
ccc.base.String.ESCAPE_MAP_ = {
  '\\': '\\\\',
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\v': '\\v',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
};
