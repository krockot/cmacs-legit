// The Cmacs Project.

goog.provide('ccc.syntax.DefineSyntax');

goog.require('ccc.base');
goog.require('goog.promise');



/**
 * DefineSyntax binds a symbol to a {@code ccc.base.Transformer}.
 * Transformers can themselves be generated using a SyntaxRules transformer.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.DefineSyntax = function() {};


/** @override */
ccc.syntax.DefineSyntax.prototype.toString = function() {
  return '#<define-syntax-transformer>';
};


/** @override */
ccc.syntax.DefineSyntax.prototype.transform = function(environment, args) {
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
