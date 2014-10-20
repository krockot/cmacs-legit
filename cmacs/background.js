// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.base');
goog.require('ccc.syntax');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');



cmacs.background.main = function() {
  var environment = new ccc.base.Environment();
  environment.set('begin', ccc.syntax.BEGIN);
  environment.set('define', ccc.syntax.DEFINE);
  environment.set('define-syntax', ccc.syntax.DEFINE_SYNTAX);
  environment.set('if', ccc.syntax.IF);
  environment.set('lambda', ccc.syntax.LAMBDA);
  environment.set('let', ccc.syntax.LET);
  environment.set('let*', ccc.syntax.LET_SEQUENTIAL);
  environment.set('\u03bb', ccc.syntax.LAMBDA);
  environment.set('quote', ccc.syntax.QUOTE);
  environment.set('set!', ccc.syntax.SET);
  environment.set('syntax-rules', ccc.syntax.SYNTAX_RULES);
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
  environment.set('display', new ccc.base.NativeProcedure(function(
      environemtn, args, continuation) {
    console.log(args.car().toString());
    return continuation(ccc.base.UNSPECIFIED);
  }));
  var evaluator = new ccc.base.Evaluator(environment);
  goog.global['evalCcc'] = function(code) {
    var scanner = new ccc.parse.Scanner();
    scanner.feed(code);
    scanner.setEof();
    var parser = new ccc.parse.Parser(scanner);
    /** @param {Object=} opt_lastValue */
    var readObjects = function(opt_lastValue) {
      parser.readObject().then(function(object) {
        if (goog.isNull(object)) {
          if (goog.isDef(opt_lastValue))
            console.log(opt_lastValue.toString());
          return;
        }
        return object.compile(environment).then(function(compiledObject) {
          return evaluator.evalObject(compiledObject);
        }).then(readObjects);
      });
    };
    readObjects();
  };
};


cmacs.background.main();
