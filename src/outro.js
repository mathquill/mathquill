//on document ready, transmogrify all <tag class="mathquill-embedded-math"></tag> elements to
//  possibly editable mathquill elements.
$(function(){
  //$('.mathquill-embedded-math').mathquill(); //LaTeX parsing doesn't work yet, so this is useless
  $('.mathquill-editable-math').mathquill('editable');
});

return mathquill;
}(jQuery));