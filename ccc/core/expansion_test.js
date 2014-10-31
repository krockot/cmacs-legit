// The Cmacs Project.

goog.provide('ccc.ExpansionTest');
goog.setTestOnly('ccc.ExpansionTEst');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var X = function(data) { return new ccc.Syntax(ccc.core.build(data)); };

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
  goog.Promise.setUnhandledRejectionHandler(justFail);
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
  var thread = new ccc.Thread(ccc.expand(ccc.core.build(input), environment));
  return thread.run().then(function(result) {
    var expectedOutput = ccc.core.build(expectedOutputSpec);
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

function testEnvironment() {
  RunTests([
    E(X([X(1), X(2), X(3)]), [1, 2, 3]),
  ]);
}
