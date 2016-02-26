# [MathQuill](http://mathquill.github.com)

by [Han][], [Jeanine][], and [Mary][] (maintainers@mathquill.com)

[Han]: http://github.com/laughinghan
[Jeanine]: http://github.com/jneen
[Mary]: http://github.com/stufflebear

Good news! We've resumed active development and we're committed to getting
things running smoothly. Find a dusty corner? Let us know in [Slack][]!
(Prefer IRC? We're #mathquill on Freenode.)

[Slack]: http://slackin.mathquill.com

## Usage

Just load MathQuill and call our constructors on some HTML element DOM objects,
for example:

```html
<link rel="stylesheet" href="/path/to/mathquill.css"/>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script src="/path/to/mathquill.js"></script>

<p>
  Solve <span id="problem">ax^2 + bx + c = 0</span>:
  <span id="answer">x=</span>
</p>

<script>
  var MQ = MathQuill.getInterface(2);
  MQ.StaticMath($('#problem')[0]);
  var answer = MQ.MathField($('#answer')[0], {
    handlers: {
      edit: function() {
        checkAnswer(answer.latex());
      }
    }
  });
</script>
```

To load MathQuill,
- [jQuery 1.4.3+](http://jquery.com) has to be loaded before `mathquill.js`
  ([Google CDN-hosted copy][] recommended)
- the fonts should be served from the `font/` directory relative to
  `mathquill.css` (unless you'd rather change where your copy of `mathquill.css`
  includes them from), which is already the case if you just:
- download and serve [the latest release][].

[Google CDN-hosted copy]: http://code.google.com/apis/libraries/devguide.html#jquery
[the latest release]: https://github.com/mathquill/mathquill/releases/latest

To use the MathQuill API, first get the latest version of the interface:

```js
var MQ = MathQuill.getInterface(2);
```

Now you can call `MQ.StaticMath()` or `MQ.MathField()`, which MathQuill-ify
an HTML element and return an API object. If the element had already been
MathQuill-ified into the same kind, return that kind of API object (if
different kind or not an HTML element, `null`). Note that it always returns
either an instance of itself, or `null`.

```js
var staticMath = MQ.StaticMath(staticMathSpan);
mathField instanceof MQ.StaticMath // => true
mathField instanceof MQ // => true
mathField instanceof MathQuill // => true

var mathField = MQ.MathField(mathFieldSpan);
mathField instanceof MQ.MathField // => true
mathField instanceof MQ.EditableField // => true
mathField instanceof MQ // => true
mathField instanceof MathQuill // => true
```

`MQ` itself is a function that takes an HTML element and, if it's the root
HTML element of a static math or math field, returns an API object for it
(if not, `null`):

```js
MQ(mathFieldSpan) instanceof MQ.MathField // => true
MQ(otherSpan) // => null
```

API objects for the same MathQuill instance have the same `.id`, which will
always be a unique truthy primitive value that can be used as an object key
(like an ad hoc [`Map`][] or [`Set`][]):

```js
MQ(mathFieldSpan).id === mathField.id // => true

var setOfMathFields = {};
setOfMathFields[mathField.id] = mathField;
MQ(mathFieldSpan).id in setOfMathFields // => true
staticMath.id in setOfMathFields // => false
```

[`Map`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[`Set`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

Similarly, API objects for the same MathQuill instance share a `.data` object
(which can be used like an ad hoc [`WeakMap`][] or [`WeakSet`][]):

```js
MQ(mathFieldSpan).data === mathField.data // => true
mathField.data.foo = 'bar';
MQ(mathFieldSpan).data.foo // => 'bar'
```

[`WeakMap`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[`WeakSet`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet

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

`MQ.MathField()` can also take an options object:

```js
var el = $('<span>x^2</span>').appendTo('body');
var mathField = MQ.MathField(el[0], {
  spaceBehavesLikeTab: true,
  leftRightIntoCmdGoes: 'up',
  restrictMismatchedBrackets: true,
  sumStartsWithNEquals: true,
  supSubsRequireOperand: true,
  charsThatBreakOutOfSupSub: '+-=<>',
  autoSubscriptNumerals: true,
  autoCommands: 'pi theta sqrt sum',
  autoOperatorNames: 'sin cos etc',
  substituteTextarea: function() {
    return document.createElement('textarea');
  },
  handlers: {
    edit: function(mathField) { ... },
    upOutOf: function(mathField) { ... },
    moveOutOf: function(dir, mathField) { if (dir === MQ.L) ... else ... }
  }
});
```

To change `mathField`'s options, the `.config({ ... })` method takes an options
object in the same format.

Global defaults for a page may be set with `MQ.config({ ... })`.

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

If `restrictMismatchedBrackets` is true then you can type [a,b) and [a,b), but
if you try typing `[x}` or `\langle x|`, you'll get `[{x}]` or
`\langle|x|\rangle` instead. This lets you type `(|x|+1)` normally; otherwise,
you'd get `\left( \right| x \left| + 1 \right)`.

If `sumStartsWithNEquals` is true then when you type `\sum`, `\prod`, or
`\coprod`, the lower limit starts out with `n=`, e.g. you get the LaTeX
`\sum_{n=}^{ }`, rather than empty by default.

`supSubsRequireOperand` disables typing of superscripts and subscripts when
there's nothing to the left of the cursor to be exponentiated or subscripted.
Averts the especially confusing typo `x^^2`, which looks much like `x^2`.

`charsThatBreakOutOfSupSub` sets the chars that when typed, "break out" of
superscripts and subscripts: for example, typing `x^2n+y` normally results in
the LaTeX `x^{2n+y}`, you have to hit Down or Tab (or Space if
`spaceBehavesLikeTab` is true) to move the cursor out of the exponent and get
the LaTeX `x^{2n}+y`; this option makes `+` "break out" of the exponent and
type what you expect. Problem is, now you can't just type `x^n+m` to get the
LaTeX `x^{n+m}`, you have to type `x^(n+m` and delete the paren or something.
(Doesn't apply to the first character in a superscript or subscript, so typing
`x^-6` still results in `x^{-6}`.)

`autoCommands`, a space-delimited list of LaTeX control words (no backslash,
letters only, min length 2), defines the (default empty) set of "auto-commands",
commands automatically rendered by just typing the letters without typing a
backslash first.

`autoOperatorNames`, a list of the same form (space-delimited letters-only each
length>=2), and overrides the set of operator names that automatically become
non-italicized when typing the letters without typing a backslash first, like
`sin`, `log`, etc. (Defaults to [the LaTeX built-in operator names][Wikia], but
with additional trig operators like `sech`, `arcsec`, `arsinh`, etc.)

[Wikia]: http://latex.wikia.com/wiki/List_of_LaTeX_symbols#Named_operators:_sin.2C_cos.2C_etc.

`substituteTextarea`, a function that creates a focusable DOM element, called
when setting up a math field. It defaults to `<textarea autocorrect=off .../>`,
but for example, Desmos substitutes `<span tabindex=0></span>` on iOS to
suppress the built-in virtual keyboard in favor of a custom math keypad that
calls the MathQuill API. Unfortunately there's no universal [check for a virtual
keyboard][StackOverflow], you can't even [detect a touchscreen][stucox] (notably
[Modernizr gave up][Modernizr]) and even if you could, Windows 8 and ChromeOS
devices have both physical keyboards and touchscreens and you can connect
physical keyboards to iOS and Android devices with Bluetooth, so touchscreen !=
virtual keyboard. Desmos currently sniffs the user agent for iOS, so Bluetooth
keyboards just don't work in Desmos on iOS, the tradeoffs are up to you.

[StackOverflow]: http://stackoverflow.com/q/2593139/362030
[stucox]: http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
[Modernizr]: https://github.com/Modernizr/Modernizr/issues/548

Supported handlers:
- `moveOutOf`, `deleteOutOf`, and `selectOutOf` are called with `dir` and the
  math field API object as arguments
- `upOutOf`, `downOutOf`, `enter`, and `edit` are called with just the API
  object as the argument

The `*OutOf` handlers are called when Left/Right/Up/Down/Backspace/Del/
Shift-Left/Shift-Right is pressed but the cursor is at the left/right/top/bottom
edge and so nothing happens within the math field. For example, when the cursor
is at the left edge, pressing the Left key causes the `moveOutOf` handler (if
provided) to be called with `MQ.L` and the math field API object as arguments,
and Backspace causes `deleteOutOf` (if provided) to be called with `MQ.L` and
the API object as arguments, etc.

The `enter` handler is called whenever Enter is pressed.

The `edit` handler is called when the contents of the field might have been
changed by stuff being typed, or deleted, or written with the API, etc.
(Deprecated aliases: `edited`, `reflow`.)

Handlers are always called directly on the `handlers` object passed in,
preserving the `this` value, so you can do stuff like:
```js
var MathList = P(function(_) {
  _.init = function() {
    this.maths = [];
    this.el = ...
  };
  _.add = function() {
    var math = MQ.MathField($('<span/>')[0], { handlers: this });
    $(math.el()).appendTo(this.el);
    math.data.i = this.maths.length;
    this.maths.push(math);
  };
  _.moveOutOf = function(dir, math) {
    var adjacentI = (dir === MQ.L ? math.data.i - 1 : math.data.i + 1);
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
var mathField = MQ.MathField($('#mathfield')[0], {
  handlers: {
    edit: function() { latex = mathField.latex(); },
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

## Open-Source License

The Source Code Form of MathQuill is subject to the terms of the Mozilla Public
License, v. 2.0: http://mozilla.org/MPL/2.0/

The quick-and-dirty is you can do whatever if modifications to MathQuill are in
public GitHub forks.

Other ways to publicize modifications are also fine, as are private use
modifications. See also: [MPL 2.0 FAQ][]

[MPL 2.0 FAQ]: https://www.mozilla.org/en-US/MPL/2.0/FAQ/
