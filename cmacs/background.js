// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.core');
goog.require('ccc.core.stringify');
goog.require('ccc.syntax');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');



cmacs.background.main = function() {
  var environment = new ccc.Environment();
  environment.set('begin', ccc.syntax.BEGIN);
  environment.set('define', ccc.syntax.DEFINE);
  environment.set('defmacro', ccc.syntax.DEFMACRO);
  environment.set('if', ccc.syntax.IF);
  environment.set('lambda', ccc.syntax.LAMBDA);
  environment.set('\u03bb', ccc.syntax.LAMBDA);
  environment.set('quote', ccc.syntax.QUOTE);
  environment.set('set!', ccc.syntax.SET);
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
