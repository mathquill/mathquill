suite('parser', function() {
  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var digit = Parser.digit;
  var any = Parser.any;
  var optWhitespace = Parser.optWhitespace;
  var eof = Parser.eof;
  var succeed = Parser.succeed;
  var all = Parser.all;

  test('Parser.string', function() {
    var parser = string('x');
    assert.equal(parser.parse('x'), 'x');
    assert.throws(function() { parser.parse('y') })
  });

  test('Parser.regex', function() {
    var parser = regex(/^[0-9]/);

    assert.equal(parser.parse('1'), '1');
    assert.equal(parser.parse('4'), '4');
    assert.throws(function() { parser.parse('x'); });
    assert.throws(function() { regex(/./) }, 'must be anchored');
  });

  suite('then', function() {
    test('with a parser, uses the last return value', function() {
      var parser = string('x').then(string('y'));
      assert.equal(parser.parse('xy'), 'y');
      assert.throws(function() { parser.parse('y'); });
      assert.throws(function() { parser.parse('xz'); });
    });

    test('asserts that a parser is returned', function() {
      var parser1 = letter.then(function() { return 'not a parser' });
      assert.throws(function() { parser1.parse('x'); });

      var parser2 = letter.then('x');
      assert.throws(function() { letter.parse('xx'); });
    });

    test('with a function that returns a parser, continues with that parser', function() {
      var piped;
      var parser = string('x').then(function(x) {
        piped = x;
        return string('y');
      });

      assert.equal(parser.parse('xy'), 'y');
      assert.equal(piped, 'x');
      assert.throws(function() { parser.parse('x'); });
    });
  });

  suite('map', function() {
    test('with a function, pipes the value in and uses that return value', function() {
      var piped;

      var parser = string('x').map(function(x) {
        piped = x;
        return 'y';
      });

      assert.equal(parser.parse('x'), 'y')
      assert.equal(piped, 'x');
    });
  });

  suite('result', function() {
    test('returns a constant result', function() {
      var myResult = 1;
      var oneParser = string('x').result(1);

      assert.equal(oneParser.parse('x'), 1);

      var myFn = function() {};
      var fnParser = string('x').result(myFn);

      assert.equal(fnParser.parse('x'), myFn);
    });
  });

  suite('skip', function() {
    test('uses the previous return value', function() {
      var parser = string('x').skip(string('y'));

      assert.equal(parser.parse('xy'), 'x');
      assert.throws(function() { parser.parse('x'); });
    });
  });

  suite('or', function() {
    test('two parsers', function() {
      var parser = string('x').or(string('y'));

      assert.equal(parser.parse('x'), 'x');
      assert.equal(parser.parse('y'), 'y');
      assert.throws(function() { parser.parse('z') });
    });

    test('with then', function() {
      var parser = string('\\')
        .then(function() {
          return string('y')
        }).or(string('z'));

      assert.equal(parser.parse('\\y'), 'y');
      assert.equal(parser.parse('z'), 'z');
      assert.throws(function() { parser.parse('\\z') });
    });
  });

  function assertParses(parser, str, expectedResult) {
    if (arguments.length < 3) expectedResult = str;
    var result = parser.parse(str);
    if (result instanceof Array) result = result.join('');
    assert.equal(result, expectedResult);
  }
  function assertDoesntParse(parser, str) {
    assert.throws(function() { parser.parse(str); });
  }

  suite('many', function() {
    test('simple case', function() {
      var letters = letter.many();

      assertParses(letters, 'x');
      assertParses(letters, 'xyz');
      assertParses(letters, '');
      assertDoesntParse(letters, '1');
      assertDoesntParse(letters, 'xyz1');
    });

    test('followed by then', function() {
      var parser = string('x').many().then(string('y'));

      assertParses(parser, 'y', 'y');
      assertParses(parser, 'xy', 'y');
      assertParses(parser, 'xxxxxy', 'y');
      assertDoesntParse(parser, '');
      assertDoesntParse(parser, 'x');
      assertDoesntParse(parser, 'xyz');
    });
  });

  suite('times', function() {
    test('zero case', function() {
      var zeroLetters = letter.times(0);

      assertParses(zeroLetters, '');
      assertDoesntParse(zeroLetters, 'x');
    });

    test('nonzero case', function() {
      var threeLetters = letter.times(3);

      assertParses(threeLetters, 'xyz');
      assertDoesntParse(threeLetters, 'xy');
      assertDoesntParse(threeLetters, 'xyzw');

      var thenDigit = threeLetters.then(digit);

      assertParses(thenDigit, 'xyz1', '1');
      assertDoesntParse(thenDigit, 'xy1');
      assertDoesntParse(thenDigit, 'xyz');
      assertDoesntParse(thenDigit, 'xyzw');
    });

    test('with a min and max', function() {
      var someLetters = letter.times(2, 4);

      assertParses(someLetters, 'xy');
      assertParses(someLetters, 'xyz');
      assertParses(someLetters, 'xyzw');
      assertDoesntParse(someLetters, 'xyzwv');
      assertDoesntParse(someLetters, 'x');

      var thenDigit = someLetters.then(digit);

      assertParses(thenDigit, 'xy1', '1');
      assertParses(thenDigit, 'xyz1', '1');
      assertParses(thenDigit, 'xyzw1', '1');
      assertDoesntParse(thenDigit, 'xy');
      assertDoesntParse(thenDigit, 'xyzw');
      assertDoesntParse(thenDigit, 'xyzwv1');
      assertDoesntParse(thenDigit, 'x1');
    });

    test('atLeast', function() {
      var atLeastTwo = letter.atLeast(2);

      assertParses(atLeastTwo, 'xy');
      assertParses(atLeastTwo, 'xyzw');
      assertDoesntParse(atLeastTwo, 'x');
    });
  });

  suite('fail', function() {
    var fail = Parser.fail;
    var succeed = Parser.succeed;

    test('use Parser.fail to fail dynamically', function() {
      var parser = any.then(function(ch) {
        return fail('character '+ch+' not allowed');
      }).or(string('x'));

      assert.throws(function() { parser.parse('y'); });
      assert.equal(parser.parse('x'), 'x');
    });

    test('use Parser.succeed or Parser.fail to branch conditionally', function() {
      var allowedOperator;

      var parser =
        string('x')
        .then(string('+').or(string('*')))
        .then(function(operator) {
          if (operator === allowedOperator) return succeed(operator);
          else return fail('expected '+allowedOperator);
        })
        .skip(string('y'))
      ;

      allowedOperator = '+';
      assert.equal(parser.parse('x+y'), '+');
      assert.throws(function() { parser.parse('x*y'); });

      allowedOperator = '*';
      assert.equal(parser.parse('x*y'), '*');
      assert.throws(function() { parser.parse('x+y'); });
    });
  });

  test('eof', function() {
    var parser = optWhitespace.skip(eof).or(all.result('default'));

    assert.equal(parser.parse('  '), '  ')
    assert.equal(parser.parse('x'), 'default');
  });
});
