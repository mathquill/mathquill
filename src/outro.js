//on document ready, transmogrify all <tag class="mathquill-embedded-latex"></tag> and
//  <tag class="mathquill-editable"></tag> elements to mathquill elements.
$(function(){
  //$('.mathquill-embedded-latex').mathquill(); //LaTeX parsing doesn't work yet, so this is useless
  $('.mathquill-editable').mathquill('editable');
});

return mathquill;
}(jQuery));