# MathField Config

## Setting Configuration

The configuration options for a given mathField has the following structure and [properties]():
```js
{
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

On initialization, pass the configuration object, structured like the one above as the second argument to `MQ.MathField(HTML_ELEMENT, CONFIG)`.

To change the options later on, use `mathField.config(NEW_CONFIG)`.

Global defaults for a page may be set with `MQ.config(NEW_CONFIG)`.

## Configuration Options

### spacesBehavesLikeTab

If `spaceBehavesLikeTab` is true the keystrokes {Shift-,}Spacebar will behave
like {Shift-,}Tab escaping from the current block (as opposed to the default
behavior of inserting a Space character).

### leftRightIntoCmdGoes

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

### restrictMismatchedBrackets

If `restrictMismatchedBrackets` is true then you can type [a,b) and [a,b), but
if you try typing `[x}` or `\langle x|`, you'll get `[{x}]` or
`\langle|x|\rangle` instead. This lets you type `(|x|+1)` normally; otherwise,
you'd get `\left( \right| x \left| + 1 \right)`.

### sumStartsWithNEquals

If `sumStartsWithNEquals` is true then when you type `\sum`, `\prod`, or
`\coprod`, the lower limit starts out with `n=`, e.g. you get the LaTeX
`\sum_{n=}^{ }`, rather than empty by default.

### supSubsRequireOperand

`supSubsRequireOperand` disables typing of superscripts and subscripts when
there's nothing to the left of the cursor to be exponentiated or subscripted.
Averts the especially confusing typo `x^^2`, which looks much like `x^2`.

### charsThatBreakOutOfSupSub

`charsThatBreakOutOfSupSub` sets the chars that when typed, "break out" of
superscripts and subscripts: for example, typing `x^2n+y` normally results in
the LaTeX `x^{2n+y}`, you have to hit Down or Tab (or Space if
`spaceBehavesLikeTab` is true) to move the cursor out of the exponent and get
the LaTeX `x^{2n}+y`; this option makes `+` "break out" of the exponent and
type what you expect. Problem is, now you can't just type `x^n+m` to get the
LaTeX `x^{n+m}`, you have to type `x^(n+m` and delete the paren or something.
(Doesn't apply to the first character in a superscript or subscript, so typing
`x^-6` still results in `x^{-6}`.)

### autoCommands

`autoCommands`, a space-delimited list of LaTeX control words (no backslash,
letters only, min length 2), defines the (default empty) set of "auto-commands",
commands automatically rendered by just typing the letters without typing a
backslash first.

### autoOperatorNames

`autoOperatorNames`, a list of the same form (space-delimited letters-only each
length>=2), and overrides the set of operator names that automatically become
non-italicized when typing the letters without typing a backslash first, like
`sin`, `log`, etc. (Defaults to [the LaTeX built-in operator names][Wikia], but
with additional trig operators like `sech`, `arcsec`, `arsinh`, etc.)

[Wikia]: http://latex.wikia.com/wiki/List_of_LaTeX_symbols#Named_operators:_sin.2C_cos.2C_etc.

### substituteTextarea

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

### Handlers

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
