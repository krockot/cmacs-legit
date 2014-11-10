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
 * Recursively map this pair given a transform function. The transform is
 * applied to each car in the pair chain. If the list is improper, the transform
 * is also applied to the tail element.
 *
 * @param {function(ccc.Data):ccc.Data} transform
 * @return {!ccc.Pair}
 */
ccc.Pair.prototype.map = function(transform) {
  var tail = this.cdr_;
  if (ccc.isPair(tail))
    tail = tail.map(transform);
  else
    tail = transform(tail);
  return new ccc.Pair(transform(this.car_), tail);
};


/**
 * Modifies the first element of this pair.
 *
 * @param {ccc.Data} data
 */
ccc.Pair.prototype.setCar = function(data) {
  this.car_ = data;
};


/**
 * Modifies the second element of this pair.
 *
 * @param {ccc.Data} data
 */
ccc.Pair.prototype.setCdr = function(data) {
  this.cdr_ = data;
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
    return continuation(head.pass());
  if (!ccc.equal(head, this.car_))
    return goog.partial(ccc.expand(new ccc.Pair(head, this.cdr_), environment),
        continuation);
  if (ccc.isTransformer(head))
    return goog.partial(head.transform(environment, this.cdr_),
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
    return continuation(transformedData.pass());
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
    return continuation(expandedTail.pass());
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
    return continuation(tail.pass());
  return goog.partial(continuation, new ccc.Pair(head, tail));
};


/** @override */
ccc.Pair.prototype.compile = function(environment, continuation) {
  return ccc.Pair.compileList_(this, environment, continuation);
};


/**
 * Compiles a list recursively.
 *
 * @param {(!ccc.Pair|!ccc.Nil|!ccc.Error)} list
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.compileList_ = function(list, environment, continuation) {
  if (ccc.isError(list))
    return continuation(list.pass());
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
  if (ccc.isError(compiledData))
    return continuation(compiledData.pass());
  return goog.partial(ccc.Pair.compileList_, list.cdr_, environment,
      goog.partial(ccc.Pair.join_, continuation, compiledData));
};


/** @override */
ccc.Pair.prototype.eval = function(environment, continuation) {
  return ccc.Pair.evalList_(this, environment, goog.partial(
      ccc.Pair.combineList_, environment, continuation));
};


/**
 * Evaluates a list recursively.
 *
 * @param {(!ccc.Pair|!ccc.Nil|!ccc.Error)} list
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.evalList_ = function(list, environment, continuation) {
  if (ccc.isError(list))
    return continuation(list.pass());
  if (ccc.isNil(list))
    return continuation(ccc.NIL);
  return goog.partial(ccc.eval(list.car_, environment), goog.partial(
      ccc.Pair.onListEvaluated_, list, environment, continuation));
};


/**
 * Continues recursive list evaluation.
 *
 * @param {!ccc.Pair} list
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} result
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.onListEvaluated_ = function(list, environment, continuation, result) {
  if (ccc.isError(result))
    return continuation(result);
  return goog.partial(ccc.Pair.evalList_, list.cdr_, environment,
      goog.partial(ccc.Pair.join_, continuation, result));
};


/**
 * Combines a list by applying its head to its tail.
 *
 * @param {!ccc.Environment} environment
 * @param {ccc.Continuation} continuation
 * @param {ccc.Data} data
 * @return {ccc.Thunk}
 * @private
 */
ccc.Pair.combineList_ = function(environment, continuation, data) {
  if (ccc.isError(data))
    return continuation(data.pass());
  goog.asserts.assert(ccc.isPair(data));
  var list = /** @type {!ccc.Pair} */ (data);
  var head = list.car_;
  if (!ccc.isApplicable(head))
    return continuation(new ccc.Error('Object ' + head.toString() +
        ' is not applicable.'));
  return goog.bind(head.apply, head, environment, list.cdr_, continuation);
};
