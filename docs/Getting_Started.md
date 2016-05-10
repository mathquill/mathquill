# Download and Load

Download [the latest release](https://github.com/mathquill/mathquill/releases/latest) or [build from source](Contributing.md#building-and-testing).

MathQuill depends on [jQuery 1.4.3+](http://jquery.com), we recommend the [Google CDN-hosted copy](http://code.google.com/apis/libraries/devguide.html#jquery).

Load MathQuill with something like (order matters):
```html
<link rel="stylesheet" href="/path/to/mathquill.css"/>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script src="/path/to/mathquill.js"></script>
<script>
var MQ = MathQuill.getInterface(2);
</script>
```

Now you can call our [API methods](Api_Methods.md) on `MQ`.

# Basic Usage

MathQuill instances are created from HTML elements. For the full list of constructors and API methods, see [API Methods](Api_Methods.md).

## Static Math Rendering

To statically render a formula, call [`MQ.StaticMath()`](Api_Methods.md#mqstaticmathhtml_element) on an HTML element:
```html
<p>Solve <span id="problem">ax^2 + bx + c = 0</span>.</p>

<script>
  var problemSpan = document.getElementById('problem');
  MQ.StaticMath(problemSpan);
</script>
```

## Editable Math Fields

To create an editable math field, call [`MQ.MathField()`](Api_Methods.md#mqmathfieldhtml_element-config) on an HTML element and, optionally, a [config options object](Config.md). The following example features a math field with a handler to check the answer every time an edit may have occurred:
```html
<p><span id="answer">x=</span></p>

<script>
  var answerSpan = document.getElementById('answer');
  var answerMathField = MQ.MathField(answerSpan, {
    handlers: {
      edit: function() {
        var enteredMath = answerMathField.latex(); // Get entered math in LaTeX format
        checkAnswer(enteredMath);
      }
    }
  });
</script>
```

## Get and Set Math

To get and set the contents of a math field, use [`mathField.latex()`](Api_Methods.md#latex).

Math fields are initialized with the text that was in the span, parsed as LaTeX. This can be updated by calling [`mathField.latex(latexString)`](Api_Methods.md#latexlatex_string). To programmatically type text into a math field, use [`.typedText(string)`](Api_Methods.md#typedtexttext),

# Join the Community

[<img alt="slackin.mathquill.com" src="http://slackin.mathquill.com/badge.svg" align="top">](http://slackin.mathquill.com)
(Prefer IRC? We're `#mathquill` on Freenode.)
