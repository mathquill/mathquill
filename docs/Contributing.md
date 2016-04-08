# Contributing

## Building and Testing

To hack on MathQuill, you're gonna want to build and test the source files
you edit. In addition to `make`, MathQuill uses some build tools written on
[Node](http://nodejs.org/#download), so you will need to install that before
running `make`. (Once it's installed, `make` automatically does `npm install`,
installing the necessary build tools.)

- `make` builds `build/mathquill.{css,js,min.js}`
- `make dev` won't try to minify MathQuill (which can be annoyingly slow)
- `make test` builds `mathquill.test.js` (used by `test/unit.html`) and also
  doesn't minify
- `make basic` builds `mathquill-basic.{js,min.js,css}` and
  `font/Symbola-basic.{eot,ttf}`; serve and load them instead for a stripped-
  down version of MathQuill for basic mathematics, without advanced LaTeX
  commands. Specifically, it doesn't let you type LaTeX backslash commands
  with `\` or text blocks with `$`, and also won't render any LaTeX commands
  that can't by typed without `\`. The resulting JS is only somewhat smaller,
  but the font is like 100x smaller. (TODO: reduce full MathQuill's font size.)

## Understanding The Source Code

All the CSS is in `src/css`. Most of it's pretty straightforward, the choice of
font isn't settled, and fractions are somewhat arcane, see the Wiki pages
["Fonts"](http://github.com/mathquill/mathquill/wiki/Fonts) and
["Fractions"](http://github.com/mathquill/mathquill/wiki/Fractions).

All the JavaScript that you actually want to read is in `src/`, `build/` is
created by `make` to contain the same JS cat'ed and minified.

There's a lot of JavaScript but the big picture isn't too complicated, there's 2
thin layers sandwiching 2 broad but modularized layers:

- At the highest level, the public API is a thin wrapper around calls to:
- "services" on the "controller", which sets event listeners that call:
- methods on "commands" in the "edit tree", which call:
- tree- and cursor-manipulation methods, at the lowest level, to move the
  cursor or edit the tree or whatever.

More specifically:

(In comments and internal documentation, `::` means `.prototype.`.)

- At the lowest level, the **edit tree** of JS objects represents math and text
  analogously to how [the HTML DOM](http://www.w3.org/TR/html5-author/introduction.html#a-quick-introduction-to-html) represents a web page.
    + (Old docs variously called this the "math tree", the "fake DOM", or some
      combination thereof, like the "math DOM".)
    + `tree.js` defines base classes of objects relating to the tree.
    + `cursor.js` defines objects representing the cursor and a selection of
      math or text, with associated HTML elements.
- Interlude: a **feature** is a unit of publicly exposed functionality, either
  by the API or interacted with by typists. Following are the 2 disjoint
  categories of features.
- A **command** is a thing you can type and edit like a fraction, square root,
  or "for all" symbol, &forall;. They are implemented as a class of node objects
  in the edit tree, like `Fraction`, `SquareRoot`, or `VanillaSymbol`.
    + Each command has an associated **control sequence** (as termed by Knuth;
      in the LaTeX community, commonly called a "macro" or "command"), a token
      in TeX and LaTeX syntax consisting of a backslash then any single
      character or string of letters, like `\frac` or <code>\ </code>. Unlike
      loose usage in the LaTeX community, where `\ne` and `\neq` (which print
      the same symbol, &ne;) might or might not be considered the same command,
      in the context of MathQuill they are considered different "control
      sequences" for the same "command".
- A **service** is a feature that applies to all or many commands, like typing,
  moving the cursor around, LaTeX exporting, LaTeX parsing. Note that each of
  these varies by command (the cursor goes in a different place when moving into
  a fraction vs into a square root, they export different LaTeX, etc), cue
  polymorphism: services define methods on the controller that call methods on
  nodes in the edit tree with certain contracts, such as a controller method
  called on initialization to set listeners for keyboard events, that when the
  Left key is pressed, calls `.moveTowards` on the node just left of the cursor,
  dispatching on what kind of command the node is (`Fraction::moveTowards` and
  `SquareRoot::moveTowards` can insert the cursor in different places).
    + `controller.js` defines the base class for the **controller**, which each
      math field or static math instance has one of, and to which each service
      adds methods.
- `publicapi.js` defines the global `MathQuill.getInterface()` function, the
  `MQ.MathField()` etc. constructors, and the API objects returned by
  them. The constructors, and the API methods on the objects they return, call
  appropriate controller methods to initialize and manipulate math field and
  static math instances.

Misc.:

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

Classes are defined using [Pjs](https://github.com/jneen/pjs), and the variable `_` is used by convention as
the prototype.

`services/*.util.js` files are unimportant to the overall architecture, you can
ignore them until you have to deal with code that is using them.
