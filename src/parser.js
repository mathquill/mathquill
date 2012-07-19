var Parser = P(function(_, _super, Parser) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  function returning(x) { return function() { return x; } }
  function compose(f, g) { return function() { return f(g.apply(this, arguments)); }; }
  function parseError(stream, message) {
    if (stream) {
      stream = "'"+stream+"'";
    }
    else {
      stream = 'EOF';
    }

    throw 'Parse Error: '+message+' at '+stream;
  }

  function ensureFunction(thing) {
    if (typeof thing !== 'function') thing = returning(thing);

    return thing;
  }

  _.init = function(body) { this._ = body; };

  _.parse = function(stream) {
    return this.skip(eof)._(stream, success, parseError);

    function success(stream, result) { return result; }
  };

  // -*- primitive combinators -*- //
  _.or = function(two) {
    pray('or is passed a parser', two instanceof Parser);

    var one = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return one._(stream, onSuccess, failure);

      function failure(newStream) {
        return two._(stream, onSuccess, onFailure);
      }
    });
  };

  _.then = function(two) {
    var one = this;
    two = ensureFunction(two);

    return Parser(function(stream, onSuccess, onFailure) {
      return one._(stream, success, onFailure);

      function success(newStream, result) {
        var newParser = two(result);
        pray('a parser is returned', newParser instanceof Parser);
        return newParser._(newStream, onSuccess, onFailure);
      }
    });
  };

  _.map = function(fn) { return this.then(compose(succeed, fn)); };
  _.result = function(res) { return this.then(succeed(res)); };

  // -*- higher-level combinators -*- //
  _.skip = function(two) {
    return this.then(function(result) { return two.result(result); });
  };

  _.many = function() {
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      var xs = [];
      while (self._(stream, success, failure));
      return onSuccess(stream, xs);

      function success(newStream, x) {
        stream = newStream;
        xs.push(x);
        return true;
      }

      function failure() {
        return false;
      }
    });
  };

  _.times = function(min, max) {
    if (arguments.length < 2) max = min;
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      var xs = [];
      var result = true;
      var failure;

      for (var i = 0; i < min; i += 1) {
        result = self._(stream, success, firstFailure);
        if (!result) return onFailure(stream, failure);
      }

      for (; i < max && result; i += 1) {
        result = self._(stream, success, secondFailure);
      }

      return onSuccess(stream, xs);

      function success(newStream, x) {
        xs.push(x);
        stream = newStream;
        return true;
      }

      function firstFailure(newStream, msg) {
        failure = msg;
        stream = newStream;
        return false;
      }

      function secondFailure(newStream, msg) {
        return false;
      }
    });
  };

  _.atLeast = function(n) {
    var self = this;
    return self.times(n).then(function(start) {
      return self.many().map(function(end) {
        return start.concat(end);
      });
    });
  };

  _.atMost = function(n) { return this.times(0, n); };

  // -*- primitive parsers -*- //
  var string = this.string = function(str) {
    var len = str.length;
    var expected = "expected '"+str+"'";

    return Parser(function(stream, onSuccess, onFailure) {
      var head = stream.slice(0, len);

      if (head === str) {
        return onSuccess(stream.slice(len), head);
      }
      else {
        return onFailure(stream, expected);
      }
    });
  };

  var regex = this.regex = function(re) {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');

    var expected = 'expected '+re;

    return Parser(function(stream, onSuccess, onFailure) {
      var match = re.exec(stream);

      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      }
      else {
        return onFailure(stream, expected);
      }
    });
  };

  var succeed = Parser.succeed = function(result) {
    return Parser(function(stream, onSuccess) {
      return onSuccess(stream, result);
    });
  };

  var fail = Parser.fail = function(msg) {
    return Parser(function(stream, _, onFailure) {
      return onFailure(stream, msg);
    });
  };

  var letter = Parser.letter = regex(/^[a-z]/i);
  var letters = Parser.letters = regex(/^[a-z]*/i);
  var digit = Parser.digit = regex(/^[0-9]/);
  var digits = Parser.digits = regex(/^[0-9]*/);
  var whitespace = Parser.whitespace = regex(/^\s+/);
  var optWhitespace = Parser.optWhitespace = regex(/^\s*/);

  var any = Parser.any = Parser(function(stream, onSuccess, onFailure) {
    if (!stream) return onFailure(stream, 'expected any character');

    return onSuccess(stream.slice(1), stream.charAt(0));
  });

  var all = Parser.all = Parser(function(stream, onSuccess, onFailure) {
    return onSuccess('', stream);
  });

  var eof = Parser.eof = Parser(function(stream, onSuccess, onFailure) {
    if (stream) return onFailure(stream, 'expected EOF');

    return onSuccess(stream, stream);
  });
});
