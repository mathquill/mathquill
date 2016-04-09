# [MathQuill](http://mathquill.github.com)

by [Han](http://github.com/laughinghan), [Jeanine](http://github.com/jneen), and [Mary](http://github.com/stufflebear) (maintainers@mathquill.com)

MathQuill is a web formula editor designed to make typing math easy and beautiful. To view a demo, please view our [website](http://mathquill.com/). The MathQuill project is currently supported by its [partners](http://mathquill.com/partners.html). We are bound by a [Code of Conduct](http://mathquill.readthedocs.org/en/latest/Code_of_Conduct/).

MathQuill is actively developed and we're committed to getting
things running smoothly. Find a dusty corner? [Let us know.](https://github.com/mathquill/mathquill/issues) We'd love to hear from you.

<big>[<img alt="slackin.mathquill.com" src="http://slackin.mathquill.com/badge.svg" align="top">](http://slackin.mathquill.com)
[<img alt="freenode irc: #mathquill" src="https://img.shields.io/badge/%20freenode%20irc%20-%20%23mathquill%20-brightgreen.svg" align="top">](http://webchat.freenode.net/?channels=mathquill)</big>

## Getting Started

MathQuill has a simple interface. This brief example creates a MathQuill element and renders, then reads a given input:
```javascript
var htmlElement = document.getElementById('some_id');
var config = {
  handlers: {edit: myEditHandler},
  restrictMismatchedBrackets: true
};
var mathField = MQ.MathField(htmlElement, config);

mathField.latex('2^{\\frac{3}{2}}'); // Renders the given LaTeX in the MathQuill field
console.log(mathField.latex()); // Shows '2^{\frac{3}{2}}'
```

Check out our [Getting Started Guide](http://mathquill.readthedocs.org/en/latest/Getting_Started/) for setup instructions and basic MathQuill usage.

## Open-Source License

The Source Code Form of MathQuill is subject to the terms of the Mozilla Public
License, v. 2.0: [http://mozilla.org/MPL/2.0/](http://mozilla.org/MPL/2.0/)

The quick-and-dirty is you can do whatever if modifications to MathQuill are in
public GitHub forks. (Other ways to publicize modifications are also fine, as
are private use modifications. See also: [MPL 2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/))
