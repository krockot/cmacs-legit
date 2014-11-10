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

function testExponentation() {
  RunTests([
    T(['**', 2, 3], 8),
    T(['**', 3, 4], 81),
    F(['**']),
    F(['**', 1]),
    F(['**', 1, 2, 3]),
    F(['**', true, false])
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

function testIntegerPredicate() {
  RunTests([
    T(['integer?', 1], true),
    T(['integer?', 0], true),
    T(['integer?', ccc.NIL], false),
    T(['integer?', true], false),
    F(['integer?']),
    F(['integer?', 1, 2]),
  ]);
}

function testPositivePredicate() {
  RunTests([
    T(['positive?', 0], false),
    T(['positive?', 1], true),
    T(['positive?', -1], false),
    F(['positive?']),
    F(['positive?', 1, 2]),
    F(['positive?', true]),
  ]);
}

function testNegativePredicate() {
  RunTests([
    T(['negative?', 0], false),
    T(['negative?', -1], true),
    T(['negative?', 1], false),
    F(['negative?']),
    F(['negative?', 1, 2]),
    F(['negative?', true]),
  ]);
}

function testEvenPredicate() {
  RunTests([
    T(['even?', 0], true),
    T(['even?', 2], true),
    T(['even?', -4], true),
    T(['even?', 1], false),
    T(['even?', -1], false),
    F(['even?', 1.5]),
    F(['even?']),
    F(['even?', 1, 2]),
    F(['even?', true]),
  ]);
}

function testOddPredicate() {
  RunTests([
    T(['odd?', 0], false),
    T(['odd?', 2], false),
    T(['odd?', -4], false),
    T(['odd?', 1], true),
    T(['odd?', -1], true),
    F(['odd?', 1.5]),
    F(['odd?']),
    F(['odd?', 1, 2]),
    F(['odd?', true]),
  ]);
}

function testMin() {
  RunTests([
    T(['min', 0], 0),
    T(['min', 1, 2, 3], 1),
    T(['min', 9, 8, -10, 7], -10),
    F(['min']),
    F(['min', 1, 2, true]),
  ]);
}

function testMax() {
  RunTests([
    T(['max', 0], 0),
    T(['max', 1, 2, 3], 3),
    T(['max', -10, -9, 12, 4, 5], 12),
    F(['max']),
    F(['max', false, 6]),
  ]);
}
