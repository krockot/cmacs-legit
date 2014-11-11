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

function testVector() {
  RunTests([
    T(['vector'], V([])),
    T(['vector', 1, 2, 3], V([1, 2, 3])),
    T(['vector', []], V([[]])),
    T(['vector', true, false], V([true, false])),
  ]);
}

function testMakeVector() {
  RunTests([
    T(['make-vector', 0], V([])),
    T(['make-vector', 1], V([ccc.UNSPECIFIED])),
    T(['make-vector', 2], V([ccc.UNSPECIFIED, ccc.UNSPECIFIED])),
    T(['make-vector', 3, 6], V([6, 6, 6])),
    T(['make-vector', 4, true], V([true, true, true, true])),
    F(['make-vector']),
    F(['make-vector', false]),
    F(['make-vector', 1, 1, 1]),
  ]);
}

function testVectorLength() {
  RunTests([
    T(['vector-length', V([])], 0),
    T(['vector-length', V([2, 3, 4])], 3),
    F(['vector-length']),
    F(['vector-length', 1]),
    F(['vector-length', V([]), 1]),
  ]);
}

function testVectorRef() {
  RunTests([
    T(['vector-ref', V([1]), 0], 1),
    T(['vector-ref', V([1, 2, 3, 4]), 2], 3),
    F(['vector-ref']),
    F(['vector-ref', V([1, 2, 3])]),
    F(['vector-ref', V([]), 0]),
    F(['vector-ref', V([1, 2, 3]), 3]),
    F(['vector-ref', V([])]),
    F(['vector-ref', V([1]), false]),
    F(['vector-ref', V([1]), 0, 0]),
  ]);
}

function testVectorSet() {
  RunTests([
    T(['begin',
        ['define', 'x', V([1, 2, 3, 4])],
        ['vector-set!', 'x', 1, true],
        'x'], V([1, true, 3, 4])),
    F(['vector-set!']),
    F(['vector-set!', V([1, 2, 3])]),
    F(['vector-set!', V([1, 2, 3], 1)]),
    F(['vector-set!', V([1, 2, 3], 1, 2, 3)]),
    F(['vector-set!', [1, 2, 3], 1, 2]),
  ]);
}
