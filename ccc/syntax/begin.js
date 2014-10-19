// The Cmacs Project.

goog.provide('ccc.syntax.Begin');

goog.require('ccc.base');
goog.require('ccc.syntax.Lambda')
goog.require('goog.Promise');



/**
 * The builtin Begin performs a sequence of evaluations and yields the value of
 * the last one.
 *
 * @constructor
 * @extends {ccc.base.Transformer}
 * @public
 */
ccc.syntax.Begin = function() {
};
goog.inherits(ccc.syntax.Begin, ccc.base.Transformer);


/** @override */
ccc.syntax.Begin.prototype.toString = function() {
  return '#<begin-transformer>';
};


/** @override */
ccc.syntax.Begin.prototype.transform = function(environment, args) {
  if (!args.isPair())
    return goog.Promise.reject(new Error(
        'begin: One or more expressions required'));
  var lambda = new ccc.syntax.Lambda();
  return lambda.transform(environment, List([ccc.base.NIL], args)).then(
      function(procedure) {
    return new ccc.base.Pair(procedure, ccc.base.NIL);
  });
};
