#!/usr/bin/env python3

# A simple Python server that supports CGI.

import os
import sys
import http.server

http.server.HTTPServer(("", 8000), http.server.CGIHTTPRequestHandler).serve_forever()
