#!/usr/local/bin/python3

import os
import http.server

os.chdir('public')
http.server.HTTPServer(("", 8000), http.server.CGIHTTPRequestHandler).serve_forever()
