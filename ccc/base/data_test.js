// The Cmacs Project.

goog.provide('ccc.base.DataTest');
goog.setTestOnly('ccc.base.DataTest');

goog.require('ccc.baseTestUtil');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.DataTest');
}

function testEq() {
  RunTests([
    T(['eq?', 1, 1], true),
    T(['eq?', new String("hey"), new String("hey")], true),
    T(['eq?', 1, new String("1")], false),
    T(['eq?', ['list', 1, 2], ['list', 1, 2]], false),
    T(['eq?', new ccc.Vector([1, 2]), new ccc.Vector([1, 2])], false),
    T(['eq?', true, true], true),
    T(['eq?', false, false], true),
    T(['eq?', ccc.NIL, ccc.NIL], true),
    T(['eq?', ccc.UNSPECIFIED, ccc.UNSPECIFIED], true),
    T(['eq?', ccc.NIL, ccc.UNSPECIFIED], false),
    T(['eq?', false, ccc.NIL], false),
    F(['eq?']),
    F(['eq?', 1]),
    F(['eq?', 1, 1, 1]),
  ]);
}

function testEqv() {
  RunTests([
    T(['eqv?', 1, 1], true),
    T(['eqv?', new String("hey"), new String("hey")], true),
    T(['eqv?', 1, new String("1")], false),
    T(['eqv?', ['list', 1, 2], ['list', 1, 2]], false),
    T(['eqv?', new ccc.Vector([1, 2]), new ccc.Vector([1, 2])], false),
    T(['eqv?', true, true], true),
    T(['eqv?', false, false], true),
    T(['eqv?', ccc.NIL, ccc.NIL], true),
    T(['eqv?', ccc.UNSPECIFIED, ccc.UNSPECIFIED], true),
    T(['eqv?', ccc.NIL, ccc.UNSPECIFIED], false),
    T(['eqv?', false, ccc.NIL], false),
    F(['eqv?']),
    F(['eqv?', 1]),
    F(['eqv?', 1, 1, 1]),
  ]);
}

function testEqual() {
  RunTests([
    T(['equal?', 1, 1], true),
    T(['equal?', new String("hey"), new String("hey")], true),
    T(['equal?', 1, new String("1")], false),
    T(['equal?', ['list', 1, 2], ['list', 1, 2]], true),
    T(['equal?', ['list', 1, 2, 3], ['list', 1, 2]], false),
    T(['equal?', new ccc.Vector([1, 2]), new ccc.Vector([1, 2])], true),
    T(['equal?', true, true], true),
    T(['equal?', false, false], true),
    T(['equal?', ccc.NIL, ccc.NIL], true),
    T(['equal?', ccc.UNSPECIFIED, ccc.UNSPECIFIED], true),
    T(['equal?', ccc.NIL, ccc.UNSPECIFIED], false),
    T(['equal?', false, ccc.NIL], false),
    F(['equal?']),
    F(['equal?', 1]),
    F(['equal?', 1, 1, 1]),
  ]);
}

function testNot() {
  RunTests([
    T(['not', 0], false),
    T(['not', true], false),
    T(['not', 1], false),
    T(['not', ccc.NIL], false),
    T(['not', ccc.UNSPECIFIED], false),
    T(['not', ['list', 1, 2, 3]], false),
    T(['not', false], true),
    F(['not']),
    F(['not', 1, 2]),
  ]);
}

function testBooleanPredicate() {
  RunTests([
    T(['boolean?', 0], false),
    T(['boolean?', ccc.NIL], false),
    T(['boolean?', ccc.UNSPECIFIED], false),
    T(['boolean?', true], true),
    T(['boolean?', false], true),
    F(['boolean?']),
    F(['boolean?', true, true]),
  ]);
}

function testSymbolPredicate() {
  RunTests([
    T(['symbol?', ['quote', 'foo']], true),
    T(['symbol?', new String('foo')], false),
    T(['symbol?', false], false),
    F(['symbol?']),
    F(['symbol?', 1, 2]),
  ]);
}

function testSymbolToString() {
  RunTests([
    T(['symbol->string', ['quote', 'foo']], new String('foo')),
    T(['symbol->string', ['quote', '']], new String('')),
    F(['symbol->string']),
    F(['symbol->string', new String('foo')]),
    F(['symbol->string', ['quote', 'foo'], 1]),
  ]);
}
