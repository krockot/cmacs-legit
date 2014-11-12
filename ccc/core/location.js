// The Cmacs Project.

goog.provide('ccc.Location');

goog.require('ccc.Object');
goog.require('goog.asserts');



/**
 * Location defines a common interface for binding locations to implement
 * value boxing and unboxing.
 *
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Location = function() {
  /** @private {string} */
  this.name_ = '<unknown>';
};
goog.inherits(ccc.Location, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Location}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isLocation = function(data) {
  return data instanceof ccc.Location;
};


/** @override */
ccc.Location.prototype.toString = function() {
  return '#<invalid-location>';
};


/** @override */
ccc.Location.prototype.eval = function(environment, continuation) {
  var value = this.getValue();
  if (goog.isNull(value))
    return continuation(new ccc.Error('Referencing uninitialized variable ' +
        this.name_));
  return continuation(value);
};


/**
 * Retrieves the value stored at this location.
 *
 * @return {?ccc.Data}
 */
ccc.Location.prototype.getValue = function() {
  goog.asserts.assert(false, 'Not reached');
  return null;
};


/**
 * Sets the value stored at this location.
 *
 * @param {ccc.Data} value
 */
ccc.Location.prototype.setValue = function(value) {
  goog.asserts.assert(false, 'Not reached');
};


/**
 * Tags this location with a name which may be useful for debugging.
 *
 * @param {string} name
 */
ccc.Location.prototype.setName = function(name) {
  this.name_ = name;
};
