// The Cmacs Project.

goog.provide('ccc.base.EvalTest');
goog.setTestOnly('ccc.base.EvalTest');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Char');
goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.NativeProcedure');
goog.require('ccc.base.Number');
goog.require('ccc.base.Object');
goog.require('ccc.base.Pair');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.T');
goog.require('ccc.base.Transformer');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.base.Vector');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var List = ccc.base.Pair.makeList;

function setUpPage() {
  asyncTestCase.stepTimeout = 200;
  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  asyncTestCase.continueTesting();
  console.error(goog.isDef(reason.stack) ? reason.stack : reason);
  fail(reason);
}

// Single eval test. Takes an input object and an expected output object.
function E(input, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment(opt_environment));
  return input.eval(environment).then(function(result) {
    if (result.equal(expectedOutput))
      return null;
    return goog.Promise.reject(new Error('Object mismatch.\n' +
        'Expected: ' + expectedOutput.toString() +
        '\nActual: ' + result.toString() + '\n'));
  });
}

// Single compile test. Takes an input object and an expected output object.
function C(input, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment(opt_environment));
  return input.compile(environment).then(function(result) {
    if (result.equal(expectedOutput))
      return null;
    return goog.Promise.reject(new Error('Object mismatch.\n' +
        'Expected: ' + expectedOutput.toString() +
        '\nActual: ' + result.toString() + '\n'));
  });
}

// Single compile + eval test.
function CE(input, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment(opt_environment));
  return input.compile(environment).then(function(compiledInput) {
    return compiledInput.eval(environment).then(function(result) {
      if (result.equal(expectedOutput))
        return null;
      return goog.Promise.reject(new Error('Object mismatch.\n' +
          'Expected: ' + expectedOutput.toString() +
          '\nActual: ' + result.toString() + '\n'));
    });
  });
}

/**
 * @param {function(!ccc.base.Environment, !ccc.base.Object):
 *     !goog.Promise.<!ccc.base.Object>} transform
 * @constructor
 * @extends {ccc.base.Transformer}
 */
var TestTransformer = function(transform) {
  this.transform_ = transform;
};
goog.inherits(TestTransformer, ccc.base.Transformer);

/** @override */
TestTransformer.prototype.transform = function(environment, args) {
  return this.transform_(environment, args);
};

function RunTest(test) {
  asyncTestCase.waitForAsync();
  test.then(continueTesting, justFail);
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
  goog.Promise.all(tests).then(continueTesting, justFail);
}

// Tests below this line

function testEnvironment() {
  var outer = new ccc.base.Environment();
  var inner = new ccc.base.Environment(outer);
  outer.set('x', ccc.base.T);
  outer.set('y', ccc.base.T);
  inner.set('x', ccc.base.F);
  inner.set('z', ccc.base.NIL);
  assertEquals(ccc.base.T, outer.get('x'));
  assertEquals(ccc.base.F, inner.get('x'));
  assertEquals(ccc.base.T, outer.get('y'));
  assertEquals(ccc.base.T, inner.get('y'));
  assertEquals(ccc.base.NIL, inner.get('z'));
  assertNull(outer.get('z'));
}

function testSelfEvaluators() {
  RunTests([
    E(new ccc.base.String('Hello, world!'),
      new ccc.base.String('Hello, world!')),
    E(new ccc.base.Number(42), new ccc.base.Number(42)),
    E(new ccc.base.Char(0x03bb), new ccc.base.Char(0x03bb)),
    E(ccc.base.T, ccc.base.T),
    E(ccc.base.F, ccc.base.F),
    E(ccc.base.NIL, ccc.base.NIL),
    E(ccc.base.UNSPECIFIED, ccc.base.UNSPECIFIED),
    E(new ccc.base.Vector([ccc.base.T, ccc.base.F]),
      new ccc.base.Vector([ccc.base.T, ccc.base.F]))
  ]);
}

function testSymbolLookup() {
  var environment = new ccc.base.Environment();
  environment.set('answer', new ccc.base.Number(42));
  environment.set('question', ccc.base.UNSPECIFIED);
  RunTests([
    E(new ccc.base.Symbol('answer'), new ccc.base.Number(42), environment),
    E(new ccc.base.Symbol('question'), ccc.base.UNSPECIFIED, environment)
  ]);
}

function testNativeProcedure() {
  var proc = new ccc.base.NativeProcedure(function(environment, args) {
    assertNotNull(args);
    assert(args.isPair());
    assert(args.cdr().isPair());
    assert(args.cdr().cdr().isNil());
    assert(args.car().equal(new ccc.base.Number(42)));
    assert(args.cdr().car().equal(new ccc.base.String('monkey')));
    return goog.Promise.resolve(ccc.base.T);
  });
  var combination = List([proc, new ccc.base.Number(42),
    new ccc.base.String('monkey')]);
  RunTest(E(combination, ccc.base.T));
}

function testSimpleTransformer() {
  var adder = new ccc.base.NativeProcedure(function(environment, args) {
    return goog.Promise.resolve(new ccc.base.Number(
        args.car().value() + args.cdr().car().value()));
  });
  var transformer = new TestTransformer(function(environment, args) {
    // Throw away the first argument, return (<adder> arg2 arg3).
    return goog.Promise.resolve(List([adder], args.cdr()));
  });
  var environment = new ccc.base.Environment();
  environment.set('the-machine', transformer);

  // Construct (the-machine #t 26 16). We expect this to compile down to
  // (<adder> 26 16) according to the transformer definition above.
  var form = List([new ccc.base.Symbol('the-machine'), ccc.base.T,
      new ccc.base.Number(26), new ccc.base.Number(16)]);
  RunTests([
    C(form, List([adder], form.cdr().cdr()), environment),
    CE(form, new ccc.base.Number(42), environment)
  ]);
}

function testNestedTransformers() {
  var adder = new ccc.base.NativeProcedure(function(environment, args) {
    return goog.Promise.resolve(new ccc.base.Number(
        args.car().value() + args.cdr().car().value()));
  });
  var transformer = new TestTransformer(function(environment, args) {
    // Throw away the first argument, return (<adder> arg2 arg3).
    return goog.Promise.resolve(List([adder], args.cdr()));
  });
  var environment = new ccc.base.Environment();
  environment.set('the-machine', transformer);

  var oneSix = new TestTransformer(function(environment, args) {
    // Transformer which always generates the number 16.
    return goog.Promise.resolve(new ccc.base.Number(16));
  });
  environment.set('dieciséis', oneSix);

  var needMoreLayers = new TestTransformer(function(environment, args) {
    // Transformer which always generates (the-machine #t 26 (dieciséis))
    return goog.Promise.resolve(List([new ccc.base.Symbol('the-machine'),
        ccc.base.T, new ccc.base.Number(26),
        List([new ccc.base.Symbol('dieciséis')])]));
  });
  environment.set('meta-machine', needMoreLayers);

  var form = List([new ccc.base.Symbol('meta-machine')]);
  var numbers = List([new ccc.base.Number(26), new ccc.base.Number(16)]);
  RunTests([
    C(form, List([adder], numbers), environment),
    CE(form, new ccc.base.Number(42), environment)
  ]);
}
