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

  'substring': {
    args: [ccc.isString, ccc.isInteger],
    optionalArgs: [ccc.isInteger],
    impl: function(str, start, opt_end) {
      if (start < 0)
        start += str.length;
      if (start < 0 || start >= str.length)
        return new ccc.Error('substring: Invalid start index');
      if (goog.isDef(opt_end)) {
        if (opt_end < 0)
          opt_end += str.length;
        if (opt_end <= start || opt_end > str.length)
          return new ccc.Error('substring: Invalid end index');
      }
      return str.substring(start, opt_end);
    }
  },

  'string-append': {
    optionalArgs: ccc.isString,
    impl: function() {
      return Array.prototype.join.call(arguments, '');
    }
  },

  'string->list': {
    args: [ccc.isString],
    impl: function(str) {
      return ccc.Pair.makeList(str.split('').map(function(chr) {
        return new ccc.Char(chr.charCodeAt(0));
      }));
    }
  },
});
