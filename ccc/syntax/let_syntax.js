// The Cmacs Project.

goog.provide('ccc.syntax.LET_SYNTAX');

goog.require('ccc.base');
goog.require('ccc.syntax.LAMBDA');
goog.require('goog.Promise');
goog.require('goog.array');



/**
 * The LET_SYNTAX transformer establishes a set of syntax bindings for use
 * within an isolated scope.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @private
 */
ccc.syntax.LetSyntaxTransformer_ = function() {
};
goog.inherits(ccc.syntax.LetSyntaxTransformer_, ccc.base.Transformer);


/** @override */
ccc.syntax.LetSyntaxTransformer_.prototype.toString = function() {
  return '#<let-syntax-transformer>';
};


/** @override */
ccc.syntax.LetSyntaxTransformer_.prototype.transform = function(
    environment, args) {
  var fail = function(why) {
    return goog.Promise.reject(new Error(why));
  }
  if (!args.isPair())
    return fail('let-syntax: Not enough arguments');
  var bindings = args.car();
  if (!bindings.isPair() && !bindings.isNil())
    return fail('let-syntax: Invalid bindings spec: ' + bindings.toString());
  var body = args.cdr();
  if (!body.isPair())
    return fail('let-syntax: Invalid body: ' + body.toString());
  var bindingNames = [];
  var uncompiledRules = [];
  while (bindings.isPair()) {
    var binding = bindings.car();
    if (!binding.isPair() || !binding.cdr().isPair() ||
        !binding.cdr().cdr().isNil())
      return fail('let-syntax: Invalid binding spec: ' + binding.toString());
    var name = binding.car();
    if (!name.isSymbol())
      return fail('let-syntax: Invalid binding name: ' + name.toString());
    var rules = binding.cdr().car();
    if (!rules.isPair())
      return fail('let-syntax: Invalid binding rules: ' + rules.toString());
    bindingNames.push(name.name());
    uncompiledRules.push(rules);
    bindings = bindings.cdr();
  }
  if (!bindings.isNil())
    return fail('let-syntax: Invalid bindings spec near ' +
        bindings.toString());

  var compiledRules = goog.array.map(uncompiledRules, function(form) {
    return form.compile(environment);
  });
  return goog.Promise.all(compiledRules).then(function(transformers) {
    var innerEnvironment = new ccc.base.Environment(environment);
    goog.array.forEach(transformers, function(transformer, index) {
      if (!transformer.isTransformer())
        return fail('Invalid binding rules for |' + name.toString() + '|');
      innerEnvironment.allocate(bindingNames[index]).setValue(transformer);
    });
    var lambdaArgs = new ccc.base.Pair(ccc.base.NIL, body);
    return ccc.syntax.LAMBDA.transform(innerEnvironment, lambdaArgs);
  }).then(function(lambda) {
    return new ccc.base.Pair(lambda, ccc.base.NIL);
  });
};


/**
 * @public {!ccc.base.Transformer}
 * @const
 */
ccc.syntax.LET_SYNTAX = new ccc.syntax.LetSyntaxTransformer_();
