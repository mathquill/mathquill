(function() {
  var jQuery = window.jQuery;
  if (!jQuery) throw 'MathQuill requires jQuery 1.5.2+ to be loaded first';

  {SOURCE}

  MathQuill.noConflict = function() {
    window.MathQuill = origMathQuill;
    return MathQuill;
  };
  var origMathQuill = window.MathQuill;
  window.MathQuill = MathQuill;
})();
