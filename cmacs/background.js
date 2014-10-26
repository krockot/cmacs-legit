// The Cmacs Project.

goog.provide('cmacs.background.main');

goog.require('ccc.base');
goog.require('ccc.syntax');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');
goog.require('goog.Promise');



cmacs.background.main = function() {
  var environment = new ccc.base.Environment();
  environment.allocate('begin').setValue(ccc.syntax.BEGIN);
  environment.allocate('cond').setValue(ccc.syntax.COND);
  environment.allocate('define').setValue(ccc.syntax.DEFINE);
  environment.allocate('define-syntax').setValue(ccc.syntax.DEFINE_SYNTAX);
  environment.allocate('if').setValue(ccc.syntax.IF);
  environment.allocate('lambda').setValue(ccc.syntax.LAMBDA);
  environment.allocate('let').setValue(ccc.syntax.LET);
  environment.allocate('let*').setValue(ccc.syntax.LETSEQ);
  environment.allocate('let-syntax').setValue(ccc.syntax.LET_SYNTAX);
  environment.allocate('letrec').setValue(ccc.syntax.LETREC);
  environment.allocate('\u03bb').setValue(ccc.syntax.LAMBDA);
  environment.allocate('quote').setValue(ccc.syntax.QUOTE);
  environment.allocate('set!').setValue(ccc.syntax.SET);
  environment.allocate('syntax-rules').setValue(ccc.syntax.SYNTAX_RULES);
  // Add some test library functions to play with.
  environment.allocate('-').setValue(new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() - args.cdr().car().value()));
  }));
  environment.allocate('+').setValue(new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(new ccc.base.Number(
        args.car().value() + args.cdr().car().value()));
  }));
  environment.allocate('zero?').setValue(new ccc.base.NativeProcedure(function(
      environment, args, continuation) {
    return continuation(args.car().value() == 0 ? ccc.base.T : ccc.base.F);
  }));
  environment.allocate('display').setValue(new ccc.base.NativeProcedure(
      function(environment, args, continuation) {
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
