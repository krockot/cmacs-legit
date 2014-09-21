// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.Token');
goog.provide('ccc.parse.TokenType')



/**
 * Token type.
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
  QUOTED_SYMBOL: 15,
};



/**
 * A single token emitted from a {@code ccc.parse.Scanner}.
 * @param {ccc.parse.TokenType} type The token type.
 * @param {string} text The input text associated with this token.
 * @param {!Object} data Extra type-specific data derived by the scanner.
 * @param {number} line The line number on which this token occurs.
 * @param {number} column The column number at which this token begins.
 * @struct
 * @constructor
 * @public
 */
ccc.parse.Token = function(type, text, data, line, column) {
  /** @public {ccc.parse.TokenType} */
  this.type = type;

  /** @public {string} */
  this.text = text;

  /** @public {!Object} */
  this.data = data;

  /** @public {number} */
  this.line = line;

  /** @public {number} */
  this.column = column;
};
