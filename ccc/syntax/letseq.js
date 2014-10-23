// The Cmacs Project.

goog.provide('ccc.syntax.LETSEQ');

goog.require('ccc.base');
goog.require('ccc.syntax.LAMBDA');
goog.require('ccc.syntax.buildRule');
goog.require('ccc.syntax.buildTransformer');



/**
 * The LETSEQ transformer (spelled "let*") is similar to let, except the
 * local bindings are established sequentially. As such, any given binding's
 * initializer expression may reference bindings which occur before it in the
 * same let* expression.
 *
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LETSEQ = ccc.syntax.buildTransformer([
  // let* with no bindings specified.
  [
    // (() body0 body ...)
    [[], 'body0', 'body', '...'],
    // ((lambda () body0 body ...))
    [[ccc.syntax.LAMBDA, [], 'body0', 'body', '...']]
  ]
]);

ccc.syntax.LETSEQ.addRules(ccc.syntax.buildRules([
  // let* with one or more bindings specified.
  [
    // (((var0 expr0) (var expr) ...) body0 body ...)
    [[['var0', 'expr0'], ['var', 'expr'], '...'], 'body0', 'body', '...'],
    // ((lambda (var0) (let* ((var expr) ...) body0 body ...)) expr0)
    [[ccc.syntax.LAMBDA, ['var0'],
      [ccc.syntax.LETSEQ, [['var', 'expr'], '...'],
          'body0', 'body', '...']], 'expr0']
  ]
]));
