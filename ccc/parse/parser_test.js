// The Cmacs Project.

goog.provide('ccc.parse.ParserTest');
goog.setTestOnly('ccc.parse.ParserTest');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenReader');
goog.require('ccc.parse.TokenType');
goog.require('goog.array');
goog.require('goog.testing.jsunit');

var K = ccc.parse.TokenType;

// Simplified token constructors for test setup.

var OPEN_LIST = function(bracket) {
  return new ccc.parse.Token(K.OPEN_LIST, bracket, 1, 1);
};
var CLOSE_FORM = function(bracket) {
  return new ccc.parse.Token(K.CLOSE_FORM, bracket, 1, 1);
};
var QUOTE = function() { return new ccc.parse.Token(K.QUOTE, '\'', 1, 1); };
var UNQUOTE = function() { return new ccc.parse.Token(K.UNQUOTE, ',', 1, 1); };
var UNQUOTE_SPLICING = function() {
  return new ccc.parse.Token(K.UNQUOTE_SPLICING, ',@', 1, 1);
};
var QUASIQUOTE = function() {
  return new ccc.parse.Token(K.QUASIQUOTE, '`', 1, 1);
};
var OMIT_DATUM = function() {
  return new ccc.parse.Token(K.OMIT_DATUM, '#;', 1, 1);
};
var TRUE = function() { return new ccc.parse.Token(K.TRUE, '#t', 1, 1); };
var FALSE = function() { return new ccc.parse.Token(K.FALSE, '#f', 1, 1); };
var UNSPECIFIED = function() {
  return new ccc.parse.Token(K.UNSPECIFIED, '#?', 1, 1);
};
var OPEN_VECTOR = function(bracket) {
  return new ccc.parse.Token(K.OPEN_VECTOR, '#' + bracket, 1, 1);
};
var SYMBOL = function(name) {
  return new ccc.parse.Token(K.SYMBOL, name, 1, 1);
};
var CHAR_LITERAL = function(value) {
  return new ccc.parse.Token(K.CHAR_LITERAL,
      '#\\' + String.fromCharCode(value), 1, 1);
};
var STRING_LITERAL = function(value) {
  return new ccc.parse.Token(K.STRING_LITERAL, '"' + value + '"', 1, 1);
};
var NUMERIC_LITERAL = function(value) {
  return new ccc.parse.Token(K.NUMERIC_LITERAL, value.toString(), 1, 1);
};
var DOT = function() { return new ccc.parse.Token(K.DOT, '.', 1, 1); };

// Test framework for the parser tests

/** @implements {ccc.parse.TokenReader} */
var TestTokenReader = function(tokens) {
  this.tokens_ = tokens;
};

/** @override */
TestTokenReader.prototype.readToken = function() {
  if (this.tokens_.length == 0)
    return null;
  return this.tokens_.shift();
};

// Expect a specific object to match under equality (Object.equal).
var E = function(matchSpec) {
  return function(parser) {
    var data;
    while (!goog.isDef(data))
      data = parser.read();
    if (ccc.isError(data))
      fail(data);
    assertNotNull('Ran out of parsed objects!', data);
    var match = ccc.core.build(matchSpec);
    if (!ccc.equal(data, match)) {
      fail('Object mismatch:\n' +
           '  Expected: ' + ccc.core.stringify(match) +
           '\n  Actual: ' + ccc.core.stringify(data) + '\n');
    }
  };
};

// Expect failure on read.
var FAIL = function(parser) {
  var data;
  while (!goog.isDef(data))
    data = parser.read();
  if (!ccc.isError(data))
    fail('Expected failure, got success.');
};

// Single test which takes a token list and a set of top-level object
// expectations.
var S = function(tokens, expectations) {
  var reader = new TestTokenReader(tokens);
  var parser = new ccc.parse.Parser(reader);
  goog.array.forEach(expectations, function(expectSomeThings) {
    expectSomeThings(parser);
  });
};

var RunSingleTest = function(test) {
};

var RunTests = function(tests) {
};

// Tests below this line

