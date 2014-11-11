// The Cmacs Project.

goog.provide('ccc.base.StringTest');
goog.setTestOnly('ccc.base.StringTest');

goog.require('ccc.baseTestUtil');


var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(document.title);
var C = function(chr) { return new ccc.Char(chr); };
var S = function(str) { return new String(str); };

function setUpPage() {
  setUpBaseTest('ccc.base.StringTest');
}

function testStringPredicate() {
  RunTests([
    T(['string?', S('Hello')], true),
    T(['string?', S('')], true),
    T(['string?', 0], false),
    T(['string?', true], false),
    T(['string?', 'string?'], false),
    F(['string?']),
    F(['string?', S('hello'), S('goodbye')]),
  ]);
}

function testMakeString() {
  RunTests([
    T(['make-string', 0], S('')),
    T(['make-string', 1], S('\0')),
    T(['make-string', 3, C(955)], S('\u03bb\u03bb\u03bb')),
    F(['make-string']),
    F(['make-string', C(0)]),
    F(['make-string', true]),
    F(['make-string', 1, C(0), 2]),
  ]);
}

function testStringLength() {
  RunTests([
    T(['string-length', S('')], 0),
    T(['string-length', S('hello')], 5),
    F(['string-length']),
    F(['string-length', S(''), S('')]),
    F(['string-length', 1]),
    F(['string-length', 'string-length']),
  ]);
}

function testStringEqualityPredicate() {
  RunTests([
    T(['string=?', S('hello'), S('hello')], true),
    T(['string=?', S('Hello'), S('hello')], false),
    F(['string=?']),
    F(['string=?', S('hello')]),
    F(['string=?', S('hello'), S('goodbye'), S('banana')]),
  ]);
}

