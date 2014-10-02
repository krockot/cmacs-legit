# The Cmacs Project.


import inspect
import json
import os
import shutil
import subprocess
import sys
import tempfile
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


def _InitializeOutput(app_path, out_path):
  if os.path.isdir(out_path):
    shutil.rmtree(out_path)
  app_out_path = os.path.join(out_path, 'app')
  shutil.copytree(app_path, app_out_path)


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
      '--jscomp_error', 'globalThis',
      '--jscomp_error', 'invalidCasts',
      '--jscomp_error', 'misplacedTypeAnnotation',
      '--jscomp_error', 'missingProperties',
      '--jscomp_error', 'missingProvide',
      '--jscomp_error', 'missingRequire',
      '--jscomp_error', 'missingReturn',
      '--jscomp_error', 'newCheckTypes',
      '--jscomp_error', 'suspiciousCode',
      '--jscomp_error', 'strictModuleDepCheck',
      '--jscomp_error', 'typeInvalidation',
      '--jscomp_error', 'undefinedNames',
      '--jscomp_error', 'undefinedVars',
      '--jscomp_error', 'unknownDefines',
      '--jscomp_error', 'uselessCode',
      '--jscomp_error', 'useOfGoogBase',
      '--jscomp_error', 'visibility',
      '--define=goog.DEBUG=%s' % ('true' if debug else 'false'),
      closure_library_root,
      '!%s' % os.path.join(closure_library_root, '**_test.js'),
      '!%s' % os.path.join(closure_library_root, '**demo.js'),
      '--externs'] + externs + src_paths +
        ['!%s' % os.path.join(path, '**_test.js') for path in src_paths])


def _BuildJsOutputs(closure_library_root,
                    closure_compiler_jar,
                    src_paths,
                    externs,
                    out_path,
                    debug):
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


def _CalcDeps(src_paths, closure_library_root, out_path):
  print 'Calculating test deps...'
  deps_roots = [closure_library_root]
  subprocess.call([
      'python',
      os.path.join(closure_library_root, 'closure', 'bin', 'calcdeps.py'),
      '--output_file', os.path.join(out_path, 'deps.js'),
      '-o', 'deps'] + deps_roots)


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
  src_paths = map(lambda path : os.path.join(root_path, path),
                  _SOURCE_PATHS)
  externs = [os.path.join(root_path, 'externs', path) for path in _EXTERNS]
  out_path = os.path.join(root_path, 'out')

  closure_library_root = os.path.join(root_path, 'third_party',
      'closure-library')
  closure_compiler_jar = os.path.join(root_path, 'third_party',
      'closure-compiler', 'compiler.jar')
  _InitializeOutput(app_path, out_path)
  _CalcDeps(src_paths, closure_library_root, out_path)
  _BuildJsOutputs(closure_library_root, closure_compiler_jar, src_paths,
      externs, out_path, debug)
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

