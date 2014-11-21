// The Cmacs Project.

goog.provide('ccc.syntax.KeywordsTest');
goog.setTestOnly('ccc.syntax.KeywordsTest');

goog.require('ccc.base.all');
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
var logger = goog.log.getLogger('ccc.syntax.KeywordsTest');
var L = function(e, t) { return ccc.Pair.makeList(e, t); };

var notEvaluated = new ccc.NativeProcedure(function(
    environment, args, continuation) {
  justFail(new Error('This should never be evaluated.'));
});

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

// Test case to evaluate a single expression and optionally validate the result.
var T = function(spec, opt_expectedOutputSpec, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment());
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
          return reject('Object mismatch on result of ' +
              ccc.core.stringify(data) + '\n' +
              'Expected: ' + ccc.core.stringify(expectedOutput) +
              '\nActual: ' + ccc.core.stringify(result) + '\n');
      }
      resolve();
    });
  });
};

// Test case which evaluates a single expression and expects failure.
var F = function(spec) {
  return T(spec).then(goog.partial(justFail, 'Expected failure; got success ' +
      'with expression ' + ccc.core.stringify(ccc.core.build(spec))),
      function() {});
};

var RunTests = function(tests) {
  asyncTestCase.waitForAsync();
  return goog.Promise.all(tests).then(continueTesting, justFail);
};

function testDefine() {
  var environment = new ccc.Environment();
  RunTests([
    T(['define', 'foo', 42], ccc.UNSPECIFIED, environment).then(function() {
      var foo = environment.get('foo');
      assertEquals(42, foo.getValue());
    }),
    F(['define']),
    F(['define', 'bananas']),
    F(['define', true, true]),
    F(['define', 'bananas', true, true]),
  ]);
}

function testSet() {
  var environment = new ccc.Environment();
  environment.setValue('bar', 41);
  RunTests([
    F(['set!', 'foo', 42]),
    T(['set!', 'bar', 42], ccc.UNSPECIFIED, environment).then(function() {
      assertEquals(42, environment.get('bar').getValue());
    }),
    F(['set!']),
    F(['set!', 'bananas']),
    F(['set!', true, true]),
    F(['set!', 'bananas', true, true]),
  ]);
}

function testInnerSet() {
  asyncTestCase.waitForAsync();
  var env1 = new ccc.Environment();
  var env2 = new ccc.Environment();
  env1.setValue('x', 41);
  env2.setValue('x', 41);
  RunTests([
    T([['lambda', [], ['set!', 'x', 42], 'x']], 42, env1),
    T([['lambda', ['x'], ['set!', 'x', 2], 'x'], 1], 2, env2).then(function() {
      // The outer |x| should still be bound to 41.
      assertEquals(41, env2.get('x').getValue());
    }),
    T([['lambda', ['y'], ['set!', 'y', 6], 'y'], 1], 6, env1).then(function() {
      // The inner |y| binding shouldn't leak out.
      assertNull(env1.get('y'));
    }),
  ]).then(continueTesting, justFail);
}

function testIf() {
  RunTests([
    T(['if', [], true, [notEvaluated]], true),
    T(['if', 0, true, [notEvaluated]], true),
    T(['if', false, [notEvaluated], []], ccc.NIL),
    T(['if', false, [notEvaluated]], ccc.UNSPECIFIED),
    F(['if']),
    F(['if', true]),
    F(['if', true, true, true, []]),
    F(['if', true, new ccc.Pair(true, true)]),
  ]);
}

function testQuote() {
  RunTests([
    T(['quote', [true, false, []]], [true, false, []]),
    T(['quote', [notEvaluated]], [notEvaluated]),
    F(['quote']),
    F(['quote', true, true]),
  ]);
}

function testLambda() {
  var environment = new ccc.Environment();
  environment.setValue('x', false);
  RunTests([
    T([['lambda', [], 42]], 42),
    T([['lambda', ['x'], 'x'], true], true, environment).then(function() {
      assertEquals(false, environment.get('x').getValue());
    }),
    T([['lambda', 'rest', 'rest'], 1, 2, 3, 4], [1, 2, 3, 4]),
    T([['lambda', L(['foo'], 'rest'), 'rest'], 1, 2, 3, 4], [2, 3, 4]),
    T([['lambda', L(['a', 'b'], 'rest'), 'rest'], 1, 2, 3, 4], [3, 4]),
    T([['lambda', L(['a', 'b', 'c', 'd'], 'rest'), 'rest'], 1, 2, 3, 4], []),
    F(['lambda']),
    F(['lambda', 'foo']),
    F(['lambda', 42]),
    F(L(['lambda', 'foo'], 'foo')),
  ]);
}

function testQuasiquote() {
  var Q = 'quote';
  var QQ = 'quasiquote';
  var UQ = 'unquote';
  var UQS = 'unquote-splicing';
  RunTests([
    T([QQ, 1], 1),
    T([QQ, true], true),
    T([QQ, new String("hello")], new String("hello")),
    T([QQ, 'bananas'], 'bananas'),
    T([QQ, [1, 2, 3]], [1, 2, 3]),
    T([QQ, [1, 2, ['+', 1, 2]]], [1, 2, ['+', 1, 2]]),
    T([QQ, [1, 2, [UQ, ['+', 1, 2]]]], [1, 2, 3]),
    T([QQ, [1, 2, [UQS, [Q, [4, 5, 6]]]]], [1, 2, 4, 5, 6]),
    T([QQ, [1, 2, [UQS, [Q, [4, 5, 6]]], 7]], [1, 2, 4, 5, 6, 7]),
    T([QQ, ccc.Pair.makeList([1, 2], [UQ, ['+', 1, 2]])],
       ccc.Pair.makeList([1, 2], 3)),
    T([QQ, [QQ, [1, 2, [UQ, ['-', [UQ, ['+', 3, 4]]]], 5]]],
      [QQ, [1, 2, [UQ, ['-', 7]], 5]]),
    F([QQ]),
    F([UQ, 1]),
    F([UQS, []]),
    F([QQ, 1, 2]),
    F([QQ, [UQ, [UQ, 1]]]),
  ]);
}
