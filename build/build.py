# The Cmacs Project.

import inspect
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

# A list of (namespace, output) pairs to compile. Each output file will contain
# the compiled transitive closure of the given namespace's dependencies.
_COMPILE_TARGETS = [
  ('cmacs.app.main', 'main.js'),
]

# List of source roots within the project.
_SOURCE_PATHS = ['ccc', 'cmacs']

_EXTERNS = ['chrome_apis.js', 'hacks.js']


def _PrintError(*args):
  sys.stderr.write('ERROR: %s\n' % ' '.join(map(str, args)))
  sys.stderr.flush()


def _InitializeOutput(app_path, out_path):
  if os.path.isdir(out_path):
    shutil.rmtree(out_path)
  app_out_path = os.path.join(out_path, 'app')
  shutil.copytree(app_path, app_out_path)


def _BuildCccSources(src_paths, out_root):
  for path in src_paths:
    for root, dirs, files in os.walk(path):
      prefix = os.path.commonprefix((root, out_root))
      relative_path = root[len(prefix):]
      out_dir = os.path.join(out_root, relative_path)
      if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
      for file in (file for file in files
                   if os.path.splitext(file)[1] == '.ccc'):
        out_filename = os.path.splitext(file)[0] + '.js'
        out_path = os.path.join(out_dir, out_filename)
        with open(os.path.join(root, file)) as f:
          contents = f.read()
          namespace = re.search(r'; @provide (\S+)', contents)
          if namespace is None:
            print 'WARNING: Ignoring ccc source with no @provide annotation.'
            continue
          namespace = namespace.groups()[0]
          library = '.'.join(namespace.split('.')[:-1])
          source = json.dumps(contents)
          with open(out_path, 'w') as out_file:
            out_file.writelines([
              'goog.provide(\'%s\')\n\n' % namespace,
              'goog.require(\'ccc.base\')\n\n\n',
              '%s.addPrelude(%s)\n' % (library, source)])


def _CompileJs(closure_library_root,
               closure_compiler_jar,
               src_paths,
               generated_src_paths,
               externs,
               entry_point,
               output_filename,
               debug):
  compilation_level = 'WHITESPACE_ONLY' if debug else 'ADVANCED'
  print 'Compiling %s...' % output_filename
  extern_args = [('--externs', extern) for extern in externs]
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
      '--jscomp_error', 'useOfGoogBase',
      '--jscomp_error', 'uselessCode',
      '--jscomp_error', 'visibility',
      '--define=goog.DEBUG=%s' % ('true' if debug else 'false'),
      closure_library_root,
      '!%s' % os.path.join(closure_library_root, '**_test.js'),
      '!%s' % os.path.join(closure_library_root, '**demo.js')] +
      [arg for pair in extern_args for arg in pair] + src_paths +
      generated_src_paths +
        ['!%s' % os.path.join(path, '**_test.js') for path in src_paths])


def _BuildJsOutputs(closure_library_root,
                    closure_compiler_jar,
                    src_paths,
                    generated_src_paths,
                    externs,
                    out_path,
                    debug):
  for namespace, filename in _COMPILE_TARGETS:
    output_file = os.path.join(out_path, 'app', filename)
    if not _CompileJs(closure_library_root,
                      closure_compiler_jar,
                      src_paths,
                      generated_src_paths,
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


def _BuildCmacs(version, debug):
  build_script_path = os.path.dirname(os.path.abspath(inspect.getfile(
      inspect.currentframe())))
  root_path = os.path.dirname(build_script_path)
  app_path = os.path.join(root_path, 'app')
  src_paths = map(lambda path : os.path.join(root_path, path),
                  _SOURCE_PATHS)
  externs = [os.path.join(root_path, 'externs', path) for path in _EXTERNS]
  out_path = os.path.join(root_path, 'out')
  generated_src_paths = map(lambda path : os.path.join(out_path, path),
                            _SOURCE_PATHS)

  closure_library_root = os.path.join(root_path, 'third_party',
      'closure-library')
  closure_compiler_jar = os.path.join(root_path, 'third_party',
      'closure-compiler', 'compiler.jar')
  _InitializeOutput(app_path, out_path)
  _BuildCccSources(src_paths, out_path)
  _CalcDeps(src_paths, closure_library_root, out_path)
  _BuildJsOutputs(closure_library_root, closure_compiler_jar, src_paths,
      generated_src_paths, externs, out_path, debug)
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

