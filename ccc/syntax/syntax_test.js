// The Cmacs Project.

goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.base');
goog.require('ccc.syntax');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

var BEGIN = ccc.syntax.BEGIN;
var DEFINE = ccc.syntax.DEFINE;
var DEFINE_SYNTAX = ccc.syntax.DEFINE_SYNTAX;
var IF = ccc.syntax.IF;
var LAMBDA = ccc.syntax.LAMBDA;
var LET = ccc.syntax.LET;
var LET_SYNTAX = ccc.syntax.LET_SYNTAX;
var LETREC = ccc.syntax.LETREC;
var LETSEQ = ccc.syntax.LETSEQ;
var QUOTE = ccc.syntax.QUOTE;
var SET = ccc.syntax.SET;
var SYNTAX_RULES = ccc.syntax.SYNTAX_RULES;

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
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
      : new ccc.base.Environment());
  var args = ccc.base.build(argsSpec);
  return transformer.transform(environment, args).then(function(transformed) {
    assertNotNull(transformed);
    if (goog.isDef(opt_expectedOutputSpec)) {
      var expectedOutput = ccc.base.build(opt_expectedOutputSpec);
      if (!transformed.equal(expectedOutput))
        return goog.Promise.reject('Objet mismatch.\n' +
            'Expected: ' + expectedOutput.toString() +
            '\nActual: ' + transformed.toString() + '\n');
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
      : new ccc.base.Environment());
  var evaluator = new ccc.base.Evaluator(environment);
  var form = new ccc.base.Pair(transformer, ccc.base.build(argsSpec));
  return form.compile(environment).then(function(compiledForm) {
    return evaluator.evalObject(compiledForm).then(function(result) {
      if (goog.isDef(opt_expectedOutputSpec)) {
        var expectedOutput = ccc.base.build(opt_expectedOutputSpec);
        if (!result.equal(expectedOutput))
          return goog.Promise.reject(new Error('Object mismatch.\n' +
              'Expected: ' + expectedOutput.toString() +
              '\nActual: ' + result.toString() + '\n'));
      }
    });
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
      : new ccc.base.Environment());
  var evaluator = new ccc.base.Evaluator(environment);
  var form = new ccc.base.Pair(LAMBDA, ccc.base.build(formalsAndBodySpec));
  var args = ccc.base.build(argsSpec);
  return form.compile(environment).then(function(procedureGenerator) {
    var callExpr = new ccc.base.Pair(procedureGenerator, args);
    return evaluator.evalObject(callExpr).then(function(result) {
      if (goog.isDef(opt_expectedOutputSpec)) {
        var expectedOutput = ccc.base.build(opt_expectedOutputSpec);
        if (!result.equal(expectedOutput))
          return goog.Promise.reject(new Error('Object mismatch.\n' +
              'Expected: ' + expectedOutput.toString() +
              '\nActual: ' + result.toString() + '\n'));
      }
    });
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
  var environment = new ccc.base.Environment();
  TE(DEFINE, ['foo', 42], ccc.base.UNSPECIFIED, environment).then(function() {
    var foo = environment.get('foo');
    assertNotNull(foo);
    assert(foo.isNumber());
    assertEquals(42, foo.value());
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
  var environment = new ccc.base.Environment();
  // First try to set unbound symbol 'foo and expect it to fail.
  TE(SET, ['foo', 42], null, environment).then(justFail).thenCatch(function() {
    // Now bind foo to 41
    return TE(DEFINE, ['foo', 41], undefined, environment).then(function() {
      var foo = environment.get('foo');
      assertNotNull(foo);
      assert(foo.isNumber());
      assertEquals(41, foo.value());
      // And finally set the existing binding to 42
      return TE(SET, ['foo', 42], undefined, environment).then(function() {
        var foo = environment.get('foo');
        assertNotNull(foo);
        assert(foo.isNumber());
        assertEquals(42, foo.value());
      });
    });
  }).then(continueTesting);
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
  TE(IF, [false, true], ccc.base.UNSPECIFIED).then(continueTesting, justFail);
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
    T(IF, { 'list': [true, true], 'tail': true }),
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
  var environment = new ccc.base.Environment();
  environment.set('x', ccc.base.F);
  // Apply the identity lambda and verify that the symbol 'x must have
  // been internally bound to the argument #t.
  TL([['x'], 'x'], [true], true).then(function() {
    // Then also verify that the outer environment's 'x is still bound to #f.
    assertEquals(ccc.base.F, environment.get('x'));
  }).then(continueTesting, justFail);
}

function testLambdaTailArgs() {
  asyncTestCase.waitForAsync();
  RunTests([
    // ((lambda rest rest) 1 2 3 4) -> (1 2 3 4)
    TL(['rest', 'rest'], [1, 2, 3, 4], [1, 2, 3, 4]),
    // ((lambda (foo . rest) rest) 1 2 3 4) -> (2 3 4)
    TL([{ 'list': ['foo'], 'tail': 'rest' }, 'rest'], [1, 2, 3, 4], [2, 3, 4]),
    // ((lambda (a b . rest) rest) 1 2 3 4) -> (3 4)
    TL([{ 'list': ['a', 'b'], 'tail': 'rest' }, 'rest'], [1, 2, 3, 4], [3, 4]),
    // ((lambda (a b c d . rest) rest) 1 2 3 4) -> ()
    TL([{ 'list': ['a', 'b', 'c', 'd'], 'tail': 'rest' }, 'rest'],
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
    TL([{ 'list': ['foo'], 'tail': 'foo' }, 1], [1], 1),
  ]).then(continueTesting, justFail);
}

function testLambdaTailRecursion() {
  var N = 100;
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  environment.set('x', new ccc.base.Number(N));
  var decrementX = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    environment.update('x', new ccc.base.Number(
        environment.get('x').value() - 1));
    return continuation(ccc.base.NIL);
  });
  var xIsPositive = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    if (environment.get('x').value() > 0)
      return continuation(ccc.base.T);
    return continuation(ccc.base.F);
  });
  var incrementZ = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    environment.update('z', new ccc.base.Number(
        environment.get('z').value() + 1));
    return continuation(ccc.base.T);
  });
  environment.set('z', new ccc.base.Number(0));

  var evaluator = new ccc.base.Evaluator(environment);
  var ifForm = ccc.base.build([[xIsPositive], ['loop'], true]);
  IF.transform(environment, ifForm).then(function(conditional) {
    // Build a procedure and bind it to 'loop:
    // (lambda () (decrementX) (if (xIsPositive) (loop) #t))
    var loop = ccc.base.build([[], [decrementX], [incrementZ], conditional]);
    return LAMBDA.transform(environment, loop);
  }).then(function(loopGenerator) {
    return evaluator.evalObject(loopGenerator);
  }).then(function(loop) {
    environment.set('loop', loop);
    // Run the loop!
    return evaluator.evalObject(ccc.base.build(['loop']));
  }).then(function() {
    // Verify that the loop ran N times.
    assertEquals(N, environment.get('z').value());
  }).then(continueTesting, justFail);
}

function testDefineSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  T(DEFINE_SYNTAX, ['cita', QUOTE], ccc.base.UNSPECIFIED, environment).then(
      function(result) {
    assertEquals(environment.get('cita'), QUOTE);
  }).then(continueTesting, justFail);
}

