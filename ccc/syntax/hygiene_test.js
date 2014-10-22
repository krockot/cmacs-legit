// The Cmacs Project.

goog.provide('ccc.syntax.HygieneTest');
goog.setTestOnly('ccc.syntax.HygieneTest');

goog.require('ccc.base')
goog.require('ccc.syntax');
goog.require('ccc.syntax.buildTransformer');
goog.require('ccc.syntax.buildRule');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');

// A test suite to validate hygienic syntax transformation behavior.

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

var BEGIN = ccc.syntax.BEGIN;
var COND = ccc.syntax.COND;
var DEFINE = ccc.syntax.DEFINE;
var DEFINE_SYNTAX = ccc.syntax.DEFINE_SYNTAX;
var IF = ccc.syntax.IF;
var LAMBDA = ccc.syntax.LAMBDA;
var LET = ccc.syntax.LET;
var LET_SYNTAX = ccc.syntax.LET_SYNTAX;
var LETREC = ccc.syntax.LETREC;
var LETSEQ = ccc.syntax.LET_SEQUENTIAL;
var QUOTE = ccc.syntax.QUOTE;
var SET = ccc.syntax.SET;
var SYNTAX_RULES = ccc.syntax.SYNTAX_RULES;

function setUpPage() {
  asyncTestCase.stepTimeout = 100;
  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  continueTesting();
  console.error(goog.isDef(reason.stack) ? reason.stack : reason);
  fail(reason);
}

function T(programSpec, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment);
  var program = ccc.base.build(programSpec);
  var evaluator = new ccc.base.Evaluator(environment);
  return program.compile(environment).then(function(compiledProgram) {
    return evaluator.evalObject(compiledProgram);
  }).then(function(result) {
    if (!result.equal(expectedOutput)) {
      return goog.Promise.reject(new Error('Object mismatch.\n' +
          'Expected: ' + expectedOutput.toString() +
          '\nActual: ' + result.toString() + '\n'));
    }
  });
}

function F(programSpec) {
  return T(programSpec, []).then(
      goog.partial(justFail, new Error('Expected failure, got success')),
      function() {});
}

function RunTests(tests) {
  asyncTestCase.waitForAsync()
  return goog.Promise.all(tests).then(continueTesting, justFail);
}

function testLocalUseBindingsShadowRuleBindings() {
  RunTests([
    /**
     * This is a canonical example taken from R5RS section 4.3.2.
     *
     * (let ((=> #f))
     *   (cond (#t => 'ok)))
     *
     * The outer => binding shadows the COND transformer's syntax literal,
     * preventing the transformer from matching its usage as a literal. Instead
     * of transforming to
     *
     * (let ((temp #t)) (if temp ('ok t)))
     *
     * which would result in an error (because 'ok is not applicable), this
     * transform must yield
     *
     * (let ((=> #f)) (if #t (begin => 'ok)))
     *
     * which is perfectly legal and evaluates to 'ok.
     */
    T([LET, [['=>', false]], [COND, [true, '=>', [QUOTE, 'ok']]]],
      [QUOTE, 'ok']),
  ]);
}
