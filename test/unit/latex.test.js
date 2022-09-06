suite('latex', function() {
  function assertParsesLatex(str, latex) {
    if (arguments.length < 2) latex = str;

    var result = latexMathParser.parse(str).postOrder('finalizeTree', Options.p).join('latex');
    assert.equal(result, latex,
      'parsing \''+str+'\', got \''+result+'\', expected \''+latex+'\''
    );
  }

  test('empty LaTeX', function () {
    assertParsesLatex('');
    assertParsesLatex(' ', '');
    assertParsesLatex('{}', '');
    assertParsesLatex('   {}{} {{{}}  }', '');
  });

  test('variables', function() {
    assertParsesLatex('xyz');
  });

  test('variables that can be mathbb', function() {
    assertParsesLatex('PNZQRCH');
  });

  test('can parse mathbb symbols', function() {
    assertParsesLatex('\\P\\N\\Z\\Q\\R\\C\\H',
        '\\mathbb{P}\\mathbb{N}\\mathbb{Z}\\mathbb{Q}\\mathbb{R}\\mathbb{C}\\mathbb{H}');
    assertParsesLatex('\\mathbb{P}\\mathbb{N}\\mathbb{Z}\\mathbb{Q}\\mathbb{R}\\mathbb{C}\\mathbb{H}');
  });

  test('can parse mathbb error case', function() {
    assert.throws(function() { assertParsesLatex('\\mathbb + 2'); });
    assert.throws(function() { assertParsesLatex('\\mathbb{A}'); });
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

    assert.ok(tree.ends[L] instanceof Bracket);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left(123\\right)');
  });

  test('\\langle/\\rangle (issue #508)', function() {
    var tree = latexMathParser.parse('\\left\\langle 123\\right\\rangle)');

    assert.ok(tree.ends[L] instanceof Bracket);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left\\langle 123\\right\\rangle )');
  });

  test('\\langle/\\rangle (without whitespace)', function() {
    var tree = latexMathParser.parse('\\left\\langle123\\right\\rangle)');

    assert.ok(tree.ends[L] instanceof Bracket);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left\\langle 123\\right\\rangle )');
  });

  test('\\lVert/\\rVert', function() {
    var tree = latexMathParser.parse('\\left\\lVert 123\\right\\rVert)');

    assert.ok(tree.ends[L] instanceof Bracket);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left\\lVert 123\\right\\rVert )');
  });

  test('\\lVert/\\rVert (without whitespace)', function() {
    var tree = latexMathParser.parse('\\left\\lVert123\\right\\rVert)');

    assert.ok(tree.ends[L] instanceof Bracket);
    var contents = tree.ends[L].ends[L].join('latex');
    assert.equal(contents, '123');
    assert.equal(tree.join('latex'), '\\left\\lVert 123\\right\\rVert )');
  });

  test('\\langler should not parse', function() {
    assert.throws(function () {
      latexMathParser.parse('\\left\\langler123\\right\\rangler');
    })
  });

  test('\\lVerte should not parse', function() {
    assert.throws(function () {
      latexMathParser.parse('\\left\\lVerte123\\right\\rVerte');
    })
  });

  test('parens with whitespace', function() {
    assertParsesLatex('\\left ( 123 \\right ) ', '\\left(123\\right)');
  });

  test('escaped whitespace', function() {
    assertParsesLatex('\\ ', '\\ ');
    assertParsesLatex('\\      ', '\\ ');
    assertParsesLatex('  \\   \\\t\t\t\\   \\\n\n\n', '\\ \\ \\ \\ ');
    assertParsesLatex('\\space\\   \\   space  ', '\\ \\ \\ space');
  });

  test('\\text', function() {
    assertParsesLatex('\\text { lol! } ', '\\text{ lol! }');
    assertParsesLatex('\\text{apples} \\ne \\text{oranges}',
                      '\\text{apples}\\ne \\text{oranges}');
    assertParsesLatex('\\text{}', '');
  });

  test('\\textcolor', function() {
    assertParsesLatex('\\textcolor{blue}{8}', '\\textcolor{blue}{8}');
  });

  test('\\class', function() {
    assertParsesLatex('\\class{name}{8}', '\\class{name}{8}');
    assertParsesLatex('\\class{name}{8-4}', '\\class{name}{8-4}');
  });

  test('not real LaTex commands, but valid symbols', function() {
    assertParsesLatex('\\parallelogram ');
    assertParsesLatex('\\circledot ', '\\odot ');
    assertParsesLatex('\\degree ');
    assertParsesLatex('\\square ');
  });

  suite('public API', function() {
    var mq;
    setup(function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    });

    suite('.latex(...)', function() {
      function assertParsesLatex(str, latex) {
        if (arguments.length < 2) latex = str;
        mq.latex(str);
        assert.equal(mq.latex(), latex);
      }

      test('basic rendering', function() {
        assertParsesLatex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }',
                          'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
      });

      test('re-rendering', function() {
        assertParsesLatex('a x^2 + b x + c = 0', 'ax^2+bx+c=0');
        assertParsesLatex('x = \\frac{ -b \\pm \\sqrt{ b^2 - 4ac } }{ 2a }',
                          'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
      });

      test('empty LaTeX', function () {
        assertParsesLatex('');
        assertParsesLatex(' ', '');
        assertParsesLatex('{}', '');
        assertParsesLatex('   {}{} {{{}}  }', '');
      });

      test('coerces to a string', function () {
        assertParsesLatex(undefined, 'undefined');
        assertParsesLatex(null, 'null');
        assertParsesLatex(0, '0');
        assertParsesLatex(Infinity, 'Infinity');
        assertParsesLatex(NaN, 'NaN');
        assertParsesLatex(true, 'true');
        assertParsesLatex(false, 'false');
        assertParsesLatex({}, '[objectObject]'); // lol, the space gets ignored
        assertParsesLatex({toString: function() { return 'thing'; }}, 'thing');
      });
    });

    suite('.write(...)', function() {
      test('empty LaTeX', function () {
        function assertParsesLatex(str, latex) {
          if (arguments.length < 2) latex = str;
          mq.write(str);
          assert.equal(mq.latex(), latex);
        }
        assertParsesLatex('');
        assertParsesLatex(' ', '');
        assertParsesLatex('{}', '');
        assertParsesLatex('   {}{} {{{}}  }', '');
      });

      test('overflow triggers automatic horizontal scroll', function(done) {
        var mqEl = mq.el();
        var rootEl = mq.__controller.root.jQ[0];
        var cursor = mq.__controller.cursor;

        $(mqEl).width(10);
        var previousScrollLeft = rootEl.scrollLeft;

        mq.write("abc");
        setTimeout(afterScroll, 150);

        function afterScroll() {
          cursor.show();

          try {
            assert.ok(rootEl.scrollLeft > previousScrollLeft, "scrolls on write");
            assert.ok(mqEl.getBoundingClientRect().right > cursor.jQ[0].getBoundingClientRect().right,
              "cursor right end is inside the field");
          }
          catch(error) {
            done(error);
            return;
          }

          done();
        }
      });

      suite('\\sum', function() {
        test('basic', function() {
          mq.write('\\sum_{n=0}^5');
          assert.equal(mq.latex(), '\\sum_{n=0}^5');
          mq.write('x^n');
          assert.equal(mq.latex(), '\\sum_{n=0}^5x^n');
        });

        test('only lower bound', function() {
          mq.write('\\sum_{n=0}');
          assert.equal(mq.latex(), '\\sum_{n=0}^{ }');
          mq.write('x^n');
          assert.equal(mq.latex(), '\\sum_{n=0}^{ }x^n');
        });

        test('only upper bound', function() {
          mq.write('\\sum^5');
          assert.equal(mq.latex(), '\\sum_{ }^5');
          mq.write('x^n');
          assert.equal(mq.latex(), '\\sum_{ }^5x^n');
        });
      });

      suite('\\lim', function() {
        test('empty', function() {
          mq.latex('\\lim');
          assert.equal(mq.latex(), '\\lim_{ }');

          mq.keystroke('Left').typedText('x');
          assert.equal(mq.latex(), '\\lim_x');
        });

        test('nonempty', function() {
          mq.latex('\\lim_x');
          assert.equal(mq.latex(), '\\lim_x');

          mq.keystroke('Left').typedText('y');
          assert.equal(mq.latex(), '\\lim_{xy}');
        });
      });
    });
  });

  suite('\\MathQuillMathField', function() {
    var outer, inner1, inner2;
    setup(function() {
      outer = MQ.StaticMath(
        $('<span>\\frac{\\MathQuillMathField{x_0 + x_1 + x_2}}{\\MathQuillMathField{3}}</span>')
        .appendTo('#mock')[0]
      );
      inner1 = outer.innerFields[0];
      inner2 = outer.innerFields[1];
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

    test('optional inner field name', function() {
      outer.latex('\\MathQuillMathField[mantissa]{}\\cdot\\MathQuillMathField[base]{}^{\\MathQuillMathField[exp]{}}');
      assert.equal(outer.innerFields.length, 3);

      var mantissa = outer.innerFields.mantissa;
      var base = outer.innerFields.base;
      var exp = outer.innerFields.exp;

      assert.equal(mantissa, outer.innerFields[0]);
      assert.equal(base, outer.innerFields[1]);
      assert.equal(exp, outer.innerFields[2]);

      mantissa.latex('1.2345');
      base.latex('10');
      exp.latex('8');
      assert.equal(outer.latex(), '1.2345\\cdot10^8');
    });

    test('make inner field static and then editable', function() {
      outer.latex('y=\\MathQuillMathField[m]{\\textcolor{blue}{m}}x+\\MathQuillMathField[b]{b}');
      assert.equal(outer.innerFields.length, 2);
      // assert.equal(outer.innerFields.m.__controller.container, false);

      outer.innerFields.m.makeStatic();
      assert.equal(outer.innerFields.m.__controller.editable, false);
      assert.equal(outer.innerFields.m.__controller.container.hasClass('mq-editable-field'), false);
      assert.equal(outer.innerFields.b.__controller.editable, true);

      //ensure no errors in making static field static
      outer.innerFields.m.makeStatic();
      assert.equal(outer.innerFields.m.__controller.editable, false);
      assert.equal(outer.innerFields.m.__controller.container.hasClass('mq-editable-field'), false);
      assert.equal(outer.innerFields.b.__controller.editable, true);

      outer.innerFields.m.makeEditable();
      assert.equal(outer.innerFields.m.__controller.editable, true);
      assert.equal(outer.innerFields.m.__controller.container.hasClass('mq-editable-field'), true);
      assert.equal(outer.innerFields.b.__controller.editable, true);

      //ensure no errors with making editable field editable
      outer.innerFields.m.makeEditable();
      assert.equal(outer.innerFields.m.__controller.editable, true);
      assert.equal(outer.innerFields.m.__controller.container.hasClass('mq-editable-field'), true);
      assert.equal(outer.innerFields.b.__controller.editable, true);
    });

    test('separate API object', function() {
      var outer2 = MQ(outer.el());
      assert.equal(outer2.innerFields.length, 2);
      assert.equal(outer2.innerFields[0].id, inner1.id);
      assert.equal(outer2.innerFields[1].id, inner2.id);
    });
  });

  suite('error handling', function() {
    var mq;
    setup(function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
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
    testCantParse('langlerfish/ranglerfish (checking for confusion with langle/rangle)',
		    '\\left\\langlerfish 123\\right\\ranglerfish)');
  });

  suite('selectable span', function() {
    setup(function() {
      MQ.StaticMath($('<span>2&lt;x</span>').appendTo('#mock')[0]);
    });

    function selectableContent() {
      return document.querySelector('#mock .mq-selectable').textContent;
    }

    test('escapes < in textContent', function () {
      assert.equal(selectableContent(), '$2<x$');
    });
  });
});
