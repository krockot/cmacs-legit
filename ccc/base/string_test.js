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

function testMakeString() {
  RunTests([
    T(['make-string', 0], new String('')),
    T(['make-string', 1], new String('\0')),
    T(['make-string', 3, new ccc.Char(955)], new String('\u03bb\u03bb\u03bb')),
    F(['make-string']),
    F(['make-string', new ccc.Char(0)]),
    F(['make-string', true]),
    F(['make-string', 1, new ccc.Char(0), 2]),
  ]);
}

function testStringLength() {
  RunTests([
    T(['string-length', new String('')], 0),
    T(['string-length', new String('hello')], 5),
    F(['string-length']),
    F(['string-length', new String(''), new String('')]),
    F(['string-length', 1]),
    F(['string-length', 'string-length']),
  ]);
}
