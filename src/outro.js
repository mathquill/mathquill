//on document ready, replace the contents of all <tag class="mathquill-embedded-math"></tag> elements
//with root MathBlock's.
$(function(){
  $('.mathquill-embedded-math').mathquill();
});

return mathquill;
}(jQuery));