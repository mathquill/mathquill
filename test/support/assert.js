window.assert = (function () {
  function AssertionError(opts) {
    if (!opts) opts = {};

    $.extend(this, opts);
    this.message = this.explanation + ' ' + this.message;

    Error.call(this, this.message);
  }

  function noop() {}
  noop.prototype = Error.prototype;
  AssertionError.prototype = new noop();

  function fail(opts) {
    if (typeof opts === 'string') opts = { message: opts };

    throw new AssertionError(opts);
  }

  return {
    ok: function (thing, message) {
      if (thing) return;

      fail({
        message: message,
        explanation: 'expected ' + thing + ' to be truthy',
      });
    },
    equal: function (thing1, thing2, message) {
      if (thing1 === thing2) return;

      fail({
        message: message,
        explanation: 'expected (' + thing1 + ') to equal (' + thing2 + ')',
      });
    },
    throws: function (fn, message) {
      var error = false;

      try {
        fn();
      } catch (e) {
        error = true;
      }

      if (error) return;

      fail({
        message: message,
        explanation: 'expected ' + fn + ' to throw an error',
      });
    },
    fail: function (message) {
      fail({ message: message, explanation: 'generic fail' });
    },
  };
})();
