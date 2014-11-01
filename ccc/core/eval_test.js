// The Cmacs Project.

goog.provide('ccc.EvalTest');
goog.setTestOnly('ccc.EvalTest');

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
var logger = goog.log.getLogger('ccc.ExpansionTest');
var List = ccc.Pair.makeList;

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

// Single eval test. Takes an input object and an expected output object.
function E(input, expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment(opt_environment));
  var thread = new ccc.Thread(ccc.eval(ccc.core.build(input), environment));
  return thread.run().then(function(result) {
    logger.log(goog.log.Logger.Level.INFO, goog.string.format(
        'Expansion completed in %s thunks in %s ms.', thread.thunkCounter_,
        thread.age_));
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
  var outer = new ccc.Environment();
  var inner = new ccc.Environment(outer);
  outer.set('x', ccc.T);
  outer.set('y', ccc.T);
  inner.set('x', ccc.F);
  inner.set('z', ccc.NIL);
  assertEquals(ccc.T, outer.get('x'));
  assertEquals(ccc.F, inner.get('x'));
  assertEquals(ccc.T, outer.get('y'));
  assertEquals(ccc.T, inner.get('y'));
  assertEquals(ccc.NIL, inner.get('z'));
  assertNull(outer.get('z'));
}

function testSelfEvaluators() {
  RunTests([
    E({ 'str': 'Hello, world!' }, { 'str': 'Hello, world!' }),
    E(42, 42),
    E(new ccc.Char(0x03bb), new ccc.Char(0x03bb)),
    E(true, true),
    E(false, false),
    E(ccc.NIL, ccc.NIL),
    E(ccc.UNSPECIFIED, ccc.UNSPECIFIED),
    E(new ccc.Vector([true, false]), new ccc.Vector([true, false])),
  ]);
}

function testSymbolLookup() {
  var environment = new ccc.Environment();
  environment.set('answer', 42);
  environment.set('question', ccc.UNSPECIFIED);
  // TODO(krockot): Remove this test. It's testing hack behavior. Symbol lookup
  // should not happen during evaluation.
  RunTests([
    E('answer', 42, environment),
    E('question', ccc.UNSPECIFIED, environment)
  ]);
}

function testNativeProcedure() {
  var proc = new ccc.NativeProcedure(function(environment, args, continuation) {
    assertNotNull(args);
    assert(ccc.isPair(args));
    assert(ccc.isPair(args.cdr()));
    assert(ccc.isNil(args.cdr().cdr()));
    return continuation(new ccc.Pair(args.cdr().car(), args.car()));
  });
  var environment = new ccc.Environment();
  environment.set('monkey', 7);
  RunTest(E([proc, 42, 'monkey'], new ccc.Pair(7, 42), environment));
}

function testNestedNativeProcedure() {
  var proc = new ccc.NativeProcedure(function(environment, args, continuation) {
    assertNotNull(args);
    assert(ccc.isPair(args));
    assert(ccc.isPair(args.cdr()));
    assert(ccc.isNil(args.cdr().cdr()));
    return continuation(new ccc.Pair(args.cdr().car(), args.car()));
  });
  var procGenerator = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(proc);
  });
  var environment = new ccc.Environment();
  environment.set('monkey', 7);
  RunTest(E([[procGenerator], 42, 'monkey'], new ccc.Pair(7, 42), environment));
}
