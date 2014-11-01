// The Cmacs Project.

goog.provide('ccc.core.build');

goog.require('ccc.core');



/**
 * Builds a {@code ccc.Data} given a declarative descriptor. An input
 * object {@code o} is processed recursively according to the following rough
 * outline:
 *
 * 1. If o is an Array:
 *    1a. Build each element of o using this procedure
 *    1b. Build a proper list consisting of all built elements.
 * 2. If o is a string which starts and ends with a ", strip quotes and build a
 *    string with the stripped contents.
 * 3. If o is any other string, build a symbol with that name.
 * 4. If o anything else, return it as-is.
 *
 * This should be used whenever a complex object is being constructed in JS
 * code, particularly with lots of nested lists and symbols.
 *
 * @param {*} spec
 * @return {!ccc.Data}
 */
ccc.core.build = function(spec) {
  if (spec instanceof Array)
    return ccc.Pair.makeList(goog.array.map(spec, ccc.core.build));
  if (typeof spec == 'string') {
    if (spec.length > 1 && spec.charAt(0) == '"' &&
        spec.charAt(spec.length - 1) == '"') {
      return spec.substr(1, spec.length - 2);
    }
    return new ccc.Symbol(spec);
  }
  return spec;
};
