#!/usr/local/bin/python3

import os
import re
import shutil

class indexHTML():
    def __init__(self, filePath):
        self.filePath = filePath
        self.html = open(filePath, 'r').read()

    def commit(self):
        file = open(self.filePath, 'w')
        file.write(self.html)
        file.close()
    
    def compress(self):
        currentLocation = os.getcwd()
        os.chdir(prodLocation)
        os.system('java -jar ../htmlcompressor-1.5.3.jar {0} -o '
                  'index.html --charset utf-8'.format(self.filePath)) 
        os.chdir(currentLocation)

    def delCSSDecl(self, fileName):
        self.html = re.sub(r'\s*<link.*{0}.*/>'.format(fileName), '', self.html)

    def makeCSSDecl(self, filePath):
        cssEntry = '<link type="text/css" rel="stylesheet" href="{0}" />'.format(filePath)
        self.html = re.sub('</head>', '{0}\n\0'.format(cssEntry), self.html)

    def delJSDecl(self, fileName):
        self.html = re.sub(r'\s*<script.*{0}.*</script>'.format(fileName), '', self.html)

    def makeJSDecl(self, filePath):
        jsEntry = '<script src="{0}"></script>'.format(filePath)
        self.html = re.sub(r'</body>', '{0}\n\0'.format(jsEntry), self.html)

def compressDir(relPath, newFileName, fileType='js', prependStr='', appendStr=''):
    
    minFilePath = '{0}{1}'.format(relPath, newFileName) 
    os.chdir(relPath)

    with open('buildOrder', 'r') as buildOrder, open(newFileName, 'w+') as outFile:
        
        outFile.write(prependStr)

        for fileName in buildOrder:
            fileName = fileName.strip()
            outFile.write(open(fileName, 'r').read())
            os.remove(fileName)
            
            if fileType == 'js':
                index.delJSDecl(fileName)
            else:
                index.delCSSDecl(fileName)

        outFile.write(appendStr)

        os.remove('buildOrder')

    os.chdir(prodLocation)
    os.system('java -jar ../yuicompressor-2.4.7.jar --type {0} {1} -o '
              '{1} --charset utf-8'.format(fileType, minFilePath))

    if fileType == 'js':
        index.makeJSDecl(minFilePath)
    else:
        index.makeCSSDecl(minFilePath)

# Create production directory
if os.path.isdir('prod'):
    shutil.rmtree('prod')

shutil.copytree('public', 'prod')
os.chdir('prod')

prodLocation = os.getcwd()
index = indexHTML('index.html')

# Compress JS
compressDir('js/', 'oSnakeMin.js', 'js', '(function ($, undefined) {', '})(jQuery);')

# Compress CSS
compressDir('css/', 'oSnakeMin.css', 'css')

# Commit index.html changes
index.commit()
index.compress()
