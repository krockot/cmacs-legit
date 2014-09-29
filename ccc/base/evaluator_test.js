// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.EvaluatorTest');
goog.setTestOnly('ccc.parse.EvaluatorTest');

goog.require('ccc.base.Evaluator');
goog.require('ccc.base.Char');
goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Number');
goog.require('ccc.base.Object');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.T');
goog.require('ccc.base.UNSPECIFIED');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 200;
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(new Error(reason));
  fail(reason);
}

// Single evaluator test. Takes an input object and an expected output object.
function E(input, expectedOutput) {
  return new goog.Promise(function(resolve, reject) {
    var evaluator = new ccc.base.Evaluator();
    evaluator.eval(input).then(function(result) {
      if (result.equal(expectedOutput))
        resolve(null);
      else
        reject('Object mismatch.\n' +
               'Expected: ' + expectedOutput.toString() +
               '\nActual: ' + result.toString() + '\n');
    }, justFail);
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

function testSelfEvaluators() {
  RunTests([
    E(new ccc.base.String('Hello, world!'),
      new ccc.base.String('Hello, world!')),
    E(new ccc.base.Number(42), new ccc.base.Number(42)),
    E(new ccc.base.Char(0x03bb), new ccc.base.Char(0x03bb)),
    E(ccc.base.T, ccc.base.T),
    E(ccc.base.F, ccc.base.F),
    E(ccc.base.NIL, ccc.base.NIL),
    E(ccc.base.UNSPECIFIED, ccc.base.UNSPECIFIED)
  ]);
}
