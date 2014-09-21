// Cmacs project. Copyright forever, the universe.

// This file should contain any bootstrapping code that needs to run before
// compiled Closure output.

// Unoptimized Closure base code tries to load dependencies using
// calls to document.write. This doesn't fly for Chrome apps, and we don't
// need anyway. This turns it off.
var CLOSURE_UNCOMPILED_DEFINES = {
  'goog.ENABLE_DEBUG_LOADER': false
};