function testSimpleData() {
  RunSingleTest(S([
    TRUE(),
    FALSE(),
    UNSPECIFIED(),
    STRING_LITERAL("Hello, world!"),
    SYMBOL('hello-world'),
    CHAR_LITERAL(10),
    NUMERIC_LITERAL(-42e3),
  ], [
    E(true),
    E(false),
    E(ccc.UNSPECIFIED),
    E(new String('Hello, world!')),
    E('hello-world'),
    E(new ccc.Char(10)),
    E(-42e3),
  ]));
}

function testSimpleVector() {
  RunSingleTest(S([
    OPEN_VECTOR('('),
    TRUE(),
    FALSE(),
    UNSPECIFIED(),
    NUMERIC_LITERAL(42),
    CLOSE_FORM(')')
  ], [
    E(new ccc.Vector([true, false, ccc.UNSPECIFIED, 42])),
  ]));
}

function testNestedVector() {
  RunSingleTest(S([
    OPEN_VECTOR('('),
    TRUE(),
    FALSE(),
    OPEN_VECTOR('['),
    TRUE(),
    CLOSE_FORM(']'),
    UNSPECIFIED(),
    NUMERIC_LITERAL(42),
    CLOSE_FORM(')')
  ], [
    E(new ccc.Vector(
        [true, false, new ccc.Vector([true]), ccc.UNSPECIFIED, 42])),
  ]));
}

function testSimplePair() {
  RunSingleTest(S([
    OPEN_LIST('('),
    SYMBOL('a'),
    DOT(),
    SYMBOL('b'),
    CLOSE_FORM(')')
  ], [
    E(new ccc.Pair('a', 'b')),
  ]));
}

function testSimpleList() {
  RunSingleTest(S([
    OPEN_LIST('('),
    TRUE(),
    FALSE(),
    CLOSE_FORM(')')
  ], [
    E([true, false]),
  ]));
}

function testNestedList() {
  RunSingleTest(S([
    OPEN_LIST('('),
    TRUE(),
    OPEN_LIST('('),
    CLOSE_FORM(')'),
    OPEN_LIST('['),
    FALSE(),
    NUMERIC_LITERAL('7'),
    CLOSE_FORM(']'),
    CLOSE_FORM(')')
  ], [
    E([true, [], [false, 7]]),
  ]));
}

function testDottedTail() {
  RunSingleTest(S([
    OPEN_LIST('['),
    NUMERIC_LITERAL(1),
    NUMERIC_LITERAL(2),
    DOT(),
    NUMERIC_LITERAL(3),
    CLOSE_FORM(']')
  ], [
    E(ccc.Pair.makeList([1, 2], 3)),
  ]));
}

function testMissingClosingBracket() {
  RunSingleTest(S([OPEN_LIST('['), TRUE()], [FAIL]));
}

function testMissingOpeningBracket() {
  RunSingleTest(S([TRUE(), CLOSE_FORM(')')], [E(true), FAIL]));
}

function testBracketMismatch() {
  RunSingleTest(S([OPEN_LIST('['), CLOSE_FORM(')')], [FAIL]));
}

function testNil() {
  RunSingleTest(S([OPEN_LIST('['), CLOSE_FORM(']')], [E([])]));
}

function testNoDottedTailsInOuterSpace() {
  RunSingleTest(S([TRUE(), FALSE(), DOT(), TRUE()],
    [E(true), E(false), FAIL]));
}

function testNoDottedTailInVector() {
  RunSingleTest(S(
    [OPEN_VECTOR('('), TRUE(), FALSE(), DOT(), TRUE(), CLOSE_FORM(')')],
    [FAIL]));
}

function testDottedTailMissingTailElement() {
  RunSingleTest(S([OPEN_LIST('('), TRUE(), DOT(), CLOSE_FORM(')')],
    [FAIL]));
}

function testDottedTailExtraTailElement() {
  RunSingleTest(S(
    [OPEN_LIST('('), TRUE(), DOT(), FALSE(), FALSE(), CLOSE_FORM(')')],
    [FAIL]));
}

