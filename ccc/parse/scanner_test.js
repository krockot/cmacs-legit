// The Cmacs Project.

goog.provide('ccc.parse.ScannerTest');
goog.setTestOnly('ccc.parse.ScannerTest');

goog.require('ccc.parse.Scanner');
goog.require('ccc.parse.Token');
goog.require('ccc.parse.TokenType');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var T = ccc.parse.TokenType;

var setUpPage = function() {
  asyncTestCase.stepTimeout = 200;
}

var continueTesting = function() {
  asyncTestCase.continueTesting();
};

var justFail = function(reason) {
  console.error(reason);
  fail(reason);
};

// Expect a specific token with optional details.
var E = function(tokenType, opt_text, opt_line, opt_column) {
  return function(scanner) {
    return scanner.readToken().then(function(token) {
      assertNotNull('Ran out of tokens!', token);
      assertEquals(tokenType, token.type);
      if (goog.isDef(opt_text)) {
        assertEquals(opt_text, token.text);
      }
      if (goog.isDef(opt_line)) {
        assertEquals(opt_line, token.line);
      }
      if (goog.isDef(opt_column)) {
        assertEquals(opt_column, token.column)
      }
      return true;
    });
  };
};

// Expectation of an exception.
var F = function(scanner) {
  return new goog.Promise(function(resolve, reject) {
    scanner.readToken().then(
        reject.bind(null, 'Expected failure, got success.'),
        resolve.bind(null, false));
  });
};

