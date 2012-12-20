#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
  ./node_modules/pjs/src/p.js \
  $(SRC_DIR)/textarea.js \
  $(SRC_DIR)/parser.js \
  $(SRC_DIR)/tree.js \
  $(SRC_DIR)/math.js \
  $(SRC_DIR)/rootelements.js \
  $(SRC_DIR)/commands.js \
  $(SRC_DIR)/symbols.js \
  $(SRC_DIR)/latex.js \
  $(SRC_DIR)/cursor.js \
  $(SRC_DIR)/publicapi.js

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

FONT_SOURCE = $(SRC_DIR)/font
FONT_TARGET = $(BUILD_DIR)/font

UNIT_TESTS = ./test/unit/*.test.js

# outputs
VERSION ?= $(shell node -e "console.log(require('./package.json').version)")

BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_DIR)/*

DISTDIR = ./mathquill-$(VERSION)
DIST = $(DISTDIR).tgz
CLEAN += $(DIST)

# programs and flags
UGLIFY ?= ./node_modules/.bin/uglifyjs
UGLIFY_OPTS ?= --lift-vars

LESSC ?= ./node_modules/.bin/lessc
LESS_OPTS ?=

# environment constants

#
# -*- Build tasks -*-
#

.PHONY: all cat uglify css font dist clean
all: font css uglify
# dev is like all, but without minification
dev: font css js
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
font: $(FONT_TARGET)
dist: $(DIST)
clean:
	rm -rf $(CLEAN)

$(BUILD_JS): $(INTRO) $(SOURCES) $(OUTRO)
	cat $^ > $@

$(UGLY_JS): $(BUILD_JS)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BUILD_CSS): $(CSS_SOURCES)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@

$(FONT_TARGET): $(FONT_SOURCE)
	rm -rf $@
	cp -r $< $@

$(DIST): $(UGLY_JS) $(BUILD_JS) $(BUILD_CSS) $(FONT_TARGET)
	tar -czf $(DIST) \
		--xform 's:^\./build:$(DISTDIR):' \
		--exclude='\.gitkeep' \
		./build/

#
# -*- Test tasks -*-
#

.PHONY: test server
server:
	./node_modules/.bin/supervisor -e js,less,Makefile .
test: dev $(BUILD_TEST)
	@echo
	@echo "** now open test/{unit,visual}.html in your browser to run the {unit,visual} tests. **"

$(BUILD_TEST): $(INTRO) $(SOURCES) $(UNIT_TESTS) $(OUTRO)
	cat $^ > $@

#
# -*- site (mathquill.github.com) tasks
#

.PHONY: site publish site-pull

SITE = mathquill.github.com
SITE_CLONE_URL = git@github.com:mathquill/mathquill.github.com
SITE_COMMITMSG = 'updating mathquill to $(VERSION)'

DOWNLOADS_PAGE = $(SITE)/downloads.html
DIST_DOWNLOAD = $(SITE)/downloads/$(DIST)

site: $(SITE) $(SITE)/mathquill $(SITE)/demo.html $(SITE)/support $(DOWNLOADS_PAGE)

publish: site-pull site
	pwd
	cd $(SITE) \
	&& git add -- mathquill demo.html support downloads downloads.html \
	&& git commit -m $(SITE_COMMITMSG) \
	&& git push

$(SITE)/mathquill: $(DIST)
	mkdir -p $@
	tar -xzf $(DIST) \
		--directory $@ \
		--strip-components=2

$(DIST_DOWNLOAD): $(DIST)
	mkdir -p $(dir $@)
	cp $^ $@

$(DOWNLOADS_PAGE): $(DIST_DOWNLOAD)
	@echo -n updating downloads page...
	@sed -ri $(DOWNLOADS_PAGE) \
		-e '/Latest version:/ s/[0-9]+[.][0-9]+[.][0-9]+/$(VERSION)/g'
	@mkdir -p tmp
	@ls $(SITE)/downloads/*.tgz \
		| egrep -o '[0-9]+[.][0-9]+[.][0-9]+' \
		| fgrep -v $(VERSION) \
		| sort --version-sort \
		| sed 's|.*|<li><a class="prev" href="downloads/mathquill-&.tgz">v&</a></li>|' \
		> tmp/versions-list.html
	@sed -ir $(DOWNLOADS_PAGE) \
		-e '/<a class="prev"/d' \
		-e '/<ul id="prev-versions">/ r tmp/versions-list.html'
	@rm tmp/versions-list.html
	@echo done.

$(SITE)/demo.html: test/demo.html
	cat $^ \
	| sed 's:../build/:mathquill/:' \
	| sed 's:local test page:live demo:' \
	> $@

$(SITE)/support: test/support
	rm -rf $@
	cp -r $^ $@

$(SITE):
	git clone $(SITE_CLONE_URL) $@

site-pull: $(SITE)
	cd $(SITE) && git pull
