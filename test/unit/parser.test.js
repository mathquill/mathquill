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

  function assertDoesntParse(parser, str, msg) {
    assert.equal(parser._parse(str), undefined, msg);
  }

  test('Parser.string', function() {
    var parser = string('x');
    assert.equal(parser._parse('x'), 'x');
    assertDoesntParse(parser, 'y');
  });

  test('Parser.regex', function() {
    var parser = regex(/^[0-9]/);

    assert.equal(parser._parse('1'), '1');
    assert.equal(parser._parse('4'), '4');
    assertDoesntParse(parser, 'x');
    assert.throws(function() { regex(/./) }, 'must be anchored');
  });

  suite('then', function() {
    test('with a parser, uses the last return value', function() {
      var parser = string('x').then(string('y'));
      assert.equal(parser._parse('xy'), 'y');
      assertDoesntParse(parser, 'y');
      assertDoesntParse(parser, 'xz');
    });

    test('asserts that a parser is returned', function() {
      var parser1 = letter.then(function() { return 'not a parser' });
      assert.throws(function() { parser1._parse('x'); });

      var parser2 = letter.then('x');
      assert.throws(function() { parser2._parse('xx'); });
    });

    test('with a function that returns a parser, continues with that parser', function() {
      var piped;
      var parser = string('x').then(function(x) {
        piped = x;
        return string('y');
      });

      assert.equal(parser._parse('xy'), 'y');
      assert.equal(piped, 'x');
      assertDoesntParse(parser, 'x');
    });
  });

  suite('map', function() {
    test('with a function, pipes the value in and uses that return value', function() {
      var piped;

      var parser = string('x').map(function(x) {
        piped = x;
        return 'y';
      });

      assert.equal(parser._parse('x'), 'y')
      assert.equal(piped, 'x');
    });
  });

  suite('result', function() {
    test('returns a constant result', function() {
      var myResult = 1;
      var oneParser = string('x').result(1);

      assert.equal(oneParser._parse('x'), 1);

      var myFn = function() {};
      var fnParser = string('x').result(myFn);

      assert.equal(fnParser._parse('x'), myFn);
    });
  });

  suite('skip', function() {
    test('uses the previous return value', function() {
      var parser = string('x').skip(string('y'));

      assert.equal(parser._parse('xy'), 'x');
      assertDoesntParse(parser, 'x');
    });
  });

  suite('or', function() {
    test('two parsers', function() {
      var parser = string('x').or(string('y'));

      assert.equal(parser._parse('x'), 'x');
      assert.equal(parser._parse('y'), 'y');
      assertDoesntParse(parser, 'z');
    });

    test('with then', function() {
      var parser = string('\\')
        .then(function() {
          return string('y')
        }).or(string('z'));

      assert.equal(parser._parse('\\y'), 'y');
      assert.equal(parser._parse('z'), 'z');
      assertDoesntParse(parser, '\\z');
    });
  });

  function assertEqualArray(arr1, arr2) {
    assert.equal(arr1.join(), arr2.join());
  }

  suite('many', function() {
    test('simple case', function() {
      var letters = letter.many();

      assertEqualArray(letters._parse('x'), ['x']);
      assertEqualArray(letters._parse('xyz'), ['x','y','z']);
      assertEqualArray(letters._parse(''), []);
      assertDoesntParse(letters, '1');
      assertDoesntParse(letters, 'xyz1');
    });

    test('followed by then', function() {
      var parser = string('x').many().then(string('y'));

      assert.equal(parser._parse('y'), 'y');
      assert.equal(parser._parse('xy'), 'y');
      assert.equal(parser._parse('xxxxxy'), 'y');
    });
  });

  suite('times', function() {
    test('zero case', function() {
      var zeroLetters = letter.times(0);

      assertEqualArray(zeroLetters._parse(''), []);
      assertDoesntParse(zeroLetters, 'x');
    });

    test('nonzero case', function() {
      var threeLetters = letter.times(3);

      assertEqualArray(threeLetters._parse('xyz'), ['x', 'y', 'z']);
      assertDoesntParse(threeLetters, 'xy');
      assertDoesntParse(threeLetters, 'xyzw');

      var thenDigit = threeLetters.then(digit);
      assert.equal(thenDigit._parse('xyz1'), '1');
      assertDoesntParse(thenDigit, 'xy1');
      assertDoesntParse(thenDigit, 'xyz');
      assertDoesntParse(thenDigit, 'xyzw');
    });

    test('with a min and max', function() {
      var someLetters = letter.times(2, 4);

      assertEqualArray(someLetters._parse('xy'), ['x', 'y']);
      assertEqualArray(someLetters._parse('xyz'), ['x', 'y', 'z']);
      assertEqualArray(someLetters._parse('xyzw'), ['x', 'y', 'z', 'w']);
      assertDoesntParse(someLetters, 'xyzwv');
      assertDoesntParse(someLetters, 'x');

      var thenDigit = someLetters.then(digit);
      assert.equal(thenDigit._parse('xy1'), '1');
      assert.equal(thenDigit._parse('xyz1'), '1');
      assert.equal(thenDigit._parse('xyzw1'), '1');
      assertDoesntParse(thenDigit, 'xy');
      assertDoesntParse(thenDigit, 'xyzw');
      assertDoesntParse(thenDigit, 'xyzwv1');
      assertDoesntParse(thenDigit, 'x1');
    });

    test('atLeast', function() {
      var atLeastTwo = letter.atLeast(2);

      assertEqualArray(atLeastTwo._parse('xy'), ['x', 'y']);
      assertEqualArray(atLeastTwo._parse('xyzw'), ['x', 'y', 'z', 'w']);
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

      assertDoesntParse(parser, 'y');
      assert.equal(parser._parse('x'), 'x');
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
      assert.equal(parser._parse('x+y'), '+');
      assertDoesntParse(parser, 'x*y');

      allowedOperator = '*';
      assert.equal(parser._parse('x*y'), '*');
      assertDoesntParse(parser, 'x+y');
    });
  });

  test('eof', function() {
    var parser = optWhitespace.skip(eof).or(all.result('default'));

    assert.equal(parser._parse('  '), '  ')
    assert.equal(parser._parse('x'), 'default');
  });
});
