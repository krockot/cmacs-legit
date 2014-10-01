// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('ccc.syntax.SyntaxTests');
goog.setTestOnly('ccc.syntax.SyntaxTests');

goog.require('ccc.base.Environment');
goog.require('ccc.base.Number');
goog.require('ccc.base.Pair');
goog.require('ccc.base.String');
goog.require('ccc.base.Symbol');
goog.require('ccc.base.UNSPECIFIED');
goog.require('ccc.syntax.Define');
goog.require('ccc.syntax.If');
goog.require('ccc.syntax.Lambda');
goog.require('ccc.syntax.Quote');
goog.require('ccc.syntax.Set');
goog.require('goog.Promise');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var List = ccc.base.Pair.makeList;

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
  var environment = new ccc.base.Environment();
  var args = List([new ccc.base.Symbol('foo'), new ccc.base.Number(42)]);
  var transformer = new ccc.syntax.Define();
  transformer.transform(environment, args).then(function(define) {
    return define.car().apply(environment, define.cdr()).then(function(result) {
      assertEquals(ccc.base.UNSPECIFIED, result);
      var foo = environment.get('foo');
      assertNotNull(foo);
      assert(foo.isNumber());
      assertEquals(42, foo.value());
    });
  }).then(continueTesting);
}

function testBadDefineSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var transformer = new ccc.syntax.Define();
  var symbol = new ccc.base.Symbol('bananas');

  // Define with no arguments: FAIL!
  transformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
    function() {
      // Define with only a symbol argument: FAIL!
      return transformer.transform(environment, List([symbol]));
  }).then(justFail).thenCatch(function() {
    // Define a non-symbol first argument: FAIL!
    return transformer.transform(environment, List([ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // Define with too many arguments: FAIL!
    return transformer.transform(environment,
        List([symbol, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(continueTesting);
}

function testSet() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var defineArgs = List([new ccc.base.Symbol('foo'), new ccc.base.Number(41)]);
  var setArgs = List([new ccc.base.Symbol('foo'), new ccc.base.Number(42)]);
  var setTransformer = new ccc.syntax.Set();
  var defineTransformer = new ccc.syntax.Define();

  setTransformer.transform(environment, setArgs).then(function(set) {
    // Set an unbound symbol (foo) and expect failure
    return set.car().apply(environment, set.cdr()).then(justFail).thenCatch(
        function() { return goog.Promise.resolve(set); });
  }).then(function(set) {
    return defineTransformer.transform(
        environment, defineArgs).then(function(define) {
      return define.car().apply(
          environment, define.cdr()).then(function(result) {
        var foo = environment.get('foo');
        assertNotNull(foo);
        assert(foo.isNumber());
        assertEquals(41, foo.value());
        return set.car().apply(environment, set.cdr()).then(function(result) {
          var foo = environment.get('foo');
          assertNotNull(foo);
          assert(foo.isNumber());
          assertEquals(42, foo.value());
        });
      });
    });
  }).then(continueTesting);
}

function testBadSetSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var transformer = new ccc.syntax.Set();
  var symbol = new ccc.base.Symbol('catpants');

  // Set with no arguments: FAIL!
  transformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
    function() {
      // Set with only a symbol argument: FAIL!
      return transformer.transform(environment, List([symbol]));
  }).then(justFail).thenCatch(function() {
    // Set a non-symbol first argument: FAIL!
    return transformer.transform(environment, List([ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // Set with too many arguments: FAIL!
    return transformer.transform(environment,
        List([symbol, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(continueTesting);
}

function testIfTrue() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = List([ccc.base.NIL, ccc.base.T]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.T, result);
    });
  }).then(continueTesting);
}

function testIfFalse() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = List([ccc.base.F, ccc.base.T, ccc.base.NIL]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.NIL, result);
    });
  }).then(continueTesting);
}

function testIfFalseWithNoAlternate() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var ifTransformer = new ccc.syntax.If();
  var ifArgs = List([ccc.base.F, ccc.base.T]);
  ifTransformer.transform(environment, ifArgs).then(function(if_) {
    return if_.car().apply(environment, ifArgs).then(function(result) {
      assertEquals(ccc.base.UNSPECIFIED, result);
    });
  }).then(continueTesting);
}

function testBadIfSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var ifTransformer = new ccc.syntax.If();

  // If with no arguments: FAIL!
  ifTransformer.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
      function() {
        // If with only a condition: FAIL!
        return ifTransformer.transform(environment, List([ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // If with too many arguments: FAIL!
    return ifTransformer.transform(environment,
        List([ccc.base.T, ccc.base.T, ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(function() {
    // If with weird improper list: DEFINITELY FAIL!
    return ifTransformer.transform(environment,
      List([ccc.base.T, ccc.base.T], ccc.base.T));
  }).then(justFail).thenCatch(continueTesting);
}

function testQuote() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var transformer = new ccc.syntax.Quote();
  var list = List([ccc.base.T, ccc.base.F, ccc.base.NIL]);
  transformer.transform(environment, List([list])).then(function(quote) {
    return quote.car().apply(environment, ccc.base.NIL).then(function(result) {
      assertNotNull(result);
      assert(result.equal(list));
    });
  }).then(continueTesting);
}

function testBadQuoteSyntax() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var quote = new ccc.syntax.Quote();
  quote.transform(environment, ccc.base.NIL).then(justFail).thenCatch(
      function() {
        return quote.transform(environment, List([ccc.base.T, ccc.base.T]));
  }).then(justFail).thenCatch(continueTesting);
}

function testSimpleLambda() {
  asyncTestCase.waitForAsync();
  var environment = new ccc.base.Environment();
  var transformer = new ccc.syntax.Lambda();
  var formals = ccc.base.NIL;
  var body = List([ccc.base.T, new ccc.base.Number(42)]);
  var args = List([formals], body);
  transformer.transform(environment, args).then(function(lambda) {
    return lambda.car().apply(environment, ccc.base.NIL).then(function(result) {
      assertNotNull(result);
      assert(result.isProcedure());
      result.apply(environment, ccc.base.NIL).then(function(result) {
        assertNotNull(result);
        assert(result.isNumber());
        assertEquals(42, result.value());
      });
    });
  }).then(continueTesting);
}

