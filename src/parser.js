// Parser a
var Parser = P(function(_) {
  function returning(x) { return function() { return x; } }
  function parseError(stream) { throw new Error(stream); }

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
    function success(stream, result) {
      if (stream) parseError(stream);

      return result;
    }

    return this._(stream, success, parseError);
  };

  // -*- combinators -*- //
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

function CharConditionParser(cond) {
  return Parser(function(stream, onSuccess, onFailure) {
    if (!stream.length) return onFailure(stream);

    var head = stream.charAt(0);
    if (cond(head)) {
      return onSuccess(stream.slice(1), head);
    }
    else {
      return onFailure(stream);
    }
  });
}

function CharParser(ch) {
  return CharConditionParser(function(head) { return head === ch; });
}

function CharClassParser(regex) {
  return CharConditionParser(function(head) { return regex.test(head); });
}

var LetterParser = CharClassParser(/[a-z]/i);
