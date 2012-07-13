suite('parser', function() {
  test('CharParser', function() {
    var parser = CharParser('x');
    assert.equal(parser.parse('x'), 'x');
    assert.throws(function() { parser.parse('y') })
  });

  test('CharParser with a regex', function() {
    var parser = CharParser(/[0-9]/);

    assert.equal(parser.parse('1'), '1');
    assert.equal(parser.parse('4'), '4');
    assert.throws(function() { parser.parse('x'); });
  });

  suite('bind', function() {
    test('with a function that returns a parser, continues with that parser', function() {
      var parser = CharParser('x').bind(function(x) {
        return CharParser('y');
      });

      assert.equal(parser.parse('xy'), 'y');
      assert.throws(function() { parser.parse('x'); });
    });
  });

  suite('then', function() {
    test('with a parser, uses the last return value', function() {
      var parser = CharParser('x').then(CharParser('y'));
      assert.equal(parser.parse('xy'), 'y');
      assert.throws(function() { parser.parse('y'); });
      assert.throws(function() { parser.parse('xz'); });
    });
  });

  suite('pipe', function() {
    test('with a function, passes in the value so far and uses return value', function() {
      var piped;

      var parser = CharParser('x').pipe(function(x) {
        piped = x;
        return 'y';
      });

      assert.equal(parser.parse('x'), 'y')
      assert.equal(piped, 'x');
    });

    test('can use with bind and closure to combine values', function() {
      var parser = CharParser('x').bind(function(x) {
        return CharParser('y').pipe(function(y) {
          return x + y;
        });
      });

      assert.equal(parser.parse('xy'), 'xy');
      assert.throws(function() { parser.parse('x'); });
      assert.throws(function() { parser.parse('y'); });
    });
  });

  suite('skip', function() {
    test('with a parser, uses the previous return value', function() {
      var parser = CharParser('x').skip(CharParser('y'));

      assert.equal(parser.parse('xy'), 'x');
      assert.throws(function() { parser.parse('x'); });
    });

    test('uses the previous return value, even if it was a function', function() {
      var parser = CharParser('x').constResult(function() {
        return 'the right result';
      }).skip(CharParser('y'));

      var result = parser.parse('xy');
      assert.equal(typeof result, 'function');
      assert.equal(result(), 'the right result');
      assert.throws(function() { parser.parse('x'); });
    });
  });

  suite('or', function() {
    test('two parsers', function() {
      var parser = CharParser('x').or(CharParser('y'));

      assert.equal(parser.parse('x'), 'x');
      assert.equal(parser.parse('y'), 'y');
      assert.throws(function() { parser.parse('z') });
    });

    test('with bind', function() {
      var parser = CharParser('\\')
        .bind(function() {
          return CharParser('y')
        }).or(CharParser('z'));

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
      var xs = CharParser('x').many();

      assertEqualArray(xs.parse('x'), ['x']);
      assertEqualArray(xs.parse('xxx'), ['x','x','x']);
      assertEqualArray(xs.parse(''), []);
      assert.throws(function() { xs.parse('y'); });
      assert.throws(function() { xs.parse('xxxy'); });
    });

    test('followed by then', function() {
      var parser = CharParser('x').many().then(CharParser('y'));

      assert.equal(parser.parse('y'), 'y');
      assert.equal(parser.parse('xy'), 'y');
      assert.equal(parser.parse('xxxxxy'), 'y');
    });
  });
});
