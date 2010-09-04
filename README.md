Please note that this is an alpha version, so bugs and unimplemented features
are all over the place.

Usage
-----

(Note: Requires [jQuery 1.4](http://jquery.com).)

All you need is a script include in your header:

`<script src="http://laughinghan.github.com/mathquill/mathquill.js">`

and wherever you'd like to have an editable math textbox:

`<span class="mathquill-editable">f(x)=?</span>`

or to convert LaTeX math to HTML:

`<span class="mathquill-embedded-latex">\frac{d}{dx}\sqrt{x}</span>`

Note that for dynamically created elements that weren't in the HTML DOM on
document ready, you will need to call our jQuery plugin after inserting into
the visible HTML DOM:

`$('<span>x^2</span>').appendTo('body').mathquill()` or `.mathquill('editable')`

MathQuill has to perform calculations based on computed CSS values. If you
mathquill-ify an element before inserting into the visible HTML DOM, then once
it is visible MathQuill will need to recalculate:

`$('<span>\sqrt{2}</span>').mathquill().appendTo('body').mathquill('redraw')`

Any element that has been MathQuill-ified can be reverted:

`$('.mathquill-embedded-latex').mathquill('revert');`

Understanding The Code
----------------------

All the CSS is in `mathquill.css`. Most of it's pretty straightforward, although
fractions and a few other things are somewhat arcane. In particular, see the
Wiki pages "Fonts" and "Fractions".

All the JavaScript that you actually want to read is in `src/`, `build/` just
contains a cat'ed (and eventually, minified) version of all that.

1. To start with, skim `baseclasses.js` to get an idea of the Math DOM.
    * Look over the structure of the Math DOM tree and the utility methods on
      the nodes in the tree.
    * Some of the initialization code is a bit obscure, don't worry about it.
2. Next are `Cursor.prototype`'s methods that deal with the DOM in `cursor.js`.
    1. First read through the tree traversal and manipulation methods
       * they pretty much just do what they say on the tin
       * you may want to take a peek at how they're called by
         `RootMathBlock.prototype.keydown()` in `rootelements.js`
         - just pay attention to calls where it's obvious what it's supposed to do,
           like `cursor.moveLeft()` when the left key is pressed
    2. Now check out how `RootMathBlock.prototype.keypress()` calls
       `Cursor.prototype.write()`
        * and how that calls `Cursor.prototype.insertNew()`
        * and what `Cursor.prototype.insertNew()` does to commands and the tree.
3. Once you've seen what the Math DOM tree is like, how to traverse and
    manipulate it, and how commands are created and inserted, you can read
    through `commands.js`
    * perhaps comparing with what `Cursor.prototype.insertNew()` does
    * as well as what the `MathCommand`'s constructor does in `baseclasses.js`

And you should be set to figure out everything else from here!

License
-------

[GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html)
