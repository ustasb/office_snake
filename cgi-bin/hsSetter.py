#!/usr/local/bin/python3

import os
import cgi
import time
import re

request = cgi.FieldStorage()
pName = request.getvalue('name')
pDifficulty = request.getvalue('diff')
pScore = int(request.getvalue('score'))
pTime = int(request.getvalue('time'))

hsFile = 'cgi-bin/{0}HS.csv'.format(pDifficulty)

date = time.strftime('%m/%d/%y') 
newEntry = '{0},{1},{2},{3}\n'.format(pName, pScore, pTime,
                                   time.strftime('%m/%d/%y'))

# Print header
print('Content-type: text/plain\r')
print('\r')

rank = 1
madeEntry = False

try:
    hsFile = open(hsFile, 'r')
except IOError:
    # Create the high score file.
    open (hsFile, 'w')
    hsFile = open(hsFile, 'r')

with hsFile, open('cgi-bin/tmp.txt', 'w') as outfile:
    for rank, line in enumerate(hsFile):

        if madeEntry is False:
            score = int(re.match(r'\w*,(\d*),', line).group(1))
            if pScore > score:
                outfile.write(newEntry)
                outfile.write(line)
                print(rank)
                madeEntry = True
            elif pScore == score:
                print(rank)
                madeEntry = True
                time = int(re.match(r'\w*,\d*,(\d*),', line).group(1))
                if pTime < time:
                    outfile.write(newEntry)
                    outfile.write(line)
                else:
                    outfile.write(line)
                    outfile.write(newEntry)
            else:
                outfile.write(line)
        else:
            outfile.write(line)

    if madeEntry is False:
        print(rank)
        outfile.write(newEntry)

os.rename('cgi-bin/tmp.txt', 'cgi-bin/' + pDifficulty + 'HS.csv')

hsFile.close
outfile.close
