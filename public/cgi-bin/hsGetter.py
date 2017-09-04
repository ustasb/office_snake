#!/usr/bin/env python3

import cgi

request = cgi.FieldStorage()
scoresToReturn = int(request.getvalue('amt'))
difficulty = request.getvalue('diff')
hsFile = 'high_scores/{0}HS.csv'.format(difficulty)

# Print header
print('Content-type: text/plain\r')
print('\r')

try:
    hsFile = open(hsFile, 'r')
except IOError:
    # Create the high score file.
    open (hsFile, 'w')
    hsFile = open(hsFile, 'r')

with hsFile:
    for line in hsFile:
        print(line, end='')

        scoresToReturn -= 1
        if scoresToReturn == 0:
            break
