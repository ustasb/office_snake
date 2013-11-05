#!/usr/bin/env python3

# A simple Python server that supports CGI.

import os
import sys
import http.server

# Move into the supplied directory to begin serving it.
try:
    os.chdir(sys.argv[1])
except IndexError:
    # Default to the public/ directory.
    os.chdir('public/')

http.server.HTTPServer(("", 8000), http.server.CGIHTTPRequestHandler).serve_forever()
