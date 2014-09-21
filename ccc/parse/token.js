// Cmacs project. Copyright forever, the universe.

goog.provide('ccc.parse.Token');



/**
 * Token type.
 * @enum {number}
 * @public
 */
ccc.parse.TokenType = {
  STRING: 0,
  LIST: 1
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

  /** @public {column} */
  this.column = column;
};
