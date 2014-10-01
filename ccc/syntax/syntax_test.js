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
goog.require('ccc.syntax.If');
goog.require('ccc.syntax.Set');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  asyncTestCase.stepTimeout = 100;

  goog.Promise.setUnhandledRejectionHandler(justFail);
}

function continueTesting() {
  asyncTestCase.continueTesting();
}

function justFail(reason) {
  console.error(goog.isDef(reason.stack) ? reason.stack : reason);
  continueTesting();
  fail(reason);
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
      continueTesting();
    }, fail);
  }, fail);
}

function testBadDefineSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var transformer = new ccc.syntax.Define();
  var symbol = new ccc.base.Symbol('bananas');

  // Define with no arguments: FAIL!
  transformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
    function() {
      // Define with only a symbol argument: FAIL!
      return transformer.transform(environment, ccc.base.Pair.makeList([
          symbol]));
  }).then(justFail).thenCatch(function() {
    // Define a non-symbol first argument: FAIL!
    return transformer.transform(environment, ccc.base.Pair.makeList([
        ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // Define with too many arguments: FAIL!
    return transformer.transform(environment, ccc.base.Pair.makeList([
        symbol, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(continueTesting);
}

function testSet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var defineArgs = ccc.base.Pair.makeList([new ccc.base.Symbol('foo'),
      new ccc.base.Number(41)]);
  var setArgs = ccc.base.Pair.makeList([new ccc.base.Symbol('foo'),
      new ccc.base.Number(42)]);
  var setTransformer = new ccc.syntax.Set();
  var defineTransformer = new ccc.syntax.Define();

  setTransformer.transform(environment, setArgs).then(function(set) {
    // Set an unbound symbol (foo) and expect failure
    return set.car().apply(environment, set.cdr()).then(justFail).thenCatch(
        function() { return goog.Promise.resolve(set); });
  }).then(function(set) {
    defineTransformer.transform(environment, defineArgs).then(function(define) {
      define.car().apply(environment, define.cdr()).then(function(result) {
        var foo = environment.get('foo');
        assertNotNull(foo);
        assert(foo.isNumber());
        assertEquals(41, foo.value());
        set.car().apply(environment, set.cdr()).then(function(result) {
          var foo = environment.get('foo');
          assertNotNull(foo);
          assert(foo.isNumber());
          assertEquals(42, foo.value());
          continueTesting();
        });
      });
    });
  });
}

function testBadSetSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var transformer = new ccc.syntax.Set();
  var symbol = new ccc.base.Symbol('catpants');

  // Set with no arguments: FAIL!
  transformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
    function() {
      // Set with only a symbol argument: FAIL!
      return transformer.transform(environment, ccc.base.Pair.makeList([
          symbol]));
  }).then(justFail).thenCatch(function() {
    // Set a non-symbol first argument: FAIL!
    return transformer.transform(environment, ccc.base.Pair.makeList([
        ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // Set with too many arguments: FAIL!
    return transformer.transform(environment, ccc.base.Pair.makeList([
        symbol, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(continueTesting);
}

function testIfTrue() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = ccc.base.Pair.makeList([ccc.base.NIL, ccc.base.T]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.T, result);
      continueTesting();
    });
  });
}

function testIfFalse() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = ccc.base.Pair.makeList([ccc.base.F, ccc.base.T, ccc.base.NIL]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.NIL, result);
      continueTesting();
    });
  });
}

function testIfFalseWithNoAlternate() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = ccc.base.Pair.makeList([ccc.base.F, ccc.base.T]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.UNSPECIFIED, result);
      continueTesting();
    });
  });
}

function testBadIfSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.BasicEnvironment();
  var ifTransformer = new ccc.syntax.If();

  // If with no arguments: FAIL!
  ifTransformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
    function() {
      // If with only a condition: FAIL!
      return ifTransformer.transform(environment, ccc.base.Pair.makeList([
          ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // If with too many arguments: FAIL!
    return ifTransformer.transform(environment, ccc.base.Pair.makeList([
        ccc.base.T, ccc.base.T, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // If with weird improper list: DEFINITELY FAIL!
    return ifTransformer.transform(environment, ccc.base.Pair.makeList([
        ccc.base.T, ccc.base.T], ccc.base.T));
  }).then(justFail).thenCatch(continueTesting);
}
