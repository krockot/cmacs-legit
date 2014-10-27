// The Cmacs Project.

goog.provide('ccc.EvalTest');
goog.setTestOnly('ccc.EvalTest');

goog.require('ccc.base');
goog.require('ccc.base.stringify');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var List = ccc.Pair.makeList;

function setUpPage() {
  asyncTestCase.stepTimeout = 50;
  asyncTestCase.timeToSleepAfterFailure = 50;
  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(goog.isDef(reason) && goog.isDef(reason.stack)
      ? reason.stack : reason);
  setTimeout(goog.partial(fail, reason), 0);
}

// Single eval test. Takes an input object and an expected output object.
function E(input, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.Environment(opt_environment));
  var evaluator = new ccc.Evaluator(environment);
  return evaluator.evalData(input).then(function(result) {
    if (!ccc.equal(expectedOutput, result))
      return goog.Promise.reject(new Error('Object mismatch.\n' +
          'Expected: ' + ccc.base.stringify(expectedOutput) +
          '\nActual: ' + ccc.base.stringify(result) + '\n'));
  });
}


/**
 * @param {function(!ccc.Environment, !ccc.Object):
 *     !goog.Promise.<!ccc.Object>} transform
 * @constructor
 * @extends {ccc.Transformer}
 */
var TestTransformer = function(transform) {
  this.transform_ = transform;
};
goog.inherits(TestTransformer, ccc.Transformer);

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
  var outer = new ccc.Environment();
  var inner = new ccc.Environment(outer);
  outer.allocate('x').setValue(ccc.T);
  outer.allocate('y').setValue(ccc.T);
  inner.allocate('x').setValue(ccc.F);
  inner.allocate('z').setValue(ccc.NIL);
  assertEquals(ccc.T, outer.get('x').getValue());
  assertEquals(ccc.F, inner.get('x').getValue());
  assertEquals(ccc.T, outer.get('y').getValue());
  assertEquals(ccc.T, inner.get('y').getValue());
  assertEquals(ccc.NIL, inner.get('z').getValue());
  assertNull(outer.get('z'));
}

function testSelfEvaluators() {
  RunTests([
    E('Hello, world!', 'Hello, world!'),
    E(42, 42),
    E(Symbol.for('bananas'), Symbol.for('bananas')),
    E(new ccc.Char(0x03bb), new ccc.Char(0x03bb)),
    E(true, true),
    E(false, false),
    E(ccc.NIL, ccc.NIL),
    E(ccc.UNSPECIFIED, ccc.UNSPECIFIED),
    E([true, false], [true, false]),
  ]);
}

function DISABLED_testSymbolLookup() {
  var environment = new ccc.Environment();
  environment.allocate('answer').setValue(new ccc.Number(42));
  environment.allocate('question').setValue(ccc.UNSPECIFIED);
  RunTests([
    CE(new ccc.Symbol('answer'), new ccc.Number(42), environment),
    CE(new ccc.Symbol('question'), ccc.UNSPECIFIED, environment)
  ]);
}

function testNativeProcedure() {
  var proc = new ccc.NativeProcedure(function(environment, args, continuation) {
    assertNotNull(args);
    assert(ccc.isPair(args));
    assert(ccc.isPair(args.cdr()));
    assert(ccc.isNil(args.cdr().cdr()));
    assert(ccc.equal(args.car(), 42));
    assert(ccc.equal(args.cdr().car(), 'monkey'));
    return continuation(true);
  });
  var combination = List([proc, 42, 'monkey']);
  RunTest(E(combination, true));
}

function DISABLED_testSimpleTransformer() {
  var adder = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.Number(
        args.car().value() + args.cdr().car().value()));
  });
  var transformer = new TestTransformer(function(environment, args) {
    // Throw away the first argument, return (<adder> arg2 arg3).
    return goog.Promise.resolve(List([adder], args.cdr()));
  });
  var environment = new ccc.Environment();
  environment.allocate('the-machine').setValue(transformer);

  // Construct (the-machine #t 26 16). We expect this to compile down to
  // (<adder> 26 16) according to the transformer definition above.
  var form = List([new ccc.Symbol('the-machine'), ccc.T,
      new ccc.Number(26), new ccc.Number(16)]);
  RunTests([
    C(form, List([adder], form.cdr().cdr()), environment),
    CE(form, new ccc.Number(42), environment)
  ]);
}

function DISABLED_testNestedTransformers() {
  var adder = new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.Number(
        args.car().value() + args.cdr().car().value()));
  });
  var transformer = new TestTransformer(function(environment, args) {
    // Throw away the first argument, return (<adder> arg2 arg3).
    return goog.Promise.resolve(List([adder], args.cdr()));
  });
  var environment = new ccc.Environment();
  environment.allocate('the-machine').setValue(transformer);

  var oneSix = new TestTransformer(function(environment, args) {
    // Transformer which always generates the number 16.
    return goog.Promise.resolve(new ccc.Number(16));
  });
  environment.allocate('dieciséis').setValue(oneSix);

  var needMoreLayers = new TestTransformer(function(environment, args) {
    // Transformer which always generates (the-machine #t 26 (dieciséis))
    return goog.Promise.resolve(List([new ccc.Symbol('the-machine'),
        ccc.T, new ccc.Number(26),
        List([new ccc.Symbol('dieciséis')])]));
  });
  environment.allocate('meta-machine').setValue(needMoreLayers);

  var form = List([new ccc.Symbol('meta-machine')]);
  var numbers = List([new ccc.Number(26), new ccc.Number(16)]);
  RunTests([
    C(form, List([adder], numbers), environment),
    CE(form, new ccc.Number(42), environment)
  ]);
}
