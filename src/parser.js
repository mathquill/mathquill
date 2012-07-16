var Parser = P(function(_, _super, Parser) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  function returning(x) { return function() { return x; } }
  function parseError(stream, message) {
    throw 'Parse Error: ' + message + ', got \''+stream+'\'';
  }

  function ensureFunction(thing) {
    if (typeof thing !== 'function') thing = returning(thing);

    return thing;
  }

  function ensureParser(x) {
    if (x instanceof Parser) return x;

    return Parser(function(stream, success) {
      return success(stream, x);
    });
  }

  _.init = function(body) { this._ = body; };

  _.parse = function(stream) {
    return this._(stream, success, parseError);

    function success(stream, result) {
      if (stream) parseError(stream, 'expected EOF');

      return result;
    }
  };

  // -*- primitive combinators -*- //
  _.or = function(two) {
    var one = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return one._(stream, onSuccess, failure);

      function failure(newStream) {
        return ensureParser(two)._(stream, onSuccess, onFailure);
      }
    });
  };

  _.then = function(two) {
    var one = this;
    two = ensureFunction(two);

    return Parser(function(stream, onSuccess, onFailure) {
      return one._(stream, success, onFailure);

      function success(newStream, result) {
        return ensureParser(two(result))._(newStream, onSuccess, onFailure);
      }
    });
  };

  // -*- higher-level combinators -*- //
  _.after = function(two) {
    var one = this;
    two = ensureFunction(two);

    return one.then(function(result) {
      return ensureParser(two(result)).then(function() {
        return ensureParser(result);
      });
    });
  };

  _.many = function() {
    var self = this;

    return manyReverse(this).then(reverseArray);
  };

  function manyReverse(self) {
    return self.then(function(x) {
      return manyReverse(self).then(accumulate(x));
    }).or([]);
  }

  function accumulate(x) {
    return function(xs) {
      xs.push(x);
      return xs;
    }
  }

  _.times = function(n) {
    return timesReverse(this, n).then(reverseArray);
  };

  function timesReverse(self, n) {
    if (n === 0) return ensureParser([]);

    return self.then(function(x) {
      return timesReverse(self, n - 1).then(accumulate(x))
    });
  }

  _.manyOne = function() {
    var self = this;

    return self.then(function(x) {
      return self.many().then(function(xs) {
        return [x].concat(xs);
      });
    });
  };

  function reverseArray(reversed) {
    var out = [];
    for (var i = reversed.length; i > 0; i -= 1) {
      out.push(reversed[i-1]);
    }

    return out;
  }

  // -*- primitive parsers -*- //
  var string = this.string = function(str) {
    var len = str.length;

    return Parser(function(stream, onSuccess, onFailure) {
      var head = stream.slice(0, len);

      if (head === str) {
        return onSuccess(stream.slice(len), head);
      }
      else {
        return onFailure(stream, str);
      }
    });
  };

  var regex = this.regex = function(re) {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');

    return Parser(function(stream, onSuccess, onFailure) {
      var match = re.exec(stream);

      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      }
      else {
        return onFailure(stream, re);
      }
    });
  };

  var letter = Parser.letter = regex(/^[a-z]/i);
  var letters = Parser.letters = regex(/^[a-z]*/i);
  var digit = Parser.digit = regex(/^[0-9]/);
  var digits = Parser.digits = regex(/^[0-9]*/);
  var any = Parser.any = Parser(function(stream, onSuccess, onFailure) {
    if (!stream.length) return onFailure(stream, 'any character');

    return onSuccess(stream.slice(1), stream.charAt(0));
  });
});
