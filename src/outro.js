//on document ready, transmogrify all <tag class="mathquill-editable"></tag> and
//  <tag class="mathquill-embedded-latex"></tag> elements to mathquill elements.
$(function(){
  $('.mathquill-embedded-latex').mathquill();
  $('.mathquill-editable').mathquill('editable');
  var _onerror = window.onerror;
  window.onerror = function(){ if(_onerror) _onerror.apply(this, arguments); return true; };
});

return mathquill;
}(jQuery));