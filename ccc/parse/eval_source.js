// The Cmacs Project.

goog.provide('ccc.parse.evalSource');

goog.require('ccc.core');
goog.require('ccc.parse.Parser');
goog.require('ccc.parse.Scanner');


/**
 * Scans, parses, and fully evaluates a string representing zero or more
 * {@code ccc.Data}.
 *
 * @param {string} source
 * @param {!ccc.Environment} environment
 * @return {ccc.ThreadEntryPoint}
 */
ccc.parse.evalSource = function(source, environment) {
  return function(continuation) {
    var scanner = new ccc.parse.Scanner();
    scanner.feed(source);
    scanner.setEof();
    var lastResult = ccc.UNSPECIFIED;
    var parser = new ccc.parse.Parser(scanner);
    var captureResultAndKeepParsing = function(data) {
      lastResult = data;
      return parseNextData;
    };
    var parseNextData = function() {
      var data = parser.read();
      if (!goog.isDef(data))
        return parseNextData;
      if (goog.isNull(data))
        return continuation(lastResult);
      if (ccc.isError(data))
        return continuation(data);
      return ccc.evalData(data, environment)(captureResultAndKeepParsing);
    }
    return parseNextData;
  };
}
