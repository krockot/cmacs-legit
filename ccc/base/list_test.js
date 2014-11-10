// The Cmacs Project.

goog.provide('ccc.base.ListTest');
goog.setTestOnly('ccc.base.ListTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.ListTest');
}

function testList() {
  RunTests([
    T(['list'], ccc.NIL),
    T(['list', 1], [1]),
    T(['list', 2, 3, 4], [2, 3, 4]),
    T(['list', ['list', 1, 2], 3], [[1, 2], 3]),
  ]);
}

function testListAccessors() {
  RunTests([
    T(['car', ['list', 1, 2]], 1),
    T(['cdr', ['list', 1, 2, 3]], [2, 3]),
    T(['cadr', ['list', 1, 2, 3]], 2),
    T(['caaddr', ['quote', [1, 2, [3, 4]]]], 3),
    T(['caddar', ['quote', [[40, 41, 42], 2, 3]]], 42),
  ]);
}

function testCons() {
  RunTests([
    T(['cons', 1, 2], new ccc.Pair(1, 2)),
    T(['cons', 1, ccc.NIL], [1]),
    T(['cons', 1, ['cons', 2, ccc.NIL]], [1, 2]),
    F(['cons', 1]),
    F(['cons', 1, 2, 3]),
    F(['cons']),
  ]);
}

function testSetCar() {
  RunTests([
    T(['begin',
        ['define', 'x', ['list', 1, 2, 3]],
        ['set-car!', 'x', 4],
        'x'], [4, 2, 3]),
    F(['set-car!']),
    F(['set-car!', ['list', 1, 2]]),
    F(['set-car!', ['list', 1, 2], 2, 3]),
  ]);
}

function testSetCdr() {
  RunTests([
    T(['begin',
        ['define', 'x', ['list', 1, 2, 3]],
        ['set-cdr!', 'x', 4],
        'x'], new ccc.Pair(1, 4)),
    F(['set-cdr!']),
    F(['set-cdr!', ['list', 1, 2]]),
    F(['set-cdr!', ['list', 1, 2], 2, 3]),
  ]);
}

function testPairPredicate() {
  RunTests([
    T(['pair?', []], false),
    T(['pair?', ['list', 1, 2]], true),
    T(['pair?', ['cons', 1, 2]], true),
    T(['pair?', 1], false),
    F(['pair?']),
    F(['pair?', 1, 2]),
  ]);
}

function testListPredicate() {
  RunTests([
    T(['list?', ['list', 1, 2, 3]], true),
    T(['list?', []], true),
    T(['list?', ['list', 1]], true),
    T(['list?', ['cons', 1, 2]], false),
    T(['list?', 1], false),
    T(['begin',
        ['define', 'x', ['cons', 1, []]],
        ['set-cdr!', 'x', 'x'],
        ['list?', 'x']], false),
    F(['list?']),
    F(['list?', 1, 2]),
  ]);
}

function testNullPredicate() {
  RunTests([
    T(['null?', 0], false),
    T(['null?', false], false),
    T(['null?', []], true),
    T(['null?', ccc.UNSPECIFIED], false),
    F(['null?']),
    F(['null?', 1, 2]),
  ]);
}
