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
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');



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
  cmacs.ui.FragmentView.base(this, 'constructor');

  /** @private {!cmacs.Fragment} */
  this.fragment_ = opt_fragment || new cmacs.Fragment(ccc.NIL);

  /** @private {Element} */
  this.domRoot_ = goog.dom.createDom('div', { 'class': 'fragment-view' });

  /** @private {!cmacs.Cursor} */
  this.cursor_ = new cmacs.Cursor(this.fragment_);

  /** @private {!goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.eventHandler_.listen(this.cursor_, cmacs.Cursor.EventType.CHANGE,
      goog.bind(this.updateDom_, this));
  this.eventHandler_.listen(window, goog.events.EventType.KEYDOWN,
      goog.bind(this.onKeydown_, this));

  this.updateDom_();
};
goog.inherits(cmacs.ui.FragmentView, goog.Disposable);


/**
 * @override
 * @protected
 */
cmacs.ui.FragmentView.prototype.disposeInternal = function() {
  cmacs.ui.FragmentView.base(this, 'disposeInternal');
  this.eventHandler_.dispose();
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
  this.domRoot_.appendChild(createFragmentDom_(this.fragment_, this.cursor_));
};


/**
 * Creates a DOM view of some program fragment styled according to the current
 * cursor position.
 *
 * @param {!cmacs.Fragment} fragment
 * @param {!cmacs.Cursor} cursor
 * @return {!Node}
 * @private
 */
var createFragmentDom_ = function(fragment, cursor) {
  var dom = goog.dom.createDom('span');
  var type = fragment.getType();
  var children = fragment.getChildren();

  if (type == cmacs.FragmentType.LEAF) {
    dom.innerText = ccc.core.stringify(fragment.getData());
  } else {
    if (type == cmacs.FragmentType.VECTOR)
      dom.appendChild(goog.dom.createTextNode('#('));
    else
      dom.appendChild(goog.dom.createTextNode('('));
    var tailSize = type == cmacs.FragmentType.IMPROPER_LIST ? 1 : 0;
    for (var i = 0; i < children.length - tailSize; ++i) {
      if (i > 0)
        dom.appendChild(goog.dom.createTextNode(' '));
      dom.appendChild(createFragmentDom_(children[i], cursor));
    }
    if (tailSize == 1)
      dom.appendChild(createFragmentDom_(children[children.length - 1],
          cursor));
    dom.appendChild(goog.dom.createTextNode(')'));
  }

  if (cursor.getFragment() === fragment)
    goog.dom.classlist.add(dom, 'cursor');
  return dom;
};


/**
 * Hacky keypress handler for bad UI times.
 *
 * @param {!Event} e
 */
cmacs.ui.FragmentView.prototype.onKeydown_ = function(e) {
  var preventDefault = true;
  switch (e.keyCode) {
    case 8:
    case 46:
      this.cursor_.erase();
      break;
    case 37: this.cursor_.moveLeft(); break;
    case 38: this.cursor_.moveUp(); break;
    case 39: this.cursor_.moveRight(); break;
    case 40: this.cursor_.moveDown(); break;
    default: preventDefault = false;
  }
  if (preventDefault)
    e.preventDefault();
};