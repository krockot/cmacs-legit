// The Cmacs Project.

goog.provide('ccc.base.Pair');

goog.require('ccc.base.NIL');
goog.require('ccc.base.Object');
goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * Pair type.
 *
 * @param {!ccc.base.Object} car
 * @param {!ccc.base.Object} cdr
 * @constructor
 * @extends {ccc.base.Object}
 * @public
 */
ccc.base.Pair = function(car, cdr) {
  /** @private {!ccc.base.Object} */
  this.car_ = car;

  /** @private {!ccc.base.Object} */
  this.cdr_ = cdr;
};
goog.inherits(ccc.base.Pair, ccc.base.Object);


/** @override */
ccc.base.Pair.prototype.toString = function() {
  var str = '(' + this.car_.toString();
  if (this.cdr_.isNil()) {
    return str + ')';
  }
  if (this.cdr_.isPair()) {
    return str + this.cdr_.toStringInner_() + ')';
  }
  return str + ' . ' + this.cdr_.toString() + ')';
};


/**
 * Used by toString to display inner elements of a list.
 *
 * @return {string}
 */
ccc.base.Pair.prototype.toStringInner_ = function() {
  var str = ' ' + this.car_.toString();
  if (this.cdr_.isNil()) {
    return str;
  }
  if (this.cdr_.isPair()) {
    return str + this.cdr_.toStringInner_();
  }
  return str + ' . ' + this.cdr_.toString();
};


/** @override */
ccc.base.Pair.prototype.equal = function(other) {
  return other.isPair() &&
      this.car_.equal(other.car_) &&
      this.cdr_.equal(other.cdr_);
};


/** @override */
ccc.base.Pair.prototype.isPair = function() {
  return true;
};


/**
 * The first element of the pair.
 *
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.prototype.car = function() {
  return this.car_;
};


/**
 * The second element of the pair.
 *
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.prototype.cdr = function() {
  return this.cdr_;
};


/**
 * Creates a nested Pair sequence to represent a list of objects with an
 * optional non-NIL tail.
 *
 * @param {!Array.<!ccc.base.Object>} objects
 * @param {!ccc.base.Object=} opt_tail
 * @return {!ccc.base.Object}
 */
ccc.base.Pair.makeList = function(objects, opt_tail) {
  var list = goog.isDef(opt_tail) ? opt_tail : ccc.base.NIL;
  goog.array.forEachRight(objects, function(object) {
    list = new ccc.base.Pair(object, list);
  });
  return list;
};


/** @override */
ccc.base.Pair.prototype.compile = function(environment) {
  return this.car_.compile(environment).then(function(compiledHead) {
    if (compiledHead.isSymbol()) {
      var headValue = environment.get(compiledHead.name());
      if (!goog.isNull(headValue) && headValue.isTransformer()) {
        return headValue.transform(environment, this.cdr_).then(
            function(transformed) {
          return transformed.compile(environment);
        });
      }
    }
    var compileArgs = function(args) {
      if (args.isNil())
        return goog.Promise.resolve(ccc.base.NIL);
      if (!args.isPair())
        return goog.Promise.reject(new Error('Invalid list expression'));
      return compileArgs(args.cdr_).then(function(cdr) {
        return args.car_.compile(environment).then(function(car) {
          return new ccc.base.Pair(car, cdr);
        });
      });
    };
    return compileArgs(this.cdr_).then(function(compiledArgs) {
      return new ccc.base.Pair(compiledHead, compiledArgs);
    });
  }, null, this);
};


/** @override */
ccc.base.Pair.prototype.eval = function(environment, continuation) {
  return this.car_.eval(environment, goog.bind(
      this.onHeadEval_, this, environment, continuation));
};


/**
 * Continuation to handle head element evaluation, which is the first step in
 * evaluating a list.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Continuation} continuation The outer continuation which
 *     will ultimately receive the result of the list evaluation.
 * @param {ccc.base.Object} head The evaluated list head. Must be applicable.
 * @param {Error=} opt_error
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.base.Pair.prototype.onHeadEval_ = function(
    environment, continuation, head, opt_error) {
  if (goog.isDef(opt_error))
    return continuation(null, opt_error);
  goog.asserts.assert(!goog.isNull(head));
  var arg = this.cdr_;
  var argContinuation = goog.partial(ccc.base.Pair.applyContinuationImpl_,
      environment, continuation, head);
  while (arg.isPair()) {
    argContinuation = goog.partial(ccc.base.Pair.evalArgContinuationImpl_,
      environment, continuation, arg.car_, argContinuation);
    arg = arg.cdr_;
  }
  goog.asserts.assert(arg.isNil());
  return argContinuation(ccc.base.NIL);
};


/**
 * Unbound implementation of the continuation which applies the evaluated
 * head of a list to its evaluated args.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Continuation} continuation
 * @param {!ccc.base.Object} head
 * @param {ccc.base.Object} args
 * @param {Error=} opt_error
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.base.Pair.applyContinuationImpl_ = function(
    environment, continuation, head, args, opt_error) {
  if (goog.isDef(opt_error))
    return continuation(null, opt_error);
  goog.asserts.assert(!goog.isNull(args));
  return head.apply(environment, args, continuation);
};


/**
 * Unbound implementation of the continuation which performs a single
 * argument evaluation leading up to list combination.
 *
 * @param {!ccc.base.Environment} environment
 * @param {!ccc.base.Continuation} continuation
 * @param {!ccc.base.Object} arg
 * @param {!ccc.base.Continuation} innerContinuation
 * @param {ccc.base.Object} values
 * @param {Error=} opt_error
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.base.Pair.evalArgContinuationImpl_ = function(
    environment, continuation, arg, innerContinuation, values, opt_error) {
  if (goog.isDef(opt_error))
    return continuation(null, opt_error);
  goog.asserts.assert(!goog.isNull(values));
  return arg.eval(environment, goog.partial(ccc.base.Pair.collectArg_,
      values, innerContinuation));
};


/**
 * Unbound continuation which joins an evaluated argument with the tail of its
 * evaluated successors.
 *
 * @param {!ccc.base.Object} values
 * @param {!ccc.base.Continuation} continuation
 * @param {ccc.base.Object} value
 * @param {Error=} opt_error
 * @return {ccc.base.Thunk}
 * @private
 */
ccc.base.Pair.collectArg_ = function(values, continuation, value, opt_error) {
  if (goog.isDef(opt_error))
    return continuation(null, opt_error);
  goog.asserts.assert(!goog.isNull(value));
  return continuation(new ccc.base.Pair(value, values));
};
