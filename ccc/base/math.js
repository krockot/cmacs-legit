// The Cmacs Project.

goog.provide('ccc.base.math');

goog.require('ccc.baseUtil');
goog.require('ccc.core');



ccc.baseUtil.makeSimpleProcedures({
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
    impl: function(a, b) {
      return Math.pow(a, b);
    }
  },

  'zero?': {
    args: [null],
    impl: function(x) { return x === 0; }
  },

  'integer?': {
    args: [null],
    impl: function(x) { return ccc.isInteger(x); }
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
});
