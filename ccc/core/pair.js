// The Cmacs Project.

goog.provide('ccc.Pair');

goog.require('ccc.Nil');
goog.require('ccc.Object');
goog.require('ccc.core.stringify');
goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * Pair type.
 *
 * @param {ccc.Data} car
 * @param {ccc.Data} cdr
 * @constructor
 * @extends {ccc.Object}
 */
ccc.Pair = function(car, cdr) {
  /** @private {ccc.Data} */
  this.car_ = car;

  /** @private {ccc.Data} */
  this.cdr_ = cdr;
};
goog.inherits(ccc.Pair, ccc.Object);


/**
 * Indicates if a {@code ccc.Data} is a {@code ccc.Pair}.
 *
 * @param {ccc.Data} data
 * @return {boolean}
 */
ccc.isPair = function(data) {
  return data instanceof ccc.Pair;
};


/** @override */
ccc.Pair.prototype.toString = function() {
  var str = '(' + ccc.core.stringify(this.car_);
  if (this.cdr_ === ccc.NIL) {
    return str + ')';
  }
  if (this.cdr_ instanceof ccc.Pair) {
    return str + this.cdr_.toStringInner_() + ')';
  }
  return str + ' . ' + ccc.core.stringify(this.cdr_) + ')';
};


/**
 * Used by toString to display inner elements of a list.
 *
 * @return {string}
 */
ccc.Pair.prototype.toStringInner_ = function() {
  var str = ' ' + ccc.core.stringify(this.car_);
  if (this.cdr_ === ccc.NIL) {
    return str;
  }
  if (this.cdr_ instanceof ccc.Pair) {
    return str + this.cdr_.toStringInner_();
  }
  return str + ' . ' + ccc.core.stringify(this.cdr_);
};


/** @override */
ccc.Pair.prototype.equal = function(other) {
  return ccc.isPair(other) &&
      ccc.equal(this.car_, other.car_) &&
      ccc.equal(this.cdr_, other.cdr_);
};


/**
 * The first element of the pair.
 *
 * @return {ccc.Data}
 */
ccc.Pair.prototype.car = function() {
  return this.car_;
};


/**
 * The second element of the pair.
 *
 * @return {ccc.Data}
 */
ccc.Pair.prototype.cdr = function() {
  return this.cdr_;
};


/**
 * Creates a nested Pair sequence to represent a list of data with an optional
 * non-NIL tail.
 *
 * @param {!Array.<ccc.Data>} objects
 * @param {ccc.Data=} opt_tail
 * @return {!ccc.Pair|!ccc.Nil}
 */
ccc.Pair.makeList = function(objects, opt_tail) {
  // Don't call this with an empty list but a non-NIL tail.
  goog.asserts.assert(objects.length > 0 || !goog.isDef(opt_tail) ||
      ccc.isNil(opt_tail), 'Invalid list form');
  var list = goog.isDef(opt_tail) ? opt_tail : ccc.NIL;
  goog.array.forEachRight(objects, function(object) {
    list = new ccc.Pair(object, list);
  });
  return /** @type {!ccc.Pair|!ccc.Nil} */ (list);
};


/** @override */
ccc.Pair.prototype.expand = function(environment, continuation) {
  return goog.partial(ccc.expand(this.car_, environment),
      goog.bind(this.onHeadExpanded_, this, environment, continuation));
};


