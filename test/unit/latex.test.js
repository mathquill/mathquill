suite('latex', function() {
  function assertParsesLatex(str, latex) {
    if (arguments.length < 2) latex = str;

    var result = latexMathParser.parse(str).join('latex');
    assert.equal(result, latex,
      'parsing \''+str+'\', got \''+result+'\', expected \''+latex+'\''
    );
  }

  test('variables', function() {
    assertParsesLatex('xyz');
  });

  test('simple exponent', function() {
    assertParsesLatex('x^n');
  });

  test('block exponent', function() {
    assertParsesLatex('x^{n}', 'x^n');
    assertParsesLatex('x^{nm}');
    assertParsesLatex('x^{}', 'x^{ }');
  });

  test('nested exponents', function() {
    assertParsesLatex('x^{n^m}');
  });

  test('exponents with spaces', function() {
    assertParsesLatex('x^ 2', 'x^2');

    assertParsesLatex('x ^2', 'x^2');
  });

  test('inner groups', function() {
    assertParsesLatex('a{bc}d', 'abcd');
    assertParsesLatex('{bc}d', 'bcd');
    assertParsesLatex('a{bc}', 'abc');
    assertParsesLatex('{bc}', 'bc');

    assertParsesLatex('x^{a{bc}d}', 'x^{abcd}');
    assertParsesLatex('x^{a{bc}}', 'x^{abc}');
    assertParsesLatex('x^{{bc}}', 'x^{bc}');
    assertParsesLatex('x^{{bc}d}', 'x^{bcd}');

    assertParsesLatex('{asdf{asdf{asdf}asdf}asdf}', 'asdfasdfasdfasdfasdf');
  });

  test('commands without braces', function() {
    assertParsesLatex('\\frac12', '\\frac{1}{2}');
    assertParsesLatex('\\frac1a', '\\frac{1}{a}');
    assertParsesLatex('\\frac ab', '\\frac{a}{b}');

    assertParsesLatex('\\frac a b', '\\frac{a}{b}');
    assertParsesLatex(' \\frac a b ', '\\frac{a}{b}');
    assertParsesLatex('\\frac{1} 2', '\\frac{1}{2}');

    assert.throws(function() { latexMathParser.parse('\\frac'); });
  });

  test('whitespace', function() {
    assertParsesLatex('  a + b ', 'a+b');
    assertParsesLatex('       ', '');
    assertParsesLatex('', '');
  });
});
