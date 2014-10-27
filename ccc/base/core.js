// The Cmacs Project.

goog.provide('ccc.Continuation');
goog.provide('ccc.Data');
goog.provide('ccc.Environment');
goog.provide('ccc.Error');
goog.provide('ccc.Location');
goog.provide('ccc.Nil');
goog.provide('ccc.Object');
goog.provide('ccc.Thunk');
goog.provide('ccc.Unspecified');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');



/**
 * An element of program data. This may be a primitive JS value or an instance
 * of {@code ccc.Object}. The only primitive values which are strictly not
 * allowed to behave as program data are {@code undefined} and {@code null}.
 *
 * @typedef {(!ccc.Object|string|symbol|number|boolean|!Object|
              !Array.<!ccc.Data>)}
 * @public
 */
ccc.Data;



/**
 * A continuation is any function which takes a single {@code ccc.Data},
 * or {@code null} and a {@code ccc.Error}, and returns a {@code ccc.Thunk}.
 *
 * @typedef {function(?ccc.Data, !ccc.Error=):ccc.Thunk}
 * @public
 */
ccc.Continuation;



/**
 * A thunk primitive used extensively to implement form evaluation in
 * continuation-passing style. Every thunk returns a new thunk to be
 * subsequently called.
 *
 * @typedef {function():ccc.Thunk}
 * @public
 */
ccc.Thunk;



/**
 * Base ccc runtime object.
 *
 * @constructor
 * @public
 */
ccc.Object = function() {};


/**
 * Returns a string representation of this object for logging and debugging
 * display. All derived object types should override this.
 *
 * @return {string}
 * @public
 */
ccc.Object.prototype.toString = function() {
  return '#<object>';
};


/**
 * Default strict equality implementation: native object identity.
 *
 * @param {!ccc.Object} other
 * @return {boolean}
 * @public
 */
ccc.Object.prototype.eq = function(other) {
  return this === other;
};


/**
 * Default equivalence implementation: fallback to strict equality.
 *
 * @param {!ccc.Object} other
 * @return {boolean}
 * @public
 */
ccc.Object.prototype.eqv = function(other) {
  return this.eq(other);
};


/**
 * Default non-strict equality implementation: fallback to equivalence.
 *
 * @param {!ccc.Object} other
 * @return {boolean}
 * @public
 */
ccc.Object.prototype.equal = function(other) {
  return this.eqv(other);
};


/**
 * Indicates if this object is applicable (i.e. it implements {@code apply}).
 *
 * @return {boolean}
 * @public
 */
ccc.Object.prototype.isApplicable = function() {
  return false;
};


/**
 * Apply this object to combine a list of data. Should only be called if
 * {@code isApplicable} returns {@code true}.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object application is to be initiated.
 * @param {!ccc.Object} args The arguments to apply.
 * @param {!ccc.Continuation} continuation The continuation which should
 *     receive the result of this procedure application.
 * @return {ccc.Thunk}
 * @public
 */
ccc.Object.prototype.apply = function(environment, args, continuation) {
  return continuation(null, new ccc.Error(
      'Object ' + this.toString() + ' is not applicable.'));
};


/**
 * Evaluate this object.
 *
 * @param {!ccc.Environment} environment The environment in which this
 *     object should be evaluated.
 * @param {!ccc.Continuation} continuation The continuation which
 *     should receive the result of this evaluation.
 * @return {ccc.Thunk}
 * @public
 */
ccc.Object.prototype.eval = function(environment, continuation) {
  // All {@code ccc.Object} types are self-evaluating by default.
  return continuation(this);
};



/**
 * The type of the global NIL object. This really only exists for setting type
 * constraints in annotations. There is no good reason to construct new
 * objects of this type beyond the global {@code ccc.NIL} constant.
 *
 * @constructor
 * @extends {ccc.Object}
 * @public
 */
ccc.Nil = function() {};
goog.inherits(ccc.Nil, ccc.Object);


/** @override */
ccc.Nil.prototype.toString = function() { return '()'; };


/**
 * The global NIL [AKA ()] object.
 *
 * @public {!ccc.Nil}
 * @const
 */
ccc.NIL = new ccc.Nil();



/**
 * The type of the global UNSPECIFIED object. Like {@code ccc.Nil}, this
 * type exists for the sake of annotation. Always use the
 * {@code ccc.UNSPECIFIED} constant if an instance is required.
 *
 * @constructor
 * @extends {ccc.Object}
 * @public
 */
ccc.Unspecified = function() {};
goog.inherits(ccc.Unspecified, ccc.Object);


/** @override */
ccc.Unspecified.prototype.toString = function() { return '#?'; };



/**
 * The global UNSPECIFIED [AKA #?] object.
 *
 * @public {!ccc.Unspecified}
 * @const
 */
ccc.UNSPECIFIED = new ccc.Unspecified();



/**
 * The basic exception type which may be thrown during evaluation.
 *
 * @param {string} message
 * @constructor
 * @extends {ccc.Object}
 * @public
 */
ccc.Error = function(message) {
  /** @private {string} */
  this.message_ = message;

  /** @private {string} */
  this.stack_ = (new Error()).stack;
};
goog.inherits(ccc.Error, ccc.Object);


/** @override */
ccc.Error.prototype.toString = function() {
  return this.message_ + '\n' + this.stack_;
};



/**
 * An Environment provides the evaluation context for an expression. It consists
 * of an innermost set of bindings and an optional link to a parent environment.
 *
 * @param {!ccc.Environment=} opt_parent The parent environment.
 * @constructor
 * @extends {ccc.Object}
 * @public
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
   * The active frame for this environment. A "frame" in this context is an
   * immediate, ephemeral descendent of the environment, generated by and
   * persisting across the extent of a single procedure application. If this
   * is {@code null}, the environment uses itself as its own active frame.
   * @private {ccc.Environment}
   */
  this.activeFrame_ = null;

  /** @private {number} */
  this.id_ = ++ccc.Environment.nextId_;
};
goog.inherits(ccc.Environment, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Environment}.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isEnvironment = function(data) {
  return data instanceof ccc.Environment;
};


/**
 * Used to attach a unique ID to every environment.
 * @private {number}
 */
ccc.Environment.nextId_ = 0;


/** @override */
ccc.Environment.prototype.toString = function() {
  return '#<environment>';
};


/**
 * Binds a name to a new Location.
 *
 * @param {string} name The name of the binding.
 * @param {boolean=} opt_asProxy If {@code true}, the Location will be created
 *     as a proxy. Defaults to {@code false}.
 * @return {!ccc.Location} The newly allocated Location.
 * @public
 */
ccc.Environment.prototype.allocate = function(name, opt_asProxy) {
  var proxyName = goog.isDef(opt_asProxy) && opt_asProxy ? name : undefined;
  return this.bindLocation(name, new ccc.Location(this, proxyName));
};


/**
 * Convenience form of allocate with opt_asProxy set to true.
 *
 * @param {string} name The name of the binding.
 * @return {!ccc.Location}
 * @public
 */
ccc.Environment.prototype.allocateProxy = function(name) {
  return this.allocate(name, true);
};


/**
 * Binds a name to an existing Location. Ownership of the Location is
 * transferred away from its previous owner if it had one.
 *
 * @param {string} name The name of the binding.
 * @param {!ccc.Location} location The location to bind.
 * @return {!ccc.Location}
 * @public
 */
ccc.Environment.prototype.bindLocation = function(name, location) {
  if (goog.object.containsKey(this.bindings_, name))
    throw new Error('Duplicate binding encountered for symbol |' + name + '|');
  goog.object.set(this.bindings_, name, location);
  location.setEnvironment(this);
  return location;
};


/**
 * Gets the {@code ccc.Location} to which the given name is bound.
 * Returns {@code null} if the binding does not exist.
 *
 * @param {string} name
 * @return {ccc.Location}
 * @public
 */
ccc.Environment.prototype.get = function(name) {
  var environment = goog.isNull(this.activeFrame_) ? this : this.activeFrame_;
  var location = /** @type {ccc.Location} */ (goog.object.get(
      environment.bindings_, name, null));
  if (goog.isNull(location) && !goog.isNull(this.parent_))
    return this.parent_.get(name);
  return location;
};


/**
 * Indicates if the environment has a location bound for the given name.
 *
 * @param {string} name
 * @return {boolean}
 * @public
 */
ccc.Environment.prototype.hasBinding = function(name) {
  return goog.object.containsKey(this.bindings_, name);
};


/**
 * Indicates if this is a top-level environment.
 *
 * @return {boolean}
 * @public
 */
ccc.Environment.prototype.isToplevel = function() {
  return goog.isNull(this.parent_);
};


/**
 * Sets this environment's active frame. Thunks within the extent of a procedure
 * application use this to ensure the evaluation environment is correct.
 *
 * @param {!ccc.Environment} frame
 * @public
 */
ccc.Environment.prototype.setActiveFrame = function(frame) {
  this.activeFrame_ = frame;
};



/**
 * A binding location. A Location holds a single {@code ccc.Data} and may
 * be allocated at compile time or evaluation time. All symbols compile down to
 * Locations, which may themselves be only lazy proxies for Locations generated
 * at evaluation time.
 *
 * For example, the form (lambda (x) x) will allocate a Location at compile time
 * and bind it to the symbol |x| witihn the lambda body's compilation
 * environment. This location, when dereferenced in evaluation, will act as
 * a proxy for the |x| binding established at call-time within the procedure's
 * active frame.
 *
 * @param {!ccc.Environment} environment The environment which owns this
 *     Location's binding.
 * @param {string=} opt_proxyName The symbol name which this Location proxies,
 *     if any.
 * @constructor
 * @extends {ccc.Object}
 * @public
 */
ccc.Location = function(environment, opt_proxyName) {
  /** @private {!ccc.Environment} */
  this.environment_ = environment;

  /** @private {string|undefined} */
  this.proxyName_ = opt_proxyName;

  /**
   * The value stored in this location. Defaults to unspecified.
   * @private {!ccc.Data}
   */
  this.value_ = ccc.UNSPECIFIED;
};
goog.inherits(ccc.Location, ccc.Object);


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Location}.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isLocation = function(data) {
  return data instanceof ccc.Location;
};


/** @override */
ccc.Location.prototype.toString = function() {
  if (this.isProxy())
    return '#<location-proxy:' + this.proxyName_ + '>';
  return '#<location:' + this.value_ + '>';
};


/** @override */
ccc.Location.prototype.eval = function(environment, continuation) {
  try {
    var value = this.getValue();
  } catch (e) {
    return continuation(null, e);
  }
  return continuation(value);
};


/**
 * Indicates if this Location is a proxy.
 *
 * @return {boolean}
 * @public
 */
ccc.Location.prototype.isProxy = function() {
  return goog.isDef(this.proxyName_);
};


/**
 * Returns the environment which owns this Location.
 *
 * @return {!ccc.Environment}
 * @public
 */
ccc.Location.prototype.getEnvironment = function() {
  return this.environment_;
};


/**
 * Updates the owning environment.
 *
 * @param {!ccc.Environment} environment
 * @public
 */
ccc.Location.prototype.setEnvironment = function(environment) {
  this.environment_ = environment;
};


/**
 * Retrieves the value stored at this location. Returns {@code null} if the
 * location is an unbacked proxy location (i.e., not a valid location to get.)
 *
 * @return {?ccc.Data}
 * @public
 */
ccc.Location.prototype.getValueUnsafe = function() {
  if (goog.isDef(this.proxyName_)) {
    var location = this.environment_.get(this.proxyName_);
    goog.asserts.assert(!goog.isNull(location));
    if (location == this)
      return null;
    return location.getValueUnsafe();
  }
  return this.value_;
};


/**
 * Retrieves the value stored at this location. For proxy locations, this
 * consults the owning environment (which should in turn consult its active
 * frame.)
 *
 * @return {!ccc.Data}
 * @public
 */
ccc.Location.prototype.getValue = function() {
  var value = this.getValueUnsafe();
  if (goog.isNull(value))
    // This should only be reachable if there's a bug in the evaluator.
    throw new Error(
        'Invalid dereference of unbacked proxy location for symbol |' +
        this.proxyName_ + '|');
  goog.asserts.assert(!goog.isNull(value));
  return value;
};


/**
 * Sets the value stored at this location.
 *
 * @param {!ccc.Data} value
 * @public
 */
ccc.Location.prototype.setValue = function(value) {
  if (goog.isDef(this.proxyName_)) {
    var location = this.environment_.get(this.proxyName_);
    goog.asserts.assert(!goog.isNull(location));
    if (location == this)
      // If the location is properly backed, its environment should return a
      // location from its own active frame instead of this.
      throw new Error(
          'Invalid dereference of unbacked proxy location for symbol |' +
          this.proxyName_ + '|');
    location.setValue(value);
  } else {
    this.value_ = value;
  }
};



/**
 * A mapping from binding name to {@code ccc.Location}.
 *
 * @typedef {Object.<string, !ccc.Location>}
 * @private
 */
ccc.BindingMap_;



/**
 * Indicates if a given {@code ccc.Data} is a symbol.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isSymbol = function(data) {
  // This is an evil hack to keep Closure Compiler from complaining that
  // 'symbol' is an unknown type.
  return typeof data === ('sym'+'bol');
};


/**
 * Indicates if a given {@code ccc.Data} is a string.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isString = function(data) {
  return typeof data === 'string';
};


/**
 * Indicates if a given {@code ccc.Data} is a number.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isNumber = function(data) {
  return typeof data === 'number';
};


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Object} of
 * any kind.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isCccObject = function(data) {
  return data instanceof ccc.Object;
};


/**
 * Indicates if a given {@code ccc.Data} is NIL.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isNil = function(data) {
  return data === ccc.NIL;
};


/**
 * Indicates if a given {@code ccc.Data} is UNSPECIFIED.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isUnspecified = function(data) {
  return data === ccc.UNSPECIFIED;
};


/**
 * Indicates if a given {@code ccc.Data} is a vector (Array).
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isVector = function(data) {
  return data instanceof Array;
};


/**
 * Indicates if a given {@code ccc.Data} is a {@code ccc.Error}.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isError = function(data) {
  return data instanceof ccc.Error;
};


/**
 * Indicates if a given {@code ccc.Data} is applicable.
 *
 * @param {!ccc.Data} data
 * @return {boolean}
 * @public
 */
ccc.isApplicable = function(data) {
  return ccc.isCccObject(data) && data.isApplicable();
}



/**
 * Create a binary predicate which compares {@code ccc.Data} objects for
 * equality using identity equality for primitive types and the given predicate
 * for {@code ccc.Object} types.
 *
 * @param {string} predicateName
 * @return {function(!ccc.Data, !ccc.Data):boolean}
 * @private
 */
ccc.createEqualityTest_ = function(predicateName) {
  /**
   * @param {!ccc.Data} one
   * @param {!ccc.Data} other
   * @return {boolean}
   */
  var test = function(one, other) {
    if (one instanceof ccc.Object)
      return one[predicateName](other);
    if (other instanceof ccc.Object)
      return false;
    if (one instanceof Array)
      return other instanceof Array && one.length == other.length &&
          goog.array.every(one, function(e, i) { return test(e, other[i]); });
    return one === other;
  };
  return test;
}


/**
 * Indicates if two {@code ccc.Data} objects are strictly equal. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @type {function(!ccc.Data, !ccc.Data):boolean}
 * @public
 */
ccc.eq = ccc.createEqualityTest_('eq');


/**
 * Indicates if two {@code ccc.Data} objects are equivalent. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @type {function(!ccc.Data, !ccc.Data):boolean}
 * @public
 */
ccc.eqv = ccc.createEqualityTest_('eqv');


/**
 * Indicates if two {@code ccc.Data} objects are recursively equal. The meaning
 * of this predicate depends on the underlying data types.
 *
 * @type {function(!ccc.Data, !ccc.Data):boolean}
 * @public
 */
ccc.equal = ccc.createEqualityTest_('equal');


/**
 * Begins evaluation of a {@code ccc.Data}. Evaluation need not happen
 * happen synchronously. This returns a {@code ccc.Thunk} which may need
 * to be called to advance the evaluation.
 *
 * When evaluation is complete the provided continuation will be called with the
 * result(s) or an error.
 *
 * @param {!ccc.Data} data The data element to evaluate.
 * @param {!ccc.Environment} environment The environment in which to
 *     perform evaluation.
 * @param {!ccc.Continuation} continuation The continuation which should
 *     eventually receive the evaluation result (or exception).
 * @return {!ccc.Thunk}
 * @public
 */
ccc.eval = function(data, environment, continuation) {
  if (ccc.isCccObject(data))
    return data.eval(environment, continuation);
  return continuation(data);
};
