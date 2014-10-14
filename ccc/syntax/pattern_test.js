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
var List = ccc.base.Pair.makeList;
var Sym = function(name) { return new ccc.base.Symbol(name); };
var Num = function(value) { return new ccc.base.Number(value); };
var NIL = ccc.base.NIL;
var TRUE = ccc.base.T;
var FALSE = ccc.base.F;
var UNSPEC = ccc.base.UNSPECIFIED;

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
  return new ccc.syntax.Capture(contents);
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}


function testSimplePatterns() {
  RunTests([
    T('(a)', [], '(42)', { 'a': C(Num(42)) }),
    T('(a b)', [], '(42 43)', { 'a': C(Num(42)), 'b': C(Num(43)) }),
    T('(a #t (b c))', [], '(1 #t (2 3))', {
      'a': C(Num(1)),
      'b': C(Num(2)),
      'c': C(Num(3))
    }),
    F('(a)', [], '()'),
    F('(a b)', [], '(1 2 3)'),
  ]);
}

function testLiterals() {
  RunTests([
    T('(a $$ b)', ['$$'], '(1 $$ 2)', { 'a': C(Num(1)), 'b': C(Num(2)) }),
    T('(a ! b @ c)', ['!', '@'], '[1 ! 2 @ 3]', {
      'a': C(Num(1)),
      'b': C(Num(2)),
      'c': C(Num(3))
    }),
  ]);
}

function testSimpleRepetition() {
  RunTests([
    T('(a ...)', [],
      '(1 2 3 4)', {
      'a': C([C(Num(1)), C(Num(2)), C(Num(3)), C(Num(4))])
    }),
    T('(a b ...)', [],
      '(1 2 3 4)', {
      'a': C(Num(1)),
      'b': C([C(Num(2)), C(Num(3)), C(Num(4))])
    }),
    T('(a (b c) ...)', [],
      '(1 (2 3) (4 5) (6 7) (8 9))', {
      'a': C(Num(1)),
      'b': C([C(Num(2)), C(Num(4)), C(Num(6)), C(Num(8))]),
      'c': C([C(Num(3)), C(Num(5)), C(Num(7)), C(Num(9))])
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
      'a': C([C(Num(1)), C(Sym('a')), C(Sym('!'))]),
      'b': C([C([C(Num(2)), C(Num(3)), C(Num(4))]),
              C([C(Sym('b')), C(Sym('c')), C(Sym('d'))]),
              C([C(Sym('@')), C(Sym('$')), C(Sym('%'))])]),
    }),
    T('((a (b c ...) ...) ...)', [],
      '((1 (2 3 4 5) (6 7 8)) (a (b c d e) (f g)) (! ($ $ $)))', {
      'a': C([C(Num(1)), C(Sym('a')), C(Sym('!'))]),
      'b': C([C([C(Num(2)), C(Num(6))]),
              C([C(Sym('b')), C(Sym('f'))]),
              C([C(Sym('$'))])]),
      'c': C([C([C([C(Num(3)), C(Num(4)), C(Num(5))]),
                 C([C(Num(7)), C(Num(8))])]),
              C([C([C(Sym('c')), C(Sym('d')), C(Sym('e'))]),
                 C([C(Sym('g'))])]),
              C([C([C(Sym('$')), C(Sym('$'))])])])
    }),
  ]);
}

function testVector() {
  RunTests([
    T('(#(a b c))', [],
      '(#(1 2 3))', {
      'a': C(Num(1)),
      'b': C(Num(2)),
      'c': C(Num(3))
    }),
    T('(#(a #(b c) ...))', [],
      '(#(1 #(2 3) #(4 5) #(6 7)))', {
      'a': C(Num(1)),
      'b': C([C(Num(2)), C(Num(4)), C(Num(6))]),
      'c': C([C(Num(3)), C(Num(5)), C(Num(7))]),
    }),
  ]);
}

function testDottedTail() {
  RunTests([
    T('(a . b)', [],
      '(1 2 3 4)', {
      'a': C(Num(1)),
      'b': C(List([Num(2), Num(3), Num(4)]))
    }),
    T('(a . (b c))', [],
      '(1 2 3)', {
      'a': C(Num(1)),
      'b': C(Num(2)),
      'c': C(Num(3))
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
      'a': C(Num(42)),
      'b': C([]),
      'c': C([C([])])
    }),
  ]);
}

