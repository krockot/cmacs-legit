// The Cmacs Project.

goog.provide('ccc.CompileTest');
goog.setTestOnly('ccc.CompileTest');

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
var logger = goog.log.getLogger('ccc.CompileTest');

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

// Single compilation test. Takes an input object and an expected output object.
function E(input, opt_expectedOutputSpec, opt_environment, opt_followUp) {
  return function(callback) {
    var environment = (goog.isDef(opt_environment)
        ? opt_environment
        : new ccc.Environment(opt_environment));
    var thread = new ccc.Thread(ccc.compile(ccc.core.build(input),
        environment));
    return thread.run(function(result) {
      logger.log(goog.log.Logger.Level.INFO, goog.string.format(
          'Compilation completed in %s thunks in %s ms.', thread.thunkCounter_,
          thread.age_));
      if (ccc.isError(result))
        return callback(result);
      if (!goog.isDef(opt_expectedOutputSpec))
        return callback();
      var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
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

function RunTests(tests, opt_callback) {
  asyncTestCase.waitForAsync();
  var testsRemaining = tests.length;
  goog.array.forEach(tests, function(test) {
    test(function(result) {
      if (ccc.isError(result))
        fail(result);
      testsRemaining--;
      if (testsRemaining == 0)
        goog.isDef(opt_callback) ? opt_callback(result) : continueTesting();
    });
  });
}

// Tests below this line

function testSimpleCompilation() {
  RunTests([
    E([1, 2, 3], [1, 2, 3]),
    E(true, true),
    E(false, false),
    E(ccc.NIL, ccc.NIL),
    E(42, 42),
    E(new String('Ello'), new String('Ello')),
  ]);
}

function testUnknownSymbolCompilation() {
  var globalEnvironment = new ccc.Environment();
  var environment = new ccc.Environment(globalEnvironment);
  // Verify that compiling an unbound symbol introduces a new uninitialized
  // binding in global environment.
  RunTests([
    E('hello', undefined, environment),
  ], function(result) {
    if (ccc.isError(result))
      fail(result);
    var location = globalEnvironment.get('hello');
    assertNotNull(location);
    assert(location instanceof ccc.ImmediateLocation);
    assertNull(location.getValue());
    continueTesting();
  });
}

function testKnownSymbolCompilation() {
  var globalEnvironment = new ccc.Environment();
  var environment = new ccc.Environment(globalEnvironment);
  // Verify that a bound symbol compiles to its bound location.
  var location = new ccc.ImmediateLocation();
  globalEnvironment.set('foo', location);
  RunTests([
    E('foo', location, environment)
  ]);
}
