.PHONY: all
all:
	./build.sh

HEAD:
	./build.sh HEAD

cat: build/mathquill.js

build/mathquill.js: src/*.js
	./build.sh cat

#
# -*- Publishing tasks -*-
#
.PHONY: publish
publish:
	./script/publish
