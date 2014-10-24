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
   * The set of active bindings local to this environment.
   * @private {!Object.<string, !ccc.base.Object>}
   */
  this.bindings_ = {};
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
 * Gets the value bound to a name or {@code null} if no such binding exists.
 *
 * @param {string} name
 */
ccc.base.Environment.prototype.get = function(name) {
  var value = goog.object.get(this.bindings_, name, null);
  if (goog.isNull(value) && !goog.isNull(this.parent_))
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
  if (!goog.object.containsKey(this.bindings_, name)) {
    if (!goog.isNull(this.parent_))
      return this.parent_.update(name, value);
    return false;
  }
  this.bindings_[name] = value;
  return true;
};
