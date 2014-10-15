  // The Cmacs Project.

goog.provide('ccc.syntax.Template');

goog.require('ccc.base');
goog.require('ccc.syntax.Capture');
goog.require('ccc.syntax.CaptureSet');
goog.require('goog.object');



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
 * Fully expands this template given a {@code ccc.syntax.CaptureSet}. Returns
 * {@code null} if expansion fails.
 *
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 * @public
 */
ccc.syntax.Template.prototype.expand = function(captures) {
  return this.expandForm_(this.form_, captures);
};


/**
 * Expand a template subform over a set of captures.
 *
 * @param {!ccc.base.Object} template
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandForm_ = function(template, captures) {
  if (template.isSymbol())
    return this.expandSymbol_(/** @type {!ccc.base.Symbol} */ (template),
        captures);
  if (template.isPair())
    return this.expandList_(template, captures);
  if (template.isVector())
    return this.expandVector_(/** @type {!ccc.base.Vector} */ (template),
        captures);
  // Anything else just expands to itself.
  return template;
};


/**
 * Expand a symbol template.
 *
 * @param {!ccc.base.Symbol} symbol
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandSymbol_ = function(symbol, captures) {
  // TODO: Support non-zero rank captures.
  var capture = goog.object.get(captures, symbol.name());
  // Non-captured symbols expand to themselves.
  if (!goog.isDef(capture))
    return symbol;
  return capture.contents();
};


/**
 * Expand a list template.
 *
 * @param {!ccc.base.Object} list
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandList_ = function(list, captures) {
  var outputElements = [];
  while (list.isPair()) {
    var outputElement = this.expandForm_(list.car(), captures);
    if (goog.isNull(outputElement))
      return null;
    outputElements.push(outputElement);
    list = list.cdr();
  }
  var tail = this.expandForm_(list, captures);
  if (goog.isNull(tail))
    return null;
  return ccc.base.Pair.makeList(outputElements, tail);
};


/**
 * Expand a vector template.
 *
 * @param {!ccc.base.Vector} vector
 * @param {!ccc.syntax.CaptureSet} captures
 * @return {ccc.base.Object}
 * @private
 */
ccc.syntax.Template.prototype.expandVector_ = function(vector, captures) {
  var outputElements = [];
  for (var i = 0; i < vector.size(); ++i) {
    var element = vector.get(i);
    goog.asserts.assert(!goog.isNull(element));
    var outputElement = this.expandForm_(element, captures);
    if (goog.isNull(outputElement))
      return null;
    outputElements.push(outputElement);
  }
  return new ccc.base.Vector(outputElements);
};