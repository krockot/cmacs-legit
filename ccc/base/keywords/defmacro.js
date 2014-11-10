// The Cmacs Project.

goog.provide('ccc.base.defmacro');

goog.require('ccc.MacroExpander');
goog.require('ccc.core');



/**
 * The DEFMACRO syntax constructs and binds a new list-rewriting transformer
 * at expansion time.
 *
 * @constructor
 * @extends {ccc.Transformer}
 */
var DefmacroTransformer_ = function() {
};
goog.inherits(DefmacroTransformer_, ccc.Transformer);


/** @override */
DefmacroTransformer_.prototype.toString = function() {
  return '#<defmacro-transformer>';
};


/** @override */
DefmacroTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args) || !ccc.isPair(args.cdr()))
      return continuation(new ccc.Error('defmacro: Invalid syntax'));
    var body = args.cdr().cdr();
    if (!ccc.isPair(body))
      return continuation(new ccc.Error('defmacro: Invalid syntax'));
    var name = args.car();
    if (!ccc.isSymbol(name))
      return continuation(new ccc.Error('defmacro: Expected symbol for name'));
    var formals = args.cdr().car();
    if (!ccc.isPair(formals) && !ccc.isNil(formals))
      return continuation(new ccc.Error('defmacro: Invalid argument list'));
    var formalNames = [];
    var formalTail = null;
    var formal = formals;
    while (ccc.isPair(formal)) {
      if (!ccc.isSymbol(formal.car()))
        return continuation(new ccc.Error('defmacro: Invalid argument list'));
      formalNames.push(formal.car().name());
      formal = formal.cdr();
    }
    if (ccc.isSymbol(formal))
      formalTail = formal.name();
    else if (!ccc.isNil(formal))
      return continuation(new ccc.Error('defmacro: Invalid argument list'));
    environment.setValue(name.name(),
        new ccc.MacroExpander(formalNames, formalTail, body));
    return continuation(ccc.UNSPECIFIED);
  };
};


/** @const {!ccc.Transformer} */
ccc.base.defmacro = new DefmacroTransformer_();
