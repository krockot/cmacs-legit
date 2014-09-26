// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Token');
goog.provide('ccc.parse.TokenType');

goog.require('goog.object');



/**
 * Token type.
 *
 * @enum {number}
 * @public
 */
ccc.parse.TokenType = {
  OPEN_LIST: 0,
  CLOSE_FORM: 1,
  QUOTE: 2,
  UNQUOTE: 3,
  UNQUOTE_SPLICING: 4,
  QUASIQUOTE: 5,
  OMIT_DATUM: 6,
  TRUE: 7,
  FALSE: 8,
  UNSPECIFIED: 9,
  OPEN_VECTOR: 10,
  SYMBOL: 11,
  CHAR_LITERAL: 12,
  STRING_LITERAL: 13,
  NUMERIC_LITERAL: 14,
  DOT: 15
};



/**
 * A single token emitted from a {@code ccc.parse.Scanner}.
 *
 * @param {ccc.parse.TokenType} type The token type.
 * @param {string} text The input text associated with this token.
 * @param {number} line The line number on which this token occurs.
 * @param {number} column The column number at which this token begins.
 * @struct
 * @constructor
 * @public
 */
ccc.parse.Token = function(type, text, line, column) {
  /** @public {ccc.parse.TokenType} */
  this.type = type;

  /** @public {string} */
  this.text = text;

  /** @public {!Object.<string,*>} */
  this.data = ccc.parse.Token.getData_(type, text);

  /** @public {number} */
  this.line = line;

  /** @public {number} */
  this.column = column;
};


/**
 * Map of supported escape sequence translations.
 *
 * @private {!Object.<string,string>}
 * @const
 */
ccc.parse.Token.ESCAPES_ = {
  '0': '\0',
  'b': '\b',
  't': '\t',
  'n': '\n',
  'v': '\v',
  'f': '\f',
  'r': '\r',
};


/**
 * Map of numeric base patterns for strict enforcement
 * of numeric literal text content in debug mode.
 *
 * @private {!Object.<number, !RegExp>}
 * @const
 */
ccc.parse.Token.BASE_PATTERNS_ = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  16: /^[0-9a-f]+$/i,
  36: /^[0-9a-z]+$/i
};


/**
 * Map of numeric literal base prefixes.
 *
 * @private {!Object.<string, number>}
 * @const
 */
ccc.parse.Token.BASE_PREFIX_MAP_ = {
  b: 2,
  B: 2,
  o: 8,
  O: 8,
  x: 16,
  X: 16
};


/**
 * Strict integer parsing in a given base. Strictness is only enforced in
 * debug mode.
 *
 * @param {string} text The numeric text.
 * @param {number} base The presumed base of the text.
 * @return {number}
 * @private
 */
ccc.parse.Token.strictParseInt_ = function(text, base) {
  goog.asserts.assert(
      goog.object.containsKey(ccc.parse.Token.BASE_PATTERNS_, base),
      'Unsupported integer base.');
  goog.asserts.assert(text.match(ccc.parse.Token.BASE_PATTERNS_[base]),
      'Invalid integer value.');
  return parseInt(text, base);
};


/**
 * Unescapes the contents of a quoted string or symbol name.
 *
 * @param {string} text The text to process.
 * @return {string} A string with all escape sequences collapsed.
 * @private
 */
ccc.parse.Token.unescapeString_ = function(text) {
  /** @type {string} */
  var output = '';
  for (var i = 0; i < text.length; ++i) {
    /** @const {string} */
    var c = text.charAt(i);
    if (c != '\\') {
      output += c;
      continue;
    }
    goog.asserts.assert(i < text.length - 1, 'Invalid escape sequence.');
    /** @const {string} */
    var e = text.charAt(++i);
    if (e == 'x') {
      goog.asserts.assert(i < text.length - 2, 'Invalid escape sequence.');
      var value = ccc.parse.Token.strictParseInt_(text.substr(i + 1, 2), 16);
      goog.asserts.assert(!isNaN(value), 'Invalid escape sequence.');
      output += String.fromCharCode(value);
      i += 2;
    } else if (e == 'u') {
      goog.asserts.assert(i < text.length - 4, 'Invalid escape sequence.');
      var value = ccc.parse.Token.strictParseInt_(text.substr(i + 1, 4), 16);
      goog.asserts.assert(!isNaN(value), 'Invalid escape sequence.');
      output += String.fromCharCode(value);
      i += 4;
    } else if (goog.object.containsKey(ccc.parse.Token.ESCAPES_, e)) {
      output += ccc.parse.Token.ESCAPES_[e];
    } else {
      output += e;
    }
  }
  return output;
};


