Please note that this is an alpha version, so bugs and unimplemented features
are all over the place.

Usage
-----

(Note: Requires [jQuery 1.4+](http://jquery.com).)

You just need to download the
[stylesheet](http://laughinghan.github.com/mathquill/mathquill.css) and the
[script](http://laughinghan.github.com/mathquill/mathquill.js), include the
stylesheet in the head:

    <link rel="stylesheet" type="text/css" href="/path/to/mathquill.css">

and include the script somewhere after including [jQuery](http://jquery.com):

    <script src="/path/to/mathquill.js"></script>

Then wherever you'd like to embed LaTeX math to be rendered in HTML:

    <span class="mathquill-embedded-latex">\frac{d}{dx}\sqrt{x}</span>

or have an editable math textbox:

    <span class="mathquill-editable">f(x)=?</span>

Note that for dynamically created elements that weren't in the HTML DOM on
document ready, you will need to call our jQuery plugin after inserting into
the visible HTML DOM:

`$('<span>x^2</span>').appendTo('body').mathquill()` or `.mathquill('editable')`

MathQuill has to perform calculations based on computed CSS values. If you
mathquill-ify an element before inserting into the visible HTML DOM, then once
it is visible MathQuill will need to recalculate:

    $('<span>\sqrt{2}</span>').mathquill().appendTo('body').mathquill('redraw')

Any element that has been MathQuill-ified can be reverted:

    $('.mathquill-embedded-latex').mathquill('revert');

Manipulating the HTML DOM inside editable math textboxes can break MathQuill.
Currently, MathQuill only supports a limited scripting API:

* To access the LaTeX contents of a mathquill-ified element:

    $('<span>x^{-1}</span>').mathquill().mathquill('latex') === 'x^{-1}'

* To render some LaTeX in a mathquill-ified element:

    $('<span></span>').mathquill().appendTo('body').mathquill('latex','a_n x^n')

Understanding The Source Code
-----------------------------

All the CSS is in `mathquill.css`. Most of it's pretty straightforward, although
fractions and a few other things are somewhat arcane. In particular, see the
Wiki pages "Fonts", "Fractions", and "Keyboard Events".

All the JavaScript that you actually want to read is in `src/`, `build/` just
contains a cat'ed (and eventually, minified) version of all that.

1. First, skim `baseclasses.js` to get an idea of the virtual "math DOM".
    * Look over the structure of the virtual DOM tree and the utility methods on
      the nodes in the tree.
    * Some of the initialization code is a bit obscure, don't worry about it.
2. Next is how the virtual cursor deals with the DOM in `cursor.js`.
    1. Start by reading through the tree traversal and manipulation methods
       * they pretty much just do what they say on the tin
       * you may want to take a peek at how they're called by
         `RootMathBlock.prototype.keydown()` in `rootelements.js`
         - just the calls where it's obvious what it's supposed to do, like
           `cursor.moveLeft()` when the left key is pressed
         - you don't have to worry about the complicated event logic yet
    2. Now check out how `RootMathBlock.prototype.keypress()` calls
       `Cursor.prototype.write()`
        * and how that calls `Cursor.prototype.insertNew()`
        * and what `Cursor.prototype.insertNew()` does to commands and the tree.
3. Once you've seen what the virtual DOM tree is like, how it is traversed and
   manipulated it, and how commands are created and inserted, you can look
   over `commands.js`
   * perhaps comparing with what `Cursor.prototype.insertNew()` does
   * as well as what the `MathCommand`'s constructor does in `baseclasses.js`

And you should be set to figure out almost everything else!

Some comments that are too high-level to put in the code:

* Event delegation is used in 2 ways:
  - in the HTML DOM, the root `span` element of each MathQuill thing is
    delegated all the events in it's own MathQuill thing
    + keyboard events usually end up triggering their analogue in the virtual
      DOM on the virtual cursor, which then bubble upwards
  - in the virtual math DOM, the root MathElement is delegated most of these
    virtual keyboard events
    + for example, `RootMathBlock.prototype.keydown()`
    + some special commands do intercept these events, though
* Keyboard events are very inconsistent between browsers, so `rootelements.js`
  has some complicated but very effective logic documented in the Wiki page
  "Keyboard Events".

Open-Source License
-------------------

[GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html)
