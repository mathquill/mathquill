var assert = (function () {
  class AssertionError extends Error {
    message: string;
    explanation: string;
    constructor({
      message,
      explanation,
    }: {
      message: string | undefined;
      explanation: string;
    }) {
      const combined = `${explanation} ${message}`;
      super(combined);
      this.explanation = explanation;
      this.message = combined;
    }
  }

  function fail(opts: { message: string | undefined; explanation: string }) {
    throw new AssertionError(opts);
  }

  return {
    ok: function (thing: any, message?: string) {
      if (thing) return;

      fail({
        message: message,
        explanation: 'expected ' + thing + ' to be truthy',
      });
    },
    equal: function <T>(thing1: T, thing2: T, message?: string) {
      if (thing1 === thing2) return;

      fail({
        message: message,
        explanation: 'expected (' + thing1 + ') to equal (' + thing2 + ')',
      });
    },
    throws: function (fn: Function, message?: string) {
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
    fail: function (message?: string) {
      fail({ message: message, explanation: 'generic fail' });
    },
  };
})();
