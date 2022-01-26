function parseError(stream: string, message: string): never {
  if (stream) {
    stream = "'" + stream + "'";
  } else {
    stream = 'EOF';
  }

  throw 'Parse Error: ' + message + ' at ' + stream;
}

type UnknownParserResult = any;

type ParserBody<T> = (
  stream: string,
  onSuccess: (stream: string, result: T) => UnknownParserResult,
  onFailure: (stream: string, msg: string) => UnknownParserResult
) => T;

class Parser<T> {
  _: ParserBody<T>;

  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.
  constructor(body: ParserBody<T>) {
    this._ = body;
  }

  parse(stream: string): T {
    return this.skip(Parser.eof)._('' + stream, success, parseError);

    function success(_stream: string, result: T) {
      return result;
    }
  }

  // -*- primitive combinators -*- //
  or<Q>(alternative: Parser<Q>): Parser<T | Q> {
    pray('or is passed a parser', alternative instanceof Parser);

    var self = this;

    return new Parser(function (stream, onSuccess, onFailure) {
      return self._(stream, onSuccess, failure);

      function failure(_newStream: string) {
        return alternative._(stream, onSuccess, onFailure);
      }
    });
  }

  then<Q>(next: Parser<Q> | ((result: T) => Parser<Q>)): Parser<Q> {
    var self = this;

    return new Parser<Q>(function (stream: string, onSuccess, onFailure) {
      return self._(stream, success, onFailure) as any as Q;

      function success(newStream: string, result: T) {
        var nextParser = next instanceof Parser ? next : next(result);
        pray('a parser is returned', nextParser instanceof Parser);
        return nextParser._(newStream, onSuccess, onFailure);
      }
    });
  }

  // -*- optimized iterative combinators -*- //
  many(): Parser<T[]> {
    var self = this;

    return new Parser(function (stream, onSuccess, _onFailure) {
      var xs: T[] = [];
      while (self._(stream, success, failure));
      return onSuccess(stream, xs);

      function success(newStream: string, x: T) {
        stream = newStream;
        xs.push(x);
        return true;
      }

      function failure() {
        return false;
      }
    });
  }

  times(min: number, max?: number): Parser<T[]> {
    if (arguments.length < 2) max = min;
    var self = this;

    return new Parser(function (stream, onSuccess, onFailure) {
      var xs: T[] = [];
      var result: boolean = true;
      var failure;

      for (var i = 0; i < min; i += 1) {
        // TODO, this may be incorrect for parsers that return boolean
        // (or generally, falsey) values
        result = !!self._(stream, success, firstFailure);
        if (!result) return onFailure(stream, failure as any as string);
      }

      for (; i < (max as number) && result; i += 1) {
        self._(stream, success, secondFailure);
      }

      return onSuccess(stream, xs);

      function success(newStream: string, x: T) {
        xs.push(x);
        stream = newStream;
        return true;
      }

      function firstFailure(newStream: string, msg: string) {
        failure = msg;
        stream = newStream;
        return false;
      }

      function secondFailure(_newStream: string, _msg: string) {
        return false;
      }
    });
  }

  // -*- higher-level combinators -*- //
  result<Q>(res: Q): Parser<Q> {
    return this.then(Parser.succeed(res));
  }
  atMost(n: number) {
    return this.times(0, n);
  }
  atLeast(n: number) {
    var self = this;
    return self.times(n).then(function (start) {
      return self.many().map(function (end) {
        return start.concat(end);
      });
    });
  }

  map<Q>(fn: (result: T) => Q): Parser<Q> {
    return this.then(function (result) {
      return Parser.succeed(fn(result));
    });
  }

  skip<Q>(two: Parser<Q>): Parser<T> {
    return this.then(function (result) {
      return two.result(result);
    });
  }

  // -*- primitive parsers -*- //
  static string(str: string): Parser<string> {
    var len = str.length;
    var expected = "expected '" + str + "'";

    return new Parser(function (stream, onSuccess, onFailure) {
      var head = stream.slice(0, len);

      if (head === str) {
        return onSuccess(stream.slice(len), head);
      } else {
        return onFailure(stream, expected);
      }
    });
  }

  static regex(re: RegExp): Parser<string> {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');

    var expected = 'expected ' + re;

    return new Parser(function (stream, onSuccess, onFailure) {
      var match = re.exec(stream);

      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      } else {
        return onFailure(stream, expected);
      }
    });
  }

  static succeed<Q>(result: Q): Parser<Q> {
    return new Parser(function (stream: string, onSuccess) {
      return onSuccess(stream, result);
    });
  }

  static fail(msg: string): Parser<never> {
    return new Parser(function (stream, _, onFailure) {
      return onFailure(stream, msg) as never;
    });
  }

  static letter = Parser.regex(/^[a-z]/i);
  static letters = Parser.regex(/^[a-z]*/i);
  static digit = Parser.regex(/^[0-9]/);
  static digits = Parser.regex(/^[0-9]*/);
  static whitespace = Parser.regex(/^\s+/);
  static optWhitespace = Parser.regex(/^\s*/);

  static any: Parser<string> = new Parser(function (
    stream,
    onSuccess,
    onFailure
  ) {
    if (!stream) return onFailure(stream, 'expected any character');

    return onSuccess(stream.slice(1), stream.charAt(0));
  });

  static all: Parser<string> = new Parser(function (
    stream,
    onSuccess,
    _onFailure
  ) {
    return onSuccess('', stream);
  });

  static eof: Parser<string> = new Parser(function (
    stream,
    onSuccess,
    onFailure
  ) {
    if (stream) return onFailure(stream, 'expected EOF');

    return onSuccess(stream, stream);
  });
}
