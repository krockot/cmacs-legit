// The Cmacs Project.

goog.provide('ccc.syntax.TemplateTest');
goog.setTestOnly('ccc.syntax.TemplateTest');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture')
goog.require('ccc.syntax.Template');
goog.require('goog.testing.jsunit');

function C(contents) {
  if (contents instanceof Array)
    return new ccc.syntax.Capture(contents);
  return new ccc.syntax.Capture(ccc.base.build(contents));
}

function T(templateSpec, captures, opt_expectedOutputSpec) {
  var template = new ccc.syntax.Template(ccc.base.build(templateSpec));
  var output = template.expand(captures);
  if (goog.isDef(opt_expectedOutputSpec)) {
    var expectedOutput = ccc.base.build(opt_expectedOutputSpec);
    if (!output.equal(expectedOutput))
      fail('Template expansion mismatch.\n' +
           'Expected: ' + expectedOutput.toString() +
           '\nActual: ' + output.toString() + '\n');
  }
}

function F(templateSpec, captures) {
  var template = new ccc.syntax.Template(ccc.base.build(templateSpec));
  try {
    var output = template.expand(captures);
  } catch (e) {
    return;
  }
  fail('Expected failure; got success.');
}

function testSimpleTemplates() {
  T(true, {}, true);
  T([true, false, { 'str': "Hello, world!" }],
    {},
    [true, false, { 'str': "Hello, world!" }]);
  T(null, {}, null);
  T(42, {}, 42);
  T({ 'vec': [1, 2, 3] }, {}, { 'vec': [1, 2, 3] });
}

function testRank0Expansion() {
  // a
  T('a', { 'a': C(42) }, 42);

  // (a b)
  T(['a', 'b'],
    {
      'a': C(42)
    },
    [42, 'b']);

  // (a . b)
  T({ 'list': ['a'], 'tail': 'b' },
    {
      'a': C({ 'list': [1, 2] }),
      'b': C({ 'list': [3, 4] })
    },
    [[1, 2], 3, 4]);
}

function testRank1Expansion() {
  // (a ...)
  T(['a', '...'],
    {
      'a': C([C(1), C(2), C(3)])
    },
    [1, 2, 3]);

  // (a ... b ...)
  T(['a', '...', 'b', '...'],
    {
      'a': C([C(1), C(2)]),
      'b': C([C('a'), C('b'), C('c')])
    },
    [1, 2, 'a', 'b', 'c']);

  // #(#t a ...)
  T({ 'vec': [true, 'a', '...'] },
    {
      'a': C([C(1), C(2)])
    },
    { 'vec': [true, 1, 2] });

  // (a ...) with empty capture
  T(['a', '...'],
    {
      'a': C([])
    },
    []);

  // #(a ...) with empty capture
  T({ 'vec': ['a', '...'] },
    {
      'a': C([])
    },
    { 'vec': [] });

  // (1 (a ...) 2 b ... c ...) with empty |c|
  T([1, ['a', '...'], 2, 'b', '...', 'c', '...'],
    {
      'a': C([C(42), C(43)]),
      'b': C([C(44), C(45)]),
      'c': C([])
    },
    [1, [42, 43], 2, 44, 45]);
}

function testExpansionLimiting() {
  // ((a b) ...) with equal capture lengths
  T([['a', 'b'], '...'],
    {
      'a': C([C(1), C(2)]),
      'b': C([C(3), C(4)])
    },
    [[1, 3], [2, 4]]);

  // ((a b) ...) with longer |a| capture
  T([['a', 'b'], '...'],
    {
      'a': C([C(1), C(2), C(42)]),
      'b': C([C(3), C(4)])
    },
    [[1, 3], [2, 4]]);

  // ((a b) ...) with longer |b| capture
  T([['a', 'b'], '...'],
    {
      'a': C([C(1), C(2)]),
      'b': C([C(3), C(4), C(42)])
    },
    [[1, 3], [2, 4]]);

  // ((a b) ...) with empty |b| capture
  T([['a', 'b'], '...'],
    {
      'a': C([C(1), C(2), C(3)]),
      'b': C([])
    },
    []);

  // ((a b ...) ...) with empty a and b captures
  T([['a', 'b', '...'], '...'],
    {
      'a': C([]),
      'b': C([C([])])
    },
    []);
}

