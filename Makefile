SOURCE_DIR = src

# TODO: put real files here.
FILES = \
intro.js
backend.js \
commands.js \
frontend.js \
outro.js

BUILD_DIR = ./build
BUILD_FILE = ${BUILD_DIR}/latexlive.js

all: ${FILES}
	@@echo "Building the following files:"
	@@echo ${FILES} | tr ' ' '\n'
	@@echo '...'
	@@cat ${FILES} > ${BUILD_FILE}
	@@echo 'done.'

lol:
	@@echo "LOL!"
