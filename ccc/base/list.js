// The Cmacs Project.

goog.provide('ccc.base.list');

goog.require('ccc.baseUtil');
goog.require('ccc.core');
goog.require('goog.array');


ccc.baseUtil.makeSimpleProcedures({
  'list': {
    optionalArgs: null,
    impl: function() {
      return ccc.Pair.makeList(Array.prototype.slice.call(arguments));
    }
  },

  'car': {
    args: [ccc.isPair],
    impl: function(p) { return p.car(); }
  },

  'cdr': {
    args: [ccc.isPair],
    impl: function(p) { return p.cdr(); }
  },

  'cons': {
    args: [null, null],
    impl: function(car, cdr) {
      return new ccc.Pair(car, cdr);
    }
  },

  'set-car!': {
    args: [ccc.isPair, null],
    impl: function(pair, data) {
      pair.setCar(data);
    }
  },

  'set-cdr!': {
    args: [ccc.isPair, null],
    impl: function(pair, data) {
      pair.setCdr(data);
    }
  },

  'pair?': {
    args: [null],
    impl: ccc.isPair
  },

  'list?': {
    args: [null],
    impl: function(data) {
      return ccc.isNil(data) || (ccc.isPair(data) &&
          data.forEachProper(function(data) {}));
    }
  },

  'null?': {
    args: [null],
    impl: ccc.isNil
  },

  'length': {
    args: [null],
    impl: function(data) {
      if (ccc.isNil(data))
        return 0;
      var length = 0;
      if (!ccc.isPair(data) || !data.forEachProper(function() { length++; }))
        return new ccc.Error('length: Argument is not a proper list');
      return length;
    }
  },

  'append': {
    optionalArgs: null,
    impl: function() {
      if (arguments.length == 0)
        return ccc.NIL;
      var tail = arguments[arguments.length - 1];
      for (var i = arguments.length - 2; i >= 0; --i) {
        var list = arguments[i];
        var elements = [];
        if (!ccc.isNil(list) && (!ccc.isPair(list) ||
            !list.forEachProper(function(data) { elements.push(data); })))
          return new ccc.Error('append: Argument is not a proper list');
        if (elements.length > 0)
          tail = ccc.Pair.makeList(elements, tail);
      }
      return tail;
    }
  },
});


/** @private */
var makeListAccessProcedure = function(signature) {
  var name = 'c' + signature + 'r';
  ccc.baseUtil.makeSimpleProcedure(name, {
    args: [ccc.isPair],
    impl: function(p) {
      for (var i = signature.length - 1; i >= 0; --i) {
        if (!ccc.isPair(p))
          return new ccc.Error(name + ': Invalid argument');
        var access = signature[i] == 'a' ? p.car : p.cdr;
        p = access.call(p);
      }
      return p;
    }
  });
};


goog.array.forEach(['aa', 'ad', 'da', 'dd', 'aaa', 'aad', 'ada', 'add', 'daa',
    'dad', 'dda', 'ddd', 'aaaa', 'aaad', 'aada', 'aadd', 'adaa', 'adad', 'adda',
    'addd', 'daaa', 'daad', 'dada', 'dadd', 'ddaa', 'ddad', 'ddda', 'dddd'],
    makeListAccessProcedure);