function testDottedTailRequiresHeadElement() {
  RunSingleTest(S([OPEN_LIST('('), DOT(), TRUE(), CLOSE_FORM(')')],
    [FAIL]));
}

function testComplexNesting() {
  // This is equivalent to:
  //
  // #t 42 (#\newline 1 #("foo" "bar" baz [#f #t . #{#? []}] #t) 3.14) ()
  RunSingleTest(S([
    TRUE(),
    NUMERIC_LITERAL(42),
    OPEN_LIST('('),
    CHAR_LITERAL(10),
    NUMERIC_LITERAL(1),
    OPEN_VECTOR('('),
    STRING_LITERAL('foo'),
    SYMBOL('bar'),
    SYMBOL('baz'),
    OPEN_LIST('['),
    FALSE(),
    TRUE(),
    DOT(),
    OPEN_VECTOR('{'),
    UNSPECIFIED(),
    OPEN_LIST('['),
    CLOSE_FORM(']'),
    CLOSE_FORM('}'),
    CLOSE_FORM(']'),
    TRUE(),
    CLOSE_FORM(')'),
    NUMERIC_LITERAL(3.14),
    CLOSE_FORM(')'),
    OPEN_LIST('{'),
    CLOSE_FORM('}')
  ], [
    E(true),
    E(42),
    E([new ccc.Char(10), 1, new ccc.Vector([
        new String('foo'), 'bar', 'baz',
        ccc.Pair.makeList([false, true], new ccc.Vector([ccc.UNSPECIFIED, []])),
        true]), 3.14]),
    E([])
  ]));
}

function testExpressionComment() {
  RunSingleTest(S([TRUE(), OMIT_DATUM(), FALSE(), TRUE()], [E(true), E(true)]));
}

function testExpressionCommentInList() {
  RunSingleTest(S([
    OPEN_LIST('('),
    NUMERIC_LITERAL(1),
    STRING_LITERAL('hey'),
    OMIT_DATUM(),
    CHAR_LITERAL(33),
    DOT(),
    SYMBOL('hay'),
    CLOSE_FORM(')')
  ], [
    E(ccc.Pair.makeList([1, new String('hey')], 'hay')),
  ]));
}

function testExpressionCommentInVector() {
  RunSingleTest(S([
    OPEN_VECTOR('('),
    SYMBOL('a'),
    OMIT_DATUM(),
    OPEN_LIST('['),
    SYMBOL('b'),
    SYMBOL('c'),
    DOT(),
    SYMBOL('d'),
    CLOSE_FORM(']'),
    SYMBOL('e'),
    CLOSE_FORM(')')
  ], [
    E(new ccc.Vector(['a', 'e'])),
  ]));
}

function testDoubleExpressionComment() {
  // The list (a #; #; c d #; e f) should become (a f).
  RunSingleTest(S([
    OPEN_LIST('('),
    SYMBOL('a'),
    OMIT_DATUM(),
    OMIT_DATUM(),
    SYMBOL('c'),
    SYMBOL('d'),
    OMIT_DATUM(),
    SYMBOL('e'),
    SYMBOL('f'),
    CLOSE_FORM(')')
  ], [
    E(['a', 'f']),
  ]));
}

function testNoExpressionCommentAtEndOfList() {
  RunSingleTest(S([
    OPEN_LIST('('),
    SYMBOL('a'),
    OMIT_DATUM(),
    CLOSE_FORM(')'),
  ], [
    FAIL
  ]));
}

function testNoExpressionCommentBeforeDot() {
  RunSingleTest(S([
    OPEN_LIST('('),
    SYMBOL('a'),
    SYMBOL('b'),
    OMIT_DATUM(),
    DOT(),
    SYMBOL('c'),
    CLOSE_FORM(')'),
  ], [
    FAIL
  ]));
}

function testNoExpressionCommentBeforeDottedTail() {
  RunSingleTest(S([
    OPEN_LIST('('),
    SYMBOL('a'),
    SYMBOL('b'),
    DOT(),
    OMIT_DATUM(),
    SYMBOL('c'),
    CLOSE_FORM(')')
  ], [
    FAIL
  ]));
}

