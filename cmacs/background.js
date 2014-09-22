// The Cmacs Project.
// Copyright forever, the universe.

goog.provide('cmacs.background.main')

goog.require('ccc.parse.Scanner')



cmacs.background.main = function() {
  chrome.app.runtime.onLaunched.addListener(function() {
    goog.global.test = function(input) {
      var scanner = new ccc.parse.Scanner(input);
      for (var token = {}; !goog.isNull(token);) {
        token = scanner.getNextToken();
        console.log(token);
      }
    };
  });
};


cmacs.background.main();