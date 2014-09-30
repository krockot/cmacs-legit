Cmacs
=====

What is? Nobody know.

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

Versioned builds are also good for forcing an advanced compilation pass, which
will helpfully tell you about some of the horrible things you just broke.

Testing
-------

Once everything is built, you can run the test server:

    python test/test_server.py

This will serve JsUnit tests over HTTP on port 4444.

You need to rebuild if you add a new test suite or change dependencies, but the test server can run
continuously.
