// The Cmacs Project.

goog.provide('ccc.ExpandTest');
goog.setTestOnly('ccc.ExpandTest');

goog.require('ccc.MacroExpander');
goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('goog.debug.Console');
goog.require('goog.log.Logger');
goog.require('goog.string.format');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var logger = goog.log.getLogger('ccc.ExpandTest');
var M = function(formalNames, formalTail, bodySpec) {
  return new ccc.MacroExpander(formalNames, formalTail,
      ccc.core.build(bodySpec));
};

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

// Single expansion test. Takes an input object and an expected output object.
function E(input, expectedOutputSpec, opt_environment) {
  return function(callback) {
    var environment = (goog.isDef(opt_environment)
        ? opt_environment
        : new ccc.Environment(opt_environment));
    var thread = new ccc.Thread(ccc.expand(ccc.core.build(input), environment));
    return thread.run(function(result) {
      logger.log(goog.log.Logger.Level.INFO, goog.string.format(
          'Expansion completed in %s thunks in %s ms.', thread.thunkCounter_,
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
  environment.setValue('the-machine', transformer);

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
  environment.setValue('the-machine', transformer);

  var oneSix = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Transformer which always generates the number 16.
      return goog.partial(continuation, 16);
    };
  });
  environment.setValue('dieciséis', oneSix);

  var needMoreLayers = new TestTransformer(function(environment, args) {
    return function(continuation) {
      // Transformer which always generates (the-machine #t 26 (dieciséis))
      return goog.partial(continuation, ccc.core.build(
          ['the-machine', true, 26, ['dieciséis']]));
    };
  });
  environment.setValue('meta-machine', needMoreLayers);

  RunTests([
    E(['meta-machine'], [adder, 26, 16], environment),
  ]);
}

function testMacroSimpleExpansion() {
  var fortyTwo = M([], null, [42]);
  RunTests([
    E([fortyTwo], 42)
  ]);
}

function testMacroDynamicExpansion() {
  // Test that macro body compilation and evaluation happens at expansion time.
  var add = new ccc.NativeProcedure(function(environment, args, continuation) {
    return continuation(args.car() + args.cdr().car());
  });
  var fortyTwo = M([], null, [[add, 40, 2]]);
  RunTests([
    E([fortyTwo], 42)
  ]);
}

function testMacroArgBinding() {
  var list = new ccc.NativeProcedure(function(environment, args, continuation) {
    return continuation(args);
  });
  var cdr = new ccc.NativeProcedure(function(environment, args, continuation) {
    return continuation(args.car().cdr());
  });
  var pickFirst = M(['a', 'b'], null, ['a']);
  var pickSecond = M(['a', 'b'], null, ['b']);
  var flip = M(['a', 'b'], null, [[list, 'b', 'a']]);
  var tail = M([], 'rest', [[cdr, 'rest']]);
  RunTests([
    E([pickFirst, 1, 2], 1),
    E([pickSecond, 1, 2], 2),
    E([flip, 1, 2], [2, 1]),
    E([tail, 1, 2, 3, 4], [2, 3, 4])
  ]);
}
