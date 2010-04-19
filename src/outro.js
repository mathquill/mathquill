//on document ready, transmogrify all <tag class="mathquill-editable"></tag> and
//  <tag class="mathquill-embedded-latex"></tag> elements to mathquill elements.
$(function(){
  //$('.mathquill-editable, .mathquill-embedded-latex').mathquill(); //LaTeX parsing doesn't work yet
  $('.mathquill-editable').mathquill();
});

return mathquill;
}(jQuery));