// The Cmacs Project.

goog.provide('ccc.syntax.LET');

goog.require('ccc.base');
goog.require('ccc.syntax.LAMBDA');
goog.require('ccc.syntax.build');



/**
 * The Let transformer provides syntactic sugar for a closure with some set of
 * new local bindings.
 *
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LET = ccc.syntax.build([
  [
    // Match (((var expr) ...) body0 body ...)
    [[['var', 'expr'], '...'], 'body0', 'body', '...'],
    // Expand to ((lambda (var ...) body0 body ...) expr ...)
    [[ccc.syntax.LAMBDA, ['var', '...'], 'body0', 'body', '...'],
      'expr', '...'],
  ],
]);
