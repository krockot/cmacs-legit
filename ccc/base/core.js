// The Cmacs Project.

goog.provide('ccc.Environment');
goog.provide('ccc.Object');
goog.provide('ccc.core');

goog.require('ccc.Continuation');
goog.require('ccc.Data');
goog.require('ccc.Environment');
goog.require('ccc.Error');
goog.require('ccc.Object');
goog.require('ccc.Thunk');



/**
 * Base ccc runtime object.
 *
 * @constructor
 */
ccc.Object = function() {};


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
 * Returns a string representation of this object for logging and debugging
 * display. All derived object types should override this.
 *
 * @return {string}
 */
ccc.Object.prototype.toString = function() {
  return '#<object>';
};


/**
 * Default strict equality implementation: native object identity.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.eq = function(other) {
  return this === other;
};


/**
 * Default equivalence implementation: fallback to strict equality.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.eqv = function(other) {
  return this.eq(other);
};


/**
 * Default non-strict equality implementation: fallback to equivalence.
 *
 * @param {ccc.Data} other
 * @return {boolean}
 */
ccc.Object.prototype.equal = function(other) {
  return this.eqv(other);
};


/**
 * Indicates if this object is applicable (i.e. it implements {@code apply}).
 *
 * @return {boolean}
 */
ccc.Object.prototype.isApplicable = function() {
  return false;
};


/**
 * Expand this object.
 *
 * @param {ccc.Continuation} continuation
 * @return {!ccc.Thunk}
 */
ccc.Object.prototype.expand = function(continuation) {
  return continuation(this);
};


/**
 * Compile this object.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {!ccc.Thunk}
 */
ccc.Object.prototype.compile = function(environment, continuation) {
  // Objects compile to themselves by default.
  return continuation(this);
};


/**
 * Evaluate this object.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object should be evaluated.
 * @param {ccc.Continuation} continuation The continuation which
 *     should receive the result of this evaluation.
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.eval = function(environment, continuation) {
  // All {@code ccc.Object} types are self-evaluating by default.
  return continuation(this);
};


/**
 * Apply this object to combine a list of data. Should only be called if
 * {@code isApplicable} returns {@code true}.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object application is to be initiated.
 * @param {!ccc.Object} args The arguments to apply.
 * @param {ccc.Continuation} continuation The continuation which should
 *     receive the result of this procedure application.
 * @return {ccc.Thunk}
 */
ccc.Object.prototype.apply = function(environment, args, continuation) {
  return continuation(new ccc.Error('Object ' + this.toString() +
      ' is not applicable.'));
};



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


/**
 * Indicates if a given {@code ccc.Data} is a symbol.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isSymbol = function(data) {
  // This is an evil hack to keep Closure Compiler from complaining that
  // 'symbol' is an unknown type.
  return typeof data === ('sym'+'bol');
};


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


/**
 * Begins evaluation of a {@code ccc.Data}, returning a {@code ccc.Thunk} which
 * steps evaluation when called.
 *
 * When evaluation is complete the provided continuation will be called with the
 * result or an error.
 *
 * @param {ccc.Data} data The data to evaluate.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform evaluation.
 * @param {ccc.Continuation} continuation The continuation which should
 *     eventually receive the evaluation result or exception.
 * @return {!ccc.Thunk}
 */
ccc.eval = function(data, environment, continuation) {
  if (ccc.isObject(data))
    return data.eval(environment, continuation);
  if (ccc.isSymbol(data)) {
    var name = Symbol.keyFor(/** @type {symbol} */ (data));
    var value = environment.get(name);
    if (goog.isNull(value))
      return continuation(new ccc.Error('Unbound symbol |' + name + '|'));
    return continuation(value);
  }
  // Default to self-evaluation for everything else.
  return continuation(data);
};
