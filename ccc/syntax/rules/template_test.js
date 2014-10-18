// The Cmacs Project.

goog.provide('ccc.syntax.TemplateTest');
goog.setTestOnly('ccc.syntax.TemplateTest');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture')
goog.require('ccc.syntax.Template');
goog.require('goog.testing.jsunit');

var List = ccc.base.Pair.makeList;
var Vec = function(contents) { return new ccc.base.Vector(contents); };
var Str = function(value) { return new ccc.base.String(value); };
var Sym = function(name) { return new ccc.base.Symbol(name); };
var Num = function(value) { return new ccc.base.Number(value); };
var NIL = ccc.base.NIL;
var TRUE = ccc.base.T;
var FALSE = ccc.base.F;
var UNSPEC = ccc.base.UNSPECIFIED;
var ELLIPSIS = Sym('...');

function C(contents) {
  return new ccc.syntax.Capture(contents);
}

function T(templateForm, captures, opt_expectedOutput) {
  var template = new ccc.syntax.Template(templateForm);
  var output = template.expand(captures);
  if (goog.isDef(opt_expectedOutput) && !output.equal(opt_expectedOutput))
    fail('Template expansion mismatch.\n' +
         'Expected: ' + opt_expectedOutput.toString() +
         '\nActual: ' + output.toString() + '\n');
}

function F(templateForm, captures) {
  var template = new ccc.syntax.Template(templateForm);
  try {
    var output = template.expand(captures);
  } catch (e) {
    return;
  }
  fail('Expected failure; got success.');
}

function testSimpleTemplates() {
  T(TRUE, {}, TRUE);
  T(List([TRUE, FALSE, Str("Hello, world!")]), {},
    List([TRUE, FALSE, Str("Hello, world!")]));
  T(NIL, {}, NIL);
  T(Num(42), {}, Num(42));
  T(Vec([Num(1), Num(2), Num(3)]), {}, Vec([Num(1), Num(2), Num(3)]));
}

function testRank0Expansion() {
  // (a)
  T(Sym('a'),
    {
      'a': C(Num(42))
    },
    Num(42));
  // (a b)
  T(List([Sym('a'), Sym('b')]),
    {
      'a': C(Num(42))
    },
    List([Num(42), Sym('b')]));
  // (a . b)
  T(List([Sym('a')], Sym('b')),
    {
      'a': C(List([Num(1), Num(2)])),
      'b': C(List([Num(3), Num(4)]))
    },
    List([List([Num(1), Num(2)]), Num(3), Num(4)]));
}

function testRank1Expansion() {
  // (a ...)
  T(List([Sym('a'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2)), C(Num(3))])
    },
    List([Num(1), Num(2), Num(3)]));
  // (a ... b ...)
  T(List([Sym('a'), ELLIPSIS, Sym('b'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))]),
      'b': C([C(Sym('a')), C(Sym('b')), C(Sym('c'))])
    },
    List([Num(1), Num(2), Sym('a'), Sym('b'), Sym('c')]));
  // #(#t a ...)
  T(Vec([TRUE, Sym('a'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))])
    },
    Vec([TRUE, Num(1), Num(2)]));
  // (a ...) with empty capture
  T(List([Sym('a'), ELLIPSIS]),
    {
      'a': C([])
    },
    ccc.base.NIL);
  // #(a ...) with empty capture
  T(Vec([Sym('a'), ELLIPSIS]),
    {
      'a': C([])
    },
    Vec([]));
}

function testExpansionLimiting() {
  // ((a b) ...) with equal capture lengths
  T(List([List([Sym('a'), Sym('b')]), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))]),
      'b': C([C(Num(3)), C(Num(4))])
    },
    List([List([Num(1), Num(3)]), List([Num(2), Num(4)])]));
  // ((a b) ...) with longer |a| capture
  T(List([List([Sym('a'), Sym('b')]), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2)), C(Num(42))]),
      'b': C([C(Num(3)), C(Num(4))])
    },
    List([List([Num(1), Num(3)]), List([Num(2), Num(4)])]));
  // ((a b) ...) with longer |b| capture
  T(List([List([Sym('a'), Sym('b')]), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))]),
      'b': C([C(Num(3)), C(Num(4)), C(Num(42))])
    },
    List([List([Num(1), Num(3)]), List([Num(2), Num(4)])]));
}

function testInvalidExpansionRank() {
  // (a ...) with rank-0 capture in |a|
  F(List([Sym('a'), ELLIPSIS]),
    {
      'a': C(Num(42))
    });
  // (a) with rank-1 capture in |a|
  F(List([Sym('a')]),
    {
      'a': C([C(Num(1)), C(Num(2))])
    });
}

function testMultipleExpansionsOfOneVariable() {
  // (a a)
  T(List([Sym('a'), Sym('a')]),
    {
      'a': C(Num(42))
    },
    List([Num(42), Num(42)]));
  // (a ... a ...)
  T(List([Sym('a'), ELLIPSIS, Sym('a'), ELLIPSIS]),
    {
      'a': C([C(Num(0)), C(Num(1))])
    },
    List([Num(0), Num(1), Num(0), Num(1)]));
  // ((a b) ...) with rank-0 capture in |a|
  T(List([List([Sym('a'), Sym('b')]), ELLIPSIS]),
    {
      'a': C(Num(42)),
      'b': C([C(Sym('foo')), C(Sym('bar'))])
    },
    List([List([Num(42), Sym('foo')]), List([Num(42), Sym('bar')])]));
}

