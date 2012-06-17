#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
  ./vendor/pjs/src/p.js \
  $(SRC_DIR)/baseclasses.js \
  $(SRC_DIR)/rootelements.js \
  $(SRC_DIR)/commands.js \
  $(SRC_DIR)/symbols.js \
  $(SRC_DIR)/cursor.js \
  $(SRC_DIR)/publicapi.js

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

FONT_SOURCE = $(SRC_DIR)/font
FONT_TARGET = $(BUILD_DIR)/font

UNIT_TESTS = ./test/unit/*.test.js
TEST_INTRO = ./test/unit/intro.js

# outputs
VERSION ?= $(shell node -e "console.log(require('./package.json').version)")

BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_DIR)

DISTDIR = ./mathquill-$(VERSION)
DIST = $(DISTDIR).tgz

# programs and flags
UGLIFY ?= uglifyjs
UGLIFY_OPTS ?= --lift-vars

LESSC ?= lessc
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
	mkdir -p $(BUILD_DIR)
	cat $^ > $@

$(UGLY_JS): $(BUILD_JS)
	$(UGLIFY) $(UGLIFY_OPTS) $< > $@

$(BUILD_CSS): $(CSS_SOURCES)
	mkdir -p $(BUILD_DIR)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@

$(FONT_TARGET): $(FONT_SOURCE)
	mkdir -p $(BUILD_DIR)
	rm -rf $@
	cp -r $< $@

$(DIST): $(UGLY_JS) $(BUILD_JS) $(BUILD_CSS) $(FONT_TARGET)
	tar -czf $(DIST) --xform 's:^\./build:$(DISTDIR):' ./build/

#
# -*- Test tasks -*-
#
.PHONY: test
test: $(BUILD_TEST)
	@echo
	@echo "** now open test/test.html in your browser to run the tests. **"

$(BUILD_TEST): $(INTRO) $(SOURCES) $(TEST_INTRO) $(UNIT_TESTS) $(OUTRO)
	mkdir -p $(BUILD_DIR)
	cat $^ > $@