function testStringLessThanPredicate() {
  RunTests([
    T(['string<?', S('hello'), S('hello')], false),
    T(['string<?', S('Hello'), S('hello')], true),
    T(['string<?', S('a'), S('b')], true),
    T(['string<?', S('b'), S('a')], false),
    T(['string<?', S('\u039b'), S('\u03bb')], true),
    T(['string<?', S('\u03bb'), S('\u039b')], false),
    F(['string<?']),
    F(['string<?', S('hello')]),
    F(['string<?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testStringLessThanOrEqualPredicate() {
  RunTests([
    T(['string<=?', S('hello'), S('hello')], true),
    T(['string<=?', S('Hello'), S('hello')], true),
    T(['string<=?', S('a'), S('b')], true),
    T(['string<=?', S('b'), S('a')], false),
    T(['string<=?', S('\u039b'), S('\u03bb')], true),
    T(['string<=?', S('\u03bb'), S('\u039b')], false),
    F(['string<=?']),
    F(['string<=?', S('hello')]),
    F(['string<=?', S('hello'), S('hello'), S('hello')]),
  ]);
}


function testStringGreaterThanPredicate() {
  RunTests([
    T(['string>?', S('hello'), S('hello')], false),
    T(['string>?', S('Hello'), S('hello')], false),
    T(['string>?', S('a'), S('b')], false),
    T(['string>?', S('b'), S('a')], true),
    T(['string>?', S('\u039b'), S('\u03bb')], false),
    T(['string>?', S('\u03bb'), S('\u039b')], true),
    F(['string>?']),
    F(['string>?', S('hello')]),
    F(['string>?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testStringGreaterThanOrEqualPredicate() {
  RunTests([
    T(['string>=?', S('hello'), S('hello')], true),
    T(['string>=?', S('Hello'), S('hello')], false),
    T(['string>=?', S('a'), S('b')], false),
    T(['string>=?', S('b'), S('a')], true),
    T(['string>=?', S('\u039b'), S('\u03bb')], false),
    T(['string>=?', S('\u03bb'), S('\u039b')], true),
    F(['string>=?']),
    F(['string>=?', S('hello')]),
    F(['string>=?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testStringCIEqualityPredicate() {
  RunTests([
    T(['string-ci=?', S('hello'), S('hello')], true),
    T(['string-ci=?', S('Hello'), S('hello')], true),
    T(['string-ci=?', S('\u03bb'), S(['\u039b'])], true),
    F(['string-ci=?']),
    F(['string-ci=?', S('hello')]),
    F(['string-ci=?', S('hello'), S('goodbye'), S('banana')]),
  ]);
}

function testStringCILessThanPredicate() {
  RunTests([
    T(['string-ci<?', S('hello'), S('hello')], false),
    T(['string-ci<?', S('Hello'), S('hello')], false),
    T(['string-ci<?', S('a'), S('b')], true),
    T(['string-ci<?', S('b'), S('a')], false),
    T(['string-ci<?', S('\u039b'), S('\u03bb')], false),
    T(['string-ci<?', S('\u03bb'), S('\u039b')], false),
    F(['string-ci<?']),
    F(['string-ci<?', S('hello')]),
    F(['string-ci<?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testStringCILessThanOrEqualPredicate() {
  RunTests([
    T(['string-ci<=?', S('hello'), S('hello')], true),
    T(['string-ci<=?', S('Hello'), S('hello')], true),
    T(['string-ci<=?', S('a'), S('b')], true),
    T(['string-ci<=?', S('b'), S('a')], false),
    T(['string-ci<=?', S('\u039b'), S('\u03bb')], true),
    T(['string-ci<=?', S('\u03bb'), S('\u039b')], true),
    F(['string-ci<=?']),
    F(['string-ci<=?', S('hello')]),
    F(['string-ci<=?', S('hello'), S('hello'), S('hello')]),
  ]);
}


function testStringCIGreaterThanPredicate() {
  RunTests([
    T(['string-ci>?', S('hello'), S('hello')], false),
    T(['string-ci>?', S('Hello'), S('hello')], false),
    T(['string-ci>?', S('a'), S('b')], false),
    T(['string-ci>?', S('b'), S('a')], true),
    T(['string-ci>?', S('\u039b'), S('\u03bb')], false),
    T(['string-ci>?', S('\u03bb'), S('\u039b')], false),
    F(['string-ci>?']),
    F(['string-ci>?', S('hello')]),
    F(['string-ci>?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testStringCIGreaterThanOrEqualPredicate() {
  RunTests([
    T(['string-ci>=?', S('hello'), S('hello')], true),
    T(['string-ci>=?', S('Hello'), S('hello')], true),
    T(['string-ci>=?', S('a'), S('b')], false),
    T(['string-ci>=?', S('b'), S('a')], true),
    T(['string-ci>=?', S('\u039b'), S('\u03bb')], true),
    T(['string-ci>=?', S('\u03bb'), S('\u039b')], true),
    F(['string-ci>=?']),
    F(['string-ci>=?', S('hello')]),
    F(['string-ci>=?', S('hello'), S('hello'), S('hello')]),
  ]);
}

function testSubstring() {
  RunTests([
    T(['substring', S('Hello, world'), 1], S('ello, world')),
    T(['substring', S('hey'), 2], S('y')),
    T(['substring', S('hey'), 1, 2], S('e')),
    T(['substring', S('hey'), 1, 3], S('ey')),
    T(['substring', S('foobar'), -2], S('ar')),
    T(['substring', S('foobar'), -3, -1], S('ba')),
    F(['substring']),
    F(['substring', S('hey')]),
    F(['substring', S('hey'), 3]),
    F(['substring', S('hey'), -4]),
    F(['substring', S('hey'), 1, 1]),
    F(['substring', S('hey'), 1, 4]),
    F(['substring', S('hey'), 1, 0]),
    F(['substring', S('hey'), -1, -2]),
  ]);
}

function testStringAppend() {
  RunTests([
    T(['string-append'], S('')),
    T(['string-append', S('hey')], S('hey')),
    T(['string-append', S('foo'), S('bar')], S('foobar')),
    T(['string-append', S('foo'), S('bar'), S('baz')], S('foobarbaz')),
    F(['string-append', 1, 2, 3, 4]),
  ]);
}

function testStringToList() {
  RunTests([
    T(['string->list', S('hello')], [C(104), C(101), C(108), C(108), C(111)]),
    T(['string->list', S('')], []),
    F(['string->list']),
    F(['string->list', 1234]),
    F(['string->list', S('hello'), 1234]),
  ]);
}

function testStringToSymbol() {
  RunTests([
    T(['string->symbol', S('hello')], 'hello'),
    T(['string->symbol', S('')], ''),
    F(['string->symbol']),
    F(['string->symbol', ['quote', 'hello']]),
    F(['string->symbol', S('hey'), 1]),
  ]);
}
