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
	[ -d "${BUILD_DIR}" ] || mkdir "${BUILD_DIR}"
	cat ${FILES} > ${BUILD_FILE}

publish:
	@@./publish.sh

lol:
	@@echo "LOL!"
