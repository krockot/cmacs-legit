# The Cmacs Project.

import BaseHTTPServer
import inspect
import mimetypes
import os
import posixpath
import re
from urlparse import urlparse


def purify_path(path, components=None):
  """Converts the path specific to the current platform into a posixpath."""
  if components is None:
    components = []
  parent, leaf = os.path.split(path)
  components.insert(0, leaf)
  if parent == '':
    return posixpath.join(*components)
  return purify_path(parent, components)


class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def do_GET(self):
    if self.path == '/':
      self.path = '/test/index.html'
      return self.do_GET()
    self.path = urlparse(self.path).path

    test_script_path = os.path.dirname(os.path.abspath(inspect.getfile(
        inspect.currentframe())))
    root_path = os.path.dirname(test_script_path)

    if self.path == '/alltests.js':
      return self.get_all_tests(root_path)

    if self.path.endswith('_test'):
      test_suite = os.path.join(root_path, self.path[1:])
      if os.path.isfile(test_suite + '.js'):
        return self.get_test_suite(test_suite)

    try:
      file_path = os.path.join(root_path, self.path[1:])
      with open(file_path) as file:
        self.send_response(200)
        _, ext = os.path.splitext(os.path.basename(self.path))
        self.send_header('Content-type', mimetypes.types_map[ext])
        self.end_headers()
        self.wfile.write(file.read())
    except:
      self.send_response(404)

  def get_all_tests(self, root_path):
    self.send_response(200)
    self.send_header('Content-type', 'text/javascript; charset=utf-8')
    self.end_headers()
    self.wfile.write('_allTests=[')
    root_dirs = os.listdir(root_path)
    blacklist = ('third_party',)
    for root_dir in [d for d in root_dirs
                     if os.path.isdir(d) and d not in blacklist]:
      for root, dirs, files in os.walk(root_dir):
        for filename in [f for f in files if f.endswith('_test.js')]:
          suite_name, _ = os.path.splitext(filename)
          print os.path.join(root, suite_name)
          suite_path = purify_path(os.path.join(root, suite_name))
          self.wfile.write('"%s",' % suite_path)
    self.wfile.write(']\n')


  def get_test_suite(self, suite):
    with open(suite + '.js') as script:
      provide = re.search('goog\\.provide\\([\'"]([^\'"]+)[\'"]\\)',
                          script.read())
      if provide is None or not provide.groups():
        self.send_response(404)
        return
      namespace = provide.groups(1)[0]
    self.send_response(200)
    self.send_header('Content-type', 'text/html; charset=utf-8')
    self.end_headers()
    self.wfile.write(('<!doctype html><html><head>' +
        '<title>Cmacs Test Suite [%s]</title><script ' +
        'src="/third_party/closure-library/closure/goog/base.js"></script>' +
        '<script src="/out/deps.js"></script><script>goog.require("%s");' +
        '</script></head><body></body></html>') % (suite, namespace))

if __name__ == '__main__':
  mimetypes.init()
  httpd = BaseHTTPServer.HTTPServer(('', 4444), RequestHandler)
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  httpd.server_close()
