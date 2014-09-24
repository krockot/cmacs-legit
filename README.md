Cmacs
=====

Cmacs is a great mystery.

Welcome, discerning hackers, to the future.

Building
--------

Building Cmacs is annoying, mostly because it requires Java to run the
Closure compiler.

Here's a complete list of prerequisites:

  * [Java](https://java.com/en/download/manual.jsp)
  * [Python 2.x](https://www.python.org/)
  * [Closure library](https://github.com/google/closure-library/)
  * [Closure compiler](http://dl.google.com/closure-compiler/compiler-latest.zip)

Python and Java should both be in your executable path.

Set `CLOSURE_LIBRARY_ROOT` in your environment to the root directory of the
expanded closure-library archive - that is the path which contains
`closure` and `third_party` subdirectories.

Set `CLOSURE_COMPILER_JAR` in your environment to the path of `compiler.jar`
from the Closure compiler download.

If either of these environment variables is unset, the build script will try to
walk a localized chunk of the file system to find the items for you. It might
fail, but at least it will fail early and obviously, and you have some recourse
(see above.)

Once you're ready to build, you can run:

    python build/build.py debug

Or if you want to generate a ZIP file to be packaged up (why?), you can present
a version number instead:

    python build/build.py 0.1.2.3

You probably just want a debug build.

Testing
-------

Once everything is built, you can run the test server:

    python out/test/test_server.py

This will serve JsUnit tests over HTTP on port 4444. Any changes which affect
dependencies may require a rebuild, but otherwise test pages can be reloaded
to reflect the current state of the local source tree.

The root path of the test server serves a list of links to individual test
modules.

The test server needs to be restarted if its source is changed or the set
of extant test modules has changed.
