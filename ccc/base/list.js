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
