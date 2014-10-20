// The Cmacs Project.

goog.provide('ccc.base.build');

goog.require('ccc.base.F');
goog.require('ccc.base.NIL');
goog.require('ccc.base.Number');
goog.require('ccc.base.Pair');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.T');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.base.Vector');
goog.require('goog.array');
goog.require('goog.object');



/**
 * Builds a {@code ccc.base.Object} given a declarative descriptor. An input
 * object {@code o} is processed recursively according to the following rough
 * outline:
 *
 * 1. If o is an Array:
 *    1a. Build each element of o using this procedure
 *    1b. Build a proper list consisting of all built elements.
 * 2. If o is a string, build a @{code ccc.base.Symbol} symbol with that name.
 * 3. If o is a number, build a @{code ccc.base.Number} with that value.
 * 4. If o is a boolean, output either {@code ccc.base.T} or {@code ccc.base.F}
 * 5. If o is {@code null}, output {@code ccc.base.NIL}
 * 6. If o is {@code undefined}, output {@code ccc.base.UNSPECIFIED}
 * 7. If o is a {@code ccc.base.Object}, it's emitted as-is.
 * 8. If o is an Object:
 *    7a. If o['vec'] is an Array, build a {@code ccc.base.Vector} from its
 *        built contents.
 *    7b. If o['str'] is a string, build a {@code ccc.base.String} with its
 *        value.
 *    7c. If o['list'] is an Array, build a list as if o were the Array, and
 *        if present, also use o['tail'] as the optional tail component.
 *    7d. If o['chr'] is a number, build a {@code ccc.base.Char} with its value.
 *    7e. If o['pair'] is an array, build a {@code ccc.base.Pair} from its first
 *        two elements.
 *
 * This should be used whenever a complex object is being constructed and
 * readability or brevity is a concern.
 *
 * @param {*} spec
 * @return {!ccc.base.Object}
 * @public
 */
ccc.base.build = function(spec) {
  if (spec instanceof Array)
    return ccc.base.Pair.makeList(goog.array.map(spec, ccc.base.build));
  if (typeof spec == 'string')
    return new ccc.base.Symbol(spec);
  if (typeof spec == 'number')
    return new ccc.base.Number(spec);
  if (typeof spec == 'boolean')
    return spec ? ccc.base.T : ccc.base.F;
  if (goog.isNull(spec))
    return ccc.base.NIL;
  if (!goog.isDef(spec))
    return ccc.base.UNSPECIFIED;
  if (spec instanceof ccc.base.Object)
    return spec;
  if (typeof spec == 'object') {
    if (goog.object.containsKey(spec, 'object'))
      return spec['object'];
    if (goog.object.containsKey(spec, 'vec'))
      return new ccc.base.Vector(goog.array.map(spec['vec'], ccc.base.build));
    if (goog.object.containsKey(spec, 'str'))
      return new ccc.base.String(spec['str']);
    if (goog.object.containsKey(spec, 'chr'))
      return new ccc.base.Char(spec['chr']);
    if (goog.object.containsKey(spec, 'pair'))
      return new ccc.base.Pair(ccc.base.build(spec['pair'][0]),
          ccc.base.build(spec['pair'][1]));
    if (goog.object.containsKey(spec, 'list')) {
      var tail = (goog.object.containsKey(spec, 'tail')
          ? ccc.base.build(spec['tail'])
          : ccc.base.NIL);
      return ccc.base.Pair.makeList(goog.array.map(spec['list'],
          ccc.base.build), tail);
    }
  }
  throw new Error('buildObject: Invalid object spec');
};
