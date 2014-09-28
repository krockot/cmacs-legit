// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.parse.ParserTest');
goog.setTestOnly('ccc.parse.ParserTest');

goog.require('ccc.base.Char');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Number');
goog.require('ccc.base.Object');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.Vector');
goog.require('ccc.base.Pair');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenReader');
goog.require('ccc.parse.TokenType');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var K = ccc.parse.TokenType;
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 200;
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(reason.stack);
  continueTesting();
  fail(reason);
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

// Some additional shortcuts

var NIL = ccc.base.NIL;
var UNSPEC = ccc.base.UNSPECIFIED;
var T = ccc.base.T;
var F = ccc.base.F;

var Symbol_ = function(name) { return new ccc.base.Symbol(name); };
var String_ = function(value) { return new ccc.base.String(value); };
var Number_ = function(value) { return new ccc.base.Number(value); };
var Char_ = function(value) { return new ccc.base.Char(value); };
var Vector_ = function(elements) { return new ccc.base.Vector(elements); };
var Pair_ = function(car, cdr) { return new ccc.base.Pair(car, cdr); };
var List_ = function(elements, opt_tail) {
  var tail = goog.isDef(opt_tail) ? opt_tail : ccc.base.NIL;
  for (var i = elements.length - 1; i >= 0; --i) {
    tail = new ccc.base.Pair(elements[i], tail);
  }
  return tail;
};

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
var E = function(match) {
  return function(parser) {
    return parser.readObject().then(function(object) {
      assertNotNull('Ran out of parsed objects!', object);
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

// Asynchronous test which takes a token list and a set of top-level object
// expectations.
var P = function(tokens, expectations) {
  var reader = new TestTokenReader(tokens);
  var parser = new ccc.parse.Parser(reader);
  asyncTestCase.waitForAsync();
  new goog.Promise(function(resolve, reject) {
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
  }).then(continueTesting, justFail);
};

// Tests below this line

function testSimpleData() {
  P([
    TRUE(),
    FALSE(),
    UNSPECIFIED(),
    STRING_LITERAL("Hello, world!"),
    SYMBOL('hello-world'),
    CHAR_LITERAL(10),
    NUMERIC_LITERAL(-42e3),
  ], [
    E(T),
    E(F),
    E(UNSPEC),
    E(String_('Hello, world!')),
    E(Symbol_('hello-world')),
    E(Char_(10)),
    E(Number_(-42e3))
  ]);
}

function testSimpleVector() {
  P([
    OPEN_VECTOR('('),
    TRUE(),
    FALSE(),
    UNSPECIFIED(),
    NUMERIC_LITERAL(42),
    CLOSE_FORM(')')
  ], [
    E(Vector_([T, F, UNSPEC, Number_(42)]))
  ]);
}

function testNestedVector() {
  P([
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
    E(Vector_([T, F, Vector_([T]), UNSPEC, Number_(42)]))
  ]);
}

function testSimplePair() {
  P([
    OPEN_LIST('('),
    SYMBOL('a'),
    DOT(),
    SYMBOL('b'),
    CLOSE_FORM(')')
  ], [
    E(Pair_(Symbol_('a'), Symbol_('b')))
  ]);
}

function testSimpleList() {
  P([
    OPEN_LIST('('),
    TRUE(),
    FALSE(),
    CLOSE_FORM(')')
  ], [
    E(List_([T, F]))
  ]);
}

function testNestedList() {
  P([
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
    E(List_([T, NIL, List_([F, Number_(7)])]))
  ]);
}

function testDottedTail() {
  P([
    OPEN_LIST('['),
    NUMERIC_LITERAL(1),
    NUMERIC_LITERAL(2),
    DOT(),
    NUMERIC_LITERAL(3),
    CLOSE_FORM(']')
  ], [
    E(List_([Number_(1), Number_(2)], Number_(3)))
  ]);
}

function testMissingClosingBracket() {
  P([OPEN_LIST('['), TRUE()], [FAIL]);
}

function testMissingOpeningBracket() {
  P([TRUE(), CLOSE_FORM(')')], [E(T), FAIL]);
}

function testBracketMismatch() {
  P([OPEN_LIST('['), CLOSE_FORM(')')], [FAIL]);
}

function testNil() {
  P([OPEN_LIST('['), CLOSE_FORM(']')], [E(NIL)]);
}

function testNoDottedTailsInOuterSpace() {
  P([TRUE(), FALSE(), DOT(), TRUE()],
    [E(T), E(F), FAIL]);
}

function testNoDottedTailInVector() {
  P([OPEN_VECTOR('('), TRUE(), FALSE(), DOT(), TRUE(), CLOSE_FORM(')')],
    [FAIL]);
}

function testDottedTailMissingTailElement() {
  P([OPEN_LIST('('), TRUE(), DOT(), CLOSE_FORM(')')],
    [FAIL]);
}

function testDottedTailExtraTailElement() {
  P([OPEN_LIST('('), TRUE(), DOT(), FALSE(), FALSE(), CLOSE_FORM(')')],
    [FAIL]);
}

function testDottedTailRequiresHeadElement() {
  P([OPEN_LIST('('), DOT(), TRUE(), CLOSE_FORM(')')],
    [FAIL]);
}

function testComplexNesting() {
  // This is equivalent to:
  //
  // #t 42 (#\newline 1 #("foo" "bar" baz [#f #t . #{#? []}] #t) 3.14) ()
  P([
    TRUE(),
    NUMERIC_LITERAL(42),
    OPEN_LIST('('),
    CHAR_LITERAL(10),
    NUMERIC_LITERAL(1),
    OPEN_VECTOR('('),
    STRING_LITERAL('foo'),
    STRING_LITERAL('bar'),
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
    E(T),
    E(Number_(42)),
    E(List_([
        Char_(10),
        Number_(1),
        Vector_([
            String_('foo'),
            String_('bar'),
            Symbol_('baz'),
            List_([F, T], Vector_([UNSPEC, NIL])),
            T]),
        Number_(3.14)])),
    E(NIL)
  ]);
}

function testExpressionComment() {
  P([TRUE(), OMIT_DATUM(), FALSE(), TRUE()], [E(T), E(T)]);
}

function testExpressionCommentInList() {
  P([
    OPEN_LIST('('),
    NUMERIC_LITERAL(1),
    STRING_LITERAL('hey'),
    OMIT_DATUM(),
    CHAR_LITERAL(33),
    DOT(),
    SYMBOL('hay'),
    CLOSE_FORM(')')
  ], [
    E(List_([Number_(1), String_('hey')], Symbol_('hay')))
  ]);
}

function testExpressionCommentInVector() {
  P([
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
    E(Vector_([Symbol_('a'), Symbol_('e')]))
  ]);
}

function testDoubleExpressionComment() {
  // The list (a #; #; c d #; e f) should become (a f).
  P([
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
    E(List_([Symbol_('a'), Symbol_('f')]))
  ])
}

function testNoExpressionCommentAtEndOfList() {
  P([
    OPEN_LIST('('),
    SYMBOL('a'),
    OMIT_DATUM(),
    CLOSE_FORM(')'),
  ], [
    FAIL
  ])
}

function testNoExpressionCommentBeforeDot() {
  P([
    OPEN_LIST('('),
    SYMBOL('a'),
    SYMBOL('b'),
    OMIT_DATUM(),
    DOT(),
    SYMBOL('c'),
    CLOSE_FORM(')'),
  ], [
    FAIL
  ]);
}

function testNoExpressionCommentBeforeDottedTail() {
  P([
    OPEN_LIST('('),
    SYMBOL('a'),
    SYMBOL('b'),
    DOT(),
    OMIT_DATUM(),
    SYMBOL('c'),
    CLOSE_FORM(')')
  ], [
    FAIL
  ]);
}

function testNoExpressionCommentAtEndOfVector() {
  P([
    OPEN_VECTOR('['),
    SYMBOL('a'),
    OMIT_DATUM(),
    CLOSE_FORM(']')
  ], [
    FAIL
  ]);
}
