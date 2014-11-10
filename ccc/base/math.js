// The Cmacs Project.

goog.provide('ccc.base.math');

goog.require('ccc.baseUtil');
goog.require('ccc.core');


ccc.baseUtil.registerProcedures(ccc.base, {
  '+': {
    optionalArgs: ccc.isNumber,
    impl: function() {
      var sum = 0;
      for (var i = 0; i < arguments.length; ++i)
        sum += arguments[i];
      return sum;
    }
  },

  '-': {
    optionalArgs: ccc.isNumber,
    impl: function() {
      if (arguments.length == 0)
        return 0;
      if (arguments.length == 1)
        return -arguments[0];
      var sum = arguments[0];
      for (var i = 1; i < arguments.length; ++i)
        sum -= arguments[i];
      return sum;
    }
  },

  '*': {
    optionalArgs: ccc.isNumber,
    impl: function() {
      var product = 1;
      for (var i = 0; i < arguments.length; ++i)
        product *= arguments[i];
      return product;
    }
  },

  '/': {
    args: [ccc.isNumber],
    optionalArgs: ccc.isNumber,
    impl: function() {
      if (arguments.length == 1) {
        if (arguments[0] == 0)
          return new ccc.Error('Division by zero');
        return 1 / arguments[0];
      }
      var quotient = arguments[0];
      for (var i = 1; i < arguments.length; ++i) {
        if (arguments[i] === 0)
          return new ccc.Error('Division by zero');
        quotient /= arguments[i];
      }
      return quotient;
    }
  },

  '**': {
    args: [ccc.isNumber, ccc.isNumber],
    impl: Math.pow
  },

  'number?': {
    args: [null],
    impl: ccc.isNumber
  },

  'zero?': {
    args: [null],
    impl: function(x) { return x === 0; }
  },

  'integer?': {
    args: [null],
    impl: ccc.isInteger,
  },

  'positive?': {
    args: [ccc.isNumber],
    impl: function(x) { return x > 0; }
  },

  'negative?': {
    args: [ccc.isNumber],
    impl: function(x) { return x < 0; }
  },

  'even?': {
    args: [ccc.isInteger],
    impl: function(x) { return x % 2 === 0; }
  },

  'odd?': {
    args: [ccc.isInteger],
    impl: function(x) { return x % 2 !== 0; }
  },

  'min': {
    args: [ccc.isNumber],
    optionalArgs: ccc.isNumber,
    impl: Math.min
  },

  'max': {
    args: [ccc.isNumber],
    optionalArgs: ccc.isNumber,
    impl: Math.max
  },

  'abs': {
    args: [ccc.isNumber],
    impl: Math.abs
  },

  'mod': {
    args: [ccc.isNumber, ccc.isNumber],
    impl: function(x, n) {
      if (n === 0)
        return new ccc.Error('Division by zero');
      return x % n;
    }
  },

  'floor': {
    args: [ccc.isNumber],
    impl: Math.floor
  },

  'ceiling': {
    args: [ccc.isNumber],
    impl: Math.ceil
  },

  'truncate': {
    args: [ccc.isNumber],
    impl: Math.trunc
  },

  'round': {
    args: [ccc.isNumber],
    impl: Math.round
  },

  'sqrt': {
    args: [ccc.isNumber],
    impl: function(x) {
      if (x < 0)
        return new ccc.Error('sqrt: Invalid argument');
      return Math.sqrt(x);
    }
  },

  'exp': {
    args: [ccc.isNumber],
    impl: Math.exp
  },

  'log': {
    args: [ccc.isNumber],
    optionalArgs: [ccc.isNumber],
    impl: function(n, opt_base) {
      if (n === 0)
        return new ccc.Error('log: Invalid argument');
      if (goog.isDef(opt_base))
        return Math.log(n) / Math.log(opt_base);
      return Math.log(n);
    }
  },

  'sin': {
    args: [ccc.isNumber],
    impl: Math.sin
  },

  'cos': {
    args: [ccc.isNumber],
    impl: Math.cos
  },

  'tan': {
    args: [ccc.isNumber],
    impl: Math.tan
  },

  'asin': {
    args: [ccc.isNumber],
    impl: function(x) {
      if (x < -1 || x > 1)
        return new ccc.Error('asin: Invalid argument');
      return Math.asin(x);
    }
  },

  'acos': {
    args: [ccc.isNumber],
    impl: function(x) {
      if (x < -1 || x > 1)
        return new ccc.Error('acos: Invalid argument');
      return Math.acos(x);
    }
  },

  'atan': {
    args: [ccc.isNumber],
    optionalArgs: [ccc.isNumber],
    impl: function(y, opt_x) {
      if (goog.isDef(opt_x))
        return Math.atan2(y, opt_x);
      return Math.atan(y);
    }
  }
});
