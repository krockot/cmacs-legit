// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.core');
goog.require('ccc.core.stringify');
goog.require('ccc.base');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');
goog.require('goog.object');



cmacs.background.main = function() {
  var environment = new ccc.Environment();
  goog.object.forEach(ccc.base, function(value, name) {
    environment.setValue(name, value);
  });
  // Add some test library functions to play with.
  environment.setValue('-', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() - args.cdr().car());
  }));
  environment.setValue('+', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() + args.cdr().car());
  }));
  environment.setValue('zero?', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() === 0);
  }));
  environment.setValue('display', new ccc.NativeProcedure(
      function(environment, args, continuation) {
    console.log(ccc.core.stringify(args.car()));
    return continuation(ccc.UNSPECIFIED);
  }));
  goog.global['evalCcc'] = function(code) {
    var scanner = new ccc.parse.Scanner();
    scanner.feed(code);
    scanner.setEof();
    var parser = new ccc.parse.Parser(scanner);
    /** @param {?ccc.Data} lastValue */
    var readData = function(lastValue) {
      return parser.read().then(function(data) {
        if (goog.isNull(data)) {
          if (!goog.isNull(lastValue))
            console.log(ccc.core.stringify(lastValue));
          return null;
        }
        var thread = new ccc.Thread(ccc.evalSource(data, environment));
        thread.run().then(readData, function(error) {
          console.error('Error: ' + error.toString());
        });
      });
    };
    readData(null);
  };
};


cmacs.background.main();
