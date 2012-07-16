suite('latex', function() {
  function parseRoot(str) { return latexParser.parse(str); }

  function assertParsesLatex(parser, str, latex) {
    if (!latex) latex = str;

    var result = parser(str).join('latex');
    assert.equal(result, latex,
      'parsing '+str+', got '+result+', expected '+latex
    );
  }

  test('variables', function() {
    assertParsesLatex(parseRoot, 'xyz');
  });

  test('simple exponent', function() {
    assertParsesLatex(parseRoot, 'x^n');
  });

  test('block exponent', function() {
    assertParsesLatex(parseRoot, 'x^{n}', 'x^n');
    assertParsesLatex(parseRoot, 'x^{nm}');
    assertParsesLatex(parseRoot, 'x^{}', 'x^{ }');
  });

  test('nested exponents', function() {
    assertParsesLatex(parseRoot, 'x^{n^m}');
  });
});
