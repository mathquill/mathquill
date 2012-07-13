var Parser = P(function(_) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  function parseError(stream, expected) {
    if (!stream) stream = 'EOF';
    else stream = '"' + stream + '"';
    throw 'Parse Error: expected ' + expected + ', got ' + stream;
  }

  _.init = function(body) { this._ = body; };

  _.parse = function(stream) {
    return this._(stream, success, parseError);

    function success(stream, result) {
      if (stream) parseError(stream, 'EOF');

      return result;
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
  _.constResult = function(c) { return this.then(Epsilon(c)); };

  _.pipe = function(f) {
    return this.bind(function(result) { return Epsilon(f(result)); });
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
    }).or(Epsilon([]));
  };
});

function Epsilon(result) {
  // Make a Parser that matches nothing and just always succeeds with `result`.
  return Parser(function(stream, onSuccess, onFailure) {
    return onSuccess(stream, result);
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
    if (!stream.length) return onFailure(stream, ch);

    var head = stream.charAt(0);
    if (cond(head)) {
      return onSuccess(stream.slice(1), head);
    }
    else {
      return onFailure(stream, ch);
    }
  });
}

var WhiteSpaceParser = CharParser(/\s/).many();
var LetterParser = CharParser(/[a-z]/i);
