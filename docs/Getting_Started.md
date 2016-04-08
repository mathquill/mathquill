# Getting Started

## Download and Load

Download [the latest release](https://github.com/mathquill/mathquill/releases/latest).
MathQuill depends on [jQuery 1.4.3+](http://jquery.com) and we recommend that you use the [Google CDN-hosted copy](http://code.google.com/apis/libraries/devguide.html#jquery).

Then you can load MathQuill with something like (order matters):
```html
<link rel="stylesheet" href="/path/to/mathquill.css"/>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script src="/path/to/mathquill.js"></script>
```

To use the MathQuill API, load it with:
```javascript
var MQ = MathQuill.getInterface(2);
```

All [API methods](http://mathquill.readthedocs.org/en/latest/Api_Methods/) will be called on `MQ`.

You can also [build from the source code]().

## Basic Usage

MathQuill instances can be created on DOM objects. For the full list of constructors and API methods, see [API Methods](http://mathquill.readthedocs.org/en/latest/Api_Methods).

The below examples assume that MathQuill has been properly loaded and exposed as `MQ` as shown [above](http://mathquill.readthedocs.org/en/latest/Getting_Started/#download-and-load).

### Render Static Math

Call `MQ.StaticMath` on the DOM object.
```html
<p>Solve <span id="problem">ax^2 + bx + c = 0</span></p>

<script>
  var problemSpan = document.getElementById('#problem');
  MQ.StaticMath(problemSpan);
</script>
```

### Editable Math

To create an editable math field, call `MQ.MathField` with the dom object and the [config](http://mathquill.readthedocs.org/en/latest/Config/). The following example shows a mathfield created on the answer span with a handler to check the answer every time an edit may occur.
```html
<p><span id="answer">x=</span></p>

<script>
  var answerDomObject = document.getElementById('#answer');
  var answerMathField = MQ.MathField(answerDomObject, {
    handlers: {
      edit: function() {
        var enteredMath = answerMathField.latex() // Retreive entered math in LaTeX format
        checkAnswer(enteredMath);
      }
    }
  });
</script>
```

The recommended way to retrieve and store the contents of the math field is to call `mathField.latex()`.
