#!/usr/local/bin/python3

import cgi

request = cgi.FieldStorage()
scoresToLoad = int(request.getvalue('amt'))
difficulty = request.getvalue('diff')

# Print header
print('Content-type: text/plain\r')
print('\r')

hsFile = open('cgi-bin/' + difficulty + 'HS.csv')
for line in hsFile:
    print(line, end='')

    scoresToLoad -= 1
    if scoresToLoad == 0:
        break
