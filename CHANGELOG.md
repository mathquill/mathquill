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