/**
 * Extracts a symbol name from a symbol token's text.
 *
 * @param {string} text The text of the symbol token.
 * @return {!{name: string}}
 * @private
 */
ccc.parse.Token.getSymbolData_ = function(text) {
  if (text.charAt(0) != '|') {
    goog.asserts.assert(text.charAt(text.length - 1) != '|',
        'Invalid quoted symbol text.');
    return { name: text };
  }
  goog.asserts.assert(text.charAt(text.length - 1) == '|',
      'Invalid quoted symbol text.');
  return {
    name: ccc.parse.Token.unescapeString_(text.substring(1, text.length - 1))
  };
};


/**
 * Extracts string contents from a string literal token's text.
 *
 * @param {string} text The text of the string literal.
 * @return {!{value: string}}
 * @private
 */
ccc.parse.Token.getStringData_ = function(text) {
  goog.asserts.assert(text.charAt(0) == '"',
      'Invalid string literal text.');
  goog.asserts.assert(text.charAt(text.length - 1) == '"',
      'Invalid string literal text.');
  return {
    value: ccc.parse.Token.unescapeString_(text.substring(1, text.length - 1))
  };
};


/**
 * Extracts a real Number value from a numeric literal token's text.
 *
 * @param {string} text The text of the numeric literal.
 * @return {!{value: number}}
 * @private
 */
ccc.parse.Token.getNumericData_ = function(text) {
  /** @type {number} */
  var value = 0;
  if (text.charAt(0) == '#') {
    var baseChar = text.charAt(1);
    goog.asserts.assert(
        goog.object.containsKey(ccc.parse.Token.BASE_PREFIX_MAP_, baseChar),
        'Invalid base prefix on numeric literal.');
    var digits = text.substr(2);
    var firstChar = digits.charAt(0);
    if (firstChar == '-' || firstChar == '+') {
      digits = text.substr(3);
    }
    value = ccc.parse.Token.strictParseInt_(digits,
        ccc.parse.Token.BASE_PREFIX_MAP_[baseChar]);
  } else {
    value = Number(text);
  }
  goog.asserts.assert(!isNaN(value), 'Invalid numeric literal.');
  return { value: value };
};


/**
 * Extracts character code data from a character literal token's text.
 *
 * @param {string} text The text of the character literal.
 * @return {!{value: number}}
 */
ccc.parse.Token.getCharacterData_ = function(text) {
  if (text.length == 3) {
    return { value: text.charCodeAt(2) };
  }
  if (text.substr(2) == 'newline') {
    return { value: 10 };
  }
  if (text.substr(2) == 'space') {
    return { value: 32 };
  }
  var c = text.charAt(2);
  if (c == 'x') {
    goog.asserts.assert(text.length == 5, 'Invalid character literal.');
    return { value: ccc.parse.Token.strictParseInt_(text.substr(3), 16) };
  }
  if (c == 'u') {
    goog.asserts.assert(text.length == 7, 'Invalid character literal.');
    return { value: ccc.parse.Token.strictParseInt_(text.substr(3), 16) };
  }
  goog.asserts.assert(false, 'Invalid character literal.');
  throw new Error('Not reached.');
};


/**
 * Post-processing function. For some token types, this generates interesting
 * data derived from the token text. Generally used to process literals and
 * symbol tokens.
 *
 * @param {ccc.parse.TokenType} type The type of token being processed.
 * @param {string} text The text of the token.
 * @return {!Object.<string, *>}
 * @private
 */
ccc.parse.Token.getData_ = function(type, text) {
  switch (type) {
    case ccc.parse.TokenType.SYMBOL:
      return ccc.parse.Token.getSymbolData_(text);
    case ccc.parse.TokenType.STRING_LITERAL:
      return ccc.parse.Token.getStringData_(text);
    case ccc.parse.TokenType.NUMERIC_LITERAL:
      return ccc.parse.Token.getNumericData_(text);
    case ccc.parse.TokenType.CHAR_LITERAL:
      return ccc.parse.Token.getCharacterData_(text);
    default:
      return {};
  }
};