function testNoExpressionCommentAtEndOfVector() {
  RunSingleTest(S([
    OPEN_VECTOR('['),
    SYMBOL('a'),
    OMIT_DATUM(),
    CLOSE_FORM(']')
  ], [
    FAIL
  ]));
}

function testNoExpressionCommentAtEof() {
  RunSingleTest(S([
    OMIT_DATUM()
  ], [
    FAIL
  ]));
}

function testQuote() {
  RunSingleTest(S([
    QUOTE(),
    SYMBOL('a')
  ], [
    E(['quote', 'a']),
  ]));
}

function testListQuote() {
  RunSingleTest(S([
    TRUE(),
    QUOTE(),
    OPEN_LIST('('),
    SYMBOL('a'),
    SYMBOL('b'),
    QUOTE(),
    SYMBOL('c'),
    CLOSE_FORM(')'),
    FALSE()
  ], [
    E(true),
    E(['quote', ['a', 'b', ['quote', 'c']]]),
    E(false)
  ]));
}

function testNestedQuotes() {
  RunSingleTest(S([
    QUOTE(),
    QUOTE(),
    QUOTE(),
    SYMBOL('a')
  ], [
    E(['quote', ['quote', ['quote', 'a']]]),
  ]));
}

function testUnquote() {
  RunSingleTest(S([UNQUOTE(), SYMBOL('a')],
    [E(['unquote', 'a'])]));
}

function testUnquoteSplicing() {
  RunSingleTest(S([UNQUOTE_SPLICING(), SYMBOL('a')],
    [E(['unquote-splicing', 'a'])]));
}

function testQuasiquote() {
  RunSingleTest(S([QUASIQUOTE(), SYMBOL('a')],
    [E(['quasiquote', 'a'])]));
}

function testNoQuoteAtEof() {
  RunSingleTest(S([SYMBOL('a'), QUOTE()], [E('a'), FAIL]));
}

function testNoQuoteAtEndOfList() {
  RunSingleTest(S([OPEN_LIST('('), SYMBOL('a'), QUOTE(), CLOSE_FORM(')')],
    [FAIL]));
}

function testNoQuoteAtEndOfVector() {
  RunSingleTest(S([OPEN_VECTOR('('), SYMBOL('a'), QUOTE(), CLOSE_FORM(')')],
    [FAIL]));
}

function testNoQuoteBeforeDot() {
  RunSingleTest(S([OPEN_LIST('('), SYMBOL('a'), QUOTE(), DOT(), SYMBOL('b')],
    [FAIL]));
}

function testNoQuoteBeforeDottedTail() {
  RunSingleTest(S([OPEN_LIST('('), SYMBOL('a'), DOT(), QUOTE(), SYMBOL('b')],
    [FAIL]));
}

function testEofCases() {
  RunTests([
    S([OPEN_LIST('(')], [FAIL]),
    S([OPEN_VECTOR('[')], [FAIL]),
    S([QUOTE()], [FAIL]),
    S([QUASIQUOTE()], [FAIL]),
    S([UNQUOTE()], [FAIL]),
    S([UNQUOTE_SPLICING()], [FAIL]),
    S([CLOSE_FORM('}')], [FAIL]),
    S([NUMERIC_LITERAL(1)], [E(1)]),
    S([CHAR_LITERAL(65)], [E(new ccc.Char(65))]),
    S([SYMBOL('foo')], [E('foo')]),
    S([STRING_LITERAL('hello')], [E(new String('hello'))]),
    S([DOT()], [FAIL]),
    S([OMIT_DATUM()], [FAIL]),
    S([TRUE()], [E(true)]),
    S([FALSE()], [E(false)]),
    S([UNSPECIFIED()], [E(ccc.UNSPECIFIED)]),
    S([OPEN_LIST('('), OPEN_LIST('['), SYMBOL('a')], [FAIL])
  ]);
}
