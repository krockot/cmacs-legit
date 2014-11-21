// The Cmacs Project.

goog.provide('ccc.base.PreludeTest');
goog.setTestOnly('ccc.base.PreludeTest');

goog.require('ccc.baseTestUtil');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.PreludeTest');
}

function testBegin() {
  var count = 0;
  var native1 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(0, count++);
    return continuation(1);
  });
  var native2 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(1, count++);
    return continuation(2);
  });
  var native3 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(2, count);
    return continuation(3);
  });
  RunTests([
    T(['begin', [native1], [native2], [native3]], 3),
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
