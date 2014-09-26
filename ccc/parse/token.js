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
  this.data = extractTokenData_(type, text);

  /** @public {number} */
  this.line = line;

  /** @public {number} */
  this.column = column;
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
var extractTokenData_ = (function() {
  var T = ccc.parse.TokenType;
  var transforms = {};

  var baseFilters = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    16: /^[0-9a-f]+$/i,
    36: /^[0-9a-z]+$/i
   };
  var strictParseInt = function(text, base) {
    goog.asserts.assert(goog.object.containsKey(baseFilters, base),
        'Invalid integer base.');
    goog.asserts.assert(text.match(baseFilters[base]),
        'Invalid integer string.');
    return parseInt(text, base);
  };

  /** @const */
  var ESCAPES = {
    '0': '\0',
    'b': '\b',
    't': '\t',
    'n': '\n',
    'v': '\v',
    'f': '\f',
    'r': '\r',
  };
  var unescapeString = function(text) {
    var output = '';
    for (var i = 0; i < text.length; ++i) {
      var c = text.charAt(i);
      if (c == '\\') {
        goog.asserts.assert(i < text.length - 1, 'Invalid string literal.');
        var e = text.charAt(++i);
        if (e == 'x') {
          goog.asserts.assert(i < text.length - 2, 'Invalid string literal.');
          var value = strictParseInt(text.substr(i + 1, 2), 16);
          goog.asserts.assert(!isNaN(value), 'Invalid string literal.');
          output += String.fromCharCode(value);
          i += 2;
        } else if (e == 'u') {
          goog.asserts.assert(i < text.length - 4, 'Invalid string literal.');
          var value = strictParseInt(text.substr(i + 1, 4), 16);
          goog.asserts.assert(!isNaN(value), 'Invalid string literal.');
          output += String.fromCharCode(value);
          i += 4;
        } else if (goog.object.containsKey(ESCAPES, e)) {
          output += ESCAPES[e];
        } else {
          output += e;
        }
      } else {
        output += c;
      }
    }
    return output;
  };

  // Processes a symbol token and outputs the real symbol name. Normally symbol
  // text is taken as its literal value, but quoted symbols need to have the
  // |-quotes removed and escape sequences collapsed.
  transforms[T.SYMBOL] = function(text) {
    if (text.charAt(0) != '|') {
      goog.asserts.assert(text.charAt(text.length - 1) != '|',
          'Invalid quoted symbol text.');
      return { name: text };
    }
    goog.asserts.assert(text.charAt(text.length - 1) == '|',
        'Invalid quoted symbol text.');
    return { name: unescapeString(text.substring(1, text.length - 1)) };
  };

  // Processes a string literal by removing the quotes and collapsing escape
  // sequences.
  transforms[T.STRING_LITERAL] = function(text) {
    goog.asserts.assert(text.charAt(0) == '"',
        'Invalid string literal text.');
    goog.asserts.assert(text.charAt(text.length - 1) == '"',
        'Invalid string literal text.');
    return { value: unescapeString(text.substring(1, text.length - 1)) };
  };

  // Parses a numeric literal and produces its actual numeric value.
  var bases = { b: 2, B: 2, o: 8, O: 8, x: 16, X: 16 };
  transforms[T.NUMERIC_LITERAL] = function(text) {
    var value;
    if (text.charAt(0) == '#') {
      var baseChar = text.charAt(1);
      goog.asserts.assert(goog.object.containsKey(bases, baseChar),
          'Invalid base prefix on numeric literal.');
      var digits = text.substr(2);
      var firstChar = digits.charAt(0);
      if (firstChar == '-' || firstChar == '+') {
        digits = text.substr(3);
      }
      value = strictParseInt(digits, bases[baseChar]);
    } else {
      value = Number(text);
    }
    goog.asserts.assert(!isNaN(value), 'Invalid numeric literal.');
    return { value: value };
  };

  // Parses a character literal and produces its character code value.
  transforms[T.CHAR_LITERAL] = function(text) {
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
    if (c == 'x' || c == 'X') {
      goog.asserts.assert(text.length == 5, 'Invalid character literal.');
      return { value: strictParseInt(text.substr(3), 16) };
    }
    if (c == 'u' || c == 'U') {
      goog.asserts.assert(text.length == 7, 'Invalid character literal.');
      return { value: strictParseInt(text.substr(3), 16) };
    }
    goog.asserts.assert(false, 'Invalid character literal.');
  };

  /**
   * @param {ccc.parse.TokenType} type
   * @param {string} text
   * @return {!Object.<string, *>}
   */
  return function(type, text) {
    if (!goog.object.containsKey(transforms, type)) {
      return {};
    }
    return transforms[type](text);
  };
}());
