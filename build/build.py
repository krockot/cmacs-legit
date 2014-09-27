# The Cmacs Project.
# Copyright forever, the universe.

import inspect
import itertools
import json
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import urllib
import urlparse
import zipfile


# A list of (namespace, output) pairs to compile. Each output file will contain
# the compiled transitive closure of the given namespace's dependencies.
_COMPILE_TARGETS = [
  ('cmacs.background.main', 'background-compiled.js'),
  ('cmacs.window.main', 'window-compiled.js'),
]


# List of source roots within the project.
_SOURCE_PATHS = ['ccc', 'cmacs']


_OUTPUT_ZIP_FILENAME = 'cmacs.zip'
_MANIFEST_FILENAME = 'manifest.json'


_EXTERNS = ['chrome_apis.js']


def _PrintError(*args):
  sys.stderr.write('ERROR: %s\n' % ' '.join(map(str, args)))
  sys.stderr.flush()


def _InitializeOutput(app_path, test_path, out_path):
  if os.path.isdir(out_path):
    shutil.rmtree(out_path)
  app_out_path = os.path.join(out_path, 'app')
  test_out_path = os.path.join(out_path, 'test')
  shutil.copytree(app_path, app_out_path)
  shutil.copytree(test_path, test_out_path);


def _FindTarget(predicate):
  subroot = os.getcwd()
  while os.path.dirname(subroot) != os.path.dirname(os.path.dirname(subroot)):
    subroot = os.path.dirname(subroot)
  for root, dirs, files in os.walk(subroot):
    for path in itertools.chain(dirs, files):
      full_path = os.path.join(root, path)
      if predicate(full_path):
        return full_path
  return None


def _FindClosureLibrary():
  def is_library_root(path):
    return (os.path.isdir(path) and
            os.path.isdir(os.path.join(path, 'closure')) and
            os.path.isdir(os.path.join(path, 'closure', 'goog')))
  return _FindTarget(is_library_root)


def _FindClosureCompiler():
  def is_compiler_jar(path):
    return os.path.isfile(path) and os.path.basename(path) == 'compiler.jar'
  return _FindTarget(is_compiler_jar)


def _CompileJs(closure_library_root,
               closure_compiler_jar,
               src_paths,
               externs,
               entry_point,
               output_filename,
               debug):
  compilation_level = 'WHITESPACE_ONLY' if debug else 'ADVANCED'
  print 'Compiling %s...' % output_filename
  return not subprocess.call([
      'java', '-jar', closure_compiler_jar,
      '--closure_entry_point', entry_point,
      '--compilation_level', compilation_level,
      '--js_output_file', output_filename,
      '--warning_level', 'VERBOSE',
      '--language_in', 'ECMASCRIPT5_STRICT',
      '--process_closure_primitives',
      '--jscomp_error', 'accessControls',
      '--jscomp_error', 'ambiguousFunctionDecl',
      '--jscomp_error', 'checkTypes',
      '--jscomp_error', 'checkVars',
      '--jscomp_error', 'const',
      '--jscomp_error', 'visibility',
      '--define=goog.DEBUG=%s' % ('true' if debug else 'false'),
      closure_library_root,
      '!%s' % os.path.join(closure_library_root, '**_test.js'),
      '!%s' % os.path.join(closure_library_root, '**demo.js'),
      '--externs'] + externs + src_paths +
        ['!%s' % os.path.join(path, '**_test.js') for path in src_paths])


def _BuildJsOutputs(src_paths, externs, out_path, debug, closure_library_root):
  closure_compiler_jar = (os.environ.get('CLOSURE_COMPILER_JAR') or
                          _FindClosureCompiler())
  if closure_compiler_jar is None:
    _PrintError('Unable to locate compiler.jar.')
    sys.exit(1)
  print 'Using closure-library at %s' % closure_library_root
  print 'Using compiler.jar at %s' % closure_compiler_jar
  for namespace, filename in _COMPILE_TARGETS:
    output_file = os.path.join(out_path, 'app', filename)
    if not _CompileJs(closure_library_root,
                      closure_compiler_jar,
                      src_paths,
                      externs,
                      namespace,
                      output_file,
                      debug):
      sys.exit(1)


