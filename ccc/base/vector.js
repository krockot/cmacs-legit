// The Cmacs Project.

goog.provide('ccc.base.vector');

goog.require('ccc.base');
goog.require('ccc.core');
goog.require('goog.array');


ccc.base.registerProcedures({
  'vector?': {
    args: [null],
    impl: ccc.isVector
  },

  'vector': {
    optionalArgs: null,
    impl: function() {
      return new ccc.Vector(goog.array.toArray(arguments));
    }
  },

  'make-vector': {
    args: [ccc.isInteger],
    optionalArgs: [null],
    impl: function(k, opt_data) {
      var data = goog.isDef(opt_data) ? opt_data : ccc.UNSPECIFIED;
      return new ccc.Vector(goog.array.repeat(data, k));
    }
  },
});
