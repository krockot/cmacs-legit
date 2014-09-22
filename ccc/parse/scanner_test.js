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

var E = function(tokenType, opt_text, opt_line, opt_column) {
  return function(token) {
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
  }
};

var scannerTest = function(string, expectations) {
  var scanner = new ccc.parse.Scanner(string);
  expectations.forEach(function(expectation) {
    var token = scanner.getNextToken();
    assertNotNull(token);
    expectation(token);
  });
  assertNull(scanner.getNextToken());
};

var M = function(name, string, expectations) {
  window['test' + name] = function() {
    scannerTest(string, expectations);
  };
};


// Actual tests below this line.

M('EmptyProgram', '', []);

