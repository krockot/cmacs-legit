// The Cmacs Project.

goog.provide('ccc.base.object');

goog.require('ccc.baseUtil');
goog.require('ccc.core');



ccc.baseUtil.makeSimpleProcedures({
  'eq?': {
    args: [null, null],
    impl: ccc.eq
  },

  'eqv?': {
    args: [null, null],
    impl: ccc.eqv
  },

  'equal?': {
    args: [null, null],
    impl: ccc.equal
  },

  'not': {
    args: [null],
    impl: function(x) {
      if (x === false)
        return true;
      return false;
    }
  },
});
