// The Cmacs Project.

goog.provide('ccc.LocalLocation');

goog.require('ccc.Location');



/**
 * A LocalLocation captures a specific environment and local variable index
 * to reference variables with dynamic extent, i.e., lexical bindings.
 * Actual storage is provided by an auxilliary buffer by the evaluation
 * environment.
 *
 * @param {!ccc.Environment} environment
 * @param {number} index
 * @constructor
 * @extends {ccc.Location}
 */
ccc.LocalLocation = function(environment, index) {
  /** @private {!ccc.Environment} */
  this.environment_ = environment;

  /** @private {number} */
  this.index_ = index;
};
goog.inherits(ccc.LocalLocation, ccc.Location);


/** @override */
ccc.LocalLocation.prototype.toString = function() {
  return '#<local-location:' + this.index_ + '>';
};


/** @override */
ccc.LocalLocation.prototype.getValue = function() {
  return this.environment_.getLocalValue(this.index_);
};


/** @override */
ccc.LocalLocation.prototype.setValue = function(value) {
  this.environment_.setLocalValue(this.index_, value);
};


/**
 * Override the environment to which this local location is bind.
 *
 * @param {!ccc.Environment} environment
 */
ccc.LocalLocation.prototype.setEnvironment = function(environment) {
  this.environment_ = environment;
};
