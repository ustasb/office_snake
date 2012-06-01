#!/usr/local/bin/python3

import cgi

request = cgi.FieldStorage()
numOfHighscores = int(request.getvalue('amt'))
difficulty = request.getvalue('diff')

# Print header
print('Content-type: text/plain\r')
print('\r')

hsFile = open('cgi-bin/' + difficulty + 'HS.csv')
for line in hsFile:
    print(line, end='')

    numOfHighscores -= 1
    if numOfHighscores == 0:
        break
