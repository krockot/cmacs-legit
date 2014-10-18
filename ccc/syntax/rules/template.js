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
 * @return {ccc.base.Object}
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
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandSymbol_ = function(
    symbol, iterators, usedVars) {
  var iterator = goog.object.get(iterators, symbol.name());
  // Non-captured symbols expand to themselves.
  if (!goog.isDef(iterator))
    return symbol;
  usedVars[symbol.name()] = true;
  if (iterator.capture().rank() != 0)
    throw new Error(goog.string.format(
        'Invalid ellipsis placement when expanding |%s|', symbol.name()));
  return iterator.get().contents();
};


/**
 * Expands a list template.
 *
 * @param {!ccc.base.Object} list
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {ccc.base.Object}
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
      var newElements = this.expandRepeatingForm_(element, iterators, usedVars);
      if (goog.isNull(newElements))
        return null;
      outputElements.push.apply(outputElements, newElements);
    } else {
      var newElement = this.expandForm_(element, iterators, usedVars);
      if (goog.isNull(newElement))
        return null;
      outputElements.push(newElement);
    }
    list = list.cdr();
  }
  var tail = this.expandForm_(list, iterators, usedVars);
  goog.asserts.assert(!goog.isNull(tail));
  return ccc.base.Pair.makeList(outputElements, tail);
};


/**
 * Expands a vector template.
 *
 * @param {!ccc.base.Vector} vector
 * @param {!ccc.syntax.CaptureIteratorSet} iterators
 * @param {!Object.<string, boolean>} usedVars
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandVector_ = function(
    vector, iterators, usedVars) {
  var outputElements = [];
  for (var i = 0; i < vector.size(); ++i) {
    var element = vector.get(i);
    goog.asserts.assert(!goog.isNull(element));
    var nextElement = null;
    if (i < vector.size() - 1) {
      nextElement = vector.get(i + 1);
    }
    if (!goog.isNull(nextElement) && nextElement.isSymbol() &&
        nextElement.name() == ccc.syntax.Pattern.ELLIPSIS_NAME) {
      ++i;
      var newElements = this.expandRepeatingForm_(element, iterators, usedVars);
      if (goog.isNull(newElements))
        return null;
      outputElements.push.apply(outputElements, newElements);
    } else {
      var newElement = this.expandForm_(element, iterators, usedVars);
      if (goog.isNull(newElement))
        return null;
      outputElements.push(newElement);
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
  while (true) {
    var exhausted = false;
    var subIterators = goog.object.map(iterators, function(iterator) {
      if (iterator.isAtEnd()) {
        exhausted = true;
        return null;
      } else {
        return new ccc.syntax.CaptureIterator(iterator.get());
      }
    });
    if (exhausted)
      break;

    var innerUsedVars = {};
    var expansion = this.expandForm_(template, subIterators, innerUsedVars);
    goog.object.extend(usedVars, innerUsedVars);
    if (goog.isNull(expansion))
      break;
    expansions.push(expansion);

    var isValid = false;
    goog.object.forEach(innerUsedVars, function(present, name) {
      var iterator = goog.object.get(iterators, name);
      goog.asserts.assert(goog.isDef(iterator));
      iterator.advance();
      // At least one pattern variable of rank > 0 must have been accessed for
      // this to be a valid ellipsis expansion.
      if (iterator.capture().rank() > 0)
        isValid = true;
    });
    if (!isValid)
      throw new Error('Invalid ellipsis placement');
  }
  goog.object.forEach(iterators, function(iterator) {
    iterator.reset();
  });
  return expansions;
};