function testSyntaxRules() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  environment.set('quote', QUOTE);

  var literals = ['::'];

  // Match (_ 1 :: a) and expand to (quote a)
  var pattern1 = ['_', 1, '::', 'a'];
  var template1 = ['quote', 'a'];

  // Match (_ 2 :: a) and expand to (quote a a)
  var pattern2 = ['_', 2, '::', 'a'];
  var template2 = ['quote', ['a', 'a']];

  var rules = [literals, [pattern1, template1], [pattern2, template2]];

  T(SYNTAX_RULES, rules, undefined, environment).then(function(transformer) {
    return RunTests([
      TE(transformer, [1, '::', 'foo'], 'foo'),
      TE(transformer, [2, '::', 'foo'], ['foo', 'foo']),
      F(transformer, [3, '::', 'foo']),
    ]);
  }).then(continueTesting, justFail);
}

function testBegin() {
  asyncTestCase.waitForAsync();
  var count = 0;
  var native1 = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(0, count++);
    return continuation(new ccc.base.Number(1));
  });
  var native2 = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(1, count++);
    return continuation(new ccc.base.Number(2));
  });
  var native3 = new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
    assertEquals(2, count);
    return continuation(new ccc.base.Number(3));
  });
  TE(BEGIN, [[native1], [native2], [native3]], 3).then(
      continueTesting, justFail);
}

function testLet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  environment.set('foo', new ccc.base.Number(9));
  RunTests([
    // |foo| will be bound within the closure but retain its outer binding after
    TE(LET, [[['foo', 42]], 'foo'], 42).then(function() {
      assert(environment.get('foo').eq(new ccc.base.Number(9)));
    }),
    // Will throw an error because |bar| is unbound during |foo| binding
    FE(LET, [[['bar', 42], ['foo', 'bar']], 'foo'])
  ]).then(continueTesting, justFail);
}

function testLetSeq() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  RunTests([
    TE(LETSEQ, [[['foo', 42], ['bar', 'foo']], 'bar'], 42),
  ]).then(continueTesting, justFail);
}

function testLetRec() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
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
  environment.set('z', new ccc.base.Number(0));
  RunTests([
    TE(LETREC, [
        [['f', [LAMBDA, ['x'],
                  [IF, [isZero, 'x'], true, ['g', 'x']]]],
         ['g', [LAMBDA, ['x'],
                  [SET, 'z', [addOne, 'z']],
                  ['f', [minusOne, 'x']]]]],
        ['f', 10]], undefined, environment).then(function() {
      assert(environment.get('z').eq(new ccc.base.Number(10)));
    }),
  ]).then(continueTesting, justFail);
}
