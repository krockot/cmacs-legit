// The Cmacs Project.

goog.provide('ccc.base.data');

goog.require('ccc.baseUtil');
goog.require('ccc.core');


/**
 * Procedures for dealing with general data or primitive types which don't
 * warrant their own distinct definitions file.
 */
ccc.baseUtil.registerProcedures(ccc.base, {
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

  'boolean?': {
    args: [null],
    impl: function(x) { return x === true || x === false; }
  },
});
