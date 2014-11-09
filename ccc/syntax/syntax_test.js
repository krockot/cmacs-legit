// The Cmacs Project.

goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('ccc.syntax');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

var BEGIN = ccc.syntax.BEGIN;
var DEFINE = ccc.syntax.DEFINE;
var DEFMACRO = ccc.syntax.DEFMACRO;
var IF = ccc.syntax.IF;
var LAMBDA = ccc.syntax.LAMBDA;
var QUOTE = ccc.syntax.QUOTE;
var SET = ccc.syntax.SET;

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 100;
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(reason);
  console.error(goog.isDef(reason) && goog.isDef(reason.stack)
      ? reason.stack : reason);
  setTimeout(goog.partial(fail, reason), 0);
}

// Single test case which applies a transformer to a list and validates the
// resulting object.
var T = function(
    transformer, argsSpec, opt_expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment());
  var args = ccc.core.build(argsSpec);
  var thread = new ccc.Thread(transformer.transform(environment, args));
  return thread.run().then(function(transformed) {
    assertNotNull(transformed);
    if (goog.isDef(opt_expectedOutputSpec)) {
      var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
      if (!ccc.equal(transformed, expectedOutput))
        return goog.Promise.reject('Object mismatch.\n' +
            'Expected: ' + ccc.core.stringify(expectedOutput) +
            '\nActual: ' + ccc.core.stringify(transformed) + '\n');
    }
    return transformed;
  });
};

var F = function(transformer, argsSpec) {
  return T(transformer, argsSpec).then(
      goog.partial(justFail, 'Expected failure; got success'),
      function() {});
};

// Single test case which applies a transformer to a list, evaluates the result,
// and then validates the result of the evaluation.
var TE = function(
    transformer, argsSpec, opt_expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment());
  var form = new ccc.Pair(transformer, ccc.core.build(argsSpec));
  var thread = new ccc.Thread(ccc.evalSource(form, environment));
  return thread.run().then(function(result) {
    if (goog.isDef(opt_expectedOutputSpec)) {
      var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
      if (!ccc.equal(result, expectedOutput))
        return goog.Promise.reject('Object mismatch.\n' +
            'Expected: ' + ccc.core.stringify(expectedOutput) +
            '\nActual: ' + ccc.core.stringify(result) + '\n');
    }
  });
};

var FE = function(transformer, argsSpec) {
  return TE(transformer, argsSpec).then(
      goog.partial(justFail, 'Expected failure; got success'),
      function() {});
};

// Single test case which transforms a supplied lambda expression and applies
// it to a list of arguments, validating the result.
var TL = function(
    formalsAndBodySpec, argsSpec, opt_expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment());
  var lambdaForm = new ccc.Pair(LAMBDA, ccc.core.build(formalsAndBodySpec));
  var callForm = new ccc.Pair(lambdaForm, ccc.core.build(argsSpec));
  var thread = new ccc.Thread(ccc.evalSource(callForm, environment));
  return thread.run().then(function(result) {
    if (goog.isDef(opt_expectedOutputSpec)) {
      var expectedOutput = ccc.core.build(opt_expectedOutputSpec);
      if (!ccc.equal(result, expectedOutput))
        return goog.Promise.reject('Object mismatch.\n' +
            'Expected: ' + ccc.core.stringify(expectedOutput) +
            '\nActual: ' + ccc.core.stringify(result) + '\n');
    }
  });
};

var RunTests = function(tests) {
  return goog.Promise.all(tests);
};

var ExpectFailures = function(tests) {
  return goog.Promise.firstFulfilled(tests).then(function(result) {
    justFail(new Error('Expected failure; got success with ' +
        result.toString()));
  }).thenCatch(function() {});
};

function testDefine() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.Environment();
  TE(DEFINE, ['foo', 42], ccc.UNSPECIFIED, environment).then(function() {
    var foo = environment.get('foo');
    assert(ccc.isNumber(foo));
    assertEquals(42, foo);
  }).then(continueTesting, justFail);
}

function testBadDefineSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // DEFINE with no arguments.
    T(DEFINE, []),
    // DEFINE with only a symbol argument.
    T(DEFINE, ['bananas']),
    // DEFINE with a non-symbol first argument.
    T(DEFINE, [true, true]),
    // DEFINE with too many arguments!
    T(DEFINE, ['bananas', true, true]),
  ]).then(continueTesting, justFail);
}

function testSet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.Environment();
  console.log('the fuck');
  // First try to set unbound symbol 'foo and expect it to fail.
  TE(SET, ['foo', 42], undefined, environment).then(justFail).thenCatch(
      function() {
    // Now bind foo to 41
    return TE(DEFINE, ['foo', 41], undefined, environment).then(function() {
      var foo = environment.get('foo');
      assertNotNull(foo);
      assertEquals(41, foo);
      // And finally set the existing binding to 42
      return TE(SET, ['foo', 42], undefined, environment).then(function() {
        var foo = environment.get('foo');
        assertNotNull(foo)
        assertEquals(42, foo);
      });
    });
  }).then(continueTesting, justFail);
}

function testBadSetSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // SET with no arguments: FAIL!
    T(SET, []),
    // SET with only a symbol argument: FAIL!
    T(SET, ['bananas']),
    // SET a non-symbol first argument: FAIL!
    T(SET, [true, true]),
    // SET with too many arguments: FAIL!
    T(SET, ['bananas', true, true]),
  ]).then(continueTesting, justFail);
}

