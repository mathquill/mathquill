// For backwards compatibility, set up the global MathQuill object as an instance of API interface v1
if ((window as any).jQuery) {
    MQ1 = getInterface(1);
    for (var key in MQ1)
      (function (key, val) {
        if (typeof val === 'function') {
          (MathQuill as any)[key] = function () {
            insistOnInterVer();
            return val.apply(this, arguments);
          };
          (MathQuill as any)[key].prototype = val.prototype;
        } else (MathQuill as any)[key] = val;
      })(key, MQ1[key]);
  }

}());
