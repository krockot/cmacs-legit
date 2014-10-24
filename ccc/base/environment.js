// The Cmacs Project.

goog.provide('ccc.base.Environment');

goog.require('ccc.base.Object');
goog.require('goog.object');



/**
 * An Environment provides the evaluation context for an expression. It consists
 * of an innermost set of bindings and an optional link to a parent environment.
 *
 * @param {!ccc.base.Environment=} opt_parent The parent environment.
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Environment = function(opt_parent) {
  /** @private {ccc.base.Environment} */
  this.parent_ = goog.isDef(opt_parent) ? opt_parent : null;

  /**
   * The set of active bindings local to this environment. A name bound to
   * {@code null} during compilation indicates that a proper binding with that
   * name will exist in the environment at evaluation time.
   * @private {!Object.<string, ccc.base.Object>}
   */
  this.bindings_ = {};

  /**
   * The active frame for this environment. A "frame" in this context is an
   * immediate, ephemeral descendent of the environment, generated by and
   * persisting across the extent of a single procedure application. If this
   * is {@code null}, the environment uses itself as its own active frame.
   * @private {ccc.base.Environment}
   */
  this.activeFrame_ = null;
};
goog.inherits(ccc.base.Environment, ccc.base.Object);


/** @override */
ccc.base.Environment.prototype.toString = function() {
  return '#<environment>';
};


/** @override */
ccc.base.Environment.prototype.isEnvironment = function() {
  return true;
};


/** @override */
ccc.base.Environment.prototype.eval = function(environment, continuation) {
  return continuation(this);
};


/**
 * Binds a name to a value in the local frame of this environment.
 *
 * @param {string} name
 * @param {!ccc.base.Object} value
 */
ccc.base.Environment.prototype.set = function(name, value) {
  this.bindings_[name] = value;
};


/**
 * Reserves a name (binds it to {@code null}) in the environment.
 *
 * @param {string} name
 */
ccc.base.Environment.prototype.reserve = function(name) {
  this.bindings_[name] = null;
};


/**
 * Gets the value bound to a name. Returns {@code undefined} if the binding
 * does not exist or {@code null} if it's not bound to a value.
 *
 * @param {string} name
 * @return {ccc.base.Object|undefined}
 */
ccc.base.Environment.prototype.get = function(name) {
  var environment = goog.isNull(this.activeFrame_) ? this : this.activeFrame_;
  var value = goog.object.get(environment.bindings_, name);
  if (!goog.isDef(value) && !goog.isNull(this.parent_))
    return this.parent_.get(name);
  return value;
};


/**
 * Indicates if this is a top-level environment.
 *
 * @return {boolean}
 */
ccc.base.Environment.prototype.isToplevel = function() {
  return goog.isNull(this.parent_);
};


/**
 * Updates the value bound to a name.
 *
 * @param {string} name
 * @param {!ccc.base.Object} value
 * @return {boolean} Indicates if the named binding was found and updated.
 */
ccc.base.Environment.prototype.update = function(name, value) {
  var environment = goog.isNull(this.activeFrame_) ? this : this.activeFrame_;
  if (!goog.object.containsKey(environment.bindings_, name)) {
    if (!goog.isNull(this.parent_))
      return this.parent_.update(name, value);
    return false;
  }
  this.bindings_[name] = value;
  return true;
};


/**
 * Sets this environment's active frame. This is used exclusively by procedure
 * applications to override their captured environment for a temporary program
 * extent.
 *
 * @param {!ccc.base.Environment} frame
 * @public
 */
ccc.base.Environment.prototype.setActiveFrame = function(frame) {
  this.activeFrame_ = frame;
};
