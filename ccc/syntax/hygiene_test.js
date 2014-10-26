// The Cmacs Project.

goog.provide('ccc.syntax.HygieneTest');
goog.setTestOnly('ccc.syntax.HygieneTest');

goog.require('ccc.base')
goog.require('ccc.syntax');
goog.require('ccc.syntax.buildTransformer');
goog.require('ccc.syntax.buildRule');
goog.require('goog.Promise');
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

function T(programSpec, expectedOutput, opt_environment) {
  var environment = (goog.isDef(opt_environment)
      ? opt_environment
      : new ccc.base.Environment);
  var program = ccc.base.build(programSpec);
  var evaluator = new ccc.base.Evaluator(environment);
  return program.compile(environment).then(function(compiledProgram) {
    return evaluator.evalObject(compiledProgram);
  }).then(function(result) {
    if (!result.equal(ccc.base.build(expectedOutput))) {
      return goog.Promise.reject(new Error('Object mismatch.\n' +
          'Expected: ' + expectedOutput.toString() +
          '\nActual: ' + result.toString() + '\n'));
    }
  });
}

function RunTests(tests) {
  asyncTestCase.waitForAsync();
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
    T([LET, [['=>', false]],
        [COND, [true, '=>', [QUOTE, 'ok']]]],
      'ok'),
  ]);
}

function testLetSyntaxEnvironmentIsolation() {
  var environment = new ccc.base.Environment();
  environment.allocate('if').setValue(IF);

  RunTests([
    /**
     * An example from R5RS section 4.3.1.
     *
     * (let-syntax ((when (syntax-rules ()
     *                      ((when test stmt0 stmt ...)
     *                       (if test
     *                           (begin stmt0
     *                                  stmt ...))))))
     *   (let ((if #t))
     *     (when if (set! if 'now))
     *     if))
     *
     * This should evaluate to 'now, because the 'if within the syntax rules
     * is expanded outside of the inner LET's environment, and the expansion is
     * in turn evaluated within the inner LET's environment.
     *
     * If things are awry, this can likely fail either because #t is not
     * applicable or because the expanded form will try to evaluate the IF
     * transformer.
     */
    T([LET_SYNTAX, [['when', [SYNTAX_RULES, [],
                          [['when', 'test', 'stmt0', 'stmt', '...'],
                           [IF, 'test', [BEGIN, 'stmt0', 'stmt', '...']]]]]],
          [LET, [['if', true]],
            ['when', 'if', [SET, 'if', [QUOTE, 'now']]],
            'if']],
      'now', environment),
  ]);
}

function testEmittedSymbolLiteralsEvaluateInCapturedEnvironment() {
  RunTests([
    /**
     * Another example from R5RS 4.3.1.
     *
     * (let ((x 'outer))
     *   (let-syntax ((m (syntax-rules () ((m) x))))
     *     (let ((x 'inner))
     *       (m))))
     *
     * This should evaluate to 'outer. Because the symbol 'x is emitted by
     * the expansion rather than via capture substitution, it's evaluated in
     * the environment of the transformer rather than of that of the
     * invocation.
     *
     * If this isn't working correctly, the output will likely be 'inner.
     */
    T([LET, [['x', [QUOTE, 'outer']]],
        [LET_SYNTAX, [['m', [SYNTAX_RULES, [], [['m'], 'x']]]],
          [LET, [['x', [QUOTE, 'inner']]],
            ['m']]]],
      'outer'),
  ]);
}

function testTemplateBindingHygiene() {
  var environment = new ccc.base.Environment();
  // A little math.
  environment.allocate('*').setValue(new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() * args.cdr().car().value()));
  }));
  environment.allocate('+').setValue(new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() + args.cdr().car().value()));
  }));
  RunTests([
    /**
     * A contrived example in wherein a template expansion should internally
     * shadow an outer binding, while still resolving the outer binding properly
     * when referenced in the transformer use.
     *
     * This really tests that bindings introduced by macro expansions are
     * quietly rewritten to avoid collision with outer bindings.
     *
     * ((let ((foo 1))
     *    (let-syntax
     *      ((hax (syntax-rules ()
     *         ((hax a)
     *          (let ((foo 6))
     *            (lambda () (* foo (+ foo a))))))))
     *      (hax foo))))
     *
     * This whole form should ultimately expand to
     *
     * ((lambda () (* <inner-foo> (+ <inner-foo> <outer-foo>))))
     *
     * and evaluate to 42. It something is broken, we should instead see either
     * 7 (values swapped), 2 (both bindings are 1), or 72 (both bindings are 6).
     */
     T([[LET, [['foo', 1]],
          [LET_SYNTAX,
            [['hax', [SYNTAX_RULES, [],
              [['hax', 'a'],
               [LET, [['foo', 6]],
                  [LAMBDA, [], ['*', 'foo', ['+', 'foo', 'a']]]]]]]],
            ['hax', 'foo']]]],
       42, environment),
  ]);
}
