// The Cmacs Project.


// This file should contain any bootstrapping code that needs to run before
// compiled or uncompiled Closure output.


var CLOSURE_UNCOMPILED_DEFINES = {
  // Unoptimized Closure base code tries to load dependencies using
  // calls to document.write. This doesn't fly for Chrome apps, and we don't
  // need anyway. This turns it off.
  'goog.ENABLE_DEBUG_LOADER': false,
};


var CLOSURE_DEFINES = {
  // Since we're a Chrome app, we can reassure the Closure library about the
  // availbility of native JSON support.
  'goog.json.USE_NATIVE_JSON': true,
};
