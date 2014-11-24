// The Cmacs Project.

goog.provide('cmacs.ui.Editor');

goog.require('cmacs.ui.FragmentView');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.dom.classlist');



/**
 * The top-level UI object for the Cmacs editor.
 *
 * @extends {goog.Disposable}
 * @constructor
 */
cmacs.ui.Editor = function() {
  /** @private {Element} */
  this.domRoot_ = goog.dom.createDom('div', { 'class': 'editor-root' });
  goog.dom.appendChild(document.body, this.domRoot_);

  /** @private {!cmacs.ui.FragmentView} */
  this.fragmentView_ = new cmacs.ui.FragmentView();

  goog.dom.appendChild(this.domRoot_, this.fragmentView_.getDom());
};
goog.inherits(cmacs.ui.Editor, goog.Disposable);


/**
 * @override
 * @protected
 */
cmacs.ui.Editor.prototype.disposeInternal = function() {
  this.domRoot_ = null;
  this.fragmentView_.dispose();
};
