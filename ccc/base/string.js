// The Cmacs Project.

goog.provide('ccc.base.string');

goog.require('ccc.baseUtil');
goog.require('ccc.core');


ccc.baseUtil.registerProcedures(ccc.base, {
  'string?': {
    args: [null],
    impl: ccc.isString
  },

  'make-string': {
    args: [ccc.isInteger],
    optionalArgs: [ccc.isChar],
    impl: function(k, opt_chr) {
      var chr = (goog.isDef(opt_chr)
          ? String.fromCharCode(opt_chr.value()) :
          '\0');
      return Array(k + 1).join(chr);
    }
  },

  'string-length': {
    args: [ccc.isString],
    impl: function(x) { return x.length; }
  },

  'string=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) { return a === b; }
  },

  'string<?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a < b;
    }
  },

  'string<=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a <= b;
    }
  },

  'string>?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a > b;
    }
  },

  'string>=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a >= b;
    }
  },

  'string-ci=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a.toLocaleLowerCase() === b.toLocaleLowerCase();
    }
  },

  'string-ci<?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a.toLocaleLowerCase() < b.toLocaleLowerCase();
    }
  },

  'string-ci<=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a.toLocaleLowerCase() <= b.toLocaleLowerCase();
    }
  },

  'string-ci>?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a.toLocaleLowerCase() > b.toLocaleLowerCase();
    }
  },

  'string-ci>=?': {
    args: [ccc.isString, ccc.isString],
    impl: function(a, b) {
      return a.toLocaleLowerCase() >= b.toLocaleLowerCase();
    }
  },
});
