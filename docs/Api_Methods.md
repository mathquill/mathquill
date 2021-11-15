# API Methods

To use the MathQuill API, first get the latest version of the interface:

```js
var MQ = MathQuill.getInterface(2);
```

By default, MathQuill overwrites the global `MathQuill` variable when loaded. If you do not want this behavior, you can use `.noConflict()` ([similar to `jQuery.noConflict()`](http://api.jquery.com/jQuery.noConflict)):

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

This lets different copies of MathQuill each power their own math fields, but using different copies on the same DOM element won't work. `.noConflict()` is primarily intended to help you reduce globals.



# Constructors

## MQ.StaticMath(html_element)

Creates a non-editable MathQuill initialized with the contents of the HTML element and returns a [StaticMath object](#mathquill-base-methods).

If the given element is already a static math instance, this will return a new StaticMath object with the same `.id`. If the element is a different type of MathQuill, this will return `null`.

## MQ.MathField(html_element, [ config ])

Creates an editable MathQuill initialized with the contents of the HTML element and returns a [MathField object](#editable-mathfield-methods).

If the given element is already an editable math field, this will return a new editable MathField object with the same `.id`. If the element is a different type of MathQuill, this will return `null`.

## \MathQuillMathField LaTeX command

`\MathQuillMathField` can be used to embed editable math fields inside static math, like:

```html
<span id="fill-in-the-blank">\sqrt{ \MathQuillMathField{x}^2 + \MathQuillMathField{y}^2 }</span>
<script>
  var fillInTheBlank = MQ.StaticMath(document.getElementById('fill-in-the-blank'));
  fillInTheBlank.innerFields[0].latex() // => 'x'
  fillInTheBlank.innerFields[1].latex() // => 'y'
</script>
```

As you can see, they can be accessed on the StaticMath object via `.innerFields`.

## MQ(html_element)

`MQ` itself is a function that takes an HTML element and, if it's the root
HTML element of a static math or math field, returns an API object for it
(if not, `null`):

```js
MQ(mathFieldSpan) instanceof MQ.MathField // => true
MQ(otherSpan) // => null
```

## MQ.config(config)

Updates the global [configuration options](Config.md) (which can be overridden on a per-field basis).



# Comparing MathFields

## Checking Type
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

## Comparing IDs
API objects for the same MathQuill instance have the same `.id`, which will always be a unique truthy primitive value that can be used as an object key (like an ad hoc [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) or [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)):

```js
MQ(mathFieldSpan).id === mathField.id // => true

var setOfMathFields = {};
setOfMathFields[mathField.id] = mathField;
MQ(mathFieldSpan).id in setOfMathFields // => true
staticMath.id in setOfMathFields // => false
```

## Data Object
Similarly, API objects for the same MathQuill instance share a `.data` object (which can be used like an ad hoc [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) or [`WeakSet`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)):

```js
MQ(mathFieldSpan).data === mathField.data // => true
mathField.data.foo = 'bar';
MQ(mathFieldSpan).data.foo // => 'bar'
```



# MathQuill base methods

The following are methods that every MathQuill object has. These are the only methods that static math instances have and a subset of the methods that editable fields have.

## .revert()

Any element that has been turned into a MathQuill instance can be reverted:
```html
<span id="revert-me" class="mathquill-static-math">
  some <code>HTML</code>
</span>
```
```js
mathfield.revert().html(); // => 'some <code>HTML</code>'
```

## .reflow()

MathQuill uses computed dimensions, so if they change (because an element was mathquill-ified before it was in the visible HTML DOM, or the font size changed), then you'll need to tell MathQuill to recompute:

```js
var mathFieldSpan = $('<span>\\sqrt{2}</span>');
var mathField = MQ.MathField(mathFieldSpan[0]);
mathFieldSpan.appendTo(document.body);
mathField.reflow();
```

## .el()

Returns the root HTML element.

## .latex()

Returns the contents as LaTeX.

## .latex(latex_string)

This will render the argument as LaTeX in the MathQuill instance.



# Editable MathField methods

Editable math fields have all of the [above](#mathquill-base-methods) methods in addition to the ones listed here.

## .focus()

Puts the focus on the editable field.

## .blur()

Removes focus from the editable field.

## .write(latex_string)

Write the given LaTeX at the current cursor position. If the cursor does not have focus, writes to last position the cursor occupied in the editable field.

```javascript
mathField.write(' - 1'); // writes ' - 1' to mathField at the cursor position
```

## .cmd(latex_string)

Enter a LaTeX command at the current cursor position or with the current selection. If the cursor does not have focus, it writes it to last position the cursor occupied in the editable field.

```javascript
mathField.cmd('\\sqrt'); // writes a square root command at the cursor position
```

## .select()

Selects the contents (just like [on `textarea`s](http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-48880622) and [on `input`s](http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-34677168)).

## .clearSelection()

Clears the selection.

## .moveToLeftEnd(), .moveToRightEnd()

Move the cursor to the left/right end of the editable field, respectively. These are shorthand for [`.moveToDirEnd(L/R)`](#movetodirenddirection), respectively.

## .moveToDirEnd(direction)

Moves the cursor to the end of the mathfield in the direction specified. The direction can be one of `MQ.L` or `MQ.R`. These are constants, where `MQ.L === -MQ.R` and vice versa. This function may be easier to use than [moveToLeftEnd or moveToRightEnd](#movetoleftend-movetorightend) if used in the [`moveOutOf` handler](Config.md#outof-handlers).

```javascript
var config = {
  handlers: {
    moveOutOf: function(direction) {
      nextMathFieldOver.movetoDirEnd(-direction);
    }
  }
});
```

## .keystroke(keys)

Simulates keystrokes given a string like `"Ctrl-Home Del"`, a whitespace-delimited list of [key inputs](http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes) with optional prefixes.

```javascript
mathField.keystroke('Shift-Left'); // Selects character before the current cursor position
```

## .typedText(text)

Simulates typing text, one character at a time from where the cursor currently is. This is supposed to be identical to what would happen if a user were typing the text in.

```javascript
// Types part of the demo from mathquill.com without delays between keystrokes
mathField.typedText('x=-b\\pm \\sqrt b^2 -4ac');
```

## .setAriaLabel(ariaLabel)

Specify an [ARIA label][`aria-label`] for this field, for screen readers. The actual [`aria-label`] includes this label followed by the math content of the field as speech. Default: `'Math Input'`

## .getAriaLabel()

Returns the [ARIA label][`aria-label`] for this field, for screen readers. If no ARIA label has been specified, `'Math Input'` is returned.

## .setAriaPostLabel(ariaPostLabel, timeout)

Specify a suffix to be appended to the [ARIA label][`aria-label`], after the math content of the field. Default: `''` (empty string)

If a timeout (in ms) is supplied, and the math field has keyboard focus when the time has elapsed, an ARIA alert will fire which will cause a screen reader to read the content of the field along with the ARIA post-label. This is useful if the post-label contains an evaluation, error message, or other text that the user needs to know about.

## .getAriaPostLabel()

Returns the suffix to be appended to the [ARIA label][`aria-label`], after the math content of the field. If no ARIA post-label has been specified, `''` (empty string) is returned.

[`aria-label`]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute

## .config(new_config)

Changes the [configuration](Config.md) of just this math field.

## .dropEmbedded(pageX, pageY, options) **[ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ](#note-on-experimental-features)**

Insert a custom embedded element at the given coordinates, where `options` is an object like:
```js
{
  htmlString: '<span class="custom-embed"></span>',
  text: function() { return 'custom_embed'; },
  latex: function() { return '\\customEmbed'; }
}
```

## .registerEmbed('name', function(id){ return options; }) **[ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ](#note-on-experimental-features)**

Allows MathQuill to parse custom embedded objects from latex, where `options` is an object like the one defined above in `.dropEmbedded()`. This will parse the following latex into the embedded object you defined: `\embed{name}[id]}`.

## Note on Experimental Features

Methods marked as experimental may be altered drastically or removed in future versions. They may also receive less maintenance than other non-experimental features.

# Inner MathField methods

Inner math fields have all of the [above](#editable-mathfield-methods) methods in addition to the ones listed here.

## makeStatic()

Converts the editable inner field into a static one.

## makeEditable()

Converts the static inner field into an editable one.
