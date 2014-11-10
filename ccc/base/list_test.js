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
