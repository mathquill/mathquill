//on document ready, transmogrify all <tag class="mathquill-editable"></tag> and
//  <tag class="mathquill-embedded-latex"></tag> elements to mathquill elements.
$(function(){
  $('.mathquill-embedded-latex').mathquill();
  $('.mathquill-editable').mathquill('editable');
});

return mathquill;
}(jQuery));