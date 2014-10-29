// The Cmacs Project.

goog.provide('ccc.Location');

goog.require('ccc.Object');



/**
 * A binding location. A Location holds a single {@code ccc.Data} and is
 * allocated dynamically during compilation or evaluation. Symbol names may in
 * turn be bound to locations within an environment.
 *
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Location = function() {
  /**
   * The value stored in this location. Defaults {@code null}, meaning the
   * location is uninitialized and inaccessible.
   * @private {?ccc.Data}
   */
  this.value_ = null;
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
  return '#<location:' + this.value_ + '>';
};


/** @override */
ccc.Location.prototype.eval = function(environment, continuation) {
  if (goog.isNull(this.value_))
    return continuation(new ccc.Error('Referencing uninitialized location'));
  return continuation(this.value_);
};


/**
 * Retrieves the value stored at this location.
 *
 * @return {?ccc.Data}
 */
ccc.Location.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the value stored at this location.
 *
 * @param {ccc.Data} value
 */
ccc.Location.prototype.setValue = function(value) {
  this.value_ = value;
};

