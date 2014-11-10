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
