# [MathQuill](http://mathquill.github.com)

by [Han][] and [Jeanine][].  Current development is proudly supported by [Desmos][], whose awesome graphing calculator makes extensive use of Mathquill.

[Han]: http://github.com/laughinghan
[Jeanine]: http://github.com/jneen
[Desmos]: http://desmos.com/

Please note that this is a beta version, so bugs and unimplemented features
are all over the place.

## Usage

(Note: Requires [jQuery 1.4.3+](http://jquery.com).
[Google CDN-hosted copy](http://code.google.com/apis/libraries/devguide.html#jquery) recommended.)

To use MathQuill on your website, grab the latest tarball from the [downloads page][], and serve

[downloads page]: http://mathquill.com/downloads.html

* [the stylesheet](http://mathquill.github.com/mathquill/mathquill.css)
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

or have an editable math textbox:

    <span class="mathquill-editable">f(x)=?</span>

Note that for dynamically created elements that weren't in the HTML DOM on
document ready, you will need to call our jQuery plugin after inserting into
the visible HTML DOM:

`$('<span>x^2</span>').appendTo('body').mathquill()` or `.mathquill('editable')`

MathQuill has to perform calculations based on computed CSS values. If you
mathquill-ify an element before inserting into the visible HTML DOM, then once
it is visible MathQuill will need to recalculate:

    $('<span>\sqrt{2}</span>').mathquill().appendTo('body').mathquill('redraw')

Any element that has been MathQuill-ified can be reverted:

    $('.mathquill-embedded-latex').mathquill('revert');

Manipulating the HTML DOM inside editable math textboxes can break MathQuill.
Currently, MathQuill only supports a limited scripting API:

* To access the LaTeX contents of a mathquill-ified element:

        $('<span>x^{-1}</span>').mathquill().mathquill('latex') === 'x^{-1}'

* To render some LaTeX in a mathquill-ified element:

        $('<span/>').mathquill().appendTo('body').mathquill('latex','a_n x^n')

* To write some LaTeX at the current cursor position:

        someMathQuillifiedElement.mathquill('write','\\frac{d}{dx}')

* To insert a LaTeX command at the current cursor position or with the current selection:

        someMathQuillifiedElement.mathquill('cmd','\\sqrt')

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
- `make dev` won't try to minify MathQuill (which can be take nonzero time)
- `make test` also doesn't minify MathQuill, but it also builds
  `mathquill.test.js`, which is used in `test/unit.html`

## Understanding The Source Code

All the CSS is in `mathquill.css`. Most of it's pretty straightforward, the
choice of font isn't settled, and fractions are somewhat arcane, see the Wiki
pages ["Fonts"](https://github.com/mathquill/mathquill/wiki/Fonts) and
["Fractions"](http://github.com/mathquill/mathquill/wiki/Fractions).

All the JavaScript that you actually want to read is in `src/`, `build/` is
created when you run `make` just to contain a cat'ed and minified version of
all that.

### Overview of how things fit together:

(Just skim the logic, but do read the starred comments, definitions and method
signatures.)

In comments and internal documentation, `::` means `.prototype.`.

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

* Classes are defined using [Pjs][], and the variable `_` is used by convention
  as the prototype.

[pjs]: https://github.com/jneen/pjs

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

`rootelements.js` defines the edit tree root elements, and a function
`createRoot()` that attaches event handlers to the jQuery-wrapped HTML elements:

* Some root elements can actually be in others, so rather than attaching
  handlers in the constructor, `createRoot()` is called on the actual root
  element. Except `\editable{}`s need text input event handlers that aren't
  attached to the static math containing them...it's a little messy.
* Event delegation is used in 2 ways:
  - in the HTML DOM, the root `span` element of each MathQuill thing is
    delegated all the events in it's own MathQuill thing
    + keyboard events usually end up triggering their analogue in the edit tree
      on the cursor, which then bubble upwards
  - in the edit tree, the root MathElement is delegated most of these
    virtual keyboard events
    + for example, `RootMathBlock::keydown()`
    + some special commands do intercept these events, though

`textarea.js` handles all the HTML DOM events necessary to emulate a textarea, using
a hidden textarea.

`symbols.js` defines classes for all the symbols like `&` and `\partial`, and
adds the constructors to `CharCmds` or `LatexCmds` as used by `Cursor::write()`.

`commands.js` defines classes for all the  commands like `\frac` and `/`, and
adds the constructors to `CharCmds` or `LatexCmds`.

`publicapi.js` defines the public `jQuery::mathquill()` method and on document
ready, finds and mathquill-ifies `.mathquill-editable` and so on elements.

`outro.js` is just closing boilerplate to match that in `intro.js`.

## Open-Source License

The Source Code Form of MathQuill is subject to the terms of the Mozilla Public
License, v. 2.0: http://mozilla.org/MPL/2.0/

The quick-and-dirty is you can do whatever if modifications to MathQuill are in
public GitHub forks.

Other ways to publicize modifications are also fine, as are private use
modifications. See also: [MPL 2.0 FAQ][]

[MPL 2.0 FAQ]: https://www.mozilla.org/en-US/MPL/2.0/FAQ/
