// The Cmacs Project.

goog.provide('ccc.core.stringify');

goog.require('ccc.core.types');


/**
 * Stringify a {@code ccc.Data} in a Schemish sort of way.
 *
 * @param {ccc.Data} data
 * @return {string}
 */
ccc.core.stringify = function(data) {
  if (ccc.isObject(data))
    return data.toString();

  if (data === true)
    return '#t';
  if (data === false)
    return '#f';
  // TODO(krockot): Symbol and string are pretty lazy right now. Should escape
  // unprintable/badly-printable characters and optionally |-quote symbols.
  if (ccc.isSymbol(data))
    return Symbol.keyFor(/** @type {symbol} */ (data));
  if (ccc.isString(data))
    return '"' + data + '"';
  if (ccc.isNumber(data))
    return data.toString();
  return '#<native-data:' + data.toString() + '>';
};
