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

UNIT_TESTS = ./test/unit/*.test.js
TEST_INTRO = ./test/unit/intro.js

# outputs
BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
BUILD_TEST = $(BUILD_DIR)/mathquill.test.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js
CLEAN += $(BUILD_DIR)

# programs and flags
UGLIFY ?= uglifyjs
UGLIFY_OPTS ?= --lift-vars


#
# -*- Build tasks -*-
#

.PHONY: all cat uglify clean
all: uglify
cat: $(BUILD_JS)
uglify: $(UGLY_JS)
clean:
	rm -rf $(CLEAN)

$(BUILD_JS): $(INTRO) $(SOURCES) $(OUTRO)
	mkdir -p $(BUILD_DIR)
	cat $^ > $@

$(UGLY_JS): $(BUILD_JS)
	$(UGLIFY) $(UGLIFY_OPTS) $< > $@

#
# -*- Test tasks -*-
#
.PHONY: test
test: $(BUILD_TEST)
	@echo "now open test/test.html in your browser to run the tests." >&2

$(BUILD_TEST): $(INTRO) $(SOURCES) $(TEST_INTRO) $(UNIT_TESTS) $(OUTRO)
	cat $^ > $@

#
# -*- Publishing tasks -*-
#
.PHONY: publish
publish:
	./script/publish
