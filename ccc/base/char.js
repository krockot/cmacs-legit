// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Char');

goog.require('ccc.base.Object');
goog.require('goog.Promise');
goog.require('goog.object');



/**
 * Basic character type.
 *
 * @param {number} value
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Char = function(value) {
  /** @private {number} */
  this.value_ = value;
};
goog.inherits(ccc.base.Char, ccc.base.Object);


/** @override */
ccc.base.Char.prototype.toString = function() {
  return '#\\' + ccc.base.Char.getCharName_(this.value_);
};


/** @override */
ccc.base.Char.prototype.eqv = function(other) {
  return other.isChar() && this.value_ == other.value_;
};


/** @override */
ccc.base.Char.prototype.isChar = function() {
  return true;
};


/**
 * Returns the underlying character code value.
 *
 * @return {number}
 */
ccc.base.Char.prototype.value = function() {
  return this.value_;
};


/**
 * Returns the underlying character string value.
 *
 * @return {string}
 */
ccc.base.Char.prototype.stringValue = function() {
  return String.fromCharCode(this.value());
};


/** @override */
ccc.base.Char.prototype.eval = function(environment) {
  return goog.Promise.resolve(this);
};


/**
 * Used by toString. Returns a version of symbol name with newlines and
 * other special characters escaped. If any characters are escaped, the
 * resulting name is |-quoted.
 *
 * @param {string} name
 * @return {string}
 */
ccc.base.Char.getCharName_ = function(value) {
  var charName = goog.object.get(ccc.base.Char.CHAR_NAME_MAP_, value);
  if (goog.isDef(charName)) {
    return charName;
  }
  if (value < 16) {
    return 'x0' + value.toString(16);
  }
  if (value < 32) {
    return 'x' + value.toString(16);
  }
  return String.fromCharCode(value);
};


/**
 * Used by {@code ccc.base.Char.getCharName_} to map characters to special
 * character literal forms.
 *
 * @private {!Object.<number, string>}
 */
ccc.base.Char.CHAR_NAME_MAP_ = {
  10: 'newline',
  32: 'space',
  0x85: 'x85',
  0xa0: 'xa0',
  0x2000: 'u2000',
  0x2001: 'u2001',
  0x2002: 'u2002',
  0x2003: 'u2003',
  0x2004: 'u2004',
  0x2005: 'u2005',
  0x2006: 'u2006',
  0x2007: 'u2007',
  0x2008: 'u2008',
  0x2009: 'u2009',
  0x200a: 'u200a',
  0x200b: 'u200b',
  0x2028: 'u2028',
  0x2029: 'u2029',
  0x202f: 'u202f',
  0x3000: 'u3000',
};
