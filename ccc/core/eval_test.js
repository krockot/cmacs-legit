// The Cmacs Project.

goog.provide('ccc.EvalTest');
goog.setTestOnly('ccc.EvalTest');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('goog.array');
goog.require('goog.debug.Console');
goog.require('goog.log.Logger');
goog.require('goog.string.format');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var logger = goog.log.getLogger('ccc.EvalTest');
var List = ccc.Pair.makeList;

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
  new goog.debug.Console().setCapturing(true);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(goog.isDef(reason) && goog.isDef(reason.stack)
      ? reason.stack : reason);
  fail(reason);
}

// Single eval test. Takes an input object and an expected output object.
function E(input, expectedOutputSpec, opt_environment) {
  return function(callback) {
    var environment = (goog.isDef(opt_environment)
        ? opt_environment
        : new ccc.Environment(opt_environment));
    var thread = new ccc.Thread(ccc.eval(ccc.core.build(input), environment));
    return thread.run(function(result) {
      logger.log(goog.log.Logger.Level.INFO, goog.string.format(
          'Evaluation completed in %s thunks in %s ms.', thread.thunkCounter_,
          thread.age_));
      if (ccc.isError(result))
        return callback(result);
      var expectedOutput = ccc.core.build(expectedOutputSpec);
      if (!ccc.equal(expectedOutput, result))
        return callback(new ccc.Error('Object mismatch.\n' +
            'Expected: ' + ccc.core.stringify(expectedOutput) +
            '\nActual: ' + ccc.core.stringify(result) + '\n'));
      callback(result);
    });
  };
}

function RunTest(test) {
  asyncTestCase.waitForAsync();
  test(function(result) {
    if (ccc.isError(result))
      fail(result);
    continueTesting();
  });
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  var testsRemaining = tests.length;
  goog.array.forEach(tests, function(test) {
    test(function(result) {
      if (ccc.isError(result))
        fail(result);
      testsRemaining--;
      if (testsRemaining == 0)
        continueTesting();
    });
  });
}

// Tests below this line

function testEnvironment() {
  var outer = new ccc.Environment();
  var inner = new ccc.Environment(outer);
  outer.setValue('x', ccc.T);
  outer.setValue('y', ccc.T);
  inner.setValue('x', ccc.F);
  inner.setValue('z', ccc.NIL);
  assertEquals(ccc.T, outer.get('x').getValue());
  assertEquals(ccc.F, inner.get('x').getValue());
  assertEquals(ccc.T, outer.get('y').getValue());
  assertEquals(ccc.T, inner.get('y').getValue());
  assertEquals(ccc.NIL, inner.get('z').getValue());
  assertNull(outer.get('z'));
}

function testSelfEvaluators() {
  RunTests([
    E(new String('Hello, world!'), new String('Hello, world!')),
    E(42, 42),
    E(new ccc.Char(0x03bb), new ccc.Char(0x03bb)),
    E(true, true),
    E(false, false),
    E(ccc.NIL, ccc.NIL),
    E(ccc.UNSPECIFIED, ccc.UNSPECIFIED),
    E(new ccc.Vector([true, false]), new ccc.Vector([true, false])),
  ]);
}

function testImmediateLocation() {
  var environment = new ccc.Environment();
  environment.setValue('answer', 42);
  environment.setValue('question', ccc.UNSPECIFIED);
  RunTests([
    E(environment.get('answer'), 42, environment),
    E(environment.get('question'), ccc.UNSPECIFIED, environment)
  ]);
}

function testLocalLocation() {
  var outerEnvironment = new ccc.Environment();
  var foo = new ccc.LocalLocation(outerEnvironment, 0);
  var bar = new ccc.LocalLocation(outerEnvironment, 1);
  outerEnvironment.setActiveLocals([42, 43])
  var environment = new ccc.Environment(outerEnvironment);
  RunTests([
    E(foo, 42, environment),
    E(bar, 43, environment)
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
  RunTest(E([proc, 42, new String('monkey')],
            new ccc.Pair(new String('monkey'), 42)));
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
  var multiply = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() * args.cdr().car());
  });

  RunTest(E([[procGenerator], [multiply, 6, 7], new String('monkey')],
            new ccc.Pair(new String('monkey'), 42)));
}
