## v0.10.1: 2016-03-21

Important fix: remove `font-size: 0` on textarea (#585), fixing typing
in Chrome Canary (#540) as well as the Enter key not triggering the
`enter` handler in Webkit and Blink (#566). `transform: scale(0)` is
used instead and expected to be much more robust.

(Note: if you're coming from v0.9.x, there've been major API changes,
see the [v0.9.x → v0.10.0 Migration Guide][].)

[v0.9.x → v0.10.0 Migration Guide]: https://github.com/mathquill/mathquill/wiki/v0.9.x-%E2%86%92-v0.10.0-Migration-Guide

**new features:**
- (#544, #552, #558, #581) new symbols `\nparallel`, `\measuredangle`,
  `\odot`, `\parallelogram` (nonstandard), `\nless`, `\ngtr`, `\square`
- (#544) new commands `\overleftarrow`, `\overrightarrow`


**bugfixes:**
- (#585) fix typing in Chrome Canary, Enter key in Webkit+Blink
- (#582) fix `\degree` symbol to round-trip (rather than exporting
  `^\circ` which doesn't parse as one symbol)
- (#578) fix `.text()` to output `\cdot` as `*`
- (#529, #571, #574) fix `.text()` of fractions, spaces, variables followed
  by exponents
- (#577) fix `\triangle` symbol to match LaTeX better
- (#568) hotfix #435 order-dependence breaking clean build on Linux
- (#560) fix florin spacing still too close
- (#546) fix parsing or pasting `×` (Unicode times symbol)
- (#519/#487) fix auto-horizontal-scroll/pan on API calls
- (#528) fix #429 can't move cursor out of `TextBlock`
- (#526) fix exponentiation to export `^` not `**`
- (#525) fix Tab while there's a selection

**build system fixes:**
- (#532) add console output to show URL of local test pages

## v0.10.0: 2016-02-20

Many major changes including a total overhaul of the API (no more
auto-MathQuill-ifying of `.mathquill-editable` etc, and no more jQuery
plugin, instead global `MathQuill()` returns API objects, like jQuery
itself): See the [v0.9.x → v0.10.0 Migration Guide]
(https://github.com/mathquill/mathquill/wiki/v0.9.x-%E2%86%92-v0.10.0-Migration-Guide).

(If you already use the new global `MathQuill()`-based API from the
 `dev` branch, migrating to v0.10.0 should be just [one small change]
 (https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide)
 for you.)

**API-only changes:**
- (#336, #349, #351, #353) config options architecture
- (#308) don't auto-MathQuill-ify on jQuery `ready`
- (#297) prefix all CSS classes with `mq-`
- (#238, #272, #288, #337, #362, #459, #463, #495) kill jQuery plugin; new
  global `MathQuill()` returns API objects

**typist-facing changes:**
- (#506) delete `\caret` and `\underscore`
- (#453) incremental backspace: backspacing into a compound command like
  fraction or exponent goes left into it rather than selecting it
- (#285) render pasted text in math mode if cursor in math mode
- (5cf838d) LiveFraction (typing `/`) stops at space when expanding left
- (#264) intentional blur (like clicking outside field) clears selection
- (#262, #281, #391, #449, #509) auto-expanding, mis-matchable parens/pipes
- (#259) blue focus ring only around whole field not individual blocks
- (#258) `\sum` now comes with lower and upper limit blocks
- (#246, #248, #274, #434, #473) merge adjacent `SupSub`s into one
  command
- (#187) delete `\vector`
- (#144) Shift-Left/Right unselects back into a thing after selecting
  out of it
- (#157) stop fractions created by typing `/` at `,`/`;`/`:`

**new features:**
- (#468) add WOFF and WOFF2 font formats
- (#376, #398) add `autoSubscriptNumerals` option
- (#338) config option `sumStartsWithNEquals`
- (#321) static math instances may have `.innerFields`
- (#279) `leftRightIntoCmdGoes: 'up'/'down'`
- (#278, #407, #442) `SupSub` options to improve usability
- (#276, #410) anything focusable can be used to `substituteTextarea`
- (#263) typing `<=` and `>=` results in `\le` and `\ge`
- (#265) "autocommands": LaTeX control sequences that automatically
  render when you type the letters, without typing backslash first
- (#261, #361, #387, #404) when the math is too wide to fit in the
  field, pan/scroll horizontally
- (#247, #301, #255, #509) auto-unitalicize `sin`, `log` etc operator names
- (#245, #253) config option whether to Spacebar behaves like Tab
- (#241, #325, #425, #462) new API methods as used by Desmos
- (#191) `\class{classname}{math}` _a la_
  [MathJax](http://docs.mathjax.org/en/v2.2-latest/tex.html#html)
- (#151) `\textcolor{color}{math}`

**new build system features:**
- (#377) `OMIT_FONT_FACE=true make` omits `@font-face {...}`
- (#319) `make basic` builds stripped-down MathQuill for basic math

**bugfixes:**
- (#452) fix blinking blue cursor and autocorrect on iOS
- (#448) fix `\ddots` to be downward-rightward not upward-rightward
- (#432) fix quadratic-time fragment construction
- (#379) fix `.text()` errors when currently typing backslash command
- (#364, #367, #363, #397, #402, #417, #472) fixes to spacing and
  positioning
- (#323, #365, #409) fix LaTeX for `/`, `{`, `}` `^`, `_`, and `~`
- (99da82a) fix LaTeX parsing of `'`
- (#294, #355) fix `Cmd-Left` turns selection into typed text in Firefox
- (#296, #392) fix `f`/florin situation
- (#299) don't use reserved word `yield`
- (#284) escape non-ASCII Unicode characters in the JS source code
- (#272) fix API methods `.write()` on empty LaTeX and `.cmd()` erroring
- (#255) fix auto-spacing of `SupSub` and `PlusMinus`
- (#266) fix keyboard select after mouse select
- (#268) <code>\ </code> not `\:` as LaTeX for space
- (68c8f2b) fix resize gripper appearing sometimes in Chrome
- (6803077) fix Shift-Enter, Ctrl-Enter inputting newlines
- (f17fb95) fix potential Ctrl-C "copy" race condition
- (765dd70, #322) don't unnecessarily `stopPropagation()` mouse events
- (c1fe1ef, 9aef35f) fix up/down in an `\editable{}` in a fraction

**docs:**
- (#485) add more metadata to package.json
- (#484) fix links in README
- (#393) correctly credit co-creator @jneen
- (#283) use Mozilla Public License (MPL) instead of LGPL

**internal refactors:**
- (#303) remove STIX font files, never used them
- (#244) refactor focus/blur out into its own service
- (#240) simplify `saneKeyboardEvents()` handlers pattern
- (#233, #234, #236, #237, #239, #509) massive refactor of cursor and
- root block nonlocal responsibilities as controller and services instead
- (#195, #340) some LaTeX rendering performance fixes; separate out
  root block DOM node from container DOM node
- (#183) `Cursor::notify` framework
- (#117, #142, #186, #287) massive refactor of cursor methods to not
  assume the edit tree is double-layered

## v0.9.4: 2014-1-22

URGENT HOTFIX for cursor showing up as an ugly box in Chrome 40 (#371)

**bugfixes:**
- (#371) fix cursor showing up as an ugly box in Chrome 40
- (#230) fix selecting previously selected static math can't be copied
- (#217) fix no Array::indexOf in IE&lt;9, use RegExp::test
- (#213) fix exception on up/down while something is selected
- (#211) fix CSS typo causing no italics when there should be

**build system changes:**
- (#222 and #228) `make server` auto-rebuilds without restarting server
- (#212) use empty target trick in Makefile

**docs:**
- (#283) change license from LGPL to Mozilla Public License

## v0.9.3: 2013-11-11

**new features:**
- (#185) add `\vec`

**bugfixes:**
- (#164) displaying `NZQRC` as `\mathbb{NZQRC}` (double-struck)
- (#180) can't type >1 spaces in `RootTextBlock`s
- (#190) `$` at the end of a `TextBlock` causes errors later
- (#152) when "Select All"-ed, `.mathquill('latex')` throws

**internal refactors:**
- rename `.end` and `.endChild` both to `.ends`

**build system changes:**
- fix `make publish` to work on BSD
- (#189) replace Connect with tiny handwritten static server
- upgrade to uglifyjs2

## v0.9.2: 2013-04-02

NOTE: The hotfix for typing over selections in Safari 5.1 (#135) from
v0.9.1 had a huge bug, fixed as #166.

**feature changes:**
- (#156) stop LiveFraction at commas/colons/semicolons

**bugfixes:**
- allow angle bracket as a VanillaSymbol (thanks @fpirsch!)
- (#166) fix selecting after paste
- (#121) editing `\text{...}` created from LaTeX
- (#122) spacebar was broken in TextBlocks
- (#125) `$` in TextBlock was jumping to the end
- stretched parens not being grayed

**internal refactors:**
- Massive renaming introducing direction constants `L` and `R`, and
  directionalized methods
- Use a subclass of jQuery with directionalized methods (see `d5597e4`)

**build system changes:**
- New site-building system
- no more submodules, `npm` only

## v0.9.1: 2012-12-19

  * Started the changelog
  * Added a `make publish` script
  * Hotfix for typing over selections in Safari 5.1 (#135)
