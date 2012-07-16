var Parser = P(function(_) {
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

    return manyReverse(this).then(function(reversed) {
      var out = [];
      for (var i = reversed.length; i > 0; i -= 1) {
        out.push(reversed[i-1]);
      }

      return out;
    });
  };

  function manyReverse(self) {
    return self.then(function(x) {
      return manyReverse(self).then(function(xs) {
        xs.push(x);
        return xs;
      });
    }).or([]);
  }
});

function CharParser(ch) {
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
    if (!stream.length) return onFailure(stream);

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
