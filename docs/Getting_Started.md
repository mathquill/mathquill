# Download and Load

Download [the latest release](https://github.com/mathquill/mathquill/releases/latest) or [build from source](Contributing/#building-and-testing).

MathQuill depends on [jQuery 1.4.3+](http://jquery.com), we recommend the [Google CDN-hosted copy](http://code.google.com/apis/libraries/devguide.html#jquery).

load MathQuill with something like (order matters):
```html
<link rel="stylesheet" href="/path/to/mathquill.css"/>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<script src="/path/to/mathquill.js"></script>
<script>
var MQ = MathQuill.getInterface(2);
</script>
```

Now you can call our [API methods](http://mathquill.readthedocs.org/en/latest/Api_Methods/) on `MQ`.

# Basic Usage

MathQuill instances are created from HTML elements. For the full list of constructors and API methods, see [API Methods](http://mathquill.readthedocs.org/en/latest/Api_Methods).

## Static Math Rendering

To statically render a formula, call [`MQ.StaticMath()`](http://mathquill.readthedocs.org/en/latest/Api_Methods/#mqstaticmathhtml_element) on an HTML element:
```html
<p>Solve <span id="problem">ax^2 + bx + c = 0</span>.</p>

<script>
  var problemSpan = document.getElementById('problem');
  MQ.StaticMath(problemSpan);
</script>
```

## Editable Math Fields

To create an editable math field, call [`MQ.MathField()`](http://mathquill.readthedocs.org/en/latest/Api_Methods/#mqmathfieldhtml_element-config) on an HTML element and, optionally, a [config options object](http://mathquill.readthedocs.org/en/latest/Config/). The following example features a math field with a handler to check the answer every time an edit may have occurred:
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

To get and set the contents of a math field, use [`mathField.latex()`](Api_Methods/#latex).

Math fields are initialized with the text that was in the span, parsed as LaTeX. This can be updated by calling [`mathField.latex(latexString)`](http://mathquill.readthedocs.org/en/latest/Api_Methods/#latexlatex_string). To programmatically type text into a math field, use [`.typedText(string)`](http://mathquill.readthedocs.org/en/latest/Api_Methods/#typedtexttext),

# Join the Community

<big>[<img alt="slackin.mathquill.com" src="http://slackin.mathquill.com/badge.svg" align="top">](http://slackin.mathquill.com)
[<img alt="freenode irc: #mathquill" src="https://img.shields.io/badge/%20freenode%20irc%20-%20%23mathquill%20-brightgreen.svg" align="top">](http://webchat.freenode.net/?channels=mathquill)</big>
