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

function testSimpleTokens() {
  S('', [
    ]);
  S(' \n\r\n\r\v\f\t\x85\xa0\u2000\u3000', [
    ]);
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
  S('#t #T', [
    E(T.TRUE),
    E(T.TRUE)]);
  S('#f #F', [
    E(T.FALSE),
    E(T.FALSE)]);
  S('#?', [
    E(T.UNSPECIFIED)]);
  S('#( #[', [
    E(T.OPEN_VECTOR),
    E(T.OPEN_VECTOR)]);
  S('\'', [
    E(T.QUOTE)]);
  S('`', [
    E(T.QUASIQUOTE)]);
  S('"Hello, world!"', [
    E(T.STRING_LITERAL, '"Hello, world!"')]);
  S('a_symbol', [
    E(T.SYMBOL, 'a_symbol')]);
  S('|a symbol|', [
    E(T.QUOTED_SYMBOL, '|a symbol|')]);
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
