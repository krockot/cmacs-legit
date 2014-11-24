// The Cmacs Project.

goog.provide('ccc.core.build');

goog.require('ccc.core');



/**
 * Builds a {@code ccc.Data} given a declarative descriptor. An input
 * object {@code o} is processed recursively according to the following rough
 * outline:
 *
 * 1. If o is an Array, build a list from o.map(ccc.core.build).
 * 2. If o is a string, return a {@code ccc.Symbol} with that name.
 * 3. If o is a {@code ccc.Vector} return o.map(ccc.core.build).
 * 4. If o is a {@code ccc.Pair} return o.map(ccc.core.build).
 * 5. If o is an instance of {@code String}, return its string value.
 * 6. If o anything else, return it as-is.
 *
 * This should be used whenever a complex object is being constructed in JS
 * code, particularly with lots of symbols and nested lists.
 *
 * @param {ccc.Data} spec
 * @return {ccc.Data}
 */
ccc.core.build = function(spec) {
  if (spec instanceof Array)
    return ccc.Pair.makeList(goog.array.map(spec, ccc.core.build));
  if (typeof spec == 'string')
    return new ccc.Symbol(spec);
  if (ccc.isVector(spec) || ccc.isPair(spec))
    return spec.map(ccc.core.build);
  if (spec instanceof String)
    return spec.toString();
  return spec;
};
