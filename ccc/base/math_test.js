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
    F(['+', []])
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
