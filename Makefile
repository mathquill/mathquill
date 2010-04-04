BRANCH = master

SOURCE_DIR = src

FILES = \
${SOURCE_DIR}/intro.js \
${SOURCE_DIR}/backend.js \
${SOURCE_DIR}/commands.js \
${SOURCE_DIR}/frontend.js \
${SOURCE_DIR}/outro.js

BUILD_DIR = ./build
BUILD_FILE = ${BUILD_DIR}/latexlive.js

all:
	@@if test ! -d ${BUILD_DIR}; then mkdir ${BUILD_DIR}; fi
	@@echo 'Building...'
	@@echo ${FILES} | tr ' ' '\n'
	@@cat ${FILES} > ${BUILD_FILE}
	@@echo 'Done.'

gsync:
	${override BRANCH := `git branch | grep '\*' | sed 's/\* *//'`}
	@@git checkout master
	@@git pull --all
	@@git push --all
	@@git checkout ${BRANCH}

lol:
	@@echo "LOL!"
