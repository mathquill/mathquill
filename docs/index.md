# [MathQuill](http://mathquill.github.com)

MathQuill is a web formula editor designed to make typing math easy and beautiful. To view a demo, check out our [website](http://mathquill.com/).

## Everything Below this still needs to be refactored

Any element that has been MathQuill-ified can be reverted:

```html
<span id="revert-me" class="mathquill-static-math">
  some <code>HTML</code>
</span>
```
```js
MQ($('#revert-me')[0]).revert().html(); // => 'some <code>HTML</code>'
```

MathQuill uses computed dimensions, so if they change (because an element was
mathquill-ified before it was in the visible HTML DOM, or the font size
changed), then you'll need to tell MathQuill to recompute:

```js
var mathFieldSpan = $('<span>\\sqrt{2}</span>');
var mathField = MQ.MathField(mathFieldSpan[0]);
mathFieldSpan.appendTo(document.body);
mathField.reflow();
```

MathQuill API objects further expose the following public methods:

* `.el()` returns the root HTML element
* `.html()` returns the contents as static HTML
* `.latex()` returns the contents as LaTeX
* `.latex('a_n x^n')` will render the argument as LaTeX

Additionally, descendants of `MQ.EditableField` (currently only `MQ.MathField`)
expose:

* `.focus()`, `.blur()` focuses or defocuses the editable field
* `.write(' - 1')` will write some LaTeX at the current cursor position
* `.cmd('\\sqrt')` will enter a LaTeX command at the current cursor position or
  with the current selection
* `.select()` selects the contents (just like [on `textarea`s][] and [on
  `input`s][])
* `.clearSelection()` clears the current selection
* `.moveTo{Left,Right,Dir}End()` move the cursor to the left/right end of the
  editable field, respectively. (The first two are implemented in terms of
  `.moveToDirEnd(dir)` where `dir` is one of `MQ.L` or `MQ.R`, constants that
  obey the contract that `MQ.L === -MQ.R` and vice versa.)
* `.keystroke(keys)` simulates keystrokes given a string like `"Ctrl-Home Del"`,
  a whitespace-delimited list of [key values][] with optional prefixes
* `.typedText(text)` simulates typing text, one character at a time
* `ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ` `.dropEmbedded(pageX, pageY, options)` insert a custom
  embedded element at the given coordinates, where `options` is an object like:

  ```js
  {
    htmlString: '<span class="custom-embed"></span>',
    text: function() { return 'custom_embed'; },
    latex: function() { return '\customEmbed'; }
  }
  ```
* `ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ` `.registerEmbed('name', function(id){return options})` allows MathQuill to parse custom embedded objects from latex, where `options` is an object like the one defined above in `.dropEmbedded`. This will parse the following latex into the embedded object you defined: `\embed{name}[id]}`

[on `textarea`s]: http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-48880622
[on `input`s]: http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-34677168
[key values]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes

MathQuill overwrites the global `MathQuill` variable when loaded. You can undo
that with `.noConflict()` (similar to [`jQuery.noConflict()`]
(http://api.jquery.com/jQuery.noConflict)):

```html
<script src="/path/to/first-mathquill.js"></script>
<script src="/path/to/second-mathquill.js"></script>
<script>
var secondMQ = MathQuill.noConflict().getInterface(2);
secondMQ.MathField(...);

var firstMQ = MathQuill.getInterface(2);
firstMQ.MathField(...);
</script>
```

(Warning: This lets different copies of MathQuill each power their own
 math fields, but using different copies on the same DOM element won't
 work. Anyway, .noConflict() is primarily to help you reduce globals.)

#### Configuration Options



**A Note On Changing Colors:**

To change the foreground color, don't just set the `color`, also set
the `border-color`, because the cursor, fraction bar, and square root
overline are all borders, not text. (Example below.)

Due to technical limitations of IE8, if you support it, and want to give
a MathQuill editable a background color other than white, and support
square roots, parentheses, square brackets, or curly braces, you will
need to, in addition to of course setting the background color on the
editable itself, set it on elements with class `mq-matrixed`, and then set
a Chroma filter on elements with class `mq-matrixed-container`.

For example, to style as white-on-black instead of black-on-white:

    #my-math-input {
      color: white;
      border-color: white;
      background: black;
    }
    #my-math-input .mq-matrixed {
      background: black;
    }
    #my-math-input .mq-matrixed-container {
      filter: progid:DXImageTransform.Microsoft.Chroma(color='black');
    }

(This is because almost all math rendered by MathQuill has a transparent
background, so for them it's sufficient to set the background color on
the editable itself. The exception is, IE8 doesn't support CSS
transforms, so MathQuill uses a matrix filter to stretch parens etc,
which [anti-aliases wrongly without an opaque background][Transforms],
so MathQuill defaults to white.)

[Transforms]: http://github.com/mathquill/mathquill/wiki/Transforms

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
- `publicapi.js` defines the global `MathQuill.getInterface()` function, the
  `MQ.MathField()` etc. constructors, and the API objects returned by
  them. The constructors, and the API methods on the objects they return, call
  appropriate controller methods to initialize and manipulate math field and
  static math instances.

[the HTML DOM]: http://www.w3.org/TR/html5-author/introduction.html#a-quick-introduction-to-html

Misc.:

`intro.js` defines some simple sugar for the idiomatic JS classes used
throughout MathQuill, plus some globals and opening boilerplate.

Classes are defined using [Pjs][], and the variable `_` is used by convention as
the prototype.

[pjs]: https://github.com/jneen/pjs

`services/*.util.js` files are unimportant to the overall architecture, you can
ignore them until you have to deal with code that is using them.