function testIfTrue() {
  asyncTestCase.waitForAsync();
  TE(IF, [[], true], true).then(continueTesting, justFail);
}

function testIfFalse() {
  asyncTestCase.waitForAsync();
  TE(IF, [false, true, []], []).then(continueTesting, justFail);
}

function testIfFalseWithNoAlternateIsUnspecified() {
  asyncTestCase.waitForAsync();
  TE(IF, [false, true], ccc.UNSPECIFIED).then(continueTesting, justFail);
}

function testBadIfSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // IF with no arguments: FAIL!
    T(IF, []),
    // IF with only a condition: FAIL!
    T(IF, [true]),
    // IF with too many arguments: FAIL!
    T(IF, [true, true, true, []]),
    // IF with weird improper list: DEFINITELY FAIL!
    T(IF, ccc.Pair.makeList([true, true], true)),
  ]).then(continueTesting, justFail);
}

function testQuote() {
  asyncTestCase.waitForAsync();
  var list = [true, false, []];
  TE(QUOTE, [list], list).then(continueTesting, justFail);
}

function testBadQuoteSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // No arguments
    T(QUOTE, []),
    // Too many arguments
    T(QUOTE, [true, true]),
  ]).then(continueTesting, justFail);
}

function testSimpleLambda() {
  asyncTestCase.waitForAsync();
  RunTests([
    TL([[], true, 42], [], 42)
  ]).then(continueTesting, justFail);
}

function testLambdaClosure() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.Environment();
  environment.set('x', false);
  // Apply the identity lambda and verify that the symbol 'x must have
  // been internally bound to the argument #t.
  TL([['x'], 'x'], [true], true).then(function() {
    // Then also verify that the outer environment's 'x is still bound to #f.
    assertEquals(false, environment.get('x'));
  }).then(continueTesting, justFail);
}

function testLambdaTailArgs() {
  asyncTestCase.waitForAsync();
  RunTests([
    // ((lambda rest rest) 1 2 3 4) -> (1 2 3 4)
    TL(['rest', 'rest'], [1, 2, 3, 4], [1, 2, 3, 4]),
    // ((lambda (foo . rest) rest) 1 2 3 4) -> (2 3 4)
    TL([ccc.Pair.makeList(['foo'], 'rest'), 'rest'], [1, 2, 3, 4], [2, 3, 4]),
    // ((lambda (a b . rest) rest) 1 2 3 4) -> (3 4)
    TL([ccc.Pair.makeList(['a', 'b'], 'rest'), 'rest'], [1, 2, 3, 4], [3, 4]),
    // ((lambda (a b c d . rest) rest) 1 2 3 4) -> ()
    TL([ccc.Pair.makeList(['a', 'b', 'c', 'd'], 'rest'), 'rest'],
       [1, 2, 3, 4],
       []),
  ]).then(continueTesting, justFail);
}

function testBadLambdaSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // ((lambda))
    TL([], [], []),
    // ((lambda foo) 1)
    TL(['foo'], [1], []),
    // ((lambda 42) 1)
    TL([42], [1], []),
    // ((lambda foo . foo) 1)
    TL([ccc.Pair.makeList(['foo'], 'foo')], [1], 1),
  ]).then(continueTesting, justFail);
}

function testBegin() {
  asyncTestCase.waitForAsync();
  var count = 0;
  var native1 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(0, count++);
    return continuation(1);
  });
  var native2 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(1, count++);
    return continuation(2);
  });
  var native3 = new ccc.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(2, count);
    return continuation(3);
  });
  TE(BEGIN, [[native1], [native2], [native3]], 3).then(
      continueTesting, justFail);
}

function DISABLED_testLet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  environment.allocate('foo').setValue(new ccc.base.Number(9));
  RunTests([
    // |foo| will be bound within the closure but retain its outer binding after
    TE(LET, [[['foo', 42]], 'foo'], 42).then(function() {
      assert(environment.get('foo').getValue().eq(new ccc.base.Number(9)));
    }),
    // Will throw an error because |bar| is unbound during |foo| binding
    FE(LET, [[['bar', 42], ['foo', 'bar']], 'foo'])
  ]).then(continueTesting, justFail);
}

function DISABLED_testLetSeq() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  RunTests([
    TE(LETSEQ, [[['foo', 42], ['bar', 'foo']], 'bar'], 42),
  ]).then(continueTesting, justFail);
}

function DISABLED_testLetRec() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var z = environment.allocate('z');
  z.setValue(new ccc.base.Number(0));
  var isZero = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    return continuation((args.isPair() && args.car().isNumber() &&
        args.car().value() == 0) ? ccc.base.T : ccc.base.F);
  });
  var minusOne = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    return continuation(new ccc.base.Number(args.car().value() - 1));
  });
  var addOne = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    return continuation(new ccc.base.Number(args.car().value() + 1));
  })
  RunTests([
    TE(LETREC, [
        [['f', [LAMBDA, ['x'],
                  [IF, [isZero, 'x'], true, ['g', 'x']]]],
         ['g', [LAMBDA, ['x'],
                  [SET, 'z', [addOne, 'z']],
                  ['f', [minusOne, 'x']]]]],
        ['f', 10]], undefined, environment).then(function() {
      assert(z.getValue().eq(new ccc.base.Number(10)));
    }),
  ]).then(continueTesting, justFail);
}
