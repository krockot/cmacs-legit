// The Cmacs Project.

goog.provide('ccc.base.list');

goog.require('ccc.baseUtil');
goog.require('ccc.core');


ccc.baseUtil.makeSimpleProcedures({
  'list': {
    optionalArgs: null,
    impl: function() {
      return ccc.Pair.makeList(Array.prototype.slice.call(arguments));
    }
  },
});
