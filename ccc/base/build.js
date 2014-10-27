// The Cmacs Project.

goog.provide('ccc.base.build');

goog.require('ccc.Data')
goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.Pair');
goog.require('ccc.Unspecified');
goog.require('ccc.Vector');



/**
 * Builds a {@code ccc.Data} given a declarative descriptor. An input
 * object {@code o} is processed recursively according to the following rough
 * outline:
 *
 * 1. If o is an Array:
 *    1a. Build each element of o using this procedure
 *    1b. Build a proper list consisting of all built elements.
 * 2. If o is a string, build a symbol with that name.
 * 3. If o is a number, return it.
 * 4. If o is a boolean, return it.
 * 5. If o is {@code null}, return {@code ccc.NIL}
 * 6. If o is {@code undefined}, return {@code ccc.UNSPECIFIED}
 * 7. If o is a {@code ccc.Object}, it's emitted as-is.
 * 8. If o is an Object:
 *    7a. If o['vec'] is an Array, build a {@code ccc.Vector} from its built
 *        contents.
 *    7b. If o['str'] is a string, return its value.
 *    7c. If o['list'] is an Array, build a list as if o were the Array, and
 *        if present, also use o['tail'] as the optional tail component.
 *    7d. If o['chr'] is a number, build a {@code ccc.Char} with its value.
 *    7e. If o['pair'] is an array, build a {@code ccc.Pair} from its first
 *        two elements.
 *
 * This should be used whenever a complex object is being constructed and
 * readability or brevity is a concern.
 *
 * Note that Arrays build lists (instead of vectors) and strings build symbols
 * (instead of, well, strings) primarily because these types occur much more
 * frequently in common cases, and the purpose of {@code ccc.base.build} is to
 * provide convenience.
 *
 * @param {*} spec
 * @return {!ccc.Data}
 * @public
 */
ccc.base.build = function(spec) {
  if (spec instanceof Array)
    return ccc.Pair.makeList(goog.array.map(spec, ccc.base.build));
  if (typeof spec == 'string')
    return Symbol.for(spec);
  if (typeof spec == 'number')
    return spec;
  if (typeof spec == 'boolean')
    return spec;
  if (goog.isNull(spec))
    return ccc.NIL;
  if (!goog.isDef(spec))
    return ccc.UNSPECIFIED;
  if (spec instanceof ccc.Object)
    return spec;
  if (typeof spec == 'object') {
    if (goog.object.containsKey(spec, 'object'))
      return spec['object'];
    if (goog.object.containsKey(spec, 'vec'))
      return new ccc.Vector(goog.array.map(spec['vec'], ccc.base.build));
    if (goog.object.containsKey(spec, 'str'))
      return spec['str'];
    if (goog.object.containsKey(spec, 'chr'))
      return new ccc.Char(spec['chr']);
    if (goog.object.containsKey(spec, 'pair'))
      return new ccc.Pair(ccc.base.build(spec['pair'][0]),
          ccc.base.build(spec['pair'][1]));
    if (goog.object.containsKey(spec, 'list')) {
      var tail = (goog.object.containsKey(spec, 'tail')
          ? ccc.base.build(spec['tail'])
          : ccc.NIL);
      return ccc.Pair.makeList(goog.array.map(spec['list'],
          ccc.base.build), tail);
    }
  }
  throw new Error('buildObject: Invalid object spec');
};
