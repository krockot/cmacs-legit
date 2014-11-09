// The Cmacs Project.

goog.provide('ccc.ExpandTest');
goog.setTestOnly('ccc.ExpandTest');

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
var logger = goog.log.getLogger('ccc.ExpandTest');

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
  var thread = new ccc.Thread(ccc.expand(ccc.core.build(input), environment));
  return thread.run().then(function(result) {
    var expectedOutput = ccc.core.build(expectedOutputSpec);
    logger.log(goog.log.Logger.Level.INFO, goog.string.format(
        'Expansion completed in %s thunks in %s ms.', thread.thunkCounter_,
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

var TestTransformer = function(transform) {
  this.transform_ = transform;
};
goog.inherits(TestTransformer, ccc.Transformer);

/** @override */
TestTransformer.prototype.transform = function(environment, args) {
  return this.transform_(environment, args);
};

// Tests below this line

function testSimpleExpansion() {
  RunTests([
    E([1, 2, 3], [1, 2, 3]),
    E(true, true),
    E(false, false),
    E(ccc.NIL, ccc.NIL),
    E(42, 42),
    E('Ello', 'Ello'),
    E('"Ello"', '"Ello"'),
  ]);
}

function testNonTransformerListExpansion() {
  RunTests([
    E(['not-a-transformer', 1, 2], ['not-a-transformer', 1, 2]),
  ]);
}

function testSimpleTransformer() {
  var adder = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return goog.partial(continuation, args.car() + args.cdr().car());
  });
  var transformer = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Throw away the first argument, return (<adder> arg2 arg3).
      return goog.partial(continuation, ccc.Pair.makeList([adder], args.cdr()));
    };
  });
  var environment = new ccc.Environment();
  environment.set('the-machine', transformer);

  RunTests([
    E(['the-machine', true, 26, 16], [adder, 26, 16], environment),
  ]);
}

function testNestedTransformers() {
  var adder = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return goog.partial(continuation, args.car() + args.cdr().car());
  });
  var transformer = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Throw away the first argument, return (<adder> arg2 arg3).
      return goog.partial(continuation, ccc.Pair.makeList([adder], args.cdr()));
    };
  });
  var environment = new ccc.Environment();
  environment.set('the-machine', transformer);

  var oneSix = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Transformer which always generates the number 16.
      return goog.partial(continuation, 16);
    };
  });
  environment.set('dieciséis', oneSix);

  var needMoreLayers = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Transformer which always generates (the-machine #t 26 (dieciséis))
      return goog.partial(continuation, ccc.core.build(
          ['the-machine', true, 26, ['dieciséis']]));
    };
  });
  environment.set('meta-machine', needMoreLayers);

  RunTests([
    E(['meta-machine'], [adder, 26, 16], environment),
  ]);
}
