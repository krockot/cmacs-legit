// The Cmacs Project.

goog.provide('ccc.syntax.COND');

goog.require('ccc.base');
goog.require('ccc.syntax.BEGIN');
goog.require('ccc.syntax.IF');
goog.require('ccc.syntax.LET');
goog.require('ccc.syntax.buildTransformer');
goog.require('ccc.syntax.buildRule');


/**
 * Literals used by COND rules. The definition given here is adapted directly
 * from R5RS Section 7.3.
 *
 * @private {!Array.<string>}
 * @const
 */
ccc.syntax.COND_LITERALS_ = ['else', '=>'];


/**
 * The COND transformer provides syntactic sugar for a chain of conditionals.
 *
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.COND = ccc.syntax.buildTransformer([
  // COND with only an else clause
  [
    // ((else result0 result ...))
    [['else', 'result0', 'result', '...']],
    // (begin result0 result ...)
    [ccc.syntax.BEGIN, 'result0', 'result', '...']
  ],
], ccc.syntax.COND_LITERALS_);


ccc.syntax.COND.addRules(ccc.syntax.buildRules([
  // Form which a applies a procedure to a non-#f test result
  [
    // ((test => result))
    [['test', '=>', 'result']],
    // (let ((temp test)) (if temp (result temp)))
    [ccc.syntax.LET, [['temp', 'test']],
      [ccc.syntax.IF, 'temp', ['result', 'temp']]]
  ],
  // The same procedure application form but with subsequent clauses
  [
    // ((test => result) clause0 clause ...)
    [['test', '=>', 'result'], 'clause0', 'clause', '...'],
    // (let ((temp test)) (if temp (result temp) (cond clause0 clause ...)))
    [ccc.syntax.LET, [['temp', 'test']],
      [ccc.syntax.IF, 'temp',
        ['result', 'temp'],
        [ccc.syntax.COND, 'clause0', 'clause', '...']]]
  ],
  // Simple test identity
  [
    // ((test))
    [['test']],
    // test
    'test'
  ],
  // Test with subsequent clauses
  [
    // ((test) clause0 clause ...)
    [['test'], 'clause0', 'clause', '...'],
    // (let ((temp test)) (if temp temp (cond clause0 clause ...)))
    [ccc.syntax.LET, [['temp', 'test']],
      [ccc.syntax.IF, 'temp',
        'temp',
        [ccc.syntax.COND, 'clause0', 'clause', '...']]]
  ],
  // Test with result expressions
  [
    // ((test result0 result ...))
    [['test', 'result0', 'result', '...']],
    // (if test (begin result0 result ...))
    [ccc.syntax.IF, 'test', [ccc.syntax.BEGIN, 'result0', 'result', '...']]
  ],
  // Test with result expressions and subsequent clauses
  [
    // ((test result0 result ...) clause0 clause ...)
    [['test', 'result0', 'result', '...'], 'clause0', 'clause', '...'],
    // (if test (begin result0 result ...) (cond clause0 clause ...))
    [ccc.syntax.IF, 'test',
      [ccc.syntax.BEGIN, 'result0', 'result', '...'],
      [ccc.syntax.COND, 'clause0', 'clause', '...']]
  ]
], ccc.syntax.COND_LITERALS_));

