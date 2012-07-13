suite('latex', function() {
  test('CharParser', function() {
    var parser = CharParser('x');
    assert.equal(parser.parse('x'), 'x');
    assert.throws(function() { parser.parse('y') })
  });

  test('CharClassParser', function() {
    var parser = CharClassParser(/[0-9]/);

    assert.equal(parser.parse('1'), '1');
    assert.equal(parser.parse('4'), '4');
    assert.throws(function() { parser.parse('x'); });
  });

  suite('then', function() {
    test('with a parser, uses the last return value', function() {
      var parser = CharParser('x').then(CharParser('y'));
      assert.equal(parser.parse('xy'), 'y');
      assert.throws(function() { parser.parse('y'); });
      assert.throws(function() { parser.parse('xz'); });
    });

    test('with a function, pipes the value in and uses that return value', function() {
      var piped;

      var parser = CharParser('x').then(function(x) {
        piped = x;
        return 'y';
      });

      assert.equal(parser.parse('x'), 'y')
      assert.equal(piped, 'x');
    });

    test('with a function that returns a parser, continues with that parser', function() {
      var parser = CharParser('x').then(function(x) {
        return CharParser('y');
      });

      assert.equal(parser.parse('xy'), 'y');
      assert.throws(function() { parser.parse('x'); });
    });
  });

  suite('after', function() {
    test('with a parser, uses the previous return value', function() {
      var parser = CharParser('x').after(CharParser('y'));

      assert.equal(parser.parse('xy'), 'x');
      assert.throws(function() { parser.parse('x'); });
    });

    test('with a function, uses the previous return value', function() {
      var parser = CharParser('x').after(function() { return 'y'; });

      assert.equal(parser.parse('x'), 'x');
    });

    test('with a function that returns a parser, '+
         'uses the previous return value', function() {
      var piped;

      var parser = CharParser('x').after(function(x) {
        piped = x;
        return CharParser('y');
      });

      assert.equal(parser.parse('xy'), 'x');
      assert.equal(piped, 'x');
    });
  });

  suite('or', function() {
    test('two parsers', function() {
      var parser = CharParser('x').or(CharParser('y'));

      assert.equal(parser.parse('x'), 'x');
      assert.equal(parser.parse('y'), 'y');
      assert.throws(function() { parser.parse('z') });
    });

    test('with then', function() {
      var parser = CharParser('\\')
        .then(function() {
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
  });
});
