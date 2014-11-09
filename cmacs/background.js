// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.core');
goog.require('ccc.core.stringify');
//goog.require('ccc.syntax');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');



cmacs.background.main = function() {
  var environment = new ccc.Environment();
  environment.allocate('begin').setValue(ccc.syntax.BEGIN);
  environment.allocate('define').setValue(ccc.syntax.DEFINE);
  environment.allocate('if').setValue(ccc.syntax.IF);
  environment.allocate('lambda').setValue(ccc.syntax.LAMBDA);
  environment.allocate('\u03bb').setValue(ccc.syntax.LAMBDA);
  environment.allocate('quote').setValue(ccc.syntax.QUOTE);
  environment.allocate('set!').setValue(ccc.syntax.SET);
  // Add some test library functions to play with.
  environment.set('-', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() - args.cdr().car());
  }));
  environment.set('+', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() + args.cdr().car());
  }));
  environment.set('zero?', new ccc.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car() === 0);
  }));
  environment.set('display', new ccc.NativeProcedure(
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
        var thread = new ccc.Thread(ccc.eval(data, environment));
        thread.run().then(readData, function(error) {
          console.error('Error: ' + error.toString());
        });
      });
    };
    readData(null);
  };
};


cmacs.background.main();
