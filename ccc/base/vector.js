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
});
