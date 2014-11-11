// The Cmacs Project.

goog.provide('ccc.base.string');

goog.require('ccc.baseUtil');
goog.require('ccc.core');


ccc.baseUtil.registerProcedures(ccc.base, {
  'string?': {
    args: [null],
    impl: ccc.isString
  },
});
