# The Cmacs Project.
# Copyright forever, the universe.

import BaseHTTPServer
import inspect
import mimetypes
import os
from urlparse import urlparse


class RequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def do_GET(self):
    if self.path == '/':
      self.path = '/index.html'
      return self.do_GET()
    self.path = urlparse(self.path).path
    filename = os.path.basename(self.path)
    _, ext = os.path.splitext(filename)
    test_script_path = os.path.dirname(os.path.abspath(inspect.getfile(
        inspect.currentframe())))
    root_path = os.path.dirname(os.path.dirname(test_script_path))
    # First try to locate the file in the project root, so we can fetch an
    # updated copy without requiring a rebuild.
    try:
      file_path = os.path.join(root_path, self.path[1:])
      if not os.path.isfile(file_path):
        file_path = os.path.join(test_script_path, self.path[1:])
      with open(file_path) as file:
        self.send_response(200)
        self.send_header('Content-type', mimetypes.types_map[ext])
        self.end_headers()
        self.wfile.write(file.read())
    except:
      self.send_response(404)

if __name__ == '__main__':
  mimetypes.init()
  httpd = BaseHTTPServer.HTTPServer(('', 4444), RequestHandler)
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  httpd.server_close()
