// The Cmacs Project.

goog.provide('ccc.base.StringTest');
goog.setTestOnly('ccc.base.StringTest');

goog.require('ccc.baseTestUtil');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);

function setUpPage() {
  setUpBaseTest('ccc.base.StringTest');
}

function testStringPredicate() {
  RunTests([
    T(['string?', new String('Hello')], true),
    T(['string?', new String('')], true),
    T(['string?', 0], false),
    T(['string?', true], false),
    T(['string?', 'string?'], false),
    F(['string?']),
    F(['string?', new String('hello'), new String('goodbye')]),
  ]);
}
