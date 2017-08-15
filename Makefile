#
# -*- Prerequisites -*-
#

# the fact that 'I am Node.js' is unquoted here looks wrong to me but it
# CAN'T be quoted, I tried. Apparently in GNU Makefiles, in the paren+comma
# syntax for conditionals, quotes are literal; and because the $(shell...)
# call has parentheses and single and double quotes, the quoted syntaxes
# don't work (I tried), we HAVE to use the paren+comma syntax
ifneq ($(shell node -e 'console.log("I am Node.js")'), I am Node.js)
  ifeq ($(shell nodejs -e 'console.log("I am Node.js")' 2>/dev/null), I am Node.js)
    $(error You have /usr/bin/nodejs but no /usr/bin/node, please 'sudo apt-get install nodejs-legacy' (see http://stackoverflow.com/a/21171188/362030 ))
  endif

  $(error Please install Node.js: https://nodejs.org/ )
endif

# stupid GNU vs BSD https://github.com/mathquill/mathquill/pull/653/commits/4332b0e97a92fb1362123a06b68fa49d9efb6f38#r68305423
ifeq (x, $(shell echo xy | sed -r 's/(x)y/\1/' 2>/dev/null))
  SED_IN_PLACE = sed -i    # GNU
else
  SED_IN_PLACE = sed -i '' # BSD
endif


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
  $(SRC_DIR)/commands/math.js \
  $(SRC_DIR)/commands/text.js \
  $(SRC_DIR)/commands/math/*.js
# FIXME text.js currently depends on math.js (#435), restore these when fixed:
# $(SRC_DIR)/commands/*.js \
# $(SRC_DIR)/commands/*/*.js

SOURCES_BASIC = \
  $(BASE_SOURCES) \
  $(SRC_DIR)/commands/math.js \
  $(SRC_DIR)/commands/math/basicSymbols.js \
  $(SRC_DIR)/commands/math/commands.js

CSS_DIR = $(SRC_DIR)/css
CSS_MAIN = $(CSS_DIR)/main.less
CSS_SOURCES = $(shell find $(CSS_DIR) -name '*.less')

FONT_SOURCE = $(SRC_DIR)/fonts
FONT_TARGET = $(BUILD_DIR)/fonts

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

.PHONY: all basic dev js uglify css font clean
all: font css uglify
basic: $(UGLY_BASIC_JS) $(BASIC_CSS)
# dev is like all, but without minification
dev: font css js
js: $(BUILD_JS)
uglify: $(UGLY_JS)
css: $(BUILD_CSS)
font: $(FONT_TARGET)
clean:
	rm -rf $(BUILD_DIR)

$(PJS_SRC): $(NODE_MODULES_INSTALLED)

$(BUILD_JS): $(INTRO) $(SOURCES_FULL) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@
	$(SED_IN_PLACE) s/{VERSION}/v$(VERSION)/ $@

$(UGLY_JS): $(BUILD_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BASIC_JS): $(INTRO) $(SOURCES_BASIC) $(OUTRO) $(BUILD_DIR_EXISTS)
	cat $^ | ./script/escape-non-ascii > $@
	$(SED_IN_PLACE) s/{VERSION}/v$(VERSION)/ $@

$(UGLY_BASIC_JS): $(BASIC_JS) $(NODE_MODULES_INSTALLED)
	$(UGLIFY) $(UGLIFY_OPTS) < $< > $@

$(BUILD_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) $(LESS_OPTS) $(CSS_MAIN) > $@
	$(SED_IN_PLACE) s/{VERSION}/v$(VERSION)/ $@

$(BASIC_CSS): $(CSS_SOURCES) $(NODE_MODULES_INSTALLED) $(BUILD_DIR_EXISTS)
	$(LESSC) --modify-var="basic=true" $(LESS_OPTS) $(CSS_MAIN) > $@
	$(SED_IN_PLACE) s/{VERSION}/v$(VERSION)/ $@

$(NODE_MODULES_INSTALLED): package.json
	test -e $(NODE_MODULES_INSTALLED) || rm -rf ./node_modules/ # robust against previous botched npm install
	NODE_ENV=development npm install
	touch $(NODE_MODULES_INSTALLED)

$(BUILD_DIR_EXISTS):
	mkdir -p $(BUILD_DIR)
	touch $(BUILD_DIR_EXISTS)

$(FONT_TARGET): $(FONT_SOURCE) $(BUILD_DIR_EXISTS)
	rm -rf $@
	cp -r $< $@

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
	$(SED_IN_PLACE) s/{VERSION}/v$(VERSION)/ $@
