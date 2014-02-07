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

    <link rel="stylesheet" type="text/css" href="/path/to/mathquill.css">`

and after [jQuery](http://jquery.com), the script

    <script src="/path/to/mathquill.min.js"></script>

Then wherever you'd like to embed LaTeX math to be rendered in HTML:

    <span class="mathquill-embedded-latex">\frac{d}{dx}\sqrt{x}</span>

or have an editable math field:

    <span class="mathquill-editable">f(x)=?</span>

This is currently done by waiting for the jQuery `ready` event and searching the
document for elements with those CSS classes, so for dynamically created
elements that weren't in the document on `ready`, you will need to call our
API after inserting into the document:

    var el = $('<span>x^2</span>').appendTo('body');
    var mathField = MathQuill.MathField(el[0]);
    mathField instanceof MathQuill.MathField // => true
    mathField instanceof MathQuill.EditableField // => true
    mathField instanceof MathQuill // => true

MathQuill has to perform calculations based on computed CSS values. If you
mathquill-ify an element before inserting into the visible HTML DOM, then once
it is visible MathQuill will need to recalculate:

    var mathFieldSpan = $('<span>\\sqrt{2}</span>');
    var mathField = MathQuill.MathField(mathFieldSpan[0]);
    mathFieldSpan.appendTo(document.body);
    mathField.redraw();

Any element that has been MathQuill-ified can be reverted:

    <span id="revert-me" class="mathquill-embedded-latex">
      some <code>HTML</code>
    </span>

    MathQuill($('#revert-me')[0]).revert().html(); // => 'some <code>HTML</code>'

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
* `.write(' - 1')` will write some LaTeX at the current cursor position
* `.cmd('\\sqrt')` will enter a LaTeX command at the current cursor position or
  with the current selection

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
[Node][http://nodejs.org/#download], so you will need to install that before
running `make`. (Once it's installed, `make` automatically does `npm install`,
installing the necessary build tools.)

- `make` builds `build/mathquill.{css,js,min.js}`
- `make dev` won't try to minify MathQuill (which can be take nonzero time)
- `make test` also doesn't minify MathQuill, but it also builds
  `mathquill.test.js`, which is used in `test/unit.html`

## Understanding The Source Code

All the CSS is in `mathquill.css`. Most of it's pretty straightforward, the
choice of font isn't settled, and fractions are somewhat arcane, see the Wiki
pages ["Fonts"](http://github.com/laughinghan/mathquill/wiki/Fonts) and
["Fractions"](http://github.com/laughinghan/mathquill/wiki/Fractions).

All the JavaScript that you actually want to read is in `src/`, `build/` is
created when you run `make` just to contain a cat'ed and minified version of
all that.

### Overview of how things fit together:

Terminology:
- The **edit tree** is a tree data structure to represent math and text,
  analogous to [the HTML DOM][]. (Old docs referred to this variously as the
  "math tree", the "fake DOM", or some combination thereof, like the
  "math DOM".)
- A **control sequence** (as used by Knuth; in the LaTeX community, commonly
  called a "macro" or "command") is a token in TeX consisting of a backslash
  and then any single character or string of letters. Does stuff, e.g.
  `\forall` prints &forall;, and `\sqrt 2` prints a radical sign connected to
  an overline over the 2.
- A **feature** is a unit or module of externally-facing functionality, exposed
  by the API or interacted with by typists. There are 2 disjoint categories of
  features:
    + A **command** is a class of node objects in the tree linked to visible
      HTML DOM nodes, like `Fraction` or `SquareRoot` or the "for all" symbol,
      &forall;. Unlike loose usage in the LaTeX community, where `\ne` and
      `\neq` (which print the same symbol, &ne;) might or might not be
      considered the same command, in the context of MathQuill they are
      considered to be different control sequences for the same command.
    + A **service** is a feature that applies to all or many commands, like
      typing, moving the cursor around, LaTeX exporting, LaTeX parsing. Note
      that each of these varies by command (you do slightly different things
      depending on the command you're typing, moving the cursor into/out of,
      or exporting as LaTeX, etc), cue polymorphism.

[the HTML DOM]: http://www.w3.org/TR/html5-author/introduction.html#a-quick-introduction-to-html

In comments and internal documentation, `::` means `.prototype.`.

Utils:

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

Classes are defined using [Pjs][], and the variable `_` is used by convention as
the prototype.

[pjs]: https://github.com/jayferd/pjs

`saneKeyboardEvents.js` normalizes cross-browser inconsistencies in keyboard
events on a textarea.

`parser.js` is the predecessor for https://github.com/jayferd/parsimmon .

Core framework:

`tree.js` defines the abstract classes for the JS objects that make up the edit tree.

* A `Node` is a node in the tree.
* A `Fragment` is a range of siblings in the tree.  This is used, for
  example, for selections.

* The edit tree has two kinds of nodes: commands and blocks
    - blocks, like the root block, can contain any number of commands
    - commands, like `x`, `1`, `+`, `\frac`, `\sqrt` (clearly siblings in the
      tree) contain a fixed number of blocks
        + symbols like `x`, `y`, `1`, `2`, `+`, `-` are commands with 0 blocks
* All edit tree nodes are instances of `MathElement`
    - blocks are instances of `MathBlock`
    - commands are instances of `MathCommand`
        + symbols are instances of `Symbol`

`cursor.js` defines the "singleton" classes for the visible blinking
cursor and highlighted selection.

* The methods on `Cursor` pretty much do what they say on the tin.
  They're how the tree is supposed to traversed and modified.

`controller.js` defines the Controller on which services are registered.

Services:

`textarea.js` creates and listens for events on a controller/MathQuill
instance's textarea.

`mouse.js` handles mouse clicking seeking where to put the cursor, mouse
selection.

`latex.js` handles latex parsing and exporting.

`exportText.js` handles exporting math in a human-readable text format.

Commands:

`math.js` defines abstract base classes for math blocks and commands.

`symbols.js` defines classes for all the symbols like `&` and `\partial`, and
adds the constructors to `CharCmds` or `LatexCmds` as used by `Cursor::write()`.

`commands.js` defines classes for all the  commands like `\frac` and `/`, and
adds the constructors to `CharCmds` or `LatexCmds`.

Finally, putting all the above code to use is `publicapi.js`, which defines the
public `jQuery::mathquill()` method and on document ready, finds and
mathquill-ifies `.mathquill-editable` and so on elements, by creating a
Controller and calling its methods to initialize MathQuill instances.

`outro.js` is just closing boilerplate to match that in `intro.js`.

## Open-Source License

[GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html)

Copyleft 2010-2012 [Han](http://github.com/laughinghan) and [Jay](http://github.com/jayferd)