function testRank2Expansion() {
  // ((a ... b ...) ...)
  T(List([List([Sym('a'), ELLIPSIS, Sym('b'), ELLIPSIS]), ELLIPSIS]),
    {
      // a <- [[1, 3, 5], [a, c, e]]
      'a': C([C([C(Num(1)), C(Num(3)), C(Num(5))]),
              C([C(Sym('a')), C(Sym('c')), C(Sym('e'))])]),
      // b <- [[2, 4, 6], [b, d, f]].
      'b': C([C([C(Num(2)), C(Num(4)), C(Num(6))]),
              C([C(Sym('b')), C(Sym('d')), C(Sym('f'))])])
    },
    // ((1 3 5 2 4 6) (a c e b d f))
    List([List([Num(1), Num(3), Num(5), Num(2), Num(4), Num(6)]),
          List([Sym('a'), Sym('c'), Sym('e'), Sym('b'), Sym('d'), Sym('f')])]));

  // ((a ... a ...) ...)
  T(List([List([Sym('a'), ELLIPSIS, Sym('a'), ELLIPSIS]), ELLIPSIS]),
    {
      // a <- [[1, 3, 5], [a, c, e]]
      'a': C([C([C(Num(1)), C(Num(3)), C(Num(5))]),
              C([C(Sym('a')), C(Sym('c')), C(Sym('e'))])]),
    },
    // ((1 3 5 1 3 5) (a c e a c e))
    List([List([Num(1), Num(3), Num(5), Num(1), Num(3), Num(5)]),
          List([Sym('a'), Sym('c'), Sym('e'), Sym('a'), Sym('c'), Sym('e')])]));
}

function testHigherRankExpansions() {
  // (((c ... b) ... a) ...)
  T(List([
      List([List([Sym('c'), ELLIPSIS, Sym('b')]),
            ELLIPSIS, Sym('a')]),
      ELLIPSIS]),
    {
      // a <- [1, a, !]
      'a': C([C(Num(1)), C(Sym('a')), C(Sym('!'))]),
      // b <- [[2, 6], [b, f], [$, $]]
      'b': C([C([C(Num(2)), C(Num(6))]),
              C([C(Sym('b')), C(Sym('f'))]),
              C([C(Sym('$'))])]),
      // c <- [[[3, 4, 5], [7, 8]], [[c, d, e], [g]], [[$, $]]]
      'c': C([C([C([C(Num(3)), C(Num(4)), C(Num(5))]),
                 C([C(Num(7)), C(Num(8))])]),
              C([C([C(Sym('c')), C(Sym('d')), C(Sym('e'))]),
                 C([C(Sym('g'))])]),
              C([C([C(Sym('$')), C(Sym('$'))])])])
    },
    // (((3 4 5 2) (7 8 6) 1) ((c d e b) (g f) a) (($ $ $) !))
    List([List([List([Num(3), Num(4), Num(5), Num(2)]),
                List([Num(7), Num(8), Num(6)]), Num(1)]),
          List([List([Sym('c'), Sym('d'), Sym('e'), Sym('b')]),
                List([Sym('g'), Sym('f')]), Sym('a')]),
          List([List([Sym('$'), Sym('$'), Sym('$')]), Sym('!')])]));

  // (((a b ...) ...) ...)
  T(List([List([List([Sym('a'), Sym('b'), ELLIPSIS]), ELLIPSIS]), ELLIPSIS]),
    {
      // a <- [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]]
      'a': C([C([C(Num(1)), C(Num(2)), C(Num(3)), C(Num(4)), C(Num(5))]),
              C([C(Num(5)), C(Num(4)), C(Num(3)), C(Num(2)), C(Num(1))])]),
      // b <- [[[a, b, c, d], [x, y, z], [7, 7, 7, 7, 7]],
      //       [[d, c, b, a], [z, y, x], [6, 6, 6, 6]]]
      'b': C([C([C([C(Sym('a')), C(Sym('b')), C(Sym('c')), C(Sym('d'))]),
                 C([C(Sym('x')), C(Sym('y')), C(Sym('z'))]),
                 C([C(Num(7)), C(Num(7)), C(Num(7)), C(Num(7)), C(Num(7))])]),
              C([C([C(Sym('d')), C(Sym('c')), C(Sym('b')), C(Sym('a'))]),
                 C([C(Sym('z')), C(Sym('y')), C(Sym('x'))]),
                 C([C(Num(6)), C(Num(6)), C(Num(6)), C(Num(6))])])])
    },
    // (((1 a b c d) (2 x y z) (3 7 7 7 7 7))
    //  ((5 d c b a) (4 z y x) (3 6 6 6 6)))
    List([List([List([Num(1), Sym('a'), Sym('b'), Sym('c'), Sym('d')]),
                List([Num(2), Sym('x'), Sym('y'), Sym('z')]),
                List([Num(3), Num(7), Num(7), Num(7), Num(7), Num(7)])]),
          List([List([Num(5), Sym('d'), Sym('c'), Sym('b'), Sym('a')]),
                List([Num(4), Sym('z'), Sym('y'), Sym('x')]),
                List([Num(3), Num(6), Num(6), Num(6), Num(6)])])]));
}
