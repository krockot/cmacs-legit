// The Cmacs Project.

goog.provide('cmacs.ui.FragmentView');

goog.require('ccc.core');
goog.require('ccc.core.stringify');
goog.require('cmacs.Fragment');
goog.require('goog.Disposable');
goog.require('goog.dom');



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
  this.fragment_ = opt_fragment || new cmacs.Fragment(ccc.NIL);

  /** @private {Element} */
  this.domRoot_ = goog.dom.createDom('div', { 'class': 'fragment-view' });

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
  this.domRoot_.innerHTML = ccc.core.stringify(this.fragment_.data());
};
