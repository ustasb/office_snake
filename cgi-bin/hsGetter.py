#!/usr/local/bin/python3

import cgi

request = cgi.FieldStorage()
scoresToLoad = int(request.getvalue('amt'))
difficulty = request.getvalue('diff')
hsFile = 'cgi-bin/{0}HS.csv'.format(difficulty)

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

        scoresToLoad -= 1
        if scoresToLoad == 0:
            break
