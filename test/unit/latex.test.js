suite('latex', function() {
  function assertParsesLatex(str, latex) {
    if (arguments.length < 2) latex = str;

    var result = latexMathParser.parse(str).postOrder('finalizeTree').join('latex');
    assert.equal(result, latex,
      'parsing \''+str+'\', got \''+result+'\', expected \''+latex+'\''
    );
  }

  test('variables', function() {
    assertParsesLatex('xyz');
  });

  test('variables that can be mathbb', function() {
    assertParsesLatex('PNZQRCH');
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
    assertParsesLatex('\\frac{ 1 } 2', '\\frac{1}{2}');

    assert.throws(function() { latexMathParser.parse('\\frac'); });
  });

  test('whitespace', function() {
    assertParsesLatex('  a + b ', 'a+b');
    assertParsesLatex('       ', '');
    assertParsesLatex('', '');
  });

  test('parens', function() {
    var tree = latexMathParser.parse('\\left(123\\right)');

    assert.ok(tree.ends[L] instanceof BracketGroup);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left(123\\right)');
  });

  test('parens with whitespace', function() {
    assertParsesLatex('\\left ( 123 \\right ) ', '\\left(123\\right)');
  });

  test('\\text', function() {
    assertParsesLatex('\\text { lol! } ', '\\text{ lol! }');
    assertParsesLatex('\\text{apples} \\ne \\text{oranges}',
                      '\\text{apples}\\ne \\text{oranges}');
  });

  suite('.latex(...)', function() {
    var mq;
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('basic rendering', function() {
      mq.latex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }');
      assert.equal(mq.latex(), 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
    });

    test('re-rendering', function() {
      mq.latex('a x^2 + b x + c = 0');
      assert.equal(mq.latex(), 'ax^2+bx+c=0');
      mq.latex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }');
      assert.equal(mq.latex(), 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
    });
  });

  suite('\\MathQuillMathField', function() {
    var outer, inner1, inner2;
    setup(function() {
      outer = MathQuill.StaticMath(
        $('<span>\\frac{\\MathQuillMathField{x_0 + x_1 + x_2}}{\\MathQuillMathField{3}}</span>')
        .appendTo('#mock')[0]
      );
      inner1 = MathQuill($(outer.el()).find('.mathquill-editable:first')[0]);
      inner2 = MathQuill($(outer.el()).find('.mathquill-editable:last')[0]);
    });
    teardown(function() {
      $(outer.el()).remove();
    });

    test('initial latex', function() {
      assert.equal(inner1.latex(), 'x_0+x_1+x_2');
      assert.equal(inner2.latex(), '3');
      assert.equal(outer.latex(), '\\frac{x_0+x_1+x_2}{3}');
    });

    test('setting latex', function() {
      inner1.latex('\\sum_{i=0}^N x_i');
      inner2.latex('N');
      assert.equal(inner1.latex(), '\\sum_{i=0}^Nx_i');
      assert.equal(inner2.latex(), 'N');
      assert.equal(outer.latex(), '\\frac{\\sum_{i=0}^Nx_i}{N}');
    });

    test('writing latex', function() {
      inner1.write('+ x_3');
      inner2.write('+ 1');
      assert.equal(inner1.latex(), 'x_0+x_1+x_2+x_3');
      assert.equal(inner2.latex(), '3+1');
      assert.equal(outer.latex(), '\\frac{x_0+x_1+x_2+x_3}{3+1}');
    });
  });

  suite('error handling', function() {
    var mq;
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    function testCantParse(title /*, latex...*/) {
      var latex = [].slice.call(arguments, 1);
      test(title, function() {
        for (var i = 0; i < latex.length; i += 1) {
          mq.latex(latex[i]);
          assert.equal(mq.latex(), '', "shouldn\'t parse '"+latex[i]+"'");
        }
      });
    }

    testCantParse('missing blocks', '\\frac', '\\sqrt', '^', '_');
    testCantParse('unmatched close brace', '}', ' 1 + 2 } ', '1 - {2 + 3} }', '\\sqrt{ x }} + \\sqrt{y}');
    testCantParse('unmatched open brace', '{', '1 * { 2 + 3', '\\frac{ \\sqrt x }{{ \\sqrt y}');
    testCantParse('unmatched \\left/\\right', '\\left ( 1 + 2 )', ' [ 1, 2 \\right ]');
  });
});
