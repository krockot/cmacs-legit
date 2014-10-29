// The Cmacs Project.

goog.provide('ccc.Environment');

goog.require('ccc.Object');



/**
 * An Environment provides the evaluation context for an expression. It consists
 * of an innermost set of bindings and an optional link to a parent environment.
 *
 * @param {!ccc.Environment=} opt_parent The parent environment.
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Environment = function(opt_parent) {
  /** @private {ccc.Environment} */
  this.parent_ = goog.isDef(opt_parent) ? opt_parent : null;

  /**
   * The set of active bindings local to this environment.
   * @private {!ccc.BindingMap_}
   */
  this.bindings_ = {};

  /** @private {number} */
  this.id_ = ++ccc.Environment.nextId_;
};
goog.inherits(ccc.Environment, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Environment}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isEnvironment = function(data) {
  return data instanceof ccc.Environment;
};


/**
 * Used to attach a unique ID to every new environment.
 *
 * @private {number}
 */
ccc.Environment.nextId_ = 0;


/** @override */
ccc.Environment.prototype.toString = function() {
  return '#<environment>';
};


/**
 * Sets the {@code ccc.Data} associated with a name within this environment.
 *
 * @param {string} name
 * @param {ccc.Data} data
 */
ccc.Environment.prototype.set = function(name, data) {
  goog.object.set(this.bindings_, name, data);
};


/**
 * Gets the {@code ccc.Data} to which a name is bound. If the binding does not
 * exist in the immediate environment, the ancestor environments are search
 * recursively.
 *
 * Returns {@code null} if the binding does not exist.
 *
 * @param {string} name
 * @return {?ccc.Data}
 */
ccc.Environment.prototype.get = function(name) {
  var data = /** @type {?ccc.Data} */ (
      goog.object.get(this.bindings_, name, null));
  if (goog.isNull(data) && !goog.isNull(this.parent_))
    return this.parent_.get(name);
  return data;
};


/**
 * Indicates if the environment has a direct binding for the given name.
 *
 * @param {string} name
 * @return {boolean}
 */
ccc.Environment.prototype.hasBinding = function(name) {
  return goog.object.containsKey(this.bindings_, name);
};


/**
 * Indicates if this is a top-level environment.
 *
 * @return {boolean}
 */
ccc.Environment.prototype.isToplevel = function() {
  return goog.isNull(this.parent_);
};



/**
 * A mapping from binding name to {@code ccc.Data}.
 *
 * @typedef {Object.<string, ccc.Data>}
 * @private
 */
ccc.BindingMap_;
