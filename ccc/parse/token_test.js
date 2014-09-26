// The Cmacs Project.
// Copyright forever, the universe.

goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenType');
goog.require('goog.object');
goog.require('goog.testing.jsunit');


var T;

var setUp = function() {
  T = ccc.parse.TokenType;
}

// Given a token type and text, expect an exact value for attached token data.
var E = function(type, text, expectedData) {
  var token = new ccc.parse.Token(type, text, 1, 1);
  goog.object.every(expectedData, function(v, k) {
    assertEquals(v, token.data[k]);
  });
  goog.object.every(token.data, function(v, k) {
    assertEquals(v, expectedData[k]);
  })
};

var STRING = function(text, expectedValue) {
  E(T.STRING_LITERAL, text, { value: expectedValue });
};

var SYMBOL = function(text, expectedName) {
  E(T.SYMBOL, text, { name: expectedName });
};

var NUMBER = function(text, expectedValue) {
  E(T.NUMERIC_LITERAL, text, { value: expectedValue });
};

var CHAR = function(text, expectedValue) {
  E(T.CHAR_LITERAL, text, { value: expectedValue });
};

// Given a token type and text, expect failure.
var F = function(type, text) {
  try {
    new ccc.parse.Token(type, text, 1, 1);
  } catch (e) {
    return false;
  }
  throw new Error('Expected failure, got success.');
};

var STRING_F = function(text) { F(T.STRING_LITERAL, text); };
var SYMBOL_F = function(text) { F(T.SYMBOL, text); };
var NUMBER_F = function(text) { F(T.NUMERIC_LITERAL, text); };
var CHAR_F = function(text) { F(T.CHAR_LITERAL, text); };

// Actual tests below this line.

function testStringLiterals() {
  STRING_F('no-quotes');
  STRING_F('"missing-quote');
  STRING_F('missing-quote"');
  STRING('""', '');
  STRING('"\\"\\""', '""');
  STRING('"Hello, world!"', 'Hello, world!');
  STRING('"Hello\\nworld\\!"', 'Hello\nworld!');
  STRING('"\\0\\b\\t\\n\\v\\f\\r"', '\0\b\t\n\v\f\r');
  STRING('"\\a\\c\\d\\e\\g\\h\\\\\\\'\\""', 'acdegh\\\'"')
  STRING('"\\u03bb\\x0a\\x41\\u2022\\xff"', '\u03bb\nA\u2022\xff');
  STRING_F('"\\u04gg');
}

function testQuotedSymbols() {
  SYMBOL_F('|missing-quote');
  SYMBOL_F('missing-quote|');
  SYMBOL('no-quotes', 'no-quotes');
  SYMBOL('everything-is-cool', 'everything-is-cool');
  SYMBOL('|quoted|', 'quoted');
  SYMBOL('|HELLO\\ncapslock\\!|', 'HELLO\ncapslock!');
  SYMBOL('||', '');
  SYMBOL('|\\|\\||', '||');
  SYMBOL('|\\u03bb|', '\u03bb');
}

function testNumericLiterals() {
  NUMBER_F('#q33');
  NUMBER_F('banana');
  NUMBER('.3', 0.3);
  NUMBER('+.4', 0.4);
  NUMBER('-.1e2', -10);
  NUMBER('5.', 5);
  NUMBER('+12', 12);
  NUMBER('-13', -13);
  NUMBER('-8.2e-3', -0.0082);
  NUMBER_F('+1.23y4');
  NUMBER('#b1001010', 74);
  NUMBER_F('#b2');
  NUMBER('#o234', 156);
  NUMBER_F('#o678');
  NUMBER('#xabcdef123', 46118400291);
  NUMBER_F('#xabcdefg');
  NUMBER_F('#z12@');
  NUMBER('#z10', 36);
  NUMBER('#z42', 146);
  NUMBER('#z1984', 58612);
  NUMBER('#zztop', 1671433);
}

function testCharLiterals() {
  CHAR_F('#\\noline');
  CHAR('#\\newline', 10);
  CHAR_F('#\\spaec');
  CHAR('#\\space', 32);
  CHAR('#\\(', 40);
  CHAR('#\\A', 65);
  CHAR('#\\x', 120);
  CHAR('#\\u', 117);
  CHAR('#\\x1b', 27);
  CHAR('#\\xfF', 255);
  CHAR_F('#\\xgg');
  CHAR('#\\u03bb', 0x03bb);
}

