#
# -*- Configuration -*-
#

# inputs
SRC_DIR = ./src
INTRO = $(SRC_DIR)/intro.js
OUTRO = $(SRC_DIR)/outro.js

SOURCES = \
  $(SRC_DIR)/baseclasses.js \
  $(SRC_DIR)/rootelements.js \
  $(SRC_DIR)/commands.js \
  $(SRC_DIR)/symbols.js \
  $(SRC_DIR)/cursor.js \
  $(SRC_DIR)/publicapi.js

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(CSS_DIR)/*.less

UNIT_TESTS = ./test/unit/*.test.js
TEST_INTRO = ./test/unit/intro.js

# outputs
BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_CSS = $(BUILD_DIR)/mathquill.css
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_DIR)

# programs and flags
UGLIFY ?= uglifyjs
UGLIFY_OPTS ?= --lift-vars

LESSC ?= lessc
LESS_OPTS ?=

#
# -*- Build tasks -*-
#

.PHONY: all cat uglify css clean
all: css uglify
# dev is like all, but without minification
dev: css js
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
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

#
# -*- Publishing tasks -*-
#
.PHONY: publish
publish:
	./script/publish
