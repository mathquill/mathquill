# Api Methods

To use the MathQuill API, first get the latest version of the interface:

```js
var MQ = MathQuill.getInterface(2);
```

## Constructors

### `MQ.StaticMath(DOM_OBJECT)`

Creates a non-editable MathQuill with the contents of the HTML element and returns a [static MathField object]().

If the element is already a static MathField, this will return a new static Mathfield object with the same ID. If the element is a different type of MathQuill element, this will return null.

### `MQ.MathField(DOM_OBJECT, CONFIG)`

Creates an editable MathQuill with the contents of the HTML element and returns an [editable MathField object]().

If the element is already an editable MathField, this will return a new editable Mathfield object with the same ID. If the element is a different type of MathQuill element, this will return null.

### `MQ(DOM_OBJECT)`

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

### Data Object
Similarly, API objects for the same MathQuill instance share a `.data` object
(which can be used like an ad hoc [`WeakMap`][] or [`WeakSet`][]):

```js
MQ(mathFieldSpan).data === mathField.data // => true
mathField.data.foo = 'bar';
MQ(mathFieldSpan).data.foo // => 'bar'
```

[`WeakMap`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
[`WeakSet`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet

## MathField Methods

These are methods that every MathField has.

## Editable MathField Methods

Editable MathFields have all of the [above]() methods in addition to the ones listed here.
