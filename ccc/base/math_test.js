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

function testNumberPredicate() {
  RunTests([
    T(['number?', 0], true),
    T(['number?', -42], true),
    T(['number?', false], false),
    T(['number?', ccc.NIL], false),
    F(['number?']),
    F(['number?', 1, 2]),
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

function testAbs() {
  RunTests([
    T(['abs', 0], 0),
    T(['abs', 42], 42),
    T(['abs', -42], 42),
    F(['abs']),
    F(['abs', 1, 2]),
    F(['abs', true]),
  ]);
}

function testMod() {
  RunTests([
    T(['mod', 5, 2], 1),
    T(['mod', 4, 2], 0),
    T(['mod', 7, -5], 2),
    T(['mod', -7, -5], -2),
    T(['mod', -7, 5], -2),
    F(['mod', 4, 0]),
    F(['mod', 1]),
    F(['mod']),
    F(['mod', 1, 2, 3]),
    F(['mod', true, 1]),
  ]);
}

function testFloor() {
  RunTests([
    T(['floor', 1], 1),
    T(['floor', 1.1], 1),
    T(['floor', 1.9], 1),
    T(['floor', -0.1], -1),
    T(['floor', -1.001], -2),
    F(['floor']),
    F(['floor', 1, 2]),
    F(['floor', true]),
  ]);
}

function testCeiling() {
  RunTests([
    T(['ceiling', 1], 1),
    T(['ceiling', 1.1], 2),
    T(['ceiling', 0.9], 1),
    T(['ceiling', -0.1], 0),
    T(['ceiling', -1.001], -1),
    F(['ceiling']),
    F(['ceiling', 1, 2]),
    F(['ceiling', true]),
  ]);
}

function testTruncate() {
  RunTests([
    T(['truncate', 1], 1),
    T(['truncate', 1.1], 1),
    T(['truncate', 1.9], 1),
    T(['truncate', -0.1], 0),
    T(['truncate', -1.001], -1),
    F(['truncate']),
    F(['truncate', 1, 2]),
    F(['truncate', true]),
  ]);
}

function testRound() {
  RunTests([
    T(['round', 1], 1),
    T(['round', 1.1], 1),
    T(['round', 1.5], 2),
    T(['round', -0.1], 0),
    T(['round', -1.001], -1),
    T(['round', -3.5], -3),
    F(['round']),
    F(['round', 1, 2]),
    F(['round', true]),
  ]);
}

function testSqrt() {
  RunTests([
    T(['sqrt', 2], Math.sqrt(2)),
    T(['sqrt', 4], 2),
    T(['sqrt', 1], 1),
    T(['sqrt', 0], 0),
    F(['sqrt', -1]),
    F(['sqrt']),
    F(['sqrt', 1, 2]),
    F(['sqrt', true]),
  ]);
}

function testExp() {
  RunTests([
    T(['exp', 1], Math.E),
    T(['exp', 0], 1),
    T(['exp', 2], Math.exp(2)),
    T(['exp', -1], Math.exp(-1)),
    F(['exp']),
    F(['exp', 1, 2]),
    F(['exp', true]),
  ]);
}

function testLog() {
  RunTests([
    T(['log', Math.E], 1),
    T(['log', 10, 10], 1),
    T(['log', 8, 2], 3),
    T(['log', 1, 42], 0),
    F(['log', 1, 2, 3]),
    F(['log']),
    F(['log', true]),
  ]);
}

function testSin() {
  RunTests([
    T(['sin', 0], Math.sin(0)),
    T(['sin', 1], Math.sin(1)),
    T(['sin', Math.sqrt(2)], Math.sin(Math.sqrt(2))),
    T(['sin', 42], Math.sin(42)),
    T(['sin', -42], Math.sin(-42)),
    F(['sin']),
    F(['sin', 1, 2]),
    F(['sin', true]),
  ]);
}

function testCos() {
  RunTests([
    T(['cos', 0], Math.cos(0)),
    T(['cos', 1], Math.cos(1)),
    T(['cos', Math.sqrt(2)], Math.cos(Math.sqrt(2))),
    T(['cos', 42], Math.cos(42)),
    T(['cos', -42], Math.cos(-42)),
    F(['cos']),
    F(['cos', 1, 2]),
    F(['cos', true]),
  ]);
}

function testTan() {
  RunTests([
    T(['tan', 0], Math.tan(0)),
    T(['tan', 1], Math.tan(1)),
    T(['tan', Math.sqrt(2)], Math.tan(Math.sqrt(2))),
    T(['tan', 42], Math.tan(42)),
    T(['tan', -42], Math.tan(-42)),
    F(['tan']),
    F(['tan', 1, 2]),
    F(['tan', true]),
  ]);
}

function testAsin() {
  RunTests([
    T(['asin', -1], Math.asin(-1)),
    T(['asin', 0], Math.asin(0)),
    T(['asin', 0.707], Math.asin(0.707)),
    T(['asin', 1], Math.asin(1)),
    F(['asin', -1.1]),
    F(['asin', 1.1]),
    F(['asin']),
    F(['asin', true]),
    F(['asin', 1, 1]),
  ]);
}

function testAcos() {
  RunTests([
    T(['acos', -1], Math.acos(-1)),
    T(['acos', 0], Math.acos(0)),
    T(['acos', 0.707], Math.acos(0.707)),
    T(['acos', 1], Math.acos(1)),
    F(['acos', -1.1]),
    F(['acos', 1.1]),
    F(['acos']),
    F(['acos', true]),
    F(['acos', 1, 1]),
  ]);
}

function testAtan() {
  RunTests([
    T(['atan', 0], 0),
    T(['atan', 1], Math.atan(1)),
    T(['atan', 2], Math.atan(2)),
    T(['atan', -1], Math.atan(-1)),
    T(['atan', 1, 2], Math.atan2(1, 2)),
    T(['atan', -1, -2], Math.atan2(-1, -2)),
    F(['atan', 1, 2, 3]),
    F(['atan']),
    F(['atan', true]),
    F(['atan', true, 1]),
    F(['atan', 1, true]),
  ]);
}
