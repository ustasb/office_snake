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

date = time.strftime('%m/%d/%y') 
entry = '{0},{1},{2},{3}\n'.format(pName, pScore, pTime,
                                   time.strftime('%m/%d/%y'))

print('Content-type: text/plain\r')
print('\r')

madeEntry = False
hsFile = open('cgi-bin/' + pDifficulty + 'HS.csv', 'r+')
outfile = open('cgi-bin/tmp.txt', 'w+')

for rank, line in enumerate(hsFile):

    if madeEntry is False:
        score = int(re.match(r'\w*,(\d*),', line).group(1))
        if pScore > score:
            outfile.write(entry)
            outfile.write(line)
            print(rank)
            madeEntry = True
        elif pScore == score:
            print(rank)
            madeEntry = True
            time = int(re.match(r'\w*,\d*,(\d*),', line).group(1))
            if pTime < time:
                outfile.write(entry)
                outfile.write(line)
            else:
                outfile.write(line)
                outfile.write(entry)
        else:
            outfile.write(line)
    else:
        outfile.write(line)

if madeEntry is False:
    print(rank)
    outfile.write(entry)

os.rename('cgi-bin/tmp.txt', 'cgi-bin/' + pDifficulty + 'HS.csv')

hsFile.close
outfile.close
