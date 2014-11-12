// The Cmacs Project.

goog.provide('ccc.base.list');

goog.require('ccc.base');
goog.require('ccc.core');
goog.require('goog.array');


ccc.base.registerProcedures({
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

  'reverse': {
    args: [null],
    impl: function(list) {
      if (ccc.isNil(list))
        return ccc.NIL;
      var elements = [];
      if (!ccc.isPair(list) ||
          !list.forEachProper(function(data) { elements.unshift(data); }))
        return new ccc.Error('reverse: Argument is not a proper list');
      return ccc.Pair.makeList(elements);
    }
  },

  'list-tail': {
    args: [null, ccc.isNumber],
    impl: function(list, k) {
      while (ccc.isPair(list) && k--)
        list = list.cdr();
      if (k > 0)
        return new ccc.Error('list-tail: Index out of range');
      return list;
    }
  },

  'list-ref': {
    args: [ccc.isPair, ccc.isNumber],
    impl: function(list, k) {
      while (ccc.isPair(list) && k--)
        list = list.cdr();
      if (k > 0 || !ccc.isPair(list))
        return new ccc.Error('list-ref: Index out of range');
      return list.car();
    }
  },

  'set-tail!': {
    args: [ccc.isPair, null],
    impl: function(list, newTail) {
      var tail = ccc.NIL;
      if (!list.forEachProper(function(car, pair) { tail = pair; }))
        return new ccc.Error('set-tail!: Invalid list argument');
      if (ccc.isPair(tail))
        tail.setCdr(newTail);
    }
  },

  'take': {
    args: [ccc.isInteger, null],
    impl: function(k, list) {
      if (k < 0)
        return new ccc.Error('take: Index must be zero or positive');
      if (ccc.isNil(list))
        return ccc.NIL;
      var elements = [];
      while (k-- && ccc.isPair(list)) {
        elements.push(list.car());
        list = list.cdr();
      }
      return ccc.Pair.makeList(elements);
    }
  },

  'repeat': {
    optionalArgs: null,
    impl: function() {
      if (arguments.length == 0)
        return ccc.NIL;
      var tail = new ccc.Pair(arguments[arguments.length - 1], ccc.NIL);
      var cycle = tail;
      for (var i = arguments.length - 2; i >= 0; --i)
        cycle = new ccc.Pair(arguments[i], cycle);
      tail.setCdr(cycle);
      return cycle;
    }
  },

  'list->string': {
    args: [null],
    impl: function(list) {
      if (ccc.isNil(list))
        return '';
      if (!ccc.isPair(list))
        return new ccc.Error('list->string: Invalid argument type');
      var result = '';
      var isValid = true;
      var isProper = list.forEachProper(function(chr) {
        if (!ccc.isChar(chr))
          isValid = false;
        else
          result += String.fromCharCode(chr.value());
      });
      if (!isValid || !isProper)
        return new ccc.Error('list->string: Invalid list argument');
      return result;
    }
  },

  'list->vector': {
    args: [null],
    impl: function(list) {
      if (ccc.isNil(list))
        return new ccc.Vector([]);
      if (!ccc.isPair(list))
        return new ccc.Error('list->vector: Invalid argument type');
      var elements = [];
      if (!list.forEachProper(function(data) { elements.push(data); }))
        return new ccc.Error('list->vector: Invalid list argument');
      return new ccc.Vector(elements);
    }
  },
});


/** @private */
var registerListAccessor_ = function(signature) {
  var name = 'c' + signature + 'r';
  ccc.base.registerProcedure(name, {
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
    registerListAccessor_);
