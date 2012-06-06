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

# outputs
BUILD_DIR = ./build
BUILD_JS = $(BUILD_DIR)/mathquill.js
UGLY_JS = $(BUILD_DIR)/mathquill.min.js

# programs and flags
UGLIFY ?= uglifyjs
UGLIFY_OPTS ?= --lift-vars


#
# -*- Build tasks -*-
#

.PHONY: all cat uglify
all: uglify
cat: $(BUILD_JS)
uglify: $(UGLY_JS)

$(BUILD_JS): $(INTRO) $(SOURCES) $(OUTRO)
	mkdir -p $(BUILD_DIR)
	cat $^ > $@

$(UGLY_JS): $(BUILD_JS)
	$(UGLIFY) $(UGLIFY_OPTS) $< > $@

#
# -*- Publishing tasks -*-
#
.PHONY: publish
publish:
	./script/publish
