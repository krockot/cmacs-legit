// The Cmacs Project.


goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Number');
goog.require('ccc.base.Pair');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.syntax.Define');
goog.require('ccc.syntax.If');
goog.require('ccc.syntax.Lambda');
goog.require('ccc.syntax.Quote');
goog.require('ccc.syntax.Set');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var List = ccc.base.Pair.makeList;
var Define = new ccc.syntax.Define();
var If = new ccc.syntax.If();
var Lambda = new ccc.syntax.Lambda();
var Quote = new ccc.syntax.Quote();
var Set = new ccc.syntax.Set();

function setUpPage() {
  asyncTestCase.stepTimeout = 100;

  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  continueTesting();
  reason && reason.stack && console.error(reason.stack);
  fail(reason);
}

// Single test case which applies a transformer to a list and validates the
// resulting object.
var T = function(transformer, args, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment());
  return transformer.transform(environment, args).then(function(transformed) {
    assertNotNull(transformed);
    if (!goog.isNull(expectedOutput))
      assert(transformed.equal(expectedOutput));
    return transformed;
  });
};

// Single test case which applies a transformer to a list, evaluates the result,
// and then validates the result of the evaluation.
var TE = function(transformer, args, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment());
  return transformer.transform(environment, args).then(function(transformed) {
    return transformed.eval(environment).then(function(result) {
      assertNotNull(result);
      if (!goog.isNull(expectedOutput))
        assert(result.equal(expectedOutput));
      return result;
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
  }, continueTesting);
};

function testDefine() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var args = List([new ccc.base.Symbol('foo'), new ccc.base.Number(42)]);
  TE(Define, args, ccc.base.UNSPECIFIED, environment).then(function() {
    var foo = environment.get('foo');
    assertNotNull(foo);
    assert(foo.isNumber());
    assertEquals(42, foo.value());
  }).then(continueTesting, justFail);
}

function testBadDefineSyntax() {
  asyncTestCase.waitForAsync();
  var symbol = new ccc.base.Symbol('bananas');
  ExpectFailures([
    // Define with no arguments.
    T(Define, ccc.base.NIL),
    // Define with only a symbol argument.
    T(Define, List([symbol])),
    // Define with a non-symbol first argument.
    T(Define, List([ccc.base.T, ccc.base.T])),
    // Define with too many arguments!
    T(Define, List([symbol, ccc.base.T, ccc.base.T])),
  ]);
}

function testSet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var defineArgs = List([new ccc.base.Symbol('foo'), new ccc.base.Number(41)]);
  var setArgs = List([new ccc.base.Symbol('foo'), new ccc.base.Number(42)]);

  // First try to set unbound symbol 'foo and expect it to fail.
  TE(Set, setArgs, null, environment).then(justFail).thenCatch(function() {
    // Now bind foo to 41
    return TE(Define, defineArgs, null, environment).then(function() {
      var foo = environment.get('foo');
      assertNotNull(foo);
      assert(foo.isNumber());
      assertEquals(41, foo.value());
      // And finally set the existing binding to 42
      return TE(Set, setArgs, null, environment).then(function() {
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
  var symbol = new ccc.base.Symbol('catpants');

  ExpectFailures([
    // Set with no arguments: FAIL!
    T(Set, ccc.base.NIL),
    // Set with only a symbol argument: FAIL!
    T(Set, List([symbol])),
    // Set a non-symbol first argument: FAIL!
    T(Set, List([ccc.base.T, ccc.base.T])),
    // Set with too many arguments: FAIL!
    T(Set, List([symbol, ccc.base.T, ccc.base.T]))
  ]);
}

function testIfTrue() {
  asyncTestCase.waitForAsync();
  var ifArgs = List([ccc.base.NIL, ccc.base.T]);
  TE(If, ifArgs, ccc.base.T).then(continueTesting, justFail);
}

function testIfFalse() {
  asyncTestCase.waitForAsync();
  var ifArgs = List([ccc.base.F, ccc.base.T, ccc.base.NIL]);
  TE(If, ifArgs, ccc.base.NIL).then(continueTesting, justFail);
}

function testIfFalseWithNoAlternate() {
  asyncTestCase.waitForAsync();
  var ifArgs = List([ccc.base.F, ccc.base.T]);
  TE(If, ifArgs, ccc.base.UNSPECIFIED).then(continueTesting, justFail);
}

function testBadIfSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // If with no arguments: FAIL!
    T(If, ccc.base.NIL),
    // If with only a condition: FAIL!
    T(If, List([ccc.base.T])),
    // If with too many arguments: FAIL!
    T(If, List([ccc.base.T, ccc.base.T, ccc.base.T, ccc.base.NIL])),
    // If with weird improper list: DEFINITELY FAIL!
    T(If, List([ccc.base.T, ccc.base.T], ccc.base.T))
  ]);
}

function testQuote() {
  asyncTestCase.waitForAsync();
  var list = List([ccc.base.T, ccc.base.F, ccc.base.NIL]);
  TE(Quote, List([list]), list).then(continueTesting, justFail);
}

function testBadQuoteSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // No arguments
    T(Quote, ccc.base.NIL),
    // Too many arguments
    T(Quote, List([ccc.base.T, ccc.base.T]))
  ]);
}

function testSimpleLambda() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var formals = ccc.base.NIL;
  var body = List([ccc.base.T, new ccc.base.Number(42)]);
  var args = List([formals], body);
  TE(Lambda, args, null, environment).then(function(lambda) {
    assertNotNull(lambda);
    assert(lambda.isProcedure());
    return lambda.apply(environment, ccc.base.NIL).then(function(result) {
      assertNotNull(result);
      assert(result.isNumber());
      assertEquals(42, result.value());
    });
  }).then(continueTesting, justFail);
}


function testLambdaClosure() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var formals = List([new ccc.base.Symbol('x')]);
  var body = List([new ccc.base.Symbol('x')]);
  var lambdaArgs = List([formals], body);
  environment.set('x', ccc.base.F);
  TE(Lambda, lambdaArgs, null, environment).then(function(lambda) {
    // Apply the identity lambda and verify that the symbol 'x must have
    // been internally bound to the argument #t.
    lambda.apply(environment, ccc.base.Pair.makeList([ccc.base.T])).then(
        goog.partial(assertEquals, ccc.base.T)).then(function() {
      // Then also verify that the outer environment's 'x is still bound to #f.
      assertEquals(ccc.base.F, environment.get('x'));
    });
  }).then(continueTesting, justFail);
}
