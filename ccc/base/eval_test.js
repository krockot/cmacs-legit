// The Cmacs Project.


goog.provide('ccc.base.EvalTest');
goog.setTestOnly('ccc.base.EvalTest');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Char');
goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Number');
goog.require('ccc.base.Object');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.T');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.base.Vector');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 200;
  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  asyncTestCase.continueTesting();
  console.error(goog.isDef(reason.stack) ? reason.stack : reason);
  fail(reason);
}

// Single eval test. Takes an input object and an expected output object.
function E(input, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment(opt_environment));
  return input.eval(environment).then(function(result) {
    if (result.equal(expectedOutput))
      return null;
    return goog.Promise.reject('Object mismatch.\n' +
        'Expected: ' + expectedOutput.toString() +
        '\nActual: ' + result.toString() + '\n');
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
  var outer = new ccc.base.Environment();
  var inner = new ccc.base.Environment(outer);
  outer.set('x', ccc.base.T);
  outer.set('y', ccc.base.T);
  inner.set('x', ccc.base.F);
  inner.set('z', ccc.base.NIL);
  assertEquals(ccc.base.T, outer.get('x'));
  assertEquals(ccc.base.F, inner.get('x'));
  assertEquals(ccc.base.T, outer.get('y'));
  assertEquals(ccc.base.T, inner.get('y'));
  assertEquals(ccc.base.NIL, inner.get('z'));
  assertNull(outer.get('z'));
}

function testSelfEvaluators() {
  RunTests([
    E(new ccc.base.String('Hello, world!'),
      new ccc.base.String('Hello, world!')),
    E(new ccc.base.Number(42), new ccc.base.Number(42)),
    E(new ccc.base.Char(0x03bb), new ccc.base.Char(0x03bb)),
    E(ccc.base.T, ccc.base.T),
    E(ccc.base.F, ccc.base.F),
    E(ccc.base.NIL, ccc.base.NIL),
    E(ccc.base.UNSPECIFIED, ccc.base.UNSPECIFIED),
    E(new ccc.base.Vector([ccc.base.T, ccc.base.F]),
      new ccc.base.Vector([ccc.base.T, ccc.base.F]))
  ]);
}

function testSymbolLookup() {
  var environment = new ccc.base.Environment();
  environment.set('answer', new ccc.base.Number(42));
  environment.set('question', ccc.base.UNSPECIFIED);
  RunTests([
    E(new ccc.base.Symbol('answer'), new ccc.base.Number(42), environment),
    E(new ccc.base.Symbol('question'), ccc.base.UNSPECIFIED, environment)
  ]);
}

function testNativeProcuedre() {

}
