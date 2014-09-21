// Cmacs project. Copyright forever, the universe.

goog.provide('cmacs.background.main')

cmacs.background.main = function() {
  chrome.app.runtime.onLaunched.addListener(function() {
    console.log('App launched!');
  });
};

cmacs.background.main();
