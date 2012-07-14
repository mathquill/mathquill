var Parser = P(function(_, _super, Parser) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  Parser.expected = function(expected, stream, onFailure) {
    if (!stream) stream = 'EOF';
    else stream = '"' + stream + '"';
    return onFailure(stream, 'expected ' + expected + ', got ' + stream);
  };

  _.init = function(body) { this._ = body; };

  _.parse = function(stream) {
    return this._(stream, success, failure);

    function success(stream, result) {
      if (stream) return Parser.expected('EOF', stream, failure);

      return result;
    }
    function failure(stream, message) {
      throw 'Parse Error: ' + message;
    }
  };

  // -*- primitive combinators -*- //
  _.or = function(alternative) {
    // Make a Parser that first tries to parse the stream with `this`
    // parser, and if it fails, tries the to parse the stream with the
    // `alternative`, which must be a Parser.
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return self._(stream, onSuccess, failure);

      function failure(newStream) {
        return alternative._(stream, onSuccess, onFailure);
      }
    });
  };

  _.bind = function(makeParser) {
    // Make a Parser that first parses the stream with `this` parser,
    // then passes the result to `makeParser`, which must be a function
    // that takes one argument and returns a Parser, and then uses the
    // returned Parser to continue to parse the stream.
    var self = this;

    return Parser(function(stream, onSuccess, onFailure) {
      return self._(stream, success, onFailure);

      function success(newStream, result) {
        return makeParser(result)._(newStream, onSuccess, onFailure);
      }
    });
  };

  // -*- higher-level combinators -*- //
  _.then = function(next) { return this.bind(function() { return next; }); };
  _.constResult = function(c) { return this.then(Succeed(c)); };

  _.pipe = function(f) {
    return this.bind(function(result) { return Succeed(f(result)); });
  };

  _.skip = function(next) {
    return this.bind(function(firstResult) {
      return next.constResult(firstResult);
    });
  };

  _.many = function() {
    var self = this;

    return self.bind(function(x) {
      return self.many().pipe(function(xs) {
        return [x].concat(xs);
      });
    }).or(Succeed([]));
  };
});

function Succeed(result) {
  // Make a Parser that matches nothing and just always succeeds with `result`.
  return Parser(function(stream, onSuccess, onFailure) {
    return onSuccess(stream, result);
  });
}

function Fail(message) {
  // Make a Parser that always fails with `message`.
  return Parser(function(stream, onSuccess, onFailure) {
    return onFailure(stream, message);
  });
}

function CharParser(ch) {
  // Make a Parser that matches a single character if and only if the character
  // matches `ch` if `ch` is a character, a regex, or a function, or matches
  // any character if `ch` is not passed.
  var cond;
  if (ch === undefined) {
    cond = function() { return true; };
  }
  else if (typeof ch === 'function') {
    cond = ch;
  }
  else if (ch instanceof RegExp) {
    cond = function(head) { return ch.test(head); };
  }
  else {
    cond = function(head) { return ch === head; };
  }

  return Parser(function(stream, onSuccess, onFailure) {
    if (!stream.length) return CharParser.expected(ch, stream, onFailure);

    var head = stream.charAt(0);
    if (cond(head)) {
      return onSuccess(stream.slice(1), head);
    }
    else {
      return CharParser.expected(ch, stream, onFailure);
    }
  });
}
CharParser.expected = function(ch, stream, onFailure) {
  if (typeof ch === 'string') ch = "'" + ch + "'";
  return Parser.expected(ch, stream, onFailure);
};

var WhiteSpaceParser = CharParser(/\s/).many();
var LetterParser = CharParser(/[a-z]/i);
