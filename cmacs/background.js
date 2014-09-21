// Cmacs project. Copyright forever, the universe.

goog.provide('cmacs.background.main')

goog.require('ccc.parse.Lexer')



cmacs.background.main = function() {
  chrome.app.runtime.onLaunched.addListener(function() {
    goog.global.test = function(input) {
      var lexer = new ccc.parse.Lexer(input);
    };
  });
};


cmacs.background.main();
