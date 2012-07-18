suite('parser', function() {
  var string = Parser.string;
  var regex = Parser.regex;
  var letter = Parser.letter;
  var any = Parser.any;

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
    test('with a parser, uses the previous return value', function() {
      var parser = string('x').skip(string('y'));

      assert.equal(parser.parse('xy'), 'x');
      assert.throws(function() { parser.parse('x'); });
    });

    test('with a function, uses the previous return value', function() {
      var parser = string('x').skip(function() { return 'y'; });

      assert.equal(parser.parse('x'), 'x');
    });

    test('with a function that returns a parser, '+
         'uses the previous return value', function() {
      var piped;

      var parser = string('x').skip(function(x) {
        piped = x;
        return string('y');
      });

      assert.equal(parser.parse('xy'), 'x');
      assert.equal(piped, 'x');
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

  function assertEqualArray(arr1, arr2) {
    assert.equal(arr1.join(), arr2.join());
  }

  suite('many', function() {
    test('simple case', function() {
      var letters = letter.many();

      assertEqualArray(letters.parse('x'), ['x']);
      assertEqualArray(letters.parse('xyz'), ['x','y','z']);
      assertEqualArray(letters.parse(''), []);
      assert.throws(function() { letters.parse('1'); });
      assert.throws(function() { letters.parse('xyz1'); });
    });

    test('followed by then', function() {
      var parser = string('x').many().then(string('y'));

      assert.equal(parser.parse('y'), 'y');
      assert.equal(parser.parse('xy'), 'y');
      assert.equal(parser.parse('xxxxxy'), 'y');
    });
  });

  suite('times', function() {
    test('zero case', function() {
      var zeroLetters = letter.times(0);

      assertEqualArray(zeroLetters.parse(''), []);
      assert.throws(function() { zeroLetters.parse('x'); });
    });

    test('nonzero case', function() {
      var threeLetters = letter.times(3);

      assertEqualArray(threeLetters.parse('xyz'), ['x', 'y', 'z']);
      assert.throws(function() { threeLetters.parse('xy'); });
      assert.throws(function() { threeLetters.parse('xyzw'); });
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
});
