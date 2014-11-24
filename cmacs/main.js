// The Cmacs Project.

goog.provide('cmacs.main');

goog.require('ccc.core');
goog.require('ccc.core.stringify');
goog.require('ccc.base.all');
goog.require('ccc.parse.evalSource');
goog.require('cmacs.ui.Editor');
goog.require('goog.Promise');
goog.require('goog.object');


cmacs.main = function() {
  var environment = new ccc.Environment();
  ccc.base.addToEnvironment(environment);
  environment.setValue('display', new ccc.NativeProcedure(
      function(environment, args, continuation) {
    console.log(ccc.core.stringify(args.car()));
    return continuation(ccc.UNSPECIFIED);
  }));
  goog.global['evalCcc'] = function(code) {
    var thread = new ccc.Thread(ccc.parse.evalSource(code, environment));
    thread.run(function(result) {
      if (ccc.isError(result))
        console.error('Error: ' + result);
      console.log(ccc.core.stringify(result));
    });
  };

  return new cmacs.ui.Editor();
};


cmacs.main();