/**
 * Continuation to use after head expansion.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} head
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.prototype.onHeadExpanded_ = function(environment, continuation, head) {
  if (ccc.isError(head))
    return continuation(head);
  if (head !== this.car_)
    return goog.partial(ccc.expand(new ccc.Pair(head, this.cdr_), environment),
        continuation);
  if (ccc.isTransformer(head))
    return goog.bind(head.transform, head, environment, this.cdr_,
        goog.partial(ccc.Pair.onTransformed_, environment, continuation));
  return goog.partial(ccc.Pair.expandTail_, this.cdr_, environment,
      goog.partial(ccc.Pair.join_, continuation, head));
};


/**
 * Continuation to use after transformation.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} transformedData
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.onTransformed_ = function(
    environment, continuation, transformedData) {
  if (ccc.isError(transformedData))
    return continuation(transformedData);
  return goog.partial(ccc.expand(transformedData, environment), continuation);
};


/**
 * Unbound thunk to expand a non-head element.
 *
 * @param {ccc.Data} tail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.expandTail_ = function(tail, environment, continuation) {
  if (ccc.isNil(tail))
    return goog.partial(continuation, ccc.NIL);
  if (!ccc.isPair(tail))
    return goog.partial(continuation,
        new ccc.Error('Unable to expand improper list'));
  return goog.partial(ccc.expand(tail.car_, environment), goog.partial(
      ccc.Pair.onTailExpanded_, tail, environment, continuation));
};


/**
 * Continuation to handle non-head element expansion.
 *
 * @param {ccc.Data} tail
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} expandedTail
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.onTailExpanded_ = function(
    tail, environment, continuation, expandedTail) {
  if (ccc.isError(expandedTail))
    return goog.partial(continuation, expandedTail);
  return goog.partial(ccc.Pair.expandTail_, tail.cdr_, environment,
      goog.partial(ccc.Pair.join_, continuation, expandedTail));
};


/**
 * Continuation which passes out a new pair by joining two arguments.
 *
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} head
 * @param {ccc.Data} tail
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.join_ = function(continuation, head, tail) {
  if (ccc.isError(tail))
    return goog.partial(continuation, tail);
  return goog.partial(continuation, new ccc.Pair(head, tail));
};


/** @override */
ccc.Pair.prototype.compile = function(environment, continuation) {
  return ccc.Pair.compileList_(this, environment, continuation);
};


/**
 * Compiles a list recursively.
 *
 * @param {(!ccc.Pair|!ccc.Nil)} list
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.compileList_ = function(list, environment, continuation) {
  if (ccc.isError(list))
    return continuation(list);
  if (ccc.isNil(list))
    return continuation(ccc.NIL);
  return goog.partial(ccc.compile(list.car_, environment), goog.partial(
      ccc.Pair.onListCompiled_, list, environment, continuation));
};


/**
 * Continues recursive list comilation.
 *
 * @param {!ccc.Pair} list
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} compiledData
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.onListCompiled_ = function(
    list, environment, continuation, compiledData) {
  return goog.partial(ccc.Pair.compileList_, list.cdr_, environment,
      goog.partial(ccc.Pair.join_, continuation, compiledData));
};


/** @override */
ccc.Pair.prototype.eval = function(environment, continuation) {
  return ccc.eval(this.car_, environment)(goog.bind(this.onHeadEval_, this,
      environment, continuation));
};


/**
 * Continuation to handle head element evaluation, which is the first step in
 * evaluating a list.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation The outer continuation which
 *     will ultimately receive the result of the list evaluation.
 * @param {ccc.Data} head The evaluated list head. Must be applicable.
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.prototype.onHeadEval_ = function(environment, continuation, head) {
  if (ccc.isError(head))
    return continuation(head);
  var arg = this.cdr_;
  var argContinuation = goog.partial(ccc.Pair.applyContinuationImpl_,
      environment, continuation, head);
  while (ccc.isPair(arg)) {
    argContinuation = goog.partial(ccc.Pair.evalArgContinuationImpl_,
      environment, continuation, arg.car_, argContinuation);
    arg = arg.cdr_;
  }
  goog.asserts.assert(ccc.isNil(arg));
  return argContinuation(ccc.NIL);
};


/**
 * Unbound implementation of the continuation which applies the evaluated
 * head of a list to its evaluated args.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} head
 * @param {ccc.Data} args
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.applyContinuationImpl_ = function(
    environment, continuation, head, args) {
  if (ccc.isError(args))
    return continuation(args);
  goog.asserts.assert(ccc.isPair(args) || ccc.isNil(args));
  return head.apply(environment, args, continuation);
};


/**
 * Unbound implementation of the continuation which performs a single
 * argument evaluation leading up to list combination.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} arg
 * @param {ccc.Continuation} innerContinuation
 * @param {ccc.Data} values
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.evalArgContinuationImpl_ = function(
    environment, continuation, arg, innerContinuation, values) {
  if (ccc.isError(values))
    return continuation(values);
  goog.asserts.assert(ccc.isPair(values) || ccc.isNil(values));
  return ccc.eval(arg, environment)(goog.partial(ccc.Pair.collectArg_, values,
      innerContinuation));
};


/**
 * Unbound continuation which joins an evaluated argument with the tail of its
 * evaluated successors.
 *
 * @param {!ccc.Pair|!ccc.Nil} values
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} value
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.collectArg_ = function(values, continuation, value) {
  if (ccc.isError(value))
    return continuation(value);
  return continuation(new ccc.Pair(value, values));
};
