/**
* Usage:
* $(thing).latexlive();
* turns thing into a live editable thingy.
* AMAZORZ.
*
* Note: doesn't actually work.
*
*/

jQuery.fn.latexlive = (function($){ //takes in the jQuery function as an argument

//$(docuent.head).append('<link rel="stylesheet" type="text/css" href="newlatexlive.css">');

var noop = function(){ return this; }, todo = function(){ alert('BLAM!\n\nAHHHHHH!\n\n"Oh god, oh god, I\'ve never seen so much blood!"\n\nYeah, that doesn\'t fully work yet.'); };
