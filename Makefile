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
MINIFIED_BUILD_FILE = ${BUILD_DIR}/mathquill.min.js

all: cat minify

cat:
	[ -d "${BUILD_DIR}" ] || mkdir "${BUILD_DIR}"
	cat ${FILES} > "${BUILD_FILE}"

minify: cat
	which uglifyjs >/dev/null && \
    uglifyjs "${BUILD_FILE}" > "${MINIFIED_BUILD_FILE}"

publish: cat minify
	[ "`git symbolic-ref -q HEAD`" = "refs/heads/master" ] || ( \
	  echo "err: Please check out master first." >&2; exit 1 \
	)
	git stash
	cp mathquill.css build/mathquill.css
	git checkout gh-pages
	git pull origin gh-pages
	cp build/* .
	rm build/mathquill.css
	git commit -a -m "publish new mathquill.{js, css}"
	git push
	git checkout -
	git stash pop

publish-dev: cat minify
	git stash
	cp mathquill.css build/mathquill.css
	git checkout gh-pages
	git pull origin gh-pages
	cp build/* dev
	rm build/mathquill.css
	git commit -a -m "publish new mathquill-dev.{js, css}"
	git push
	git checkout -
	git stash pop

lol:
	@@echo "LOL!"
