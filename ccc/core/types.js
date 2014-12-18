// The Cmacs Project.

goog.provide('ccc.core.types');

goog.require('ccc.Object');



/**
 * Indicates if a given {@code ccc.Data} is a string.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isString = function(data) {
  return typeof data === 'string';
};


/**
 * Indicates if a given {@code ccc.Data} is a number.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isNumber = function(data) {
  return typeof data === 'number';
};


/**
 * Indicates if a given {@code ccc.Data} is an integer.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isInteger = function(data) {
  if (goog.isDef(Number.isInteger))
    return Number.isInteger(data);
  return typeof data === 'number' &&
      isFinite(data) &&
      data > -9007199254740992 &&
      data < 9007199254740992 &&
      Math.floor(data) === data;
};


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Object} of
 * any kind.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isObject = function(data) {
  return data instanceof ccc.Object;
};


/**
 * Indicates if a given {@code ccc.Data} is applicable.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isApplicable = function(data) {
  return ccc.isObject(data) && data.isApplicable();
};


/**
 * Indicates if two {@code ccc.Data} objects are strictly equal. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @param {ccc.Data} one
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.eq = function(one, other) {
  if (one instanceof ccc.Object)
    return one.eq(other);
  if (other instanceof ccc.Object)
    return false;
  return one === other;
};


/**
 * Indicates if two {@code ccc.Data} objects are equivalent. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @param {ccc.Data} one
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.eqv = function(one, other) {
  if (one instanceof ccc.Object)
    return one.eqv(other);
  if (other instanceof ccc.Object)
    return false;
  return one === other;
};


/**
 * Indicates if two {@code ccc.Data} objects are recursively equal. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @param {ccc.Data} one
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.equal = function(one, other) {
  if (one instanceof ccc.Object)
    return one.equal(other);
  if (other instanceof ccc.Object)
    return false;
  return one === other;
};
