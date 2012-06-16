#!/usr/local/bin/python3

import os
import re
import shutil
from time import time

UTILS_FOLDER = '{0}/utils'.format(os.getcwd())
TIME = int(time())

class HTMLFile():
    def __init__(self, filePath):
        self.filePath = filePath
        self.html = open(filePath, 'r').read()

    def commit(self):
        file = open(self.filePath, 'w')
        file.write(self.html)
        file.close()
    
    def delCSSDecl(self, fileName):
        self.html = re.sub(r'\s*<link.*{0}.*/>'.format(fileName), '',
                           self.html)

    def makeCSSDecl(self, filePath):
        cssEntry = ('<link type="text/css" rel="stylesheet" '
                   'href="{0}?v={1}" />').format(filePath, TIME)
        regex = re.compile(r'^(\s*)(</head>)', re.M) 
        self.html = re.sub(regex, r'\1\1{0}\n\1\2'.format(cssEntry), self.html)

    def delJSDecl(self, fileName):
        self.html = re.sub(r'\s*<script.*{0}.*</script>'.format(fileName), '', 
                           self.html)

    def makeJSDecl(self, filePath):
        jsEntry = '<script src="{0}?v={1}"></script>'.format(filePath, TIME)
        regex = re.compile(r'^(\s*)(</body>)', re.M)
        self.html = re.sub(regex, r'\1\1{0}\n\1\2'.format(jsEntry), self.html)

    def addAnalytics(self, filePath):
        compress(filePath, filePath)
        source = open(filePath, 'r').read()
        jsEntry = '<script>{0}</script>'.format(source)
        regex = re.compile(r'^(\s*)(</body>)', re.M)
        self.html = re.sub(regex, r'\1\1{0}\n\1\2'.format(jsEntry), self.html)

    def removeDeclarationsInDir(self, dirPath):
        dirPath = sanitizeDirPath(dirPath)

        try:
            buildOrder = open(dirPath + 'buildOrder', 'r')
        except IOError:
            print('Expected to find a buildOrder file but didn\'t.')
            raise
        
        with buildOrder:
            for fileName in buildOrder:
                fileName = fileName.strip()

                try:
                    fileType = re.search(r'(css|js)$', fileName).group(0)
                except AttributeError:
                    print('removeDeclarationsInDir() only accepts .css or .js files.')
                    raise

                if fileType == 'css':
                    self.delCSSDecl(fileName)
                else:
                    self.delJSDecl(fileName)
        
def sanitizeDirPath(dirPath):
    if re.search(r'/$', dirPath) is None:
        dirPath += '/'

    return dirPath

def mergeDir(dirPath, resultFileName, prependStr='', appendStr=''):
    oldPath = os.getcwd()
    dirPath = sanitizeDirPath(dirPath)
    os.chdir(dirPath)

    try:
        buildOrder = open('buildOrder', 'r')
    except IOError:
        print('Expected to find a buildOrder file but didn\'t.')
        raise

    with buildOrder, open(resultFileName, 'w') as outFile:
        outFile.write(prependStr)

        for fileName in buildOrder:
            fileName = fileName.strip()
            outFile.write(open(fileName, 'r').read())
            
        outFile.write(appendStr)

    # Restore user's path.
    os.chdir(oldPath)

def compress(filePath, outFile):
    try:
        fileType = re.search(r'(html|css|js)$', filePath).group(0)
    except AttributeError:
        print('compress() only accepts .html, .css, or .js files.')
        raise

    cmd = 'java -jar {0}/{1} --type {2} {3} -o {4} --charset utf-8'

    if fileType == 'html':
        script = 'htmlcompressor-1.5.3.jar'
    else:
        script = 'yuicompressor-2.4.7.jar'
    
    os.system(cmd.format(UTILS_FOLDER, script, fileType, filePath, outFile))

if __name__ == '__main__':

    # Create production directory.
    if os.path.isdir('prod'):
        shutil.rmtree('prod')

    shutil.copytree('public', 'prod')

    oldPath = os.getcwd()
    os.chdir('prod')

    # Merge and compress CSS files.
    mergeDir('css', 'oSnakeMerge.css')
    compress('css/oSnakeMerge.css', 'css/oSnakeMergeMin.css')

    # Merge and compress JavaScript files.
    mergeDir('js', 'oSnakeMerge.js', '(function ($, undefined) {"use strict";',
             '})(jQuery);')
    compress('js/oSnakeMerge.js', 'js/oSnakeMergeMin.js')

    # Update the index.html file.
    index = HTMLFile('index.html')
    index.removeDeclarationsInDir('css')
    index.removeDeclarationsInDir('js')
    index.makeCSSDecl('css/oSnakeMergeMin.css')
    index.makeJSDecl('js/oSnakeMergeMin.js')
    index.addAnalytics('js/googleAnalytics.js')
    index.commit()
    compress(index.filePath, index.filePath)

    # Remove excess development files.
    for dir in ('css', 'js'):
        os.system('cd {0};ls .|grep -v oSnakeMergeMin.{0}|xargs rm;'
                  'cd ..'.format(dir))
    
    # Restore the old cwd.
    os.chdir(oldPath)
