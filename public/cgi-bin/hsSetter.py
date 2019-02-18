#!/usr/bin/env python3

import sys
import cgi
import os
import time
import re

try:
    request = cgi.FieldStorage()
    pName = request.getvalue('name')
    pDifficulty = request.getvalue('diff')
    pScore = int(request.getvalue('score'))
    pTime = int(request.getvalue('time'))
    pDigest = int(request.getvalue('d'))
    date = time.strftime('%m/%d/%y')

    # Validate the digest.
    digest = str(pName) + str(pDifficulty) + str(pScore) + str(pTime)
    digest = sum(map(lambda c: ord(c), digest))
    if digest != pDigest:
        raise 'invalid digest'
except:
    print("Status: 400 Bad Request\r\r")
    sys.exit()

# print header
print('Content-type: text/plain\r')
print('\r')

rank = 1
madeEntry = False
newEntry = '{0},{1},{2},{3}\n'.format(pName, pScore, pTime, date)
hsFileLocation = 'high_scores/{0}HS.csv'.format(pDifficulty)

try:
    hsFile = open(hsFileLocation, 'r')
except IOError:
    # Create the high score file.
    open(hsFileLocation, 'w')
    hsFile = open(hsFileLocation, 'r')

with hsFile, open('high_scores/tmp', 'w') as outFile:

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
                time = int(re.match(r'\w*,\d*,(\d*),', line).group(1))
                if pTime < time:
                    print(rank)
                    makeEntry(newEntry, line)
                else:
                    print(rank + 1)
                    makeEntry(line, newEntry)
            else:
                outFile.write(line)

            rank += 1
        else:
            outFile.write(line)

    if madeEntry is False:
        print(rank)
        outFile.write(newEntry)

os.rename('high_scores/tmp', hsFileLocation)
