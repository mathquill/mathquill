Please note that this is an alpha version, so bugs and unimplemented features are all over the place.

(Powered by jQuery, v1.4+ required. Get it from http://jquery.com.)

Usage
-----

All you need is a script include in your header:

`<script src="http://laughinghan.github.com/mathquill/mathquill.js">`

and wherever you'd like to convert LaTeX math to HTML or embed an editable math-textbox:

`<span class="mathquill-embedded-math">[optional LaTeX math]</span>`

Note that for dynamically created elements, you will need to call our jQuery plugin:

`$('<some set of dynamically created elements>').mathquill();`

Understanding The Code
----------------------

All the JavaScript that you actually want to read is in src/, build/ just contains a cat'ed (and eventually, minified) version of all that.

All the CSS is in mathquill.css.

1. To get a general idea of our program model, you want to start by skimming backend.js.
    * What you want to pay attention to is the structure of the Math DOM tree,
      and the choice of utility methods of the nodes in the tree.
    * Some of the initialization code is a bit obscure, don't worry about it.
2. With that in mind, you can now understand Cursor's tree traversal and manipulation methods in frontend.js.
    1. Before you dig in to Cursor.prototype, take peek at RootMathBlock.prototype.keydown()
        * ignore the arcane logic and find calls to Cursor's methods where it's blatantly obvious
          what they're supposed to do, such as .moveLeft() when the left key is pressed
        * don't worry about the abstraction layer between our keydown and keypress
          event handling system and jQuery's (which corresponds much more closely to
          the actual HTML DOM's) until later. (See the Wiki page "Keybard Events".)
    2. after that, you can read through Cursor's Math DOM tree traversal and manipulation methods.
        * they pretty much just do what they say on the tin
        * after seeing how they're called (in RootMathBlock.prototype.keydown()) it
          should be pretty obvious what each of them are supposed to do
    3. Now check out how RootMathBlock.prototype.keypress() calls Cursor.prototype.write()
        * and how that calls Cursor.prototype.insertNew()
        * and what Cursor.prototype.insertNew() does to commands and the tree.
3. Once you've seen what the Math DOM tree is supposed to be like, how we traverse and
    manipulate it, and how commands are created and inserted, you can read through commands.js
    * perhaps comparing notes with what Cursor.prototype.insertNew() does
    * as well as what the MathCommand's constructor does in backend.js

And you should be set to figure out everything else from here!

