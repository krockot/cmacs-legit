  // The Cmacs Project.

goog.provide('ccc.syntax.Template');

goog.require('ccc.base');
goog.require('ccc.syntax.CaptureSet');
goog.require('ccc.syntax.GeneratorSet');
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
  /** @type {!ccc.syntax.GeneratorSet} */
  var generators = {};
  goog.object.forEach(captures, function(capture, name) {
    generators[name] = new ccc.syntax.Generator(capture, 0);
  });
  var expansion = this.expandForm_(this.form_, generators, 0);
  goog.asserts.assert(!goog.isNull(expansion));
  return expansion;
};


/**
 * Expand a template subform over a set of generators.
 *
 * @param {!ccc.base.Object} template
 * @param {!ccc.syntax.GeneratorSet} generators
 * @param {number} rank
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandForm_ = function(
    template, generators, rank) {
  if (template.isSymbol())
    return this.expandSymbol_(/** @type {!ccc.base.Symbol} */ (template),
        generators, rank);
  if (template.isPair())
    return this.expandList_(template, generators, rank);
  if (template.isVector())
    return this.expandVector_(/** @type {!ccc.base.Vector} */ (template),
        generators, rank);
  // Anything else just expands to itself.
  return template;
};


/**
 * Expand a symbol template.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.syntax.GeneratorSet} generators
 * @param {number} rank
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandSymbol_ = function(
    symbol, generators, rank) {
  var generator = goog.object.get(generators, symbol.name());
  // Non-captured symbols expand to themselves.
  if (!goog.isDef(generator))
    return symbol;
  if (generator.depth() != rank)
    throw new Error(goog.string.format(
        'Invalid ellipsis depth for pattern variable |%s|. ' +
        'Found %d but expected %d', symbol.name(), generator.depth(), rank));
  var output = generator.get();
  goog.asserts.assert(goog.isNull(output) || output instanceof ccc.base.Object);
  return output;
};


/**
 * Expand a list template.
 *
 * @param {!ccc.base.Object} list
 * @param {!ccc.syntax.GeneratorSet} generators
 * @param {number} rank
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandList_ = function(list, generators, rank) {
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
      var newElements = this.expandRepeatingForm_(element, generators, rank);
      if (goog.isNull(newElements))
        return null;
      outputElements.push.apply(outputElements, newElements);
    } else {
      var newElement = this.expandForm_(element, generators, rank);
      if (goog.isNull(newElement))
        return null;
      outputElements.push(newElement);
    }
    list = list.cdr();
  }
  var tail = this.expandForm_(list, generators, rank);
  goog.asserts.assert(!goog.isNull(tail));
  return ccc.base.Pair.makeList(outputElements, tail);
};


/**
 * Expand a vector template.
 *
 * @param {!ccc.base.Vector} vector
 * @param {!ccc.syntax.GeneratorSet} generators
 * @param {number} rank
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandVector_ = function(
    vector, generators, rank) {
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
      var newElements = this.expandRepeatingForm_(element, generators, rank);
      if (goog.isNull(newElements))
        return null;
      outputElements.push.apply(outputElements, newElements);
    } else {
      var newElement = this.expandForm_(element, generators, rank);
      if (goog.isNull(newElement))
        return null;
      outputElements.push(newElement);
    }
  }
  return new ccc.base.Vector(outputElements);
};


/**
 * Expand a repeating template subform over a set of generators.
 *
 * @param {!ccc.base.Object} template
 * @param {!ccc.syntax.GeneratorSet} generators
 * @param {number} rank
 * @return {!Array.<!ccc.base.Object>}
 * @private
 */
ccc.syntax.Template.prototype.expandRepeatingForm_ = function(
    template, generators, rank) {
  /** @type {!ccc.syntax.GeneratorSet} */
  var generatorClones = {};
  goog.object.forEach(generators, function(generator, name) {
    generatorClones[name] = generator.clone();
  });
  var expansions = [];
  while (true) {
    var expansion = this.expandForm_(template, generatorClones, rank + 1);
    if (goog.isNull(expansion))
      break;
    expansions.push(expansion);
    goog.object.forEach(generatorClones, function(generator) {
      if (generator.consumed())
        generator.advance();
    });
  }
  return expansions;
};
