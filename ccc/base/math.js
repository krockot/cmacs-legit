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

  'zero?': {
    args: [null],
    impl: function(x) { return x === 0; }
  },
});
