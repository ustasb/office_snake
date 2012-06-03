#!/usr/local/bin/python3

import http.server

http.server.HTTPServer(("", 8000), http.server.CGIHTTPRequestHandler).serve_forever()
