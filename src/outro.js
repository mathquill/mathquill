for (var key in MathQuill) (function(key, val) {
  if (preInterVerMathQuill[key]) return; // already set .noConflict
  if (typeof val === 'function') {
    preInterVerMathQuill[key] = function() {
      insistOnInterVer();
      return val.apply(this, arguments);
    };
    preInterVerMathQuill[key].prototype = val.prototype;
  }
  else preInterVerMathQuill = val;
}(key, MathQuill[key]));

}());
