SOURCE_DIR = src

# TODO: put real files here.
FILES = \
latexlive.css \
newdemo.html

BUILD_DIR = ./build
BUILD_FILE = ${BUILD_DIR}/latexlive.js

all: ${FILES}
	@@echo "Building the following files:"
	@@echo ${FILES} | sed s/\ /\n/
	@@echo '...'
	@@cat ${FILES} > ${BUILD_FILE}
	@@echo 'done.'

lol:
	@@echo "LOL!"