function testInvalidExpansionRank() {
  // (a ...) with terminal capture in |a|
  F(['a', '...'],
    {
      'a': C(42)
    });

  // (a) with non-terminal capture in |a|
  F(['a'],
    {
      'a': C([C(1), C(2)])
    });
}

function testMultipleExpansionsOfOneVariable() {
  // (a a)
  T(['a', 'a'],
    {
      'a': C(42)
    },
    [42, 42]);

  // (a ... a ...)
  T(['a', '...', 'a', '...'],
    {
      'a': C([C(0), C(1)])
    },
    [0, 1, 0, 1]);

  // ((a b) ...) with terminal capture in |a|
  T([['a', 'b'], '...'],
    {
      'a': C(42),
      'b': C([C('foo'), C('bar')])
    },
    [[42, 'foo'], [42, 'bar']]);
}

function testRank2Expansion() {
  // ((a ... b ...) ...)
  T([['a', '...', 'b', '...'], '...'],
    {
      // a <- [[1, 3, 5], [a, c, e]]
      'a': C([C([C(1), C(3), C(5)]),
              C([C('a'), C('c'), C('e')])]),
      // b <- [[2, 4, 6], [b, d, f]].
      'b': C([C([C(2), C(4), C(6)]),
              C([C('b'), C('d'), C('f')])])
    },
    [[1, 3, 5, 2, 4, 6], ['a', 'c', 'e', 'b', 'd', 'f']]);

  // ((a ... a ...) ...)
  T([['a', '...', 'a', '...'], '...'],
    {
      // a <- [[1, 3, 5], [a, c, e]]
      'a': C([C([C(1), C(3), C(5)]),
              C([C('a'), C('c'), C('e')])]),
    },
    [[1, 3, 5, 1, 3, 5], ['a', 'c', 'e', 'a', 'c', 'e']]);
}

function testHigherRankExpansions() {
  // (((c ... b) ... a) ...)
  T([[['c', '...', 'b'], '...', 'a'], '...'],
    {
      // a <- [1, a, !]
      'a': C([C(1), C('a'), C('!')]),
      // b <- [[2, 6], [b, f], [$, $]]
      'b': C([C([C(2), C(6)]),
              C([C('b'), C('f')]),
              C([C('$')])]),
      // c <- [[[3, 4, 5], [7, 8]], [[c, d, e], [g]], [[$, $]]]
      'c': C([C([C([C(3), C(4), C(5)]),
                 C([C(7), C(8)])]),
              C([C([C('c'), C('d'), C('e')]),
                 C([C('g')])]),
              C([C([C('$'), C('$')])])])
    },
    // (((3 4 5 2) (7 8 6) 1) ((c d e b) (g f) a) (($ $ $) !))
    [[[3, 4, 5, 2], [7, 8, 6], 1], [['c', 'd', 'e', 'b'], ['g', 'f'], 'a'],
     [['$', '$', '$'], '!']]);

  // (((a b ...) ...) ...)
  T([[['a', 'b', '...'], '...'], '...'],
    {
      // a <- [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]]
      'a': C([C([C(1), C(2), C(3), C(4), C(5)]),
              C([C(5), C(4), C(3), C(2), C(1)])]),
      // b <- [[[a, b, c, d], [x, y, z], [7, 7, 7, 7, 7]],
      //       [[d, c, b, a], [z, y, x], [6, 6, 6, 6]]]
      'b': C([C([C([C('a'), C('b'), C('c'), C('d')]),
                 C([C('x'), C('y'), C('z')]),
                 C([C(7), C(7), C(7), C(7), C(7)])]),
              C([C([C('d'), C('c'), C('b'), C('a')]),
                 C([C('z'), C('y'), C('x')]),
                 C([C(6), C(6), C(6), C(6)])])])
    },
    // (((1 a b c d) (2 x y z) (3 7 7 7 7 7))
    //  ((5 d c b a) (4 z y x) (3 6 6 6 6)))
    [[[1, 'a', 'b', 'c', 'd'], [2, 'x', 'y', 'z'], [3, 7, 7, 7, 7, 7]],
     [[5, 'd', 'c', 'b', 'a'], [4, 'z', 'y', 'x'], [3, 6, 6, 6, 6]]]);
}
