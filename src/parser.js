// Parser a
var Parser = P(function(_) {

  function returning(x) { return function() { return x; } }
  function parseError(stream, message) {

    throw 'parse error - ' + message + ', got \''+stream+'\'';
  }

  function ensureFunction(thing) {
    if (typeof thing !== 'function') thing = returning(thing);

    return thing;
  }

  function ensureParser(x) {
    if (x instanceof Parser) return x;

    return Parser('EnsuredParser', function(stream, success) {
      return success(stream, x);
    });
  }

  _.init = function(name, body) { this.name = name; this._ = body; };

  _.is = function(parser) { this._ = parser._; return this; };

  _.parse = function(stream) {
    function success(stream, result) {
      if (stream) parseError(stream, 'expected EOF');

      return result;
    }

    return this._(stream, success, parseError);
  };

  // -*- combinators -*- //
  _.or = function(two) {
    var one = this;

    return Parser(one.name, function(stream, onSuccess, onFailure) {
      return one._(stream, onSuccess, failure);

      function failure(newStream) {
        return ensureParser(two)._(stream, onSuccess, onFailure);
      }
    });
  };

  _.then = function(two) {
    var one = this;
    two = ensureFunction(two);

    return Parser(one.name, function(stream, onSuccess, onFailure) {
      return one._(stream, success, onFailure);

      function success(newStream, result) {
        return ensureParser(two(result))._(newStream, onSuccess, onFailure);
      }
    });
  };

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

    return self.then(function(x) {
      return self.many().then(function(xs) {
        return [x].concat(xs);
      });
    }).or([]);
  };
});

function CharParser(ch, name) {
  if (!name) name = 'UnnamedParser :(';

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

  return Parser(name, function(stream, onSuccess, onFailure) {
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

var WhiteSpaceParser = CharParser(/\s/, 'WhiteSpaceParser').many();
var LetterParser = CharParser(/[a-z]/i, 'LetterParser');
