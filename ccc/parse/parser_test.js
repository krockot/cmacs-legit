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
  console.error(reason);
  fail(reason);
}

// Simplified token constructors for test setup.

var OPEN_LIST = function(bracket) {
  return new ccc.parse.Token(K.OPEN_LIST, bracket, 1, 1);
};
var CLOSE_FORM = function(bracket) {
  return new ccc.parse.Token(K.CLOSE_LIST, bracket, 1, 1);
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

function testBasicObjects() {
  P([
    TRUE(),
    FALSE(),
    UNSPECIFIED(),
    STRING_LITERAL("Hello, world!"),
    SYMBOL('hello-world'),
    CHAR_LITERAL(10),
    NUMERIC_LITERAL(-42e3)
  ], [
    E(T),
    E(F),
    E(UNSPEC),
    E(new ccc.base.String('Hello, world!')),
    E(new ccc.base.Symbol('hello-world')),
    E(new ccc.base.Char(10)),
    E(new ccc.base.Number(-42e3))
  ]);
}
