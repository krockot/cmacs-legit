// The Cmacs Project.

goog.provide('ccc.parse.ParserTest');
goog.setTestOnly('ccc.parse.ParserTest');

goog.require('ccc.base');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenReader');
goog.require('ccc.parse.TokenType');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var K = ccc.parse.TokenType;
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(goog.isDef(reason) && goog.isDef(reason.stack)
      ? reason.stack : reason);
  setTimeout(goog.partial(fail, reason), 0);
}

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
    return goog.Promise.resolve(null);
  return goog.Promise.resolve(this.tokens_.shift());
};

// Expect a specific object to match under equality (Object.equal).
var E = function(matchSpec) {
  return function(parser) {
    return parser.readObject().then(function(object) {
      assertNotNull('Ran out of parsed objects!', object);
      var match = ccc.base.build(matchSpec);
      if (!object.equal(match)) {
        fail('Object mismatch:\n' +
             '  Expected: ' + match.toString() +
             '\n  Actual: ' + object.toString() + '\n');
      }
      return true;
    });
  };
};

// Expect failure on readObject.
var FAIL = function(parser) {
  return new goog.Promise(function(resolve, reject) {
    parser.readObject().then(
        reject.bind(null, 'Expected failure, got success.'),
        resolve.bind(null, false));
  });
};

// Single asynchronous test which takes a token list and a set of top-level
// object expectations.
var S = function(tokens, expectations) {
  var reader = new TestTokenReader(tokens);
  var parser = new ccc.parse.Parser(reader);
  return new goog.Promise(function(resolve, reject) {
    var checkExpectations = function(expectations) {
      if (expectations.length == 0) {
        parser.readObject().then(function(object) {
          assertNull(object);
          resolve(null);
        }, reject);
      } else {
        var expectation = expectations.shift();
        expectation(parser).then(function(keepChecking) {
          if (keepChecking)
            checkExpectations(expectations);
          else
            resolve(null);
        }, reject);
      }
    };
    checkExpectations(expectations);
  });
};

var RunSingleTest = function(test) {
  asyncTestCase.waitForAsync();
  test.then(continueTesting, justFail);
};

var RunTests = function(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
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
    E(undefined),
    E({ 'str': 'Hello, world!' }),
    E('hello-world'),
    E({ 'chr': 10 }),
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
    E({ 'vec': [true, false, undefined, 42] }),
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
    E({ 'vec': [true, false, { 'vec': [true] }, undefined, 42] }),
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
    E({ 'pair': ['a', 'b'] }),
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
    E({ 'list': [1, 2], 'tail': 3 }),
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
    E([{ 'chr': 10 }, 1, { 'vec': [
        { 'str': 'foo' }, 'bar', 'baz',
        { 'list': [false, true], 'tail': { 'vec': [undefined, []] } },
        true] }, 3.14]),
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
    E({ 'list': [1, { 'str': 'hey' }], 'tail': 'hay' }),
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
    E({ 'vec': ['a', 'e'] }),
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
    S([CHAR_LITERAL(65)], [E({ 'chr': 65 })]),
    S([SYMBOL('foo')], [E('foo')]),
    S([STRING_LITERAL('hello')], [E({ 'str': 'hello' })]),
    S([DOT()], [FAIL]),
    S([OMIT_DATUM()], [FAIL]),
    S([TRUE()], [E(true)]),
    S([FALSE()], [E(false)]),
    S([UNSPECIFIED()], [E(undefined)]),
    S([OPEN_LIST('('), OPEN_LIST('['), SYMBOL('a')], [FAIL])
  ]);
}
