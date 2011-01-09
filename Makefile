SOURCE_DIR = src

FILES = \
${SOURCE_DIR}/HEADER \
${SOURCE_DIR}/intro.js \
${SOURCE_DIR}/baseclasses.js \
${SOURCE_DIR}/rootelements.js \
${SOURCE_DIR}/commands.js \
${SOURCE_DIR}/symbols.js \
${SOURCE_DIR}/cursor.js \
${SOURCE_DIR}/publicapi.js \
${SOURCE_DIR}/outro.js

BUILD_DIR = ./build
BUILD_FILE = ${BUILD_DIR}/mathquill.js

all:
	@@if test ! -d ${BUILD_DIR}; then mkdir ${BUILD_DIR}; fi
	@@echo 'Building...'
	@@echo ${FILES} | tr ' ' '\n'
	@@cat ${FILES} > ${BUILD_FILE}
	@@echo 'Done.'

publish:
	@@echo "${shell ./publish.sh}"

lol:
	@@echo "LOL!"
