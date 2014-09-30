// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.base.BasicEnvironment');
goog.require('ccc.base.Number');
goog.require('ccc.base.Pair');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.syntax.Define');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 100;
}

function testDefine() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var args = ccc.base.Pair.makeList([new ccc.base.Symbol('foo'),
      new ccc.base.Number(42)]);
  var transformer = new ccc.syntax.Define();
  transformer.transform(environment, args).then(function(define) {
    define.car().apply(environment, define.cdr()).then(function(result) {
      assertEquals(ccc.base.UNSPECIFIED, result);
      var foo = environment.get('foo');
      assertNotNull(foo);
      assert(foo.isNumber());
      assertEquals(42, foo.value());
      asyncTestCase.continueTesting();
    }, fail);
  }, fail);
};
