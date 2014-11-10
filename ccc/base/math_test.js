// The Cmacs Project.

goog.provide('ccc.base.MathTest');
goog.setTestOnly('ccc.base.MathTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.MathTest');
}

function testAdd() {
  RunTests([
    T(['+'], 0),
    T(['+', 1], 1),
    T(['+', 1, 2], 3),
    T(['+', 1, 2, 3, 4, 5], 15),
    F(['+', '+']),
    F(['+', false]),
    F(['+', []]),
  ]);
}

function testSubtract() {
  RunTests([
    T(['-'], 0),
    T(['-', 42], -42),
    T(['-', 45, 3], 42),
    T(['-', 5, 2, 7], -4),
    F(['-', true]),
    F(['-', '-']),
  ]);
}

function testMultiply() {
  RunTests([
    T(['*'], 1),
    T(['*', 2], 2),
    T(['*', 3, 4], 12),
    T(['*', 1, 2, 3, 4], 24),
    F(['*', '*']),
    F(['*', true]),
  ]);
}

function testDivide() {
  RunTests([
    T(['/', 1], 1),
    T(['/', 2], 1/2),
    T(['/', 3, 4], 3/4),
    T(['/', 1, 2, 3], 1/2/3),
    F(['/']),
    F(['/', 0]),
    F(['/', 1, 2, 3, 0, 4]),
    F(['/', true]),
  ]);
}

function testZeroPredicate() {
  RunTests([
    T(['zero?', 0], true),
    T(['zero?', 1], false),
    T(['zero?', false], false),
    T(['zero?', 'zero?'], false),
    F(['zero?']),
    F(['zero?', 0, 0]),
  ]);
}
