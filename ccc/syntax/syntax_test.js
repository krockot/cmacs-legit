// The Cmacs Project.

goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.base');
goog.require('ccc.syntax');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

var Define = new ccc.syntax.Define();
var DefineSyntax = new ccc.syntax.DefineSyntax();
var If = new ccc.syntax.If();
var Lambda = new ccc.syntax.Lambda();
var Quote = new ccc.syntax.Quote();
var Set = new ccc.syntax.Set();
var SyntaxRules = new ccc.syntax.SyntaxRules();

var List = ccc.base.Pair.makeList;
var Num = function(value) { return new ccc.base.Number(value); };
var Str = function(value) { return new ccc.base.String(value); };
var Sym = function(name) { return new ccc.base.Symbol(name); };

var FALSE = ccc.base.FALSE;
var NIL = ccc.base.NIL;
var TRUE = ccc.base.TRUE;
var UNSPECIFIED = ccc.base.UNSPECIFIED;


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
    if (!goog.isNull(expectedOutput) && !transformed.equal(expectedOutput)) {
      return goog.Promise.reject('Objet mismatch.\n' +
          'Expected: ' + expectedOutput.toString() +
          '\nActual: ' + transformed.toString() + '\n');
    }
    return transformed;
  });
};

// Single test case which applies a transformer to a list, evaluates the result,
// and then validates the result of the evaluation.
var TE = function(transformer, args, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment());
  var evaluator = new ccc.base.Evaluator(environment);
  return transformer.transform(environment, args).then(function(transformed) {
    return evaluator.evalObject(transformed).then(function(result) {
      if (!goog.isNull(expectedOutput) && !result.equal(expectedOutput))
        return goog.Promise.reject(new Error('Object mismatch.\n' +
            'Expected: ' + expectedOutput.toString() +
            '\nActual: ' + result.toString() + '\n'));
    });
  });
};

// Single test case which transforms a supplied lambda expression and applies
// it to a list of arguments, validating the result.
var TL = function(formalsAndBody, args, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment());
  var evaluator = new ccc.base.Evaluator();
  return Lambda.transform(environment, formalsAndBody).then(function(
      procedureGenerator) {
    var expr = List([procedureGenerator], args);
    return evaluator.evalObject(expr).then(function(result) {
      if (!goog.isNull(expectedOutput) && !result.equal(expectedOutput))
        return goog.Promise.reject(new Error('Object mismatch.\n' +
            'Expected: ' + expectedOutput.toString() +
            '\nActual: ' + result.toString() + '\n'));
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
  var args = List([Sym('foo'), Num(42)]);
  TE(Define, args, ccc.base.UNSPECIFIED, environment).then(function() {
    var foo = environment.get('foo');
    assertNotNull(foo);
    assert(foo.isNumber());
    assertEquals(42, foo.value());
  }).then(continueTesting, justFail);
}

function testBadDefineSyntax() {
  asyncTestCase.waitForAsync();
  var symbol = Sym('bananas');
  ExpectFailures([
    // Define with no arguments.
    T(Define, NIL),
    // Define with only a symbol argument.
    T(Define, List([symbol])),
    // Define with a non-symbol first argument.
    T(Define, List([ccc.base.T, ccc.base.T])),
    // Define with too many arguments!
    T(Define, List([symbol, ccc.base.T, ccc.base.T])),
  ]).then(continueTesting, justFail);
}

function testSet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var defineArgs = List([Sym('foo'), Num(41)]);
  var setArgs = List([Sym('foo'), Num(42)]);

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
  var symbol = Sym('catpants');

  ExpectFailures([
    // Set with no arguments: FAIL!
    T(Set, NIL),
    // Set with only a symbol argument: FAIL!
    T(Set, List([symbol])),
    // Set a non-symbol first argument: FAIL!
    T(Set, List([ccc.base.T, ccc.base.T])),
    // Set with too many arguments: FAIL!
    T(Set, List([symbol, ccc.base.T, ccc.base.T]))
  ]).then(continueTesting, justFail);
}

function testIfTrue() {
  asyncTestCase.waitForAsync();
  var ifArgs = List([NIL, ccc.base.T]);
  TE(If, ifArgs, ccc.base.T).then(continueTesting, justFail);
}

function testIfFalse() {
  asyncTestCase.waitForAsync();
  var ifArgs = List([ccc.base.F, ccc.base.T, NIL]);
  TE(If, ifArgs, NIL).then(continueTesting, justFail);
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
    T(If, NIL),
    // If with only a condition: FAIL!
    T(If, List([ccc.base.T])),
    // If with too many arguments: FAIL!
    T(If, List([ccc.base.T, ccc.base.T, ccc.base.T, NIL])),
    // If with weird improper list: DEFINITELY FAIL!
    T(If, List([ccc.base.T, ccc.base.T], ccc.base.T))
  ]).then(continueTesting, justFail);
}

function testQuote() {
  asyncTestCase.waitForAsync();
  var list = List([ccc.base.T, ccc.base.F, NIL]);
  TE(Quote, List([list]), list).then(continueTesting, justFail);
}

function testBadQuoteSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // No arguments
    T(Quote, NIL),
    // Too many arguments
    T(Quote, List([ccc.base.T, ccc.base.T]))
  ]).then(continueTesting, justFail);
}

function testSimpleLambda() {
  asyncTestCase.waitForAsync();
  var formals = NIL;
  var body = List([ccc.base.T, Num(42)]);
  RunTests([
    TL(List([formals], body), NIL, Num(42))
  ]).then(continueTesting, justFail);
}

function testLambdaClosure() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var formals = List([Sym('x')]);
  var body = List([Sym('x')]);
  environment.set('x', ccc.base.F);
  // Apply the identity lambda and verify that the symbol 'x must have
  // been internally bound to the argument #t.
  TL(List([formals], body), List([ccc.base.T]), ccc.base.T).then(function() {
    // Then also verify that the outer environment's 'x is still bound to #f.
    assertEquals(ccc.base.F, environment.get('x'));
  }).then(continueTesting, justFail);
}

function testLambdaTailArgs() {
  asyncTestCase.waitForAsync();
  var body = List([Sym('rest')]);
  var args = List([Num(1), Num(2), Num(3), Num(4)]);
  var formals1 = List([Sym('foo')], Sym('rest'));
  var formals2 = List([Sym('foo'), Sym('bar')], Sym('rest'));
  var formals4 = List([Sym('a'), Sym('b'), Sym('c'), Sym('d')], Sym('rest'));
  RunTests([
    // ((lambda rest rest) 1 2 3 4) -> (1 2 3 4)
    TL(List([Sym('rest')], body), args, args),
    // ((lambda (foo . rest) rest) 1 2 3 4) -> (2 3 4)
    TL(List([formals1], body), args, args.cdr()),
    // ((lambda (foo bar . rest) rest) 1 2 3 4) -> (3 4)
    TL(List([formals2], body), args, args.cdr().cdr()),
    // ((lambda (a b c d . rest) rest) 1 2 3 4) -> ()
    TL(List([formals4], body), args, NIL)
  ]).then(continueTesting, justFail);
}

function testBadLambdaSyntax() {
  asyncTestCase.waitForAsync();
  ExpectFailures([
    // ((lambda))
    TL(NIL, NIL, NIL),
    // ((lambda foo) 1)
    TL(List([Sym('foo')]), List([Num(1)]), NIL),
    // ((lambda 42) 1)
    TL(List([Num(42)]), List([Num(1)]), NIL),
    // ((lambda foo . foo) 1)
    TL(List([Sym('foo')], Sym('foo')), List([Num(1)]), Num(1))
  ]).then(continueTesting, justFail);
}

function testLambdaTailRecursion() {
  var N = 100;
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  environment.set('x', Num(N));
  var decrementX = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    environment.update('x', Num(environment.get('x').value() - 1));
    return continuation(NIL);
  });
  var xIsPositive = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    if (environment.get('x').value() > 0)
      return continuation(ccc.base.T);
    return continuation(ccc.base.F);
  });
  var incrementZ = new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    environment.update('z', Num(environment.get('z').value() + 1));
    return continuation(ccc.base.T);
  });
  environment.set('z', Num(0));

  var evaluator = new ccc.base.Evaluator(environment);
  If.transform(environment, List([List([xIsPositive]),
      List([Sym('loop')]), ccc.base.T])).then(function(conditional) {
    // Build a procedure and bind it to 'loop:
    // (lambda () (decrementX) (if (xIsPositive) (loop) #t))
    var loopForm = List([NIL, List([decrementX]), List([incrementZ]),
        conditional]);
    return Lambda.transform(environment, loopForm);
  }).then(function(loopGenerator) {
    return evaluator.evalObject(loopGenerator);
  }).then(function(loop) {
    environment.set('loop', loop);
    // Run the loop!
    return evaluator.evalObject(List([Sym('loop')]));
  }).then(function() {
    // Verify that the loop ran N times.
    assertEquals(N, environment.get('z').value());
  }).then(continueTesting, justFail);
}

function testDefineSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  DefineSyntax.transform(environment, List([Sym('cita'), Quote])).then(
      function(result) {
        assertEquals(ccc.base.UNSPECIFIED, result);
        assertEquals(environment.get('cita'), Quote);
  }).then(continueTesting, justFail);
}

function testSyntaxRules() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();

  var literals = List([Sym('::')]);

  // Match (1 :: a) and expand to (quote a)
  var rule1 = List([Num(1), Sym('::'), Sym('a')]);
  var template1 = List([Sym('quote'), Sym('a')]);

  // Match (2 :: a) and expand to (quote a a)
  var rule2 = List([Num(2), Sym('::'), Sym('a')]);
  var template2 = List([Sym('quote'), Sym('a'), Sym('a')]);

  SyntaxRules.transform(environment, List([literals, List([rule1, template1]),
      List([rule2, template2])])).then(function(transformer) {
    return RunTests([
      T(transformer, List([Num(1), Sym('::'), Sym('foo')]),
        List([Sym('quote'), Sym('foo')])),
      T(transformer, List([Num(2), Sym('::'), Sym('foo')]),
        List([Sym('quote'), Sym('foo'), Sym('foo')]))
    ]);
  }).then(continueTesting, justFail);
}
