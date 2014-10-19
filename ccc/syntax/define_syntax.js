// The Cmacs Project.

goog.provide('ccc.syntax.DEFINE_SYNTAX');

goog.require('ccc.base');
goog.require('goog.Promise');



/**
 * DefineSyntax binds a symbol to a {@code ccc.base.Transformer}.
 * Transformers can themselves be generated using a SyntaxRules transformer.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.DefineSyntaxTransformer_ = function() {
};
goog.inherits(ccc.syntax.DefineSyntaxTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.DefineSyntaxTransformer_.prototype.toString = function() {
  return '#<define-syntax-transformer>';
};


/** @override */
ccc.syntax.DefineSyntaxTransformer_.prototype.transform = function(
    environment, args) {
  if (!args.isPair())
    return goog.Promise.reject(new Error(
        'define-syntax: Invalid argument list'));
  if (!args.car().isSymbol())
    return goog.Promise.reject(new Error(
        'define-syntax: Symbol expected in first argument'));
  if (args.cdr().isNil())
    return goog.Promise.reject(new Error(
        'define-syntax: Missing binding value'));
  if (!args.cdr().isPair())
    return goog.Promise.reject(new Error('define-syntax: Invalid syntax'));
  if (!args.cdr().cdr().isNil())
    return goog.Promise.reject(new Error('define-syntax: Too many arguments'));
  return args.cdr().car().compile(environment).then(function(compiledForm) {
    if (!compiledForm.isTransformer())
      return goog.Promise.reject(new Error(
          'define-syntax: ' + compiledForm.toString() +
          ' is not a syntax transformer'));
    environment.set(args.car().name(), compiledForm);
    return ccc.base.UNSPECIFIED;
  });
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.DEFINE_SYNTAX = new ccc.syntax.DefineSyntaxTransformer_();
