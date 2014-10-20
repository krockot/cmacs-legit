  // The Cmacs Project.

goog.provide('ccc.syntax.Template');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture');
goog.require('ccc.syntax.CaptureIterator');
goog.require('ccc.syntax.CaptureIteratorSet');
goog.require('ccc.syntax.CaptureSet');
goog.require('ccc.syntax.Pattern');
goog.require('goog.object');
goog.require('goog.string.format');



/**
 * Syntax template which can be used to stamp out new forms when given the
 * {@code ccc.syntax.CaptureSet} of a corresponding {@code ccc.syntax.Pattern}
 * match.
 *
 * @param {!ccc.base.Object} form The template form.
 * @constructor
 * @public
 */
ccc.syntax.Template = function(form) {
  /** @private {!ccc.base.Object} */
  this.form_ = form;
};


/**
 * Fully expands this template given a {@code ccc.syntax.CaptureSet}.
 *
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {!ccc.base.Object}
 * @public
 */
ccc.syntax.Template.prototype.expand = function(captures) {
  var iterators = goog.object.map(captures, function(capture) {
    return new ccc.syntax.CaptureIterator(capture);
  });
  var expansion = this.expandForm_(this.form_, iterators, {});
  goog.asserts.assert(!goog.isNull(expansion));
  return expansion;
};


/**
 * Expands a template subform over a set of capture iterators.
 *
 * @param {!ccc.base.Object} template
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {!ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandForm_ = function(
    template, iterators, usedVars) {
  if (template.isSymbol())
    return this.expandSymbol_(/** @type {!ccc.base.Symbol} */ (template),
        iterators, usedVars);
  if (template.isPair())
    return this.expandList_(template, iterators, usedVars);
  if (template.isVector())
    return this.expandVector_(/** @type {!ccc.base.Vector} */ (template),
        iterators, usedVars);
  // Anything else just expands to itself.
  return template;
};


/**
 * Expands a symbol template.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {!ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandSymbol_ = function(
    symbol, iterators, usedVars) {
  var iterator = goog.object.get(iterators, symbol.name());
  // Non-captured symbols expand to themselves.
  if (!goog.isDef(iterator))
    return symbol;
  usedVars[symbol.name()] = true;
  if (!iterator.capture().isSingular())
    throw new Error(goog.string.format(
        'Invalid ellipsis placement when expanding |%s|', symbol.name()));
  return iterator.get().object();
};


/**
 * Expands a list template.
 *
 * @param {!ccc.base.Object} list
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {!ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandList_ = function(
    list, iterators, usedVars) {
  var outputElements = [];
  while (list.isPair()) {
    var element = list.car();
    var nextList = list.cdr();
    var repeat = false;
    if (nextList.isPair()) {
      var nextElement = nextList.car();
      if (nextElement.isSymbol() &&
          nextElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
        repeat = true;
        list = nextList;
      }
    }
    if (repeat) {
      outputElements.push.apply(outputElements, this.expandRepeatingForm_(
          element, iterators, usedVars));
    } else {
      outputElements.push(this.expandForm_(element, iterators, usedVars));
    }
    list = list.cdr();
  }
  return ccc.base.Pair.makeList(outputElements, this.expandForm_(
      list, iterators, usedVars));
};


/**
 * Expands a vector template.
 *
 * @param {!ccc.base.Vector} vector
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {!ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandVector_ = function(
    vector, iterators, usedVars) {
  var outputElements = [];
  for (var i = 0; i < vector.size(); ++i) {
    var element = vector.get(i);
    /** @type {ccc.base.Object} */
    var nextElement = null;
    if (i < vector.size() - 1) {
      nextElement = vector.get(i + 1);
    }
    if (!goog.isNull(nextElement) && nextElement.isSymbol() &&
        nextElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
      ++i;
      outputElements.push.apply(outputElements, this.expandRepeatingForm_(
          element, iterators, usedVars));
    } else {
      outputElements.push(this.expandForm_(element, iterators, usedVars));
    }
  }
  return new ccc.base.Vector(outputElements);
};


/**
 * Expand a repeating template subform over a set of iterators.
 *
 * @param {!ccc.base.Object} template
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {!Array.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Template.prototype.expandRepeatingForm_ = function(
    template, iterators, usedVars) {
  var expansions = [];

  /** @type {!Object.<string, boolean>} */
  var emptyIterators = {};
  var dummyIterator = new ccc.syntax.CaptureIterator(
      new ccc.syntax.Capture(ccc.base.NIL));
  var subIterators = goog.object.map(iterators, function(iterator, key) {
    if (iterator.isAtEnd()) {
      emptyIterators[key] = true;
      return dummyIterator;
    } else {
      return new ccc.syntax.CaptureIterator(iterator.get());
    }
  });
  var exhausted = false;
  while (!exhausted) {
    var innerUsedVars = {};
    var expansion = this.expandForm_(template, subIterators, innerUsedVars);
    goog.object.extend(usedVars, innerUsedVars);

    // Terminate immediately if any of the used capture variables were empty.
    var usedEmpty = goog.object.some(innerUsedVars, function(value, key) {
      return goog.object.containsKey(emptyIterators, key);
    });
    if (usedEmpty)
      break;

    expansions.push(expansion);

    // Ensure that at least one non-terminal pattern variable was used.
    // Otherwise expansion the expansion would be infinite.
    var isFinite = false;
    goog.object.forEach(innerUsedVars, function(present, name) {
      var iterator = goog.object.get(iterators, name);
      goog.asserts.assert(goog.isDef(iterator));
      iterator.advance();
      // At least one pattern variable with a non-terminal capture must have
      // been accessed for this to be a valid ellipsis expansion.
      if (!iterator.capture().isSingular())
        isFinite = true;
    });
    if (!isFinite)
      throw new Error('Invalid ellipsis placement');

    // Advance all non-empty iterators.
    subIterators = goog.object.map(iterators, function(iterator, key) {
      if (iterator.isAtEnd()) {
        if (goog.object.containsKey(emptyIterators, key))
          return dummyIterator;
        exhausted = true;
        return null;
      } else {
        return new ccc.syntax.CaptureIterator(iterator.get());
      }
    });
  }
  goog.object.forEach(iterators, function(iterator) {
    iterator.reset();
  });
  return expansions;
};
