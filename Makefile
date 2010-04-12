SOURCE_DIR = src

FILES = \
${SOURCE_DIR}/intro.js \
${SOURCE_DIR}/backend.js \
${SOURCE_DIR}/commands.js \
${SOURCE_DIR}/frontend.js \
${SOURCE_DIR}/outro.js

BUILD_DIR = ./build
BUILD_FILE = ${BUILD_DIR}/mathquill.js

all:
	@@if test ! -d ${BUILD_DIR}; then mkdir ${BUILD_DIR}; fi
	@@echo 'Building...'
	@@echo ${FILES} | tr ' ' '\n'
	@@cat ${FILES} > ${BUILD_FILE}
	@@echo 'Done.'

gitsync:
	@@${shell ./gitsync.sh}

publish:
	@@${shell ./publish.sh}

lol:
	@@echo "LOL!"
