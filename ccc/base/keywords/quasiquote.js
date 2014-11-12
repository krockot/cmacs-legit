// The Cmacs Project.

goog.provide('ccc.base.quasiquote');

goog.require('ccc.base');
goog.require('ccc.base.list');
goog.require('ccc.base.quote');
goog.require('ccc.core');
goog.require('goog.array');



/**
 * The QUASIQUOTE transformer quotes data with the ability to use UNQUOTE and
 * UNQUOTE_SPLICING temporary escape hatches in the middle of quoted structures.
 *
 * @constructor
 * @extends {ccc.Transformer}
 */
var QuasiquoteTransformer_ = function() {
};
goog.inherits(QuasiquoteTransformer_, ccc.Transformer);


/** @override */
QuasiquoteTransformer_.prototype.toString = function() {
  return '#<quasiquote-transformer>';
};


/** @override */
QuasiquoteTransformer_.prototype.transform = function(environment, args) {
  return function(continuation) {
    if (!ccc.isPair(args) || !ccc.isNil(args.cdr()))
      return continuation(new ccc.Error('quasiquote: Invalid form'));
    return continuation(quasiquoteData_(args.car(), 0));
  };
};


/**
 * Performs recursive quasiquotation of a {@code ccc.Data}.
 *
 * @param {ccc.Data} data
 * @param {number} depth
 * @return {ccc.Data}
 * @private
 */
var quasiquoteData_ = function(data, depth) {
  if (!ccc.isPair(data))
    return ccc.Pair.makeList([ccc.base.get('quote'), data]);
  var head = data.car();
  if (ccc.isSymbol(head) && ccc.isPair(data.cdr()) &&
      ccc.isNil(data.cdr().cdr())) {
    if (head.name() == 'unquote') {
      if (depth === 0)
        return data.cdr().car();
      return ccc.Pair.makeList([ccc.base.get('list'),
          ccc.Pair.makeList([ccc.base.get('quote'),
              new ccc.Symbol('unquote')]),
          quasiquoteData_(data.cdr().car(), depth - 1)]);    }
    if (head.name() == 'quasiquote') {
      if (depth === 0)
        return ccc.Pair.makeList([ccc.base.get('list'),
            ccc.Pair.makeList([ccc.base.get('quote'),
                new ccc.Symbol('quasiquote')]),
            quasiquoteData_(data.cdr().car(), depth + 1)]);
      return ccc.Pair.makeList([new ccc.Symbol('quasiquote'),
          quasiquoteData_(data.cdr().car(), depth + 1)]);
    }
  }
  var outputLists = [];
  var listElements = [];
  while (ccc.isPair(data) && (!ccc.isSymbol(data.car()) ||
      data.car().name() != 'unquote')) {
    var element = data.car();
    if (ccc.isPair(element) && ccc.isSymbol(element.car()) &&
        ccc.isPair(element.cdr()) && ccc.isNil(element.cdr().cdr()) &&
        element.car().name() == 'unquote-splicing') {
      if (depth > 0) {
        listElements.push(quasiquoteData_(element, depth - 1));
      } else {
        if (listElements.length > 0) {
          outputLists.push(new ccc.Pair(ccc.base.get('list'),
              ccc.Pair.makeList(listElements)));
          listElements = [];
        }
        var spliceList = element.cdr().car();
        outputLists.push(element.cdr().car())
      }
    } else {
      listElements.push(quasiquoteData_(element, depth));
    }
    data = data.cdr();
  }
  if (listElements.length > 0) {
    outputLists.push(new ccc.Pair(ccc.base.get('list'),
        ccc.Pair.makeList(listElements)));
  }
  if (!ccc.isNil(data)) {
    outputLists.push(quasiquoteData_(data, depth));
  }
  return new ccc.Pair(ccc.base.get('append'), ccc.Pair.makeList(outputLists));
};


ccc.base.registerBinding('quasiquote', new QuasiquoteTransformer_());
