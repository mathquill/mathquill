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

To use MathQuill on your website you need to serve

* [the stylesheet](http://mathquill.github.com/mathquill.css)
* [the fonts](http://mathquill.github.com/fonts.html) in the
`font/` directory relative to `mathquill.css` (or change your copy of
`mathquill.css` to include from the right directory)
* [the script](http://mathquill.github.com/mathquill.min.js) ([unminified](http://mathquill.github.com/mathquill.js))

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

If you want to give a MathQuill editable a background color other than
white, support IE8, and support square roots, parentheses, square
brackets, or curly braces, you will need to also set all descendants of
the MathQuill editable element with class `matrixed` to also have that
background color, like `#my-math-input .matrixed { background:
#lightblue; }`. (Almost all math rendered by MathQuill has
`background:transparent`; the exception is, IE8 doesn't support CSS
transforms, so MathQuill uses a matrix filter to stretch parens etc,
which won't anti-alias correctly without a opaque background, so
MathQuill defaults to white. For more details, see
[Transforms](http://github.com/laughinghan/mathquill/wiki/Transforms).)
If your background color is dark, you may also want to make the cursor
white with `#my-math-input .cursor { border-color: white; }` or the like.

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

## Understanding The Source Code

All the CSS is in `mathquill.css`. Most of it's pretty straightforward, the
choice of font isn't settled, and fractions are somewhat arcane, see the Wiki
pages ["Fonts"](http://github.com/laughinghan/mathquill/wiki/Fonts) and
["Fractions"](http://github.com/laughinghan/mathquill/wiki/Fractions).

All the JavaScript that you actually want to read is in `src/`, `build/` is
created when you run `make` just to contain a cat'ed and minified version of
all that.

### Overview of how things fit together:

(Just skim the logic, but do read the starred comments, definitions and method
signatures.)

In comments and internal documentation, `::` means `.prototype.`.

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

* By convention, when assigning or accessing many properties of an object,
  you can use the `_` variable to save having to type the object's name every
  time.
    - DO NOT use `with`, see
      [`with` considered harmful](http://crockford.com/with.html).
* The sugar saves typing when creating idiomatic prototypal JS classes,
  including setting `_` so you can assign methods and fields to the prototype.

`math.js` defines abstract base classes for the JS objects that make up the
virtual math DOM tree:

* The math DOM has two kinds of nodes: commands and blocks
    - blocks, like the root block, can contain any number of commands
    - commands, like `x`, `1`, `+`, `\frac`, `\sqrt` (clearly siblings in the
      tree) contain a fixed number of blocks
        + symbols like `x`, `y`, `1`, `2`, `+`, `-` are commands with 0 blocks
* All math DOM nodes are instances of `MathElement`
    - blocks are instances of `MathBlock`
    - commands are instances of `MathCommand`
        + symbols are instances of `Symbol`
* `MathFragment`s are basically 'subblocks' that encapsulate a "view" of
  multiple commands. Like a pointer to a particular command, they have access
  to nodes in the tree but aren't part of the tree.
    - `prev` and `next` seemed like a good idea at the time, they match
      `Cursor`, but `first` and `last` instead are under consideration

`cursor.js` defines the "singleton" classes for the visible blinking
cursor and highlighted selection. They are not part of the tree but have
access and point to elements in it to keep track of their location:

* The methods of `Cursor.prototype` pretty much do what they say on the tin.
  They're how the tree is supposed to traversed and modified.

`rootelements.js` defines the math DOM tree root elements, and a function
`createRoot()` that attaches event handlers to the jQuery-wrapped HTML elements:

* Some root elements can actually be in others, so rather than attaching
  handlers in the constructor, `createRoot()` is called on the actual root
  element. Except `\editable{}`s need text input event handlers that aren't
  attached to the static math containing them...it's a little messy.
* Event delegation is used in 2 ways:
  - in the HTML DOM, the root `span` element of each MathQuill thing is
    delegated all the events in it's own MathQuill thing
    + keyboard events usually end up triggering their analogue in the virtual
      DOM on the virtual cursor, which then bubble upwards
  - in the virtual math DOM, the root MathElement is delegated most of these
    virtual keyboard events
    + for example, `RootMathBlock::keydown()`
    + some special commands do intercept these events, though
* Keyboard events are very inconsistent between browsers, so `rootelements.js`
  has some complicated but very effective logic documented in the Wiki page
  "Keyboard Events".

`symbols.js` defines classes for all the symbols like `&` and `\partial`, and
adds the constructors to `CharCmds` or `LatexCmds` as used by `Cursor::write()`.

`commands.js` defines classes for all the  commands like `\frac` and `/`, and
adds the constructors to `CharCmds` or `LatexCmds`.

`publicapi.js` defines the public `jQuery::mathquill()` method and on document
ready, finds and mathquill-ifies `.mathquill-editable` and so on elements.

`outro.js` is just closing boilerplate to match that in `intro.js`.

See [the EtherPad for MathQuill on sync.in](http://sync.in/mathquill) for
the current active development discussion.

## Open-Source License

[GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html)

Copyleft 2010-2011 [Han](http://github.com/laughinghan) and [Jay](http://github.com/jayferd)
