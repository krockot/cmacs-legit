// The Cmacs Project.

goog.provide('cmacs.ui.FragmentView');

goog.require('ccc.core');
goog.require('ccc.core.build');
goog.require('ccc.core.stringify');
goog.require('cmacs.Cursor');
goog.require('cmacs.Fragment');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.dom.classlist');



/**
 * Provides a DOM view of program a fragment along with input hooks for
 * fragment manipulation.
 *
 * @param {!cmacs.Fragment=} opt_fragment The program fragment to use for this
 *     view. If not given, a new fragment will be created.
 * @extends {goog.Disposable}
 * @constructor
 */
cmacs.ui.FragmentView = function(opt_fragment) {
  /** @private {!cmacs.Fragment} */
  this.fragment_ = opt_fragment || new cmacs.Fragment(ccc.core.build(
      ['\u03bb', ['x'], 'x']));

  /** @private {Element} */
  this.domRoot_ = goog.dom.createDom('div', { 'class': 'fragment-view' });

  /** @private {!cmacs.Cursor} */
  this.cursor_ = new cmacs.Cursor(this.fragment_);

  this.updateDom_();
};


/**
 * @override
 * @protected
 */
cmacs.ui.FragmentView.prototype.disposeInternal = function() {
  this.domRoot_ = null;
};


/**
 * Retrieves the stable root of this view's DOM.
 *
 * @return {Element}
 */
cmacs.ui.FragmentView.prototype.getDom = function() {
  return this.domRoot_;
};


/**
 * Updates the contents of the root DOM node for this view according to the
 * current fragment state.
 *
 * @private
 */
cmacs.ui.FragmentView.prototype.updateDom_ = function() {
  while (this.domRoot_.firstChild)
    this.domRoot_.removeChild(this.domRoot_.firstChild);
  this.domRoot_.appendChild(createDataDom_(this.fragment_.getData(),
      this.cursor_));
};


/**
 * Creates a DOM view of some program data styled according to the current
 * cursor position.
 *
 * @param {ccc.Data} data
 * @param {!cmacs.Cursor} cursor
 * @return {!Node}
 * @private
 */
var createDataDom_ = function(data, cursor) {
  var dom = goog.dom.createDom('span');
  if (ccc.isVector(data)) {
    var children = [];
    dom.appendChild(goog.dom.createTextNode('#('));
    for (var i = 0; i < data.size(); ++i) {
      var childData = /** @type {ccc.Data} */ (data.get(i));
      var childDom = createDataDom_(childData, cursor);
      dom.appendChild(childDom);
    }
    dom.appendChild(goog.dom.createTextNode(')'));
  } else if (ccc.isPair(data)) {
    dom.appendChild(goog.dom.createTextNode('('));
    while (ccc.isPair(data)) {
      dom.appendChild(createDataDom_(data.car(), cursor));
      if (ccc.isPair(data.cdr()))
        dom.appendChild(goog.dom.createTextNode(' '));
      data = data.cdr();
    }
    if (!ccc.isNil(data)) {
      dom.appendChild(goog.dom.createTextNode(' . '));
      dom.appendChild(createDataDom_(data, cursor));
    }
    dom.appendChild(goog.dom.createTextNode(')'));
  } else {
    dom.innerText = ccc.core.stringify(data);
  }
  return dom;
};
