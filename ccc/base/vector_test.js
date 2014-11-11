// The Cmacs Project.

goog.provide('ccc.base.VectorTest');
goog.setTestOnly('ccc.base.VectorTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var V = function(elements) { return new ccc.Vector(elements); };

function setUpPage() {
  setUpBaseTest('ccc.base.VectorTest');
}

function testVectorPredicate() {
  RunTests([
    T(['vector?', V([])], true),
    T(['vector?', V([1, 2, 3])], true),
    T(['vector?', []], false),
    T(['vector?', ['list', 1, 2, 3]], false),
    T(['vector?', 1], false),
    T(['vector?', new String('abcdef')], false),
    F(['vector?']),
    F(['vector?', V([]), V([])]),
  ]);
}
