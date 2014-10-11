// The Cmacs Project.

goog.provide('ccc.syntax.PatternTest');
goog.setTestOnly('ccc.syntax.PatternTest');

goog.require('ccc.base');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('ccc.syntax.Pattern');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 100;
  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  continueTesting();
  console.error(goog.isDef(reason.stack) ? reason.stack : reason);
  fail(reason);
}

function readObject(code) {
  var scanner = new ccc.parse.Scanner();
  scanner.feed(code);
  scanner.setEof();
  var parser = new ccc.parse.Parser(scanner);
  return parser.readObject();
};

function T(pattern, literals, input, opt_expectedMatches) {
  return readObject(pattern).then(function(pattern) {
    return readObject(input).then(function(input) {
      var literalSet = goog.object.createSet(literals);
      pattern = new ccc.syntax.Pattern(literalSet, pattern);
      var match = pattern.match(input);
      if (!match.success)
        return goog.Promise.reject(new Error('Pattern match failed.'));
      if (!goog.isDef(opt_expectedMatches))
        return null;
      var vars = goog.object.getKeys(match.captures);
      for (var i = 0; i < vars.length; ++i) {
        if (!goog.object.containsKey(opt_expectedMatches, vars[i]))
          return goog.Promise.reject(new Error(
              'Matched unexpected pattern variable: ' + vars[i]));
      }
      var expectedMatches = [];
      var expectedVars = goog.object.getKeys(opt_expectedMatches);
      for (var i = 0; i < expectedVars.length; ++i) {
        if (!goog.object.containsKey(match.captures, expectedVars[i]))
          return goog.Promise.reject(new Error(
              'Missing expected pattern variable: ' + expectedVars[i]));
        expectedMatches.push(readObject(
            opt_expectedMatches[expectedVars[i]]).then(function(key, expected) {
          if (!match.captures[key].equal(expected)) {
            return goog.Promise.reject(new Error(
                'Capture mismatch for variable: ' + key +
                '\nExpected: ' + expected.toString() +
                '\n Actual: ' + match.captures[key].toString() + '\n'));
          }
        }.bind(null, expectedVars[i])));
      }
      return goog.Promise.all(expectedMatches);
    });
  });
}

function F(pattern, literals, input) {
  return T(pattern, literals, input).then(
      goog.partial(justFail, new Error('Expected failure, got success')),
      function() {});
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}


function testSimplePatterns() {
  RunTests([
    T('(a)', [], '(42)', { 'a': '42' }),
    T('(a b)', [], '(42 43)', { 'a': '42', 'b': '43' }),
    T('(a #t (b c))', [], '(1 #t (2 3))', { 'a': '1', 'b': '2', 'c': '3' }),
    F('(a)', [], '()'),
    F('(a b)', [], '(1 2 3)'),
  ]);
}

function testLiterals() {
  RunTests([
    T('(a $$ b)', ['$$'], '(1 $$ 2)', { 'a': '1', 'b': '2' }),
    T('(a ! b @ c)', ['!', '@'], '[1 ! 2 @ 3]',
        { 'a': '1', 'b': '2', 'c': '3' }),
  ]);
}

function testSimpleRepetition() {
  RunTests([
    T('(a ...)', [],
      '(1 2 3 4)',
      {
        'a': '(1 2 3 4)'
      }),
    T('(a b ...)', [],
      '(1 2 3 4)',
      {
        'a': '1',
        'b': '(2 3 4)'
      }),
    T('(a (b c) ...)', [],
      '(1 (2 3) (4 5) (6 7) (8 9))',
      {
        'a': '1',
        'b': '(2 4 6 8)',
        'c': '(3 5 7 9)',
      }),
    F('(a ... b)', [], '(1 2 3)'),
    F('(a (b c) ...)', [],
      '(1 2 3 4)'),
  ]);
}

function testNestedRepetition() {
  RunTests([
    T('((a b ...) ...)', [],
      '((1 2 3 4) (a b c d) (! @ $ %))',
      {
        'a': '(1 a !)',
        'b': '((2 3 4) (b c d) (@ $ %))'
      }),
    T('((a (b c ...) ...) ...)', [],
      '((1 (2 3 4 5) (6 7 8)) (a (b c d e) (f g)) (! ($ $ $)))',
      {
        'a': '(1 a !)',
        'b': '((2 6) (b f) ($))',
        'c': '(((3 4 5) (7 8)) ((c d e) (g)) (($ $)))',
      }),
  ]);
}

function testVector() {
  RunTests([
    T('(#(a b c))', [],
      '(#(1 2 3))',
      {
        'a': '1',
        'b': '2',
        'c': '3'
      }),
    T('(#(a #(b c) ...))', [],
      '(#(1 #(2 3) #(4 5) #(6 7)))',
      {
        'a': '1',
        'b': '(2 4 6)',
        'c': '(3 5 7)',
      }),
  ]);
}

function testDottedTail() {
  RunTests([
    T('(a . b)', [],
      '(1 2 3 4)',
      {
        'a': '1',
        'b': '(2 3 4)'
      }),
    T('(a . (b c))', [],
      '(1 2 3)',
      {
        'a': '1',
        'b': '2',
        'c': '3',
      }),
  ]);
}

function testEmptyCaptures() {
  RunTests([
    T('(a ...)', [],
      '()',
      {
        'a': '()'
      }),
    T('((a b ...) ...)', [],
      '()',
      {
        'a': '()',
        'b': '()'
      })
  ]);
}
