// The Cmacs Project.

goog.provide('ccc.CompileTest');
goog.setTestOnly('ccc.CompileTest');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('goog.Promise');
goog.require('goog.debug.Console');
goog.require('goog.log.Logger');
goog.require('goog.string.format');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var logger = goog.log.getLogger('ccc.CompileTest');
var X = function(data) { return new ccc.Syntax(ccc.core.build(data)); };

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
  goog.Promise.setUnhandledRejectionHandler(justFail);
  new goog.debug.Console().setCapturing(true);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(goog.isDef(reason) && goog.isDef(reason.stack)
      ? reason.stack : reason);
  setTimeout(goog.partial(fail, reason), 0);
}

// Single expansion test. Takes an input object and an expected output object.
function E(input, expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment(opt_environment));
  var thread = new ccc.Thread(ccc.compile(ccc.core.build(input), environment));
  return thread.run().then(function(result) {
    var expectedOutput = ccc.core.build(expectedOutputSpec);
    logger.log(goog.log.Logger.Level.INFO, goog.string.format(
        'Compilation completed in %s thunks in %s ms.', thread.thunkCounter_,
        thread.age_));
    if (!ccc.equal(expectedOutput, result))
      return goog.Promise.reject(new Error('Object mismatch.\n' +
          'Expected: ' + ccc.core.stringify(expectedOutput) +
          '\nActual: ' + ccc.core.stringify(result) + '\n'));
  });
}

function RunTest(test) {
  asyncTestCase.waitForAsync();
  test.then(continueTesting, justFail);
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}

// Tests below this line

function testSimpleCompilation() {
  RunTests([
    E(X([X(1), X(2), X(3)]), [1, 2, 3]),
    E(X(true), true),
    E(X(false), false),
    E(X(ccc.NIL), ccc.NIL),
    E(X(42), 42),
    E(X('"Ello"'), '"Ello"'),
    E(X('Ello'), 'Ello')
  ]);
}
