# Api Methods

To use the MathQuill API, first get the latest version of the interface:

```js
var MQ = MathQuill.getInterface(2);
```

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

## Constructors

### MQ.StaticMath(DOM_OBJECT)

Creates a non-editable MathQuill with the contents of the HTML element and returns a [static MathField object](http://mathquill.readthedocs.org/en/latest/Api_Methods/#mathfield-methods).

If the element is already a static MathField, this will return a new static Mathfield object with the same ID. If the element is a different type of MathQuill element, this will return null.

### MQ.MathField(DOM_OBJECT, CONFIG)

Creates an editable MathQuill with the contents of the HTML element and returns an [editable MathField object](http://mathquill.readthedocs.org/en/latest/Api_Methods/#editable-mathfield-methods).

If the element is already an editable MathField, this will return a new editable Mathfield object with the same ID. If the element is a different type of MathQuill element, this will return null.

### MQ(DOM_OBJECT)

`MQ` itself is a function that takes an HTML element and, if it's the root
HTML element of a static math or math field, returns an API object for it
(if not, `null`):

```js
MQ(mathFieldSpan) instanceof MQ.MathField // => true
MQ(otherSpan) // => null
```

## Comparing MathFields

### Checking Type
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

### ID
API objects for the same MathQuill instance have the same `.id`, which will
always be a unique truthy primitive value that can be used as an object key
(like an ad hoc [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) or [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)):

```js
MQ(mathFieldSpan).id === mathField.id // => true

var setOfMathFields = {};
setOfMathFields[mathField.id] = mathField;
MQ(mathFieldSpan).id in setOfMathFields // => true
staticMath.id in setOfMathFields // => false
```

### Data Object
Similarly, API objects for the same MathQuill instance share a `.data` object
(which can be used like an ad hoc [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) or [`WeakSet`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)):

```js
MQ(mathFieldSpan).data === mathField.data // => true
mathField.data.foo = 'bar';
MQ(mathFieldSpan).data.foo // => 'bar'
```

## MathField Methods

These are methods that every MathField has.

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

## Editable MathField Methods

Editable MathFields have all of the [above](http://mathquill.readthedocs.org/en/latest/Api_Methods/#mathfield-methods) methods in addition to the ones listed here.

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
