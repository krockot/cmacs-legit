// The Cmacs Project.

goog.provide('ccc.syntax.LETREC');

goog.require('ccc.base');
goog.require('ccc.syntax.LAMBDA');
goog.require('ccc.syntax.SET');
goog.require('ccc.syntax.buildRule');
goog.require('ccc.syntax.buildTransformer');



/**
 * Helper transformer for LETREC. This handles the recursive expansion needed
 * for each binding.
 *
 * @private {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LETREC_HELPER_ = ccc.syntax.buildTransformer([
  // Helper with empty bindings list
  [
    // (() body0 body ...)
    [[], 'body0', 'body', '...'],
    // ((lambda () body0 body ...))
    [[ccc.syntax.LAMBDA, [], 'body0', 'body', '...']]
  ]
]);


// Helper with at least one binding
ccc.syntax.LETREC_HELPER_.addRules(ccc.syntax.buildRules([
  // ((var0 var ...) body0 body ...)
  [['var0', 'var', '...'], 'body0', 'body', '...'],
  // ((lambda (var0) (<HELPER> (var ...) body0 body ...)) #?)
  [[ccc.syntax.LAMBDA, ['var0'],
    [ccc.syntax.LETREC_HELPER_, ['var', '...'], 'body0', 'body', '...']],
    undefined]
]));



/**
 * The LETREC transformer is similar to LET, but none of its local bindings
 * are initialized until all of them have been established.
 *
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LETREC = ccc.syntax.buildTransformer([
  [
    // (((var expr) ...) body0 body ...)
    [[['var', 'expr'], '...'], 'body0', 'body', '...'],
    // ((<HELPER> (var ...) (set! var expr) ... body0 body ...))
    [ccc.syntax.LETREC_HELPER_, ['var', '...'],
        [ccc.syntax.SET, 'var', 'expr'], '...', 'body0', 'body', '...']
  ]
]);
