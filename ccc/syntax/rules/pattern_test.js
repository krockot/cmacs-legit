// The Cmacs Project.

goog.provide('ccc.syntax.PatternTest');
goog.setTestOnly('ccc.syntax.PatternTest');

goog.require('ccc.base');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('ccc.syntax.Pattern');
goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


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

function readObject(code) {
  var scanner = new ccc.parse.Scanner();
  scanner.feed(code);
  scanner.setEof();
  var parser = new ccc.parse.Parser(scanner);
  return parser.readObject();
};

function T(pattern, literals, input, opt_expectedMatches) {
  var environment = new ccc.base.Environment();
  return readObject(pattern).then(function(pattern) {
    return readObject(input).then(function(input) {
      var literalSet = goog.object.createSet(literals);
      pattern = new ccc.syntax.Pattern(literalSet, pattern);
      var match = pattern.match(environment, input);
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
      var expectedVars = goog.object.getKeys(opt_expectedMatches);
      for (var i = 0; i < expectedVars.length; ++i) {
        var key = expectedVars[i];
        var expected = opt_expectedMatches[key];
        if (!goog.object.containsKey(match.captures, key))
          return goog.Promise.reject(
              new Error('Missing expected pattern variable: ' + key));
        if (!match.captures[key].equal(expected)) {
          return goog.Promise.reject(new Error(
              'Capture mismatch for variable: ' + key +
              '\nExpected: ' + expected.toString() +
              '\n Actual: ' + match.captures[key].toString() + '\n'));
        }
      }
    });
  });
}

function F(pattern, literals, input) {
  return T(pattern, literals, input).then(
      goog.partial(justFail, new Error('Expected failure, got success')),
      function() {});
}

function C(contents) {
  if (contents instanceof Array)
    return new ccc.syntax.Capture(contents);
  return new ccc.syntax.Capture(ccc.base.build(contents));
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}


function testSimplePatterns() {
  RunTests([
    T('(a)', [], '(42)', { 'a': C(42) }),
    T('(a b)', [], '(42 43)', { 'a': C(42), 'b': C(43) }),
    T('(a #t (b c))', [], '(1 #t (2 3))', {
      'a': C(1),
      'b': C(2),
      'c': C(3)
    }),
    F('(a)', [], '()'),
    F('(a b)', [], '(1 2 3)'),
  ]);
}

function testLiterals() {
  RunTests([
    T('(a $$ b)', ['$$'], '(1 $$ 2)', { 'a': C(1), 'b': C(2) }),
    T('(a ! b @ c)', ['!', '@'], '[1 ! 2 @ 3]', {
      'a': C(1),
      'b': C(2),
      'c': C(3)
    }),
  ]);
}

function testSimpleRepetition() {
  RunTests([
    T('(a ...)', [],
      '(1 2 3 4)', {
      'a': C([C(1), C(2), C(3), C(4)])
    }),
    T('(a b ...)', [],
      '(1 2 3 4)', {
      'a': C(1),
      'b': C([C(2), C(3), C(4)])
    }),
    T('(a (b c) ...)', [],
      '(1 (2 3) (4 5) (6 7) (8 9))', {
      'a': C(1),
      'b': C([C(2), C(4), C(6), C(8)]),
      'c': C([C(3), C(5), C(7), C(9)])
    }),
    F('(a ... b)', [], '(1 2 3)'),
    F('(a (b c) ...)', [],
      '(1 2 3 4)'),
  ]);
}

function testNestedRepetition() {
  RunTests([
    T('((a b ...) ...)', [],
      '((1 2 3 4) (a b c d) (! @ $ %))', {
      'a': C([C(1), C('a'), C('!')]),
      'b': C([C([C(2), C(3), C(4)]),
              C([C('b'), C('c'), C('d')]),
              C([C('@'), C('$'), C('%')])]),
    }),
    T('((a (b c ...) ...) ...)', [],
      '((1 (2 3 4 5) (6 7 8)) (a (b c d e) (f g)) (! ($ $ $)))', {
      'a': C([C(1), C('a'), C('!')]),
      'b': C([C([C(2), C(6)]),
              C([C('b'), C('f')]),
              C([C('$')])]),
      'c': C([C([C([C(3), C(4), C(5)]),
                 C([C(7), C(8)])]),
              C([C([C('c'), C('d'), C('e')]),
                 C([C('g')])]),
              C([C([C('$'), C('$')])])])
    }),
  ]);
}

function testVector() {
  RunTests([
    T('(#(a b c))', [],
      '(#(1 2 3))', {
      'a': C(1),
      'b': C(2),
      'c': C(3)
    }),
    T('(#(a #(b c) ...))', [],
      '(#(1 #(2 3) #(4 5) #(6 7)))', {
      'a': C(1),
      'b': C([C(2), C(4), C(6)]),
      'c': C([C(3), C(5), C(7)]),
    }),
  ]);
}

function testDottedTail() {
  RunTests([
    T('(a . b)', [],
      '(1 2 3 4)', {
      'a': C(1),
      'b': C({ 'list': [2, 3, 4] })
    }),
    T('(a . (b c))', [],
      '(1 2 3)', {
      'a': C(1),
      'b': C(2),
      'c': C(3)
    }),
  ]);
}

function testEmptyCaptures() {
  RunTests([
    T('(a ...)', [],
      '()', {
      'a': C([])
    }),
    T('((a b ...) ...)', [],
      '()', {
      'a': C([]),
      'b': C([C([])]),
    }),
    T('#(a (b c ...) ...)', [],
      '#(42)', {
      'a': C(42),
      'b': C([]),
      'c': C([C([])])
    }),
  ]);
}
