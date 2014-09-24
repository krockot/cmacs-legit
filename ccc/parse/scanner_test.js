// The Cmacs Project.
// Copyright forever, the universe.

goog.require('ccc.parse.Scanner')
goog.require('ccc.parse.Token')
goog.require('ccc.parse.TokenType')
goog.require('goog.testing.jsunit')


var T;

var setUp = function() {
  T = ccc.parse.TokenType;
}

// Expect a specific token with optional details.
var E = function(tokenType, opt_text, opt_line, opt_column) {
  return function(scanner) {
    var token = scanner.getNextToken();
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
  }
};

// Expectation of an exception.
var F = function(scanner) {
  try {
    scanner.getNextToken();
  } catch (e) {
    return false;
  }
  throw new Error('Expected failure, got success.');
};

var S = function(string, expectations) {
  var scanner = new ccc.parse.Scanner(string);
  var shouldTestForNull = true;
  expectations.forEach(function(checkExpectation) {
    shouldTestForNull = checkExpectation(scanner);
  });
  if (shouldTestForNull) {
    assertNull(scanner.getNextToken());
  }
};

// Actual tests below this line.

function testWhitespace() {
  S('', [
    ]);
  S(' \n\r\n\r\v\f\t\x85\xa0\u2000\u3000', [
    ]);
}

function testLists() {
  S('(', [
    E(T.OPEN_LIST)]);
  S(')', [
    E(T.CLOSE_FORM)]);
  S('[', [
    E(T.OPEN_LIST)]);
  S(']', [
    E(T.CLOSE_FORM)]);
  S(' ( ) ', [
    E(T.OPEN_LIST),
    E(T.CLOSE_FORM)]);
}

function testBooleans() {
  S('#t #T', [
    E(T.TRUE),
    E(T.TRUE)]);
  S('#f #F', [
    E(T.FALSE),
    E(T.FALSE)]);
}

function testUnspecified() {
  S('#?', [
    E(T.UNSPECIFIED)]);
}

function testVector() {
  S('#( #[', [
    E(T.OPEN_VECTOR),
    E(T.OPEN_VECTOR)]);
}

function testQuotes() {
  S('\'', [
    E(T.QUOTE)]);
  S('`', [
    E(T.QUASIQUOTE)]);
}

function testStrings() {
  S('"Hello, world!"', [
    E(T.STRING_LITERAL, '"Hello, world!"')]);
}

function testQuotedSymbols() {
  S('|a symbol|', [
    E(T.QUOTED_SYMBOL, '|a symbol|')]);
}

function testSymbols() {
  S('a_symbol', [
    E(T.SYMBOL, 'a_symbol')]);
}

function testDelimiters() {
  S('#t #t(#f)', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 1, 4),
    E(T.OPEN_LIST, '(', 1, 6),
    E(T.FALSE, '#f', 1, 7),
    E(T.CLOSE_FORM, ')', 1, 9)]);
  S('hello"world"', [
    E(T.SYMBOL, 'hello', 1, 1),
    E(T.STRING_LITERAL, '"world"', 1, 6)]);
  S('hello|ccc|', [
    E(T.SYMBOL, 'hello'),
    E(T.QUOTED_SYMBOL, '|ccc|')]);
  S('h[i\n]', [
    E(T.SYMBOL, 'h', 1, 1),
    E(T.OPEN_LIST, '[', 1, 2),
    E(T.SYMBOL, 'i', 1, 3),
    E(T.CLOSE_FORM, ']', 2, 1)])
  S('#()', [
    E(T.OPEN_VECTOR),
    E(T.CLOSE_FORM)]);
  S("#t'foo", [
    E(T.TRUE),
    E(T.QUOTE),
    E(T.SYMBOL, 'foo')]);
}

function testComments() {
  S('a#;b', [
    E(T.SYMBOL, 'a#', 1, 1)]);
  S('a #;b', [
    E(T.SYMBOL, 'a', 1, 1),
    E(T.OMIT_DATUM, '#;', 1, 3),
    E(T.SYMBOL, 'b', 1, 5)]);
  S('#t;a comment!#f', [
    E(T.TRUE, '#t', 1, 1)]);
  S('#t;a comment!\n#f', [
    E(T.TRUE, '#t', 1, 1),
    E(T.FALSE, '#f', 2, 1)]);
  S('#t;a comment!\r#f', [
    E(T.TRUE, '#t', 1, 1),
    E(T.FALSE, '#f', 2, 1)]);
  S(';a comment', [
    ]);
  S(';a comment\n', [
    ]);
  S(';a comment\n  ok', [
    E(T.SYMBOL, 'ok', 2, 3)]);
}

