# Building from Source

Install [Node](http://nodejs.org/#download) if needed. Then run `make`. This installs all of the needed dependencies and creates the full build folder.

For developing on MathQuill, run `make dev`. This will skip minifying MathQuill, which can be annoyingly slow.

## Building a Smaller MathQuill

`make basic` builds a stripped-down version of MathQuill for basic mathematics, without advanced LaTeX commands. This version doesn't allow typed LaTeX backslash commands with `\` or text blocks with `$`, and also won't render any LaTeX commands that can't by typed without `\`. This version of MathQuill's JS is only somewhat smaller, but the font is like 100x smaller.

To run this smaller version, serve and load `mathquill-basic.{js,min.js,css}` and `font/Symbola-basic.{eot,ttf}` instead.

# Testing

Run `make test`, which builds `mathquill.test.js`. Open `test/unit.html` in your browser to see the result of the unit tests. Open `test/visual.html` to see how a variety of expressions are rendering on your branch.

# Understanding The Source Code

All the JavaScript that you actually want to read is in `src/`. `build/` is created by `make` to contain the same JS concatenated and minified.

All the CSS is in `src/css`. The choice of font isn't settled, and fractions are somewhat arcane, see the Wiki pages ["Fonts"](http://github.com/mathquill/mathquill/wiki/Fonts) and ["Fractions"](http://github.com/mathquill/mathquill/wiki/Fractions).

## Architecture

There's 2 thin layers sandwiching 2 broad, modularized layers. At the highest level, the public API is a thin wrapper around calls to [services](#service) on the controller. These set event listeners that call methods on [commands](#command) in the [edit tree](#edit-tree). Those commands call tree and cursor manipulation methods to do actions like move the cursor or edit the tree.

## Edit Tree

At the lowest level, the **edit tree** of JS objects represents math and text analogously to how [the HTML DOM](http://www.w3.org/TR/html5-author/introduction.html#a-quick-introduction-to-html) represents a web page.

[`tree.js`](https://github.com/mathquill/mathquill/blob/master/src/tree.js) defines base classes of objects relating to the tree.

[`cursor.js`](https://github.com/mathquill/mathquill/blob/master/src/cursor.js) defines objects representing the cursor and a selection of math or text, with associated HTML elements.

Old docs called this the "math tree", the "fake DOM", or some combination thereof, like the "math DOM".

## Command

A **command** is a thing a user can type and edit like a fraction, square root, or "for all" symbol, &forall;. They are implemented as a class of node objects in the edit tree, like `Fraction`, `SquareRoot`, or `VanillaSymbol`.

Each command has an associated **control sequence** (commonly called a "macro" or "command"). This is a token in TeX and LaTeX syntax consisting of a backslash then any single character or string of letters, like `\frac` or <code>\ </code>. Unlike loose usage in the LaTeX community, where `\ne` and `\neq` might or might not be considered the same command, in the context of MathQuill they are considered different "control sequences" for the same "command".

## Service

A **service** is a feature that applies to all or many actions, such as typing, moving the cursor around, LaTeX exporting, or LaTeX parsing. Each of these actions vary by command. For example, the cursor goes in a different place when moving into a fraction vs into a square root and they each export different LaTeX.

Services define methods on the controller that call methods on nodes in the edit tree with certain contracts, such as a controller method called on initialization to set listeners for keyboard events, that when the Left key is pressed, calls `.moveTowards` on the node just left of the cursor, dispatching on what kind of command the node is (`Fraction::moveTowards` and `SquareRoot::moveTowards` can insert the cursor in different places).

[`controller.js`](https://github.com/mathquill/mathquill/blob/master/src/controller.js) defines the base class for the **controller**, which each math field or static math instance has one of, and to which each service adds methods.

## API

[`publicapi.js`](https://github.com/mathquill/mathquill/blob/master/src/publicapi.js) defines the global `MathQuill.getInterface()` function, the mathField constructors, and the API objects returned by them. The constructors, and the API methods on the objects they return, call appropriate controller methods to initialize and manipulate math field and static math instances.

## Other Components

[`services/*.util.js`](https://github.com/mathquill/mathquill/tree/master/src/services) files are unimportant to the overall architecture. You can largely ignore them until you have to deal with code that is using them.

[`intro.js`](https://github.com/mathquill/mathquill/blob/master/src/intro.js) defines some simple sugar for the idiomatic JS classes used throughout MathQuill, plus some globals and opening boilerplate.

## Conventions

Classes are defined using [Pjs](https://github.com/jneen/pjs), and the variable `_` is used by convention as the prototype.

In comments and internal documentation, `::` means `.prototype.`.
