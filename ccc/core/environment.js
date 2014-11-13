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

  /**
   * The array of currently active locals for this environment.
   * @private {!Array.<ccc.Data>}
   */
  this.locals_ = [];

  /** @private {number} */
  this.id_ = ++ccc.Environment.nextId_;

  /** @private {!Array.<ccc.ThreadEntryPoint>} */
  this.preludes_ = [];
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
 * Sets the {@code ccc.Location} associated with a name within this environment.
 *
 * @param {string} name
 * @param {!ccc.Location} location
 */
ccc.Environment.prototype.set = function(name, location) {
  goog.object.set(this.bindings_, name, location);
};


/**
 * Binds a name to a new {@code ccc.ImmediateLocation} holding the given value.
 *
 * @param {string} name
 * @param {ccc.Data} value
 */
ccc.Environment.prototype.setValue = function(name, value) {
  var location = new ccc.ImmediateLocation();
  location.setValue(value);
  this.set(name, location);
};


/**
 * Sets the {@code ccc.Location} associated with a name in this environment's
 * top-level ancestor.
 *
 * @param {string} name
 * @param {!ccc.Location} location
 */
ccc.Environment.prototype.setGlobal = function(name, location) {
  var environment = this;
  while (!goog.isNull(environment.parent_))
    environment = environment.parent_;
  environment.set(name, location);
};


/**
 * Binds a top-level name to a new {@code ccc.ImmediateLocation} holding the
 * given value.
 *
 * @param {string} name
 * @param {ccc.Data} value
 */
ccc.Environment.prototype.setGlobalValue = function(name, value) {
  var location = new ccc.ImmediateLocation();
  location.setValue(value);
  this.setGlobal(name, location);
};


/**
 * Gets the {@code ccc.Location} to which a name is bound. If the binding does
 * not exist in the immediate environment, the ancestor environments are
 * searched recursively. Returns {@code null} if the binding does not exist.
 *
 * @param {string} name
 * @return {?ccc.Location}
 */
ccc.Environment.prototype.get = function(name) {
  var location = /** @type {ccc.Location} */ (
      goog.object.get(this.bindings_, name, null));
  if (goog.isNull(location) && !goog.isNull(this.parent_))
    return this.parent_.get(name);
  return location;
};


/**
 * Gets the {@code ccc.Data} stored at a given local index or {@code null} if
 * no such local location exists.
 *
 * @param {number} index
 * @return {?ccc.Data}
 */
ccc.Environment.prototype.getLocalValue = function(index) {
  if (index < this.locals_.length)
    return this.locals_[index];
  return null;
};


/**
 * Sets the {@code ccc.Data} stored at a given local index. Returns {@code true}
 * if the local location exists and was updated, or {@code false} otherwise.
 *
 * @param {number} index
 * @param {ccc.Data} value
 * @return {boolean}
 */
ccc.Environment.prototype.setLocalValue = function(index, value) {
  if (index >= this.locals_.length)
    return false;
  this.locals_[index] = value;
  return true;
};


/**
 * Sets the array of active local bindings for this environment.
 *
 * @param {!Array.<ccc.Data>} locals
 */
ccc.Environment.prototype.setActiveLocals = function(locals) {
  this.locals_ = locals;
};


/**
 * Adds a prelude task to the environment. Libraries can add their own prelude
 * tasks - typically such a task will parse and evaluate some initialization
 * code provided by the library.
 *
 * An environment's preludes should be run to completion before the environment
 * is considered usable.
 *
 * @param {ccc.ThreadEntryPoint} prelude
 */
ccc.Environment.prototype.addPrelude = function(prelude) {
  this.preludes_.push(prelude);
};


/**
 * Returns a thread entry point which corresponds to the execution of all of
 * this environment's preludes to completion.
 *
 * @return {ccc.ThreadEntryPoint}
 */
ccc.Environment.prototype.evalPreludes = function() {
  var preludes = this.preludes_;
  return function(continuation) {
    var evalNextPrelude = function(result) {
      if (ccc.isError(result))
        return new ccc.Error('Prelude: ' + result);
      if (preludes.length == 0)
        return continuation(ccc.UNSPECIFIED);
      return preludes.shift()(evalNextPrelude);
    };
    return evalNextPrelude(ccc.UNSPECIFIED);
  }
};



/**
 * A mapping from binding name to {@code ccc.Location}.
 *
 * @typedef {Object.<string, !ccc.Location>}
 * @private
 */
ccc.BindingMap_;
