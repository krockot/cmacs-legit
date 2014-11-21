// The Cmacs Project.

goog.provide('ccc.base.PreludeTest');
goog.setTestOnly('ccc.base.PreludeTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.PreludeTest');
}

function makeCountedCaller() {
  var count = 0;
  return function(expectedCount) {
    return new ccc.NativeProcedure(function(e, a, c) {
      assertEquals(expectedCount, ++count);
      return c(count);
    })
  };
}

function testBegin() {
  var called = makeCountedCaller();
  RunTests([
    T(['begin', [called(1)], [called(2)], [called(3)]], 3),
  ]);
}

function testOr() {
  RunTests([
    T(['or'], false),
    T(['or', false], false),
    T(['or', true], true),
    T(['or', false, false, true], true),
    T(['or', false, false, []], []),
    T(['or', false, false, 42], 42),
    T(['or', true, 'never-evaluated'], true),
  ]);
}

function testAnd() {
  RunTests([
    T(['and'], true),
    T(['and', true], true),
    T(['and', false], false),
    T(['and', true, true, false], false),
    T(['and', true, true, []], []),
    T(['and', true, true, 42], 42),
    T(['and', false, 'never-evaluated'], false),
  ]);
}

function testLet() {
  var environment = new ccc.Environment();
  environment.setValue('foo', 9);
  RunTests([
    T(['let', [['foo', 42]], 'foo'], 42).then(function() {
      assertEquals(9, environment.get('foo').getValue());
    }),
    F(['let', [['bar', 42], ['foo', 'bar']], 'foo'])
  ]);
}

function testLetSeq() {
  RunTests([
    T(['let*', [['foo', 42], ['bar', 'foo']], 'bar'], 42),
  ]);
}

function testLetRec() {
  RunTests([
    T(['letrec',
        [['f', ['lambda', ['x', 'n'],
                  ['if', ['zero?', 'x'],
                    'n',
                    ['f', ['-', 'x', 1], ['+', 'n', 'x']]]]]],
        ['f', 10, 0]], 55 ),
  ]);
}

function testCond() {
  var called = makeCountedCaller();
  RunTests([
    T(['cond'], ccc.UNSPECIFIED),
    T(['cond', [false, 42], [false, 43]], ccc.UNSPECIFIED),
    T(['cond', [true, 1, 2, 3, 4]], 4),
    T(['cond', [false, 1, 2, 3], [true, 1, 2]], 2),
    T(['cond', [true, [called(1)], [called(2)], [called(3)]]], 3),
    F(['cond', [true]]),
    F(['cond', 1]),
    F(['cond', 1, 2]),
    F(['cond', [false, 1, 2, 3], 1]),
  ]);
}

function testWhen() {
  var called = makeCountedCaller();
  RunTests([
    T(['when', true, [called(1)], [called(2)]], 2),
    T(['when', false, 'never-evaluated'], ccc.UNSPECIFIED),
  ]);
}

function testUnless() {
  var called = makeCountedCaller();
  RunTests([
    T(['unless', false, [called(1)], [called(2)]], 2),
    T(['unless', true, 'never-evaluated'], ccc.UNSPECIFIED),
  ]);
}