function testLineBreaks() {
  S('#t\n#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 2, 1)]);
  S('#t\r#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 2, 1)]);
  S('#t\r\n#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 2, 1)]);
  S('#t\n\r#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 3, 1)]);
  S('#t\r\r#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 3, 1)]);
  S('#t\r\n\r#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 3, 1)]);
  S('#t\r\r\n#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 3, 1)]);
  S('#t\v\f\n\r\x85\u2028\u2029#t', [
    E(T.TRUE, '#t', 1, 1),
    E(T.TRUE, '#t', 8, 1)])
}

function testUnquotes() {
  S(',', [
    E(T.UNQUOTE)]);
  S(',a b', [
    E(T.UNQUOTE),
    E(T.SYMBOL, 'a'),
    E(T.SYMBOL, 'b')]);
  S(',@', [
    E(T.UNQUOTE_SPLICING)]);
  S(',@e', [
    E(T.UNQUOTE_SPLICING),
    E(T.SYMBOL, 'e')]);
}

function testDots() {
  S('.', [
    E(T.DOT)]);
  S('.a', [
   E(T.SYMBOL, '.a')]);
  S('. a', [
    E(T.DOT),
    E(T.SYMBOL, 'a')]);
  S('.9', [
    E(T.NUMERIC_LITERAL, '.9')]);
  S('.0a', [
    E(T.SYMBOL, '.0a')]);
}

function testSigns() {
  S('-', [
    E(T.SYMBOL, '-')]);
  S('+', [
    E(T.SYMBOL, '+')]);
  S('-a', [
    E(T.SYMBOL, '-a')]);
  S('+-', [
    E(T.SYMBOL, '+-')]);
  S('-0', [
    E(T.NUMERIC_LITERAL, '-0')]);
  S('+9', [
    E(T.NUMERIC_LITERAL, '+9')]);
  S('-9a', [
    E(T.SYMBOL, '-9a')]);
  S('-+0', [
    E(T.SYMBOL, '-+0')]);
  S('+.', [
    E(T.SYMBOL, '+.')]);
  S('-.3', [
    E(T.NUMERIC_LITERAL, '-.3')]);
  S('-.x', [
    E(T.SYMBOL, '-.x')]);
  S('+.(1)', [
    E(T.SYMBOL, '+.'),
    E(T.OPEN_LIST),
    E(T.NUMERIC_LITERAL, '1'),
    E(T.CLOSE_FORM)]);
}

function testDecimalNumbers() {
  S('1 2', [
    E(T.NUMERIC_LITERAL, '1'),
    E(T.NUMERIC_LITERAL, '2')]);
  S('.1 1.', [
    E(T.NUMERIC_LITERAL, '.1'),
    E(T.NUMERIC_LITERAL, '1.')]);
  S('6.022e23', [
    E(T.NUMERIC_LITERAL, '6.022e23')]);
  S('-1e+10', [
    E(T.NUMERIC_LITERAL, '-1e+10')]);
  S('--1e+10', [
    E(T.SYMBOL, '--1e+10')]);
  S('-1e++10', [
    E(T.SYMBOL, '-1e++10')]);
  S('-1e+10e4', [
    E(T.SYMBOL, '-1e+10e4')]);
  S('-1e+10.3', [
    E(T.SYMBOL, '-1e+10.3')]);
  S('7e(', [
    E(T.SYMBOL, '7e'),
    E(T.OPEN_LIST)]);
}

function testNumberBases() {
  S(' #b101', [
    E(T.NUMERIC_LITERAL, '#b101')]);
  S(' #banana', [
    F]);
  S('#b102', [
    F]);
  S('#b-', [
    F]);
  S('#b-0110', [
    E(T.NUMERIC_LITERAL, '#b-0110')]);
  S('#o12345670', [
    E(T.NUMERIC_LITERAL)]);
  S('#o8', [
    F]);
  S('#xdeadbeef', [
    E(T.NUMERIC_LITERAL, '#xdeadbeef')]);
  S('#x-deadbeef', [
    E(T.NUMERIC_LITERAL, '#x-deadbeef')]);
  S('#x+deadbeef', [
    E(T.NUMERIC_LITERAL, '#x+deadbeef')]);
  S('#x--deadbeef', [
    F]);
}
