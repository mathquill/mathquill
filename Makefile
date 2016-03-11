#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

PJS_SRC = ./node_modules/pjs/src/p.js

BASE_SOURCES = \
  $(PJS_SRC) \
  $(SRC_DIR)/tree.js \
  $(SRC_DIR)/cursor.js \
  $(SRC_DIR)/controller.js \
  $(SRC_DIR)/publicapi.js \
  $(SRC_DIR)/services/*.util.js \
  $(SRC_DIR)/services/*.js

SOURCES_FULL = \
  $(BASE_SOURCES) \
  $(SRC_DIR)/commands/*.js \
  $(SRC_DIR)/commands/*/*.js

SOURCES_BASIC = \
  $(BASE_SOURCES) \
  $(SRC_DIR)/commands/math.js \
  $(SRC_DIR)/commands/math/basicSymbols.js \
  $(SRC_DIR)/commands/math/commands.js

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
BASIC_JS = $(BUILD_DIR)/mathquill-basic.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
BASIC_CSS = $(BUILD_DIR)/mathquill-basic.css
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
UGLY_BASIC_JS = $(BUILD_DIR)/mathquill-basic.min.js
CLEAN += $(BUILD_DIR)/*

DISTDIR = ./mathquill-$(VERSION)
DIST = $(DISTDIR).tgz
CLEAN += $(DIST)

# programs and flags
UGLIFY ?= ./node_modules/.bin/uglifyjs
UGLIFY_OPTS ?= --mangle --compress hoist_vars=true --comments /maintainers@mathquill.com/

LESSC ?= ./node_modules/.bin/lessc
LESS_OPTS ?=
ifdef OMIT_FONT_FACE
  LESS_OPTS += --modify-var="omit-font-face=true"
endif

# Empty target files whose Last Modified timestamps are used to record when
# something like `npm install` last happened (which, for example, would then be
# compared with its dependency, package.json, so if package.json has been
# modified since the last `npm install`, Make will `npm install` again).
# http://www.gnu.org/software/make/manual/html_node/Empty-Targets.html#Empty-Targets
NODE_MODULES_INSTALLED = ./node_modules/.installed--used_by_Makefile
BUILD_DIR_EXISTS = $(BUILD_DIR)/.exists--used_by_Makefile

# environment constants

#
# -*- Build tasks -*-
#

.PHONY: all basic dev js uglify css font dist clean
all: font css uglify
basic: $(UGLY_BASIC_JS) $(BASIC_CSS)
# dev is like all, but without minification
dev: font css js
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
font: $(FONT_TARGET)
dist: $(DIST)
clean:
	rm -rf $(CLEAN)

$(PJS_SRC): $(NODE_MODULES_INSTALLED)

$(BUILD_JS): $(INTRO) $(SOURCES_FULL) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_JS): $(BUILD_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BASIC_JS): $(INTRO) $(SOURCES_BASIC) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@

$(UGLY_BASIC_JS): $(BASIC_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BUILD_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@

$(BASIC_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) --modify-var="basic=true" $(LESS_OPTS) $(CSS_MAIN) > $@

$(NODE_MODULES_INSTALLED): package.json
	npm install
	touch $(NODE_MODULES_INSTALLED)

$(BUILD_DIR_EXISTS):
	mkdir -p $(BUILD_DIR)
	touch $(BUILD_DIR_EXISTS)

$(FONT_TARGET): $(FONT_SOURCE) $(BUILD_DIR_EXISTS)
	rm -rf $@
	cp -r $< $@

$(DIST): $(UGLY_JS) $(BUILD_JS) $(BUILD_CSS) $(FONT_TARGET)
	rm -rf $(DISTDIR)
	cp -r $(BUILD_DIR) $(DISTDIR)
	tar -czf $(DIST) --exclude='\.gitkeep' $(DISTDIR)
	rm -r $(DISTDIR)

#
# -*- Test tasks -*-
#

.PHONY: test server run-server
server:
	node script/test_server.js
test: dev $(BUILD_TEST) $(BASIC_JS) $(BASIC_CSS)
	@echo
	@echo "** now open test/{unit,visual}.html in your browser to run the {unit,visual} tests. **"

$(BUILD_TEST): $(INTRO) $(SOURCES_FULL) $(UNIT_TESTS) $(OUTRO) $(BUILD_DIR_EXISTS)
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

# freaking bsd, i swear
# adapted from https://developer.apple.com/library/mac/documentation/opensource/Conceptual/ShellScripting/PortingScriptstoMacOSX/PortingScriptstoMacOSX.html#//apple_ref/doc/uid/TP40004268-TP40003517-SW21
ifeq (x, $(shell echo xy | sed -r 's/(x)y/\1/' 2>/dev/null))
  # gnu
  SED = sed -r
  SED_I = $(SED) -i
else
  # bsd
  SED = sed -E
  SED_I = $(SED) -i ''
endif

$(DOWNLOADS_PAGE): $(DIST_DOWNLOAD)
	@echo Using $(SED)
	@echo -n updating downloads page...
	@$(SED_I) \
		-e '/Latest version:/ s/[0-9]+[.][0-9]+[.][0-9]+/$(VERSION)/g' \
		$(DOWNLOADS_PAGE)
	@mkdir -p tmp
	@ls $(SITE)/downloads/*.tgz \
		| egrep -o '[0-9]+[.][0-9]+[.][0-9]+' \
		| fgrep -v $(VERSION) \
		| sort -rn -t. -k 1,1 -k 2,2 -k 3,3 \
		| sed 's|.*|<li><a class="prev" href="downloads/mathquill-&.tgz">v&</a></li>|' \
		> tmp/versions-list.html
	@$(SED_I) \
		-e '/<a class="prev"/d' \
		-e '/<ul id="prev-versions">/ r tmp/versions-list.html' \
		$(DOWNLOADS_PAGE)
	@rm tmp/versions-list.html
	@echo done.

$(SITE)/demo.html: test/demo.html
	cat $^ \
	| $(SED) 's:../build/:mathquill/:' \
	| $(SED) 's:local test page:live demo:' \
	> $@

$(SITE)/support: test/support
	rm -rf $@
	cp -r $^ $@

$(SITE):
	git clone $(SITE_CLONE_URL) $@

site-pull: $(SITE)
	cd $(SITE) && git pull
