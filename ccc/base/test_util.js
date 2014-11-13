// The Cmacs Project.

goog.provide('ccc.baseTestUtil');
goog.setTestOnly('ccc.baseTestUtil');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('ccc.base.all');
goog.require('goog.Promise');
goog.require('goog.debug.Console');
goog.require('goog.log.Logger');
goog.require('goog.string.format');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');

var logger;

function setUpBaseTest(name) {
  logger = goog.log.getLogger(name);
  asyncTestCase.stepTimeout = 250;
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

function T(spec, opt_expectedOutputSpec) {
  var environment = new ccc.Environment();
  ccc.base.addToEnvironment(environment);
  var data = ccc.core.build(spec);
  var thread = new ccc.Thread(ccc.evalData(data, environment));
  return new goog.Promise(function(resolve, reject) {
    return thread.run(function(result) {
      logger.log(goog.log.Logger.Level.INFO, goog.string.format(
          'Evaluation completed in %s thunks in %s ms.', thread.thunkCounter_,
          thread.age_));
      if (ccc.isError(result))
        return reject(result);
      if (goog.isDef(opt_expectedOutputSpec)) {
        var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
        if (!ccc.equal(result, expectedOutput))
          return reject('Object mismatch on expression ' + data +
              '\nExpected: ' + ccc.core.stringify(expectedOutput) +
              '\nActual: ' + ccc.core.stringify(result) + '\n');
      }
      resolve();
    });
  });
};

var F = function(spec) {
  return T(spec).then(
      goog.partial(justFail, 'Expected failure; got success on expression ' +
          ccc.core.stringify(ccc.core.build(spec))), function() {});
};

var RunTests = function(tests) {
  asyncTestCase.waitForAsync();
  return goog.Promise.all(tests).then(continueTesting, justFail);
};
