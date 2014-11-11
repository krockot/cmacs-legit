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

  'vector-length': {
    args: [ccc.isVector],
    impl: function(v) {
      return v.size();
    }
  },

  'vector-ref': {
    args: [ccc.isVector, ccc.isInteger],
    impl: function(v, k) {
      if (k < 0 || k >= v.size())
        return new ccc.Error('vector-ref: Index out of bounds');
      return v.get(k);
    }
  },

  'vector-set!': {
    args: [ccc.isVector, ccc.isInteger, null],
    impl: function(v, k, data) {
      if (k < 0 || k >= v.size())
        return new ccc.Error('vector-set!: Index out of bounds');
      v.set(k, data);
    }
  },

  'vector-fill!': {
    args: [ccc.isVector, null],
    impl: function(v, data) {
      for (var i = 0; i < v.size(); ++i)
        v.set(i, data);
    }
  },
});
