// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.base');
goog.require('ccc.syntax');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');



cmacs.background.main = function() {
  var environment = new ccc.base.Environment();
  environment.set('define', new ccc.syntax.Define());
  environment.set('define-syntax', new ccc.syntax.DefineSyntax());
  environment.set('if', new ccc.syntax.If());
  environment.set('lambda', new ccc.syntax.Lambda());
  environment.set('\u03bb', new ccc.syntax.Lambda());
  environment.set('quote', new ccc.syntax.Quote());
  environment.set('set!', new ccc.syntax.Set());
  // Add some test library functions to play with.
  environment.set('-', new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() - args.cdr().car().value()));
  }));
  environment.set('+', new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() + args.cdr().car().value()));
  }));
  environment.set('zero?', new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car().value() == 0 ? ccc.base.T : ccc.base.F);
  }));
  var evaluator = new ccc.base.Evaluator(environment);
  goog.global['evalCcc'] = function(code) {
    var scanner = new ccc.parse.Scanner();
    scanner.feed(code);
    scanner.setEof();
    var parser = new ccc.parse.Parser(scanner);
    parser.readObject().then(function(object) {
      return object.compile(environment);
    }).then(function(compiledObject) {
      return evaluator.evalObject(compiledObject);
    }).then(function(result) {
      console.log(result.toString());
    });
  };
};


cmacs.background.main();
