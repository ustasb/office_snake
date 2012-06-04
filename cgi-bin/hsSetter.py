#!/usr/local/bin/python3

import cgi
import os
import time
import re

request = cgi.FieldStorage()
pName = request.getvalue('name')
pDifficulty = request.getvalue('diff')
pScore = int(request.getvalue('score'))
pTime = int(request.getvalue('time'))
date = time.strftime('%m/%d/%y') 

# Print header
print('Content-type: text/plain\r')
print('\r')

rank = 1
madeEntry = False
newEntry = '{0},{1},{2},{3}\n'.format(pName, pScore, pTime, date)
hsFileLocation = 'cgi-bin/{0}HS.csv'.format(pDifficulty)

try:
    hsFile = open(hsFileLocation, 'r')
except IOError:
    # Create the high score file.
    open (hsFileLocation, 'w')
    hsFile = open(hsFileLocation, 'r')


with hsFile, open('cgi-bin/tmp.txt', 'w') as outFile:

    def makeEntry(line1, line2):
        global madeEntry
        madeEntry = True
        outFile.write(line1)
        outFile.write(line2)

    for line in hsFile:

        if madeEntry is False:

            score = int(re.match(r'\w*,(\d*),', line).group(1))
            if pScore > score:
                print(rank)
                makeEntry(newEntry, line)
            elif pScore == score:
                print(rank)
                time = int(re.match(r'\w*,\d*,(\d*),', line).group(1))
                if pTime < time:
                    makeEntry(newEntry, line)
                else:
                    makeEntry(line, newEntry)
            else:
                outFile.write(line)
            
            rank += 1
        else:
            outFile.write(line)

    if madeEntry is False:
        print(rank)
        outFile.write(newEntry)

os.rename('cgi-bin/tmp.txt', hsFileLocation) 
