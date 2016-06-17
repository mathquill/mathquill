# Setting Configuration

The configuration options object is of the following form:
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
  autoOperatorNames: 'sin cos',
  substituteTextarea: function() {
    return document.createElement('textarea');
  },
  handlers: {
    edit: function(mathField) { ... },
    upOutOf: function(mathField) { ... },
    moveOutOf: function(dir, mathField) { if (dir === MQ.L) ... else ... }
  }
}
```

You can configure an editable math field by passing an options argument as the second argument to [the constructor (`MQ.MathField(html_element, config)`)](Api_Methods.md#mqmathfieldhtml_element-config), or by [calling `.config()` on the math field (`mathField.config(new_config)`)](Api_Methods.md#confignew_config).

Global defaults may be set with [`MQ.config(global_config)`](Api_Methods.md#mqconfigconfig).



# Configuration Options

## spacesBehavesLikeTab

If `spaceBehavesLikeTab` is true the keystrokes `{Shift-,}Spacebar` will behave like `{Shift-,}Tab` escaping from the current block (as opposed to the default behavior of inserting a Space character).

The animated demo on <mathquill.com> has this behavior.

## leftRightIntoCmdGoes

This allows you to change the way the left and right keys move the cursor when there are items of different height, like fractions.

By default, the Left and Right keys move the cursor through all possible cursor positions in a particular order: right into a fraction puts the cursor at the left end of the numerator, right out of the numerator puts the cursor at the left end of the denominator, and right out of the denominator puts the cursor to the right of the fraction. Symmetrically, left into a fraction puts the cursor at the right end of the denominator, etc.

If instead you want right to always visually go right, and left to always go visually left, you can set `leftRightIntoCmdGoes` to `'up'` or `'down'` so that left and right go up or down (respectively) into commands. For example, `'up'` means that left into a fraction goes up into the numerator and right out of the numerator skips the denominator and puts the cursor to the right of the fraction. This behavior can be seen in the [Desmos calculator](https://www.desmos.com/calculator). If this property is set to `'down'` instead, the numerator is harder to navigate to, like in the Mac OS X built-in app Grapher.

## restrictMismatchedBrackets

If `restrictMismatchedBrackets` is true then you can type `[a,b)` and `(a,b]`, but if you try typing `[x}` or `\langle x|`, you'll get `[{x}]` or `\langle|x|\rangle` instead. This lets you type `(|x|+1)` normally; otherwise, you'd get `\left( \right| x \left| + 1 \right)`.

## sumStartsWithNEquals

If `sumStartsWithNEquals` is true then when you type `\sum`, `\prod`, or `\coprod`, the lower limit starts out with `n=`, e.g. you get the LaTeX `\sum_{n=}^{ }`, rather than empty by default.

## supSubsRequireOperand

`supSubsRequireOperand` disables typing of superscripts and subscripts when there's nothing to the left of the cursor to be exponentiated or subscripted. Prevents the especially confusing typo `x^^2`, which looks much like `x^2`.

## charsThatBreakOutOfSupSub

`charsThatBreakOutOfSupSub` takes a string of the chars that when typed, "break out" of superscripts and subscripts.

Normally, to get out of a superscript or subscript, a user has to navigate out of it with the directional keys, a mouse click, tab, or Space if [`spaceBehavesLikeTab`](#spacesbehavesliketab) is true. For example, typing `x^2n+y` normally results in the LaTeX `x^{2n+y}`. If you wanted to get the LaTeX `x^{2n}+y`, the user would have to manually move the cursor out of the exponent.

If this option was set to `'+-'`, `+` and `-` would "break out" of the exponent. This doesn't apply to the first character in a superscript or subscript, so typing `x^-6` still results in `x^{-6}`. The downside to setting this option is that in order to type `x^{n+m}`, a workaround like typing `x^(n+m` and then deleting the `(` is required.

## autoCommands

`autoCommands` defines the set of commands automatically rendered by just typing the letters without typing a backslash first.

This takes a string formatted as a space-delimited list of LaTeX commands. Each LaTeX command must be at least letters only with a minimum length of 2 characters.

For example, with `autoCommands` set to `'pi theta'`, the word 'pi' automatically converts to the pi symbol and the word 'theta' automatically converts to the theta symbol.

## autoOperatorNames

`autoOperatorNames` overrides the set of operator names that automatically become non-italicized when typing the letters without typing a backslash first, like `sin`, `log`, etc.

This defaults to the LaTeX built-in operator names ([Section 3.17 of the Short Math Guide](http://tinyurl.com/jm9okjc)) with additional trig operators like `sech`, `arcsec`, `arsinh`, etc. If you want some of these italicized after setting this property, you will have to add them to the list.

Just like [`autoCommands`](#autocommands) above, this takes a string formatted as a space-delimited list of LaTeX commands.

## substituteTextarea

`substituteTextarea` is a function that creates a focusable DOM element that is called when setting up a math field. Overwriting this may be useful for hacks like suppressing built-in virtual keyboards. It defaults to `<textarea autocorrect=off .../>`.

For example, [Desmos](https://www.desmos.com/calculator) substitutes `<span tabindex=0></span>` on iOS to suppress the built-in virtual keyboard in favor of a custom math keypad that calls the MathQuill API. Unfortunately there's no universal [check for a virtual keyboard](http://stackoverflow.com/q/2593139/362030) or [way to detect a touchscreen](http://www.stucox.com/blog/you-cant-detect-a-touchscreen/), and even if you could, a touchscreen ≠ virtual keyboard (Windows 8 and ChromeOS devices have both physical keyboards and touchscreens and iOS and Android devices can have Bluetooth keyboards). Desmos currently sniffs the user agent for iOS, so Bluetooth keyboards just don't work in Desmos on iOS. The tradeoffs are up to you.



# Handlers

Handlers are called after a specified event. They are called directly on the `handlers` object passed in, preserving the `this` value, so you can do stuff like:
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

It's common to just ignore the last argument, like if the handlers close over the math field:
```js
var latex = '';
var mathField = MQ.MathField($('#mathfield')[0], {
  handlers: {
    edit: function() { latex = mathField.latex(); },
    enter: function() { submitLatex(latex); }
  }
});
```

## *OutOf handlers

`.moveOutOf(direction, mathField)`, `.deleteOutOf(direction, mathField)`, `.selectOutOf(direction, mathField)`, `.upOutOf(mathField)`, `.downOutOf(mathField)`

The `*OutOf` handlers are called when a cursor movement would cause the cursor to leave the MathQuill mathField. These let you integrate cursor movement seamlessly between your code and MathQuill. For example, when the cursor is at the right edge, pressing the Right key causes the `moveOutOf` handler to be called with `MQ.R` and the math field API object. Pressing Backspace causes `deleteOutOf` to be called with `MQ.L` and the API object.

## enter(mathField)

Called whenever Enter is pressed.

## edit(mathField)

This is called when the contents of the field might have been changed. This will be called with any edit, such as something being typed, deleted, or written with the API. Note that this may be called when nothing has actually changed.

Deprecated aliases: `edited`, `reflow`.

# Changing Colors

To change the foreground color, set both `color` and the `border-color` because some MathQuill symbols are implemented with borders instead of pure text.

For example, to style as white-on-black instead of black-on-white use:

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

## Color Change Support on IE8

To support a MathQuill editable background color other than white in IE8, set the background color on both the editable mathField and on elements with class `mq-matrixed`. Then set a Chroma filter on elements with class `mq-matrixed-container`.