def _BuildTestSuite(src_paths, out_path, closure_library_root):
  closure_copy = os.path.join(out_path, 'closure')
  src_copies = []

  def ignore_dot_files(d, files):
    return [f for f in files if f.startswith('.')]

  def purify_path(path, components=None):
    if components is None:
      components = []
    parent, leaf = os.path.split(path)
    components.insert(0, leaf)
    if parent == '':
      return posixpath.join(*components)
    return purify_path(parent, components)

  shutil.copytree(os.path.join(closure_library_root, 'closure'),
                  closure_copy,
                  ignore=ignore_dot_files)
  print 'Calculating test deps...'
  deps_roots = [closure_copy]
  for path in src_paths:
    src_copy = os.path.join(out_path, os.path.basename(path))
    shutil.copytree(path, src_copy)
    deps_roots.extend(['-d', src_copy])
  subprocess.call([
      'python',
      os.path.join(closure_library_root, 'closure', 'bin', 'calcdeps.py'),
      '--output_file', os.path.join(out_path, 'deps.js'),
      '-o', 'deps'] + deps_roots)
  template = ('<!doctype html><html><head>' +
      '<title>Cmacs Test Suite: %s</title><head>' +
      '<script src="/closure/goog/base.js"></script>' +
      '<script src="/deps.js"></script>' +
      '<script>goog.require(\'%s\');</script></head><body></body></html>')
  print 'Setting up test server resources...'
  with open(os.path.join(out_path, 'alltests.js'), 'w') as testList:
    testList.write('_allTests = [')
    for path in src_paths:
      for root, dirs, files in os.walk(path):
        test_files = [file for file in
                      filter(lambda f: f.endswith('_test.js'), files)]
        for filename in test_files:
          with open(os.path.join(root, filename)) as test_script:
            provide = re.search(
                'goog\\.provide\\([\'"]([^\'"]+)[\'"]\\);',
                test_script.read())
            if not provide.groups():
              print 'WARNING: No namespace provided by %s' % filename
              test_namespace = 'please.fixme'
            else:
              test_namespace = provide.group(1)
          base_path = os.path.commonprefix([root, out_path])
          rel_path = root[len(base_path):]
          out_dir = os.path.join(out_path, rel_path)
          suite_name, _ = os.path.splitext(filename)
          if not os.path.isdir(out_dir):
            os.makedirs(out_dir)
          html_filename = '%s.html' % suite_name
          if os.path.isfile(os.path.join(root, html_filename)):
            os.copy(os.path.join(root, html_filename),
                    os.path.join(out_dir, html_filename))
          else:
            with open(os.path.join(out_dir, html_filename), 'w') as html_file:
              html_file.write(template % (suite_name, test_namespace))
          testList.write('"%s",' %
                         purify_path(os.path.join(rel_path, html_filename)))
    testList.write('];\n')


def _UpdateManifest(out_path, version):
  with open(os.path.join(out_path, 'app', _MANIFEST_FILENAME)) as manifest_file:
    manifest = json.load(manifest_file)
  if 'key' in manifest:
    del manifest['key']
  manifest['version'] = version
  with open(os.path.join(out_path, 'app', _MANIFEST_FILENAME),
            'w') as manifest_file:
    json.dump(manifest, manifest_file, indent=2)


def _CreateZipFile(path, dest_dir):
  tmpdir = tempfile.mkdtemp()
  try:
    filename = os.path.join(tmpdir, _OUTPUT_ZIP_FILENAME)
    zip = zipfile.ZipFile(filename, 'w')
    for root, dir, files in os.walk(path):
      for file in files:
        full_path = os.path.join(root, file)
        arc_path = full_path[len(path):]
        zip.write(full_path, arc_path)
    zip.close()
    shutil.copy(filename, os.path.join(dest_dir, _OUTPUT_ZIP_FILENAME))
  finally:
    shutil.rmtree(tmpdir)


def _BuildCmacs(version, debug):
  build_script_path = os.path.dirname(os.path.abspath(inspect.getfile(
      inspect.currentframe())))
  root_path = os.path.dirname(build_script_path)
  app_path = os.path.join(root_path, 'app')
  test_path = os.path.join(root_path, 'test')
  src_paths = map(lambda path : os.path.join(root_path, path),
                  _SOURCE_PATHS)
  externs = [os.path.join(root_path, 'externs', path) for path in _EXTERNS]
  out_path = os.path.join(root_path, 'out')

  closure_library_root = (os.environ.get('CLOSURE_LIBRARY_ROOT') or
                          _FindClosureLibrary())
  if closure_library_root is None:
    _PrintError('Unable to locate closure-library root.')
    sys.exit(1)

  _InitializeOutput(app_path, test_path, out_path)
  _BuildTestSuite(src_paths, os.path.join(out_path, 'test'),
                  closure_library_root)
  _BuildJsOutputs(src_paths, externs, out_path, debug, closure_library_root)
  if not debug:
    print 'Packaging ZIP file with version %s' % version
    _UpdateManifest(out_path, version)
    _CreateZipFile(os.path.join(out_path, 'app'), out_path)
  print 'Success!'


if __name__ == '__main__':
  debug = False
  version = '0.0.0.0'
  if len(sys.argv) > 1:
    if sys.argv[1] == 'debug':
      debug = True
    else:
      version = sys.argv[1]
  _BuildCmacs(version, debug)

