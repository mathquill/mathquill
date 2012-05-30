.PHONY: all
all:
	./build.sh

HEAD:
	./build.sh HEAD

cat: build/mathquill.js

publish:
	./build.sh publish

build/mathquill.js: src/*.js
	./build.sh cat
