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
function E(input, opt_expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment(opt_environment));
  var thread = new ccc.Thread(ccc.compile(ccc.core.build(input), environment));
  return thread.run().then(function(result) {
    if (!goog.isDef(opt_expectedOutputSpec))
      return;
    var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
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
    E('hello', undefined, environment).then(function() {
      var location = globalEnvironment.get('hello');
      assertNotNull(location);
      assert(location instanceof ccc.ImmediateLocation);
      assertNull(location.getValue());
    })
  ]);
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
