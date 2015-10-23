for (var key in MQ) (function(key, val) {
  if (typeof val === 'function') {
    MathQuill[key] = function() {
      insistOnInterVer();
      return val.apply(this, arguments);
    };
    MathQuill[key].prototype = val.prototype;
  }
  else MathQuill[key] = val;
}(key, MQ[key]));

}());
