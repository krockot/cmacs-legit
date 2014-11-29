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

  /** @private {?ccc.Symbol} */
  this.symbolEntry_ = null;

  /** @private {!goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.eventHandler_.listen(this.cursor_, cmacs.Cursor.EventType.CHANGE,
      goog.bind(this.updateDom_, this));
  this.eventHandler_.listen(window, goog.events.EventType.KEYDOWN,
      goog.bind(this.onKeyDown_, this));
  this.eventHandler_.listen(window, goog.events.EventType.KEYPRESS,
      goog.bind(this.onKeyPress_, this));

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
 * Hacky keydown handler for bad UI times.
 *
 * @param {!Event} e
 */
cmacs.ui.FragmentView.prototype.onKeyDown_ = function(e) {
  var preventDefault = true;
  if (goog.isNull(this.symbolEntry_)) {
    switch (e.keyCode) {
      // Backspace and Delete: Erase data
      case 8:
      case 46:
        this.cursor_.erase();
        break;
      // Arrow keys: Navigate data
      case 37: this.cursor_.moveLeft(); break;
      case 38: this.cursor_.moveUp(); break;
      case 39: this.cursor_.moveRight(); break;
      case 40: this.cursor_.moveDown(); break;
      // L key: Insert lambda
      case 76: this.cursor_.replace(new ccc.Symbol('\u03bb')); break;
      // S key: Enter symbol entry mode
      case 83:
        this.symbolEntry_ = new ccc.Symbol('');
        this.cursor_.replace(this.symbolEntry_);
        break;
      // Backslash key: Lift a data element to replace its parent
      case 220:
        var parent = this.cursor_.getFragment().getParent();
        if (!goog.isNull(parent)) {
          parent.setData(this.cursor_.getFragment().getData());
          this.cursor_.setFragment(parent);
        }
        break;
      default: preventDefault = false;
    }
  } else if (e.keyCode != 8) {
    preventDefault = false;
  }
  if (preventDefault)
    e.preventDefault();
};


/**
 * Moar hacks.
 *
 * @param {!Event} e
 */
cmacs.ui.FragmentView.prototype.onKeyPress_ = function(e) {
  if (goog.isNull(this.symbolEntry_))
    return;
  if (e.charCode == 0)
    return;
  if (e.charCode == 13) {
    this.symbolEntry_ = null;
    return;
  }
  var chr = String.fromCharCode(e.charCode);
  this.symbolEntry_.setName(this.symbolEntry_.name() + chr);
  this.updateDom_();
};
