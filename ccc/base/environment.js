// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.base.Environment');
goog.provide('ccc.base.BasicEnvironment');
goog.provide('ccc.base.StandardEnvironment');

goog.require('ccc.base.Object');
goog.require('ccc.syntax.Define');
goog.require('ccc.syntax.Set');
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


/** @overwrite */
ccc.base.Environment.prototype.toString = function() {
  return '#<environment>';
};


/** @overwrite */
ccc.base.Environment.prototype.isEnvironment = function() {
  return true;
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
 * Updates the value bound to a name.
 *
 * @param {string} name
 * @param {!ccc.base.Object} value
 * @return {boolean} Indicates if the named binding was found and updated.
 */
ccc.base.Environment.prototype.update = function(name, value) {
  if (!goog.object.containsKey(this.bindings_, name)) {
    if (!goog.isNull(this.parent_))
      return this.parent_.update(name);
    return false;
  }
  this.bindings_[name] = value;
  return true;
};


/**
 * A BasicEnvironment is an Environment with basic builtin syntax keyword
 * (define, lambda, etc.) bindings.
 *
 * @constructor
 * @extends {ccc.base.Environment}
 * @public
 */
ccc.base.BasicEnvironment = function() {
  goog.base(this);

  this.set('define', new ccc.syntax.Define());
  this.set('set!', new ccc.syntax.Set());
};
goog.inherits(ccc.base.BasicEnvironment, ccc.base.Environment);



/**
 * A StandardEnvironment is a BasicEnvironment with the addition of standard
 * library function bindings.
 *
 * @constructor
 * @extends {ccc.base.BasicEnvironment}
 * @public
 */
ccc.base.StandardEnvironment = function() {
  goog.base(this);

  // TODO(krockot): Load standard library.
};
goog.inherits(ccc.base.StandardEnvironment, ccc.base.BasicEnvironment);
