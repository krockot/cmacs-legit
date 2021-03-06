# The Cmacs Project.

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

    server_path = os.path.dirname(os.path.abspath(inspect.getfile(
        inspect.currentframe())))
    root_path = os.path.dirname(server_path)
    out_path = os.path.join(root_path, 'out', 'app')

    try:
      file_path = os.path.join(out_path, self.path[1:])
      with open(file_path) as file:
        self.send_response(200)
        _, ext = os.path.splitext(os.path.basename(self.path))
        self.send_header('Content-type', mimetypes.types_map[ext])
        self.end_headers()
        self.wfile.write(file.read())
    except:
      self.send_response(404)


if __name__ == '__main__':
  mimetypes.init()
  httpd = BaseHTTPServer.HTTPServer(('', 4242), RequestHandler)
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  httpd.server_close()
