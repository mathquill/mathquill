# [MathQuill](http://mathquill.github.com)

by [Han][] and [Jay][].  Current development is proudly supported by [Desmos][], whose awesome graphing calculator makes extensive use of Mathquill.

[Han]: http://github.com/laughinghan
[Jay]: http://github.com/jayferd
[Desmos]: http://desmos.com/

Please note that this is a beta version, so bugs and unimplemented features
are all over the place.

## Usage

(Note: Requires [jQuery 1.4.3+](http://jquery.com).
[Google CDN-hosted copy](http://code.google.com/apis/libraries/devguide.html#jquery) recommended.)

To use MathQuill on your website, grab the latest tarball from the [downloads page][], and serve

[downloads page]: http://mathquill.com/downloads.html

* [the stylesheet](http://mathquill.github.com/mathquill.css)
* [the fonts](http://mathquill.github.com/fonts.html) in the
`font/` directory relative to `mathquill.css` (or change your copy of
`mathquill.css` to include from the right directory)
* [the script](http://mathquill.github.com/mathquill/mathquill.min.js) ([unminified](http://mathquill.github.com/mathquill/mathquill.js))

then on your webpages include the stylesheet

```html
<link rel="stylesheet" type="text/css" href="/path/to/mathquill.css">`
```

and after [jQuery](http://jquery.com), the script

```html
<script src="/path/to/mathquill.min.js"></script>
```

Then wherever you'd like to embed LaTeX math to be rendered in HTML:

```html
<span class="mathquill-embedded-latex">\frac{d}{dx}\sqrt{x}</span>
```

or have an editable math field:

```html
<span class="mathquill-editable">f(x)=?</span>
```

This is currently done by waiting for the jQuery `ready` event and searching the
document for elements with those CSS classes, so for dynamically created
elements that weren't in the document on `ready`, you will need to call our
API after inserting into the document:

```js
var el = $('<span>x^2</span>').appendTo('body');
var mathField = MathQuill.MathField(el[0]);
mathField instanceof MathQuill.MathField // => true
mathField instanceof MathQuill.EditableField // => true
mathField instanceof MathQuill // => true
```

MathQuill has to perform calculations based on computed CSS values. If you
mathquill-ify an element before inserting into the visible HTML DOM, then once
it is visible MathQuill will need to recalculate:

```js
var mathFieldSpan = $('<span>\\sqrt{2}</span>');
var mathField = MathQuill.MathField(mathFieldSpan[0]);
mathFieldSpan.appendTo(document.body);
mathField.redraw();
```

Any element that has been MathQuill-ified can be reverted:

```html
<span id="revert-me" class="mathquill-embedded-latex">
  some <code>HTML</code>
</span>
```
```js
MathQuill($('#revert-me')[0]).revert().html(); // => 'some <code>HTML</code>'
```

Manipulating the HTML DOM inside MathQuill-ified elements can break our
rendering and functionality, but we have a public API to manipulate MathQuill
things: the global `MathQuill()` function takes one argument, which jQuery must
resolve to a single HTML element, and will return a MathQuill object if that
element is a MathQuill thing, or `null` otherwise.

`MathQuill.noConflict()` resets the global `MathQuill` variable to whatever it
was before, and returns the `MathQuill` function to be used locally or set to
some other variable, _a la_ [`jQuery.noConflict()`](http://api.jquery.com/jQuery.noConflict).

`MathQuill.StaticMath()` and `MathQuill.MathField()` also take one argument that
jQuery must resolve to a single HTML element, and additionally the element must
either be not yet MathQuill-ified or a MathQuill instance of the same type. If
not yet MathQuill-ified they will MathQuill-ify the element as described above,
and in either case they will return a MathQuill object for that MathQuill
instance.

The MathQuill objects expose the following public methods to manipulate a
MathQuill instance:

* `.revert()` reverts
* `.el()` returns the root HTML element
* `.html()` returns the contents as static HTML
* `.latex()` returns the contents as LaTeX
* `.latex('a_n x^n')` will render the argument as LaTeX

Additionally, descendants of `MathQuill.EditableField` (currently only
`MathQuill.MathField`) expose:

* `.write(' - 1')` will write some LaTeX at the current cursor position
* `.cmd('\\sqrt')` will enter a LaTeX command at the current cursor position or
  with the current selection
* `.select()` selects the contents (just like [on `textarea`s][] and [on
  `input`s][])
* `.clearSelection()` clears the current selection
* `.moveTo{Left,Right,Dir}End()` move the cursor to the left/right end of the
  editable field, respectively. (The first two are implemented in terms of
  `.moveToDirEnd(dir)` where `dir` is one of `MathQuill.L` or `MathQuill.R`,
  constants obeying the contract that `MathQuill.L === -MathQuill.R` and vice
  versa.)
* `.keystroke(keys)` simulates keystrokes given a string like `"Ctrl-Home Del"`,
  a whitespace-delimited list of [key values][] with optional prefixes
* `.typedText(text)` simulates typing text, one character at a time

[on `textarea`s]: http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-48880622
[on `input`s]: http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-34677168
[one of these key values]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes

#### Global Behavior Options

These methods modify math typing behavior page-wide:
(TODO: per-field versions of these, if useful)

- `MathQuill.addAutoCommands('pi theta sqrt sum')` takes a space-delimited list
  of LaTeX control words (no backslash, letters only, min length 2), and adds
  them to the (default empty) set of "auto-commands", commands automatically
  rendered by just typing the letters outside a `LatexCommandInput`

#### Handlers/Options

`MathQuill.MathField()` can also take an options object:

```js
var L = MathQuill.L, R = MathQuill.R;
var el = $('<span>x^2</span>').appendTo('body');
MathQuill.MathField(el[0], {
  handlers: {
    edited: function(mathField) { ... },
    upOutOf: function(mathField) { ... },
    moveOutOf: function(dir, mathField) { if (dir === L) ... else ... }
  },
  spaceBehavesLikeTab: true,
  leftRightIntoCmdGoes: 'up'
});
```

If `spaceBehavesLikeTab` is true the keystrokes {Shift-,}Spacebar will behave
like {Shift-,}Tab escaping from the current block (as opposed to the default
behavior of inserting a Space character).

By default, the Left and Right keys move the cursor through all possible cursor
positions in a particular order: right into a fraction puts the cursor at the
left end of the numerator, right out of the numerator puts the cursor at the
left end of the denominator, right out of the denominator puts the cursor to the
right of the fraction; symmetrically, left into a fraction puts the cursor at
the right end of the denominator, etc. Note that right out of the numerator to
the left end of the denominator is actually leftwards (and downwards, it's
basically wrapped). If instead you want right to always go right, and left to
always go left, you can set `leftRightIntoCmdGoes` to `'up'` or `'down'` so that
left and right go up or down (respectively) into commands, e.g. `'up'` means
that left into a fraction goes up into the numerator, skipping the denominator;
symmetrically, right out of the numerator skips the denominator and puts the
cursor to the right of the fraction, which unlike the default behavior is
actually rightwards (the drawback is the denominator is always skipped, you
can't get to it with just Left and Right, you have to press Down); which is
the same behavior as the Desmos calculator. `'down'` instead means it is the
numerator that is always skipped, which is the same behavior as the Mac OS X
built-in app Grapher.

Supported handlers:
- `moveOutOf`, `deleteOutOf`, and `selectOutOf` are called with `dir` and the
  math field API object as arguments
- `upOutOf`, `downOutOf`, `enter`, and `edited` are called with just the API
  object as the argument

The `*OutOf` handlers are called when Left/Right/Up/Down/Backspace/Del/
Shift-Left/Shift-Right is pressed but the cursor is at the left/right/top/bottom
edge and so nothing happens within the math field. For example, when the cursor
is at the left edge, pressing the Left key causes the `moveOutOf` handler (if
provided) to be called with `MathQuill.L` and the math field API object as
arguments, and Backspace causes `deleteOutOf` (if provided) to be called with
`MathQuill.L` and the API object as arguments, etc.

The `enter` handler is called whenever Enter is pressed.

The `edited` handler is called when the field is edited (stuff is typed in,
deleted, written with the API, etc), and occasionally for no reason. (That is,
there's no guarantee the field has changed between calls to `edited`, but it is
guaranteed `edited` is called whenever the field does change.)

Handlers are always called directly on the `handlers` object passed in,
preserving the `this` value, so you can do stuff like:
```js
var MathList = P(function(_) {
  _.init = function() {
    this.maths = [];
    this.el = ...
  };
  _.add = function() {
    var math = MathQuill.MathField($('<span/>')[0], { handlers: this });
    $(math.el()).appendTo(this.el);
    math.i = this.maths.length;
    this.maths.push(math);
  };
  _.moveOutOf = function(dir, math) {
    var adjacentI = (dir === MathQuill.L ? math.i - 1 : math.i + 1);
    var adjacentMath = this.maths[adjacentI];
    if (adjacentMath) adjacentMath.focus().moveToDirEnd(-dir);
  };
  ...
});
```
Of course you can always ignore the last argument, like when the handlers close
over the math field:
```js
var latex = '';
var mathField = MathQuill.MathField($('#mathfield')[0], {
  handlers: {
    edited: function() { latex = mathField.latex(); },
    enter: function() { submitLatex(latex); }
  }
});
```

**A Note On Changing Colors:**

To change the foreground color, don't just set the `color`, also set
the `border-color`, because the cursor, fraction bar, and square root
overline are all borders, not text. (Example below.)

Due to technical limitations of IE8, if you support it, and want to give
a MathQuill editable a background color other than white, and support
square roots, parentheses, square brackets, or curly braces, you will
need to, in addition to of course setting the background color on the
editable itself, set it on elements with class `matrixed`, and then set
a Chroma filter on elements with class `matrixed-container`.

For example, to style as white-on-black instead of black-on-white:

    #my-math-input {
      color: white;
      border-color: white;
      background: black;
    }
    #my-math-input .matrixed {
      background: black;
    }
    #my-math-input .matrixed-container {
      filter: progid:DXImageTransform.Microsoft.Chroma(color='black');
    }

(This is because almost all math rendered by MathQuill has a transparent
background, so for them it's sufficient to set the background color on
the editable itself. The exception is, IE8 doesn't support CSS
transforms, so MathQuill uses a matrix filter to stretch parens etc,
which [anti-aliases wrongly without an opaque background][Transforms],
so MathQuill defaults to white.)

[Transforms]: http://github.com/laughinghan/mathquill/wiki/Transforms

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

## Understanding The Source Code

All the CSS is in `src/css`. Most of it's pretty straightforward, the choice of
font isn't settled, and fractions are somewhat arcane, see the Wiki pages
["Fonts"](http://github.com/laughinghan/mathquill/wiki/Fonts) and
["Fractions"](http://github.com/laughinghan/mathquill/wiki/Fractions).

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
  analogously to how [the HTML DOM][] represents a web page.
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
- `publicapi.js` defines the global `MathQuill` function, the
  `MathQuill.MathField()` etc. constructors, and the API objects returned by
  them. The constructors, and the API methods on the objects they return, call
  appropriate controller methods to initialize and manipulate math field and
  static math instances.

[the HTML DOM]: http://www.w3.org/TR/html5-author/introduction.html#a-quick-introduction-to-html

Misc.:

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

Classes are defined using [Pjs][], and the variable `_` is used by convention as
the prototype.

[pjs]: https://github.com/jayferd/pjs

`services/*.util.js` files are unimportant to the overall architecture, you can
ignore them until you have to deal with code that is using them.

## Open-Source License

[GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html)

Copyleft 2010-2012 [Han](http://github.com/laughinghan) and [Jay](http://github.com/jayferd)
