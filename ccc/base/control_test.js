// The Cmacs Project.

goog.provide('ccc.base.ControlTest');
goog.setTestOnly('ccc.base.ControlTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.ControlTest');
}

function testProcedurePredicate() {
  RunTests([
    T(['procedure?', ['lambda', ['x'], 'x']], true),
    T(['call/cc', 'procedure?'], true),
    T(['procedure?', 42], false),
    F(['procedure?']),
    F(['procedure?', ['lambda', ['x'], 'x'], 42]),
  ]);
}

function testCallCc() {
  RunTests([
    T(['call/cc', ['lambda', ['x'], ['x', 42]]], 42),
    F(['call/cc', 42]),
    F(['call/cc']),
    F(['call/cc', 'call/cc', 'call/cc']),
  ]);
}

function testApply() {
  RunTests([
    T(['apply', '+', ['list', 3, 4]], 7),
    T(['apply', '+', 1, 2, 3, []], 6),
    T(['begin',
        ['define', 'compose',
          ['lambda', ['f', 'g'],
            ['lambda', 'args',
              ['f', ['apply', 'g', 'args']]]]],
        [['compose', 'sqrt', '*'], 12, 75]], 30),
    F(['apply', '+']),
    F(['apply']),
    F(['apply', '+', 1, 2]),
    F(['apply', '+', ['cons', 1, 2]]),
  ]);
}

function testMap() {
  RunTests([
    T(['map', 'cadr', ['quote', [['a', 'b'], ['d', 'e'], ['g', 'h']]]],
      ['b', 'e', 'h']),
    T(['map', ['lambda', ['n'], ['**', 'n', 'n']], ['list', 1, 2, 3, 4, 5]],
      [1, 4, 27, 256, 3125]),
    T(['map', '+', ['list', 1, 2, 3], ['list', 4, 5, 6]], [5, 7, 9]),
    T(['map', '+', ['list', 1, 2, 3], []], []),
    T(['map', '+', ['list', 1, 2, 3], ['list', 1, 2]], [2, 4]),
    T(['map', '+', ['list', 1, 2], ['list', 1, 2, 3]], [2, 4]),
    F(['map']),
    F(['map', '+']),
    F(['map', false, []]),
    F(['map', '+', false]),
    F(['map', '+', [], false]),
    F(['map', '+', ['cons', 1, 2], ['list', 1, 2, 3]]),
  ]);
}
