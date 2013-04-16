## version 0.9.2: 2012-04-2

  NOTES: the #135 hotfix from v0.9.1 had a huge bug.  This was fixed
  as #166.

  * build:
    - New site-building system
    - no more submodules, npm only

  * features:
    - (#156) stop LiveFraction at commas/colons/semicolons

  * refactors:
    - Massive renaming introducing direction constants L and R, and
      directionalized methods
    - Use a subclass of jQuery with directionalized methods (see d5597e4)

  * bugfixes:
    - allow angle bracket as a VanillaSymbol (thanks @fpirsch!)
    - (#166) fix selecting after paste
    - (#121) editing \text{...} created from LaTeX
    - (#122) spacebar was broken in TextBlocks
    - (#125) $ in TextBlock was jumping to the end
    - stretched parens not being grayed

## version 0.9.1: 2012-12-19

  * Started the changelog
  * Added a `make publish` script
  * Hotfix for typing over selections in Safari 5.1 (#135)