// Simple test utility to feed a string to a Scanner and check expectations.
var S = function(string, expectations) {
  var scanner = new ccc.parse.Scanner();
  scanner.feed(string);
  scanner.setEof();

  return new goog.Promise(function(resolve, reject) {
    var checkExpectations = function(expectations) {
      if (expectations.length == 0) {
        scanner.readToken().then(function(token) {
          assertNull(token);
          resolve(null);
        }, reject);
      } else {
        var expectation = expectations.shift();
        expectation(scanner).then(function(keepChecking) {
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

// Sets up a set of asynchronous scanner tests and joins them together before
// concluding a test.
var RunTests = function(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}

// Actual tests below this line.

function testWhitespace() {
  RunTests([
    S('', [
      ]),
    S(' \n\r\n\r\v\f\t\x85\xa0\u2000\u3000', [
      ]),
  ]);
}

function testLists() {
  RunTests([
    S('(', [
        E(T.OPEN_LIST)]),
    S(')', [
        E(T.CLOSE_FORM)]),
    S('[', [
        E(T.OPEN_LIST)]),
    S(']', [
        E(T.CLOSE_FORM)]),
    S(' ( ) ', [
        E(T.OPEN_LIST),
        E(T.CLOSE_FORM)]),
  ]);
}

function testBooleans() {
  RunTests([
    S('#t #T', [
        E(T.TRUE),
        E(T.TRUE)]),
    S('#f #F', [
        E(T.FALSE),
        E(T.FALSE)]),
  ]);
}

function testUnspecified() {
  RunTests([
    S('#?', [
        E(T.UNSPECIFIED)]),
    S('#?(', [
        E(T.UNSPECIFIED),
        E(T.OPEN_LIST)]),
  ]);
}

function testVector() {
  RunTests([
    S('#( #[', [
        E(T.OPEN_VECTOR),
        E(T.OPEN_VECTOR)]),
    S('#(#(', [
        E(T.OPEN_VECTOR),
        E(T.OPEN_VECTOR)]),
    S('#((', [
        E(T.OPEN_VECTOR),
        E(T.OPEN_LIST)]),
  ]);
}

function testQuotes() {
  RunTests([
    S('\'', [
      E(T.QUOTE)]),
    S('`', [
      E(T.QUASIQUOTE)]),
  ]);
}

function testStrings() {
  RunTests([
    S('"Hello, world!"', [
      E(T.STRING_LITERAL, '"Hello, world!"')]),
    S('"\\"Hello, world!\\""', [
      E(T.STRING_LITERAL, '"\\"Hello, world!\\""')]),
    S('"EOF', [F]),
    S('"Hey\\n"', [
      E(T.STRING_LITERAL, '"Hey\\n"')]),
    S('"test\\x3dhappy"', [
      E(T.STRING_LITERAL, '"test\\x3dhappy"')]),
    S('"test\\x"', [F]),
    S('"test\\x1"', [F]),
    S('"test\\x1g"', [F]),
    S('"test\\ubar', [F]),
    S('"ok\\u1abfok"', [
      E(T.STRING_LITERAL, '"ok\\u1abfok"')]),
    S('"||"', [
      E(T.STRING_LITERAL, '"||"')]),
  ]);
}

function testQuotedSymbols() {
  RunTests([
    S('|a symbol|', [
      E(T.SYMBOL, '|a symbol|')]),
    S('|such eof', [F]),
    S('|\\||', [
      E(T.SYMBOL, '|\\||')]),
    S('|\\xabhey|', [
      E(T.SYMBOL, '|\\xabhey|')]),
    S('|\\xazhey|', [F]),
    S('|\\u1234hey|', [
      E(T.SYMBOL, '|\\u1234hey|')]),
    S('|\\u123whey|', [F]),
    S('|""|', [
      E(T.SYMBOL, '|""|')]),
  ]);
}

function testSymbols() {
  RunTests([
    S('a_symbol', [
      E(T.SYMBOL, 'a_symbol')]),
  ]);
}

function testDelimiters() {
  RunTests([
    S('#t #t(#f)', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 1, 4),
      E(T.OPEN_LIST, '(', 1, 6),
      E(T.FALSE, '#f', 1, 7),
      E(T.CLOSE_FORM, ')', 1, 9)]),
    S('hello"world"', [
      E(T.SYMBOL, 'hello', 1, 1),
      E(T.STRING_LITERAL, '"world"', 1, 6)]),
    S('hello|ccc|', [
      E(T.SYMBOL, 'hello'),
      E(T.SYMBOL, '|ccc|')]),
    S('h[i\n]', [
      E(T.SYMBOL, 'h', 1, 1),
      E(T.OPEN_LIST, '[', 1, 2),
      E(T.SYMBOL, 'i', 1, 3),
      E(T.CLOSE_FORM, ']', 2, 1)]),
    S('#()', [
      E(T.OPEN_VECTOR),
      E(T.CLOSE_FORM)]),
    S("#t'foo", [
      E(T.TRUE),
      E(T.QUOTE),
      E(T.SYMBOL, 'foo')]),
    S('foo,bar', [
      E(T.SYMBOL, 'foo'),
      E(T.UNQUOTE),
      E(T.SYMBOL, 'bar')]),
    S('foo,@bar', [
      E(T.SYMBOL, 'foo'),
      E(T.UNQUOTE_SPLICING),
      E(T.SYMBOL, 'bar')]),
    S('foo;nope', [
      E(T.SYMBOL, 'foo')]),
    S('foo`bar', [
      E(T.SYMBOL, 'foo'),
      E(T.QUASIQUOTE),
      E(T.SYMBOL, 'bar')]),
    S('foo{bar}', [
      E(T.SYMBOL, 'foo'),
      E(T.OPEN_LIST),
      E(T.SYMBOL, 'bar'),
      E(T.CLOSE_FORM)]),
  ]);
}

function testComments() {
  RunTests([
    S('a#;b', [
      E(T.SYMBOL, 'a', 1, 1),
      E(T.OMIT_DATUM, '#;', 1, 2),
      E(T.SYMBOL, 'b', 1, 4)]),
    S('a #;b', [
      E(T.SYMBOL, 'a', 1, 1),
      E(T.OMIT_DATUM, '#;', 1, 3),
      E(T.SYMBOL, 'b', 1, 5)]),
    S('#t;a comment!#f', [
      E(T.TRUE, '#t', 1, 1)]),
    S('#t;a comment!\n#f', [
      E(T.TRUE, '#t', 1, 1),
      E(T.FALSE, '#f', 2, 1)]),
    S('#t;a comment!\r#f', [
      E(T.TRUE, '#t', 1, 1),
      E(T.FALSE, '#f', 2, 1)]),
    S(';a comment', [
    ]),
    S(';a comment\n', [
    ]),
    S(';a comment\n  ok', [
      E(T.SYMBOL, 'ok', 2, 3)]),
  ]);
}

function testLineBreaks() {
  RunTests([
    S('#t\n#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 2, 1)]),
    S('#t\r#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 2, 1)]),
    S('#t\r\n#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 2, 1)]),
    S('#t\n\r#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 3, 1)]),
    S('#t\r\r#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 3, 1)]),
    S('#t\r\n\r#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 3, 1)]),
    S('#t\r\r\n#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 3, 1)]),
    S('#t\v\f\n\r\x85\u2028\u2029#t', [
      E(T.TRUE, '#t', 1, 1),
      E(T.TRUE, '#t', 8, 1)]),
  ]);
}

function testUnquotes() {
  RunTests([
    S(',', [
      E(T.UNQUOTE)]),
    S(',a b', [
      E(T.UNQUOTE),
      E(T.SYMBOL, 'a'),
      E(T.SYMBOL, 'b')]),
    S(',@', [
      E(T.UNQUOTE_SPLICING)]),
    S(',@e', [
      E(T.UNQUOTE_SPLICING),
      E(T.SYMBOL, 'e')]),
  ]);
}

function testDots() {
  RunTests([
    S('.', [
      E(T.DOT)]),
    S('.a', [
   E(T.SYMBOL, '.a')]),
    S('. a', [
      E(T.DOT),
      E(T.SYMBOL, 'a')]),
    S('.9', [
      E(T.NUMERIC_LITERAL, '.9')]),
    S('.0a', [
      E(T.SYMBOL, '.0a')]),
  ]);
}

function testSyntax() {
  RunTests([
    S('#\'', [
      E(T.SYNTAX)]),
    S('#`', [
      E(T.QUASISYNTAX)]),
    S('#,', [
      E(T.UNSYNTAX)]),
    S('#,@', [
      E(T.UNSYNTAX_SPLICING)]),
    S('#,@foo', [
      E(T.UNSYNTAX_SPLICING),
      E(T.SYMBOL, 'foo')]),
  ]);
}

function testSigns() {
  RunTests([
    S('-', [
      E(T.SYMBOL, '-')]),
    S('+', [
      E(T.SYMBOL, '+')]),
    S('-a', [
      E(T.SYMBOL, '-a')]),
    S('+-', [
      E(T.SYMBOL, '+-')]),
    S('-0', [
      E(T.NUMERIC_LITERAL, '-0')]),
    S('+9', [
      E(T.NUMERIC_LITERAL, '+9')]),
    S('-9a', [
      E(T.SYMBOL, '-9a')]),
    S('-+0', [
      E(T.SYMBOL, '-+0')]),
    S('+.', [
      E(T.SYMBOL, '+.')]),
    S('-.3', [
      E(T.NUMERIC_LITERAL, '-.3')]),
    S('-.x', [
      E(T.SYMBOL, '-.x')]),
    S('+.(1)', [
      E(T.SYMBOL, '+.'),
      E(T.OPEN_LIST),
      E(T.NUMERIC_LITERAL, '1'),
      E(T.CLOSE_FORM)]),
  ]);
}

function testDecimalNumbers() {
  RunTests([
    S('1 2', [
      E(T.NUMERIC_LITERAL, '1'),
      E(T.NUMERIC_LITERAL, '2')]),
    S('.1 1.', [
      E(T.NUMERIC_LITERAL, '.1'),
      E(T.NUMERIC_LITERAL, '1.')]),
    S('6.022e23', [
      E(T.NUMERIC_LITERAL, '6.022e23')]),
    S('-1e+10', [
      E(T.NUMERIC_LITERAL, '-1e+10')]),
    S('--1e+10', [
      E(T.SYMBOL, '--1e+10')]),
    S('-1e++10', [
      E(T.SYMBOL, '-1e++10')]),
    S('-1e+10e4', [
      E(T.SYMBOL, '-1e+10e4')]),
    S('-1e+10.3', [
      E(T.SYMBOL, '-1e+10.3')]),
    S('7e(', [
      E(T.SYMBOL, '7e'),
      E(T.OPEN_LIST)]),
  ]);
}

function testNumberBases() {
  RunTests([
    S(' #b101', [
      E(T.NUMERIC_LITERAL, '#b101')]),
    S(' #banana', [F]),
    S('#b102', [F]),
    S('#b-', [F]),
    S('#b-0110', [
      E(T.NUMERIC_LITERAL, '#b-0110')]),
    S('#o12345670', [
      E(T.NUMERIC_LITERAL)]),
    S('#o8', [F]),
    S('#xdeadbeef', [
      E(T.NUMERIC_LITERAL, '#xdeadbeef')]),
    S('#x-deadbeef', [
      E(T.NUMERIC_LITERAL, '#x-deadbeef')]),
    S('#x+deadbeef', [
      E(T.NUMERIC_LITERAL, '#x+deadbeef')]),
    S('#x--deadbeef', [F]),
    S('#z0123465789kjndfiwepsdfjadf', [
      E(T.NUMERIC_LITERAL, '#z0123465789kjndfiwepsdfjadf')]),
    S('#z0123465789kjn^dfiwepsdfjadf', [F]),
  ]);
}

function testCharLiterals() {
  RunTests([
    S('#\\a', [
      E(T.CHAR_LITERAL, '#\\a', 1, 1)]),
    S('#\\b #T', [
      E(T.CHAR_LITERAL, '#\\b', 1, 1),
      E(T.TRUE, '#T', 1, 5)]),
    S('#\\ ', [
      E(T.CHAR_LITERAL, '#\\ ')]),
    S('#\\s', [
      E(T.CHAR_LITERAL, '#\\s')]),
    S('#\\s[', [
      E(T.CHAR_LITERAL, '#\\s'),
      E(T.OPEN_LIST)]),
    S('#\\space', [
      E(T.CHAR_LITERAL, '#\\space')]),
    S('#\\newline', [
      E(T.CHAR_LITERAL, '#\\newline')]),
    S('#\\n', [
      E(T.CHAR_LITERAL, '#\\n')]),
    S('#\\n(', [
      E(T.CHAR_LITERAL, '#\\n'),
      E(T.OPEN_LIST)]),
    S('#\\newlolz', [F]),
    S('#\\newlines', [F]),
    S('#\\shark', [F]),
    S('#\\spaced', [F]),
    S('#\\newline(', [
      E(T.CHAR_LITERAL, '#\\newline'),
      E(T.OPEN_LIST)]),
    S('#\\xa', [F]),
    S('#\\ua', [F]),
    S('#\\x(', [
      E(T.CHAR_LITERAL, '#\\x'),
      E(T.OPEN_LIST)]),
    S('#\\u(', [
      E(T.CHAR_LITERAL, '#\\u'),
      E(T.OPEN_LIST)]),
    S('#\\xff', [
      E(T.CHAR_LITERAL, '#\\xff')]),
    S('#\\xff)', [
      E(T.CHAR_LITERAL, '#\\xff'),
      E(T.CLOSE_FORM)]),
    S('#\\u03bb', [
      E(T.CHAR_LITERAL, '#\\u03bb')]),
    S('#\\u03bb]', [
      E(T.CHAR_LITERAL, '#\\u03bb'),
      E(T.CLOSE_FORM)]),
  ]);
}
