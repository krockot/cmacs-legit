// The Cmacs Project.

goog.provide('ccc.base.stringify');

goog.require('ccc.Data');
goog.require('ccc.Object');


/**
 * Stringify a {@code ccc.Data} in a Schemish sort of way.
 *
 * @param {!ccc.Data} data
 * @return {string}
 * @public
 */
ccc.base.stringify = function(data) {
  if (ccc.isCccObject(data))
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