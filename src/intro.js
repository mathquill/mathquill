/**
* Usage:
*
* Wherever you'd like to have an editable math textbox:

    <span class="mathquill-editable"></span>

* or to convert LaTeX math to HTML:

    <span class="mathquill-embedded-latex">\frac{d}{dx}\sqrt{x}</span>

* Note that for dynamically created elements, you will need to call our
* jQuery plugin after inserting into the visible HTML DOM:

    $('<span>\sqrt{e^x}</span>').appendTo('body').mathquill() or .mathquill('editable')

* If it's necessary to call the plugin before inserting into the visible DOM,
* you can redraw once it is visible:

    $('<span>a_n x^n</span>').mathquill().appendTo('body').mathquill('redraw');

* (Do be warned that will trigger a flurry of change events.)
*
* Any element that has been MathQuill-ified can be reverted:

    $('.mathquill-embedded-latex').mathquill('revert');

*
*/

jQuery.fn.mathquill = (function($){ //takes in the jQuery function as an argument

//Note: if the following is no longer on line 34, please modify publish.sh accordingly
//$('head').prepend('<link rel="stylesheet" type="text/css" href="http://laughinghan.github.com/mathquill/mathquill.css">');

var todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };

