// The Cmacs Project.

goog.provide('ccc.ImmediateLocation');

goog.require('ccc.Location');



/**
 * A location which boxes a value directly.
 *
 * @constructor
 * @extends {ccc.Location}
 */
ccc.ImmediateLocation = function() {
  /** @private {?ccc.Data} */
  this.value_ = null;
};
goog.inherits(ccc.ImmediateLocation, ccc.Location);


/** @override */
ccc.ImmediateLocation.prototype.toString = function() {
  return '#<global-location>';
};


/** @override */
ccc.ImmediateLocation.prototype.getValue = function() {
  return this.value_;
};


/** @override */
ccc.ImmediateLocation.prototype.setValue = function(value) {
  this.value_ = value;
};
