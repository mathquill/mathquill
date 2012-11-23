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

```html
<link rel="stylesheet" type="text/css" href="/path/to/mathquill.css">`
```

and after [jQuery](http://jquery.com), the script

```html
<script src="/path/to/mathquill.min.js"></script>
```

Then wherever you'd like to embed LaTeX math to be rendered in HTML:

```html
<span class="mathquill-static-math">\frac{d}{dx}\sqrt{x}</span>
```

or have an editable math field:

```html
<span class="mathquill-math-field">f(x)=?</span>
```

This is done by waiting for the jQuery `ready` event and searching the document
for elements with those CSS classes, so for dynamically created elements that
weren't in the document on `ready`, you will need to call our public API after
inserting into the visible document:

```js
var el = $('<span>x^2</span>').appendTo('body');
var editableMath = MathQuill.MathField(el);
editableMath instanceof MathQuill.MathField; // => true
editableMath instanceof MathQuill; // => true
```

Note that if during MathQuill-ification the element isn't in the visible HTML
DOM, then you may need to call `.redraw()` on our public API once it is visible
so that MathQuill can perform calculations based on computed CSS values:

```js
var editableMath = MathQuill.MathField('<span>\\sqrt{2}</span>');
editableMath.jQ().appendTo('body');
editableMath.redraw();
```

Any element that has been MathQuill-ified can be reverted:

```html
<span id="revert-me" class="mathquill-static-math">some <code>HTML</code></span>
```
```js
var math = MathQuill('#revert-me');
math.revert().html(); // => 'some <code>HTML</code>'
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
* `.jQ()` returns a jQuery object wrapping the root HTML element
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

If you hack on MathQuill, you're gonna want to build and test the source files
you edit. In addition to `make`, MathQuill uses some build tools written on
[Node][]. With the [Node Package Manager][npm] that comes with recent versions
of it, just run

    npm install

from the root directory of the repo and `make` will start working.
- `make` builds `build/mathquill.{css,js,min.js}`
- `make dev` won't try to minify MathQuill (which can be take nonzero time)
- `make test` also doesn't minify MathQuill, but it also builds
  `mathquill.test.js`, which is used in `test/unit.html`

[Node]: http://nodejs.org/#download
[npm]: http://npmjs.org

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
