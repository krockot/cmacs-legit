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

function testSimpleTemplates() {
  T(TRUE, {}, TRUE);
  T(List([TRUE, FALSE, Str("Hello, world!")]), {},
    List([TRUE, FALSE, Str("Hello, world!")]));
  T(NIL, {}, NIL);
  T(Num(42), {}, Num(42));
  T(Vec([Num(1), Num(2), Num(3)]), {}, Vec([Num(1), Num(2), Num(3)]));
}

function testRank0Expansion() {
  T(Sym('a'),
    {
      'a': C(Num(42))
    },
    Num(42));
  T(List([Sym('a'), Sym('b')]),
    {
      'a': C(Num(42))
    },
    List([Num(42), Sym('b')]));
  T(List([Sym('a')], Sym('b')),
    {
      'a': C(List([Num(1), Num(2)])),
      'b': C(List([Num(3), Num(4)]))
    },
    List([List([Num(1), Num(2)]), Num(3), Num(4)]));
}

function testRank1Expansion() {
  T(List([Sym('a'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2)), C(Num(3))])
    },
    List([Num(1), Num(2), Num(3)]));
  T(List([Sym('a'), ELLIPSIS, Sym('b'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))]),
      'b': C([C(Sym('a')), C(Sym('b')), C(Sym('c'))])
    },
    List([Num(1), Num(2), Sym('a'), Sym('b'), Sym('c')]));
  T(Vec([TRUE, Sym('a'), ELLIPSIS]),
    {
      'a': C([C(Num(1)), C(Num(2))])
    },
    Vec([TRUE, Num(1), Num(2)]));
}
