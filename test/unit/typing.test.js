suite('typing with auto-replaces', function () {
  var mq, mostRecentlyReportedLatex;
  setup(function () {
    mostRecentlyReportedLatex = NaN; // != to everything
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
      handlers: {
        edit: function () {
          mostRecentlyReportedLatex = mq.latex();
        },
      },
    });
  });

  function prayWellFormedPoint(pt) {
    prayWellFormed(pt.parent, pt[L], pt[R]);
  }
  function assertLatex(latex) {
    prayWellFormedPoint(mq.__controller.cursor);
    assert.equal(mostRecentlyReportedLatex, latex);
    assert.equal(mq.latex(), latex);
  }

  function assertMathspeak(mathspeak) {
    assert.equal(normalize(mq.mathspeak()), normalize(mathspeak));
    function normalize(str) {
      return str
        .replace(/\d(?!\d)/g, '$& ')
        .split(/[ ,]+/)
        .join(' ')
        .trim();
    }
  }

  suite('LiveFraction', function () {
    test('full MathQuill', function () {
      mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
      assertLatex('\\frac{1}{2}+\\frac{\\sin x}{ }');
      mq.latex('').typedText('1+/2');
      assertLatex('1+\\frac{2}{ }');
      mq.latex('').typedText('1 2/3');
      assertLatex('1\\ \\frac{2}{3}');
    });

    test('mathquill-basic', function () {
      var mq_basic = MQBasic.MathField($('<span></span>').appendTo('#mock')[0]);
      mq_basic.typedText('1/2');
      assert.equal(mq_basic.latex(), '\\frac{1}{2}');
    });
  });

  suite('EquivalentMinus', function () {
    test('different minus symbols', function () {
      //these 4 are all different characters (!!)
      mq.typedText('−—–-');
      //these 4 are all the same character
      assertLatex('----');
    });
  });

  suite('LatexCommandInput', function () {
    test('basic', function () {
      mq.typedText('\\sqrt-x');
      assertLatex('\\sqrt{-x}');
    });

    test("they're passed their name", function () {
      mq.cmd('\\alpha');
      assert.equal(mq.latex(), '\\alpha');
    });

    test('replaces selection', function () {
      mq.typedText('49').select().typedText('\\sqrt').keystroke('Enter');
      assertLatex('\\sqrt{49}');
    });

    test('auto-operator names', function () {
      mq.typedText('\\sin^2');
      assertLatex('\\sin^{2}');
    });

    test('nonexistent LaTeX command', function () {
      mq.typedText('\\asdf').keystroke('Enter');
      assertLatex('\\text{asdf}');
    });

    test('nonexistent LaTeX command, then symbol', function () {
      mq.typedText('\\asdf+');
      assertLatex('\\text{asdf}+');
    });

    test('dollar sign', function () {
      mq.typedText('$');
      assertLatex('\\$');
    });

    test('\\text followed by command', function () {
      mq.typedText('\\text{');
      assertLatex('\\text{\\{}');
    });
  });

  suite('MathspeakShorthand', function () {
    test('fractions', function () {
      // Testing singular numeric fractions from 1/2 to 1/10
      mq.latex('\\frac{1}{2}');
      assertMathspeak('1 half');
      mq.latex('\\frac{1}{3}');
      assertMathspeak('1 third');
      mq.latex('\\frac{1}{4}');
      assertMathspeak('1 quarter');
      mq.latex('\\frac{1}{5}');
      assertMathspeak('1 fifth');
      mq.latex('\\frac{1}{6}');
      assertMathspeak('1 sixth');
      mq.latex('\\frac{1}{7}');
      assertMathspeak('1 seventh');
      mq.latex('\\frac{1}{8}');
      assertMathspeak('1 eighth');
      mq.latex('\\frac{1}{9}');
      assertMathspeak('1 ninth');
      mq.latex('\\frac{1}{10}');
      assertMathspeak('StartFraction, 1 Over 10, EndFraction');

      // Testing plural numeric fractions from 31/2 to 31/10
      mq.latex('\\frac{31}{2}');
      assertMathspeak('31 halves');
      mq.latex('\\frac{31}{3}');
      assertMathspeak('31 thirds');
      mq.latex('\\frac{31}{4}');
      assertMathspeak('31 quarters');
      mq.latex('\\frac{31}{5}');
      assertMathspeak('31 fifths');
      mq.latex('\\frac{31}{6}');
      assertMathspeak('31 sixths');
      mq.latex('\\frac{31}{7}');
      assertMathspeak('31 sevenths');
      mq.latex('\\frac{31}{8}');
      assertMathspeak('31 eighths');
      mq.latex('\\frac{31}{9}');
      assertMathspeak('31 ninths');
      mq.latex('\\frac{31}{10}');
      assertMathspeak('StartFraction, 31 Over 10, EndFraction');

      // Fractions with negative numerators should be shortened
      mq.latex('\\frac{-1}{2}');
      assertMathspeak('negative 1 half');
      mq.latex('\\frac{-3}{2}');
      assertMathspeak('negative 3 halves');
      mq.latex('-\\frac{3}{4}');
      assertMathspeak('negative 3 quarters');

      // Fractions with negative denominators should not be shortened
      mq.latex('\\frac{1}{-2}');
      assertMathspeak('StartFraction, 1 Over negative 2, EndFraction');

      // Traditional fractions should be spoken if either numerator or denominator are not numeric
      mq.latex('\\frac{x}{2}');
      assertMathspeak('StartFraction, "x" Over 2, EndFraction');
      mq.latex('\\frac{2}{x}');
      assertMathspeak('StartFraction, 2 Over "x", EndFraction');

      // Traditional fractions should be spoken if either numerator or denominator are not whole numbers
      mq.latex('\\frac{1.2}{2}');
      assertMathspeak('StartFraction, 1.2 Over 2, EndFraction');
      mq.latex('\\frac{4}{2.3}');
      assertMathspeak('StartFraction, 4 Over 2.3, EndFraction');

      // A whole number followed by a shortened fraction should include the word "and", and other combinations should not.
      mq.latex('3\\frac{3}{8}');
      assertMathspeak('3 and 3 eighths');
      mq.latex('3\\ \\frac{3}{8}');
      assertMathspeak('3 and 3 eighths');
      mq.latex('3\\ \\ \\ \\ \\ \\frac{3}{8}');
      assertMathspeak('3 and 3 eighths');
      mq.latex('3.1\\frac{3}{8}');
      assertMathspeak('3.1 3 eighths');
      mq.latex('3.1\\ \\frac{3}{8}');
      assertMathspeak('3.1 3 eighths');
      mq.latex('3.1\\ \\ \\ \\ \\frac{3}{8}');
      assertMathspeak('3.1 3 eighths');
      mq.latex('\\ \\frac{1}{2}');
      assertMathspeak('1 half');
      mq.latex('3\\frac{3}{x}');
      assertMathspeak('3 StartFraction, 3 Over "x", EndFraction');
      mq.latex('x\\frac{3}{8}');
      assertMathspeak('"x" 3 eighths');
    });

    test('exponents', function () {
      // Test simple superscripts and suffix rules
      mq.latex('x^{0}');
      assertMathspeak('"x" to the 0 power');
      mq.latex('x^{1}');
      assertMathspeak('"x" to the 1st power');
      mq.latex('x^{2}');
      assertMathspeak('"x" squared');
      mq.latex('x^{3}');
      assertMathspeak('"x" cubed');
      mq.latex('x^{4}');
      assertMathspeak('"x" to the 4th power');
      mq.latex('x^{5}');
      assertMathspeak('"x" to the 5th power');
      mq.latex('x^{6}');
      assertMathspeak('"x" to the 6th power');
      mq.latex('x^{7}');
      assertMathspeak('"x" to the 7th power');
      mq.latex('x^{8}');
      assertMathspeak('"x" to the 8th power');
      mq.latex('x^{9}');
      assertMathspeak('"x" to the 9th power');
      mq.latex('x^{10}');
      assertMathspeak('"x" to the 10th power');
      mq.latex('x^{11}');
      assertMathspeak('"x" to the 11th power');
      mq.latex('x^{12}');
      assertMathspeak('"x" to the 12th power');
      mq.latex('x^{13}');
      assertMathspeak('"x" to the 13th power');
      mq.latex('x^{14}');
      assertMathspeak('"x" to the 14th power');
      mq.latex('x^{21}');
      assertMathspeak('"x" to the 21st power');
      mq.latex('x^{22}');
      assertMathspeak('"x" to the 22nd power');
      mq.latex('x^{23}');
      assertMathspeak('"x" to the 23rd power');
      mq.latex('x^{999}');
      assertMathspeak('"x" to the 999th power');
      // Values greater than 1000 have no suffix
      mq.latex('x^{1000}');
      assertMathspeak('"x" to the 1000 power');
      mq.latex('x^{10000000000}');
      assertMathspeak('"x" to the 10000000000 power');

      // Ensure negative exponents are shortened
      mq.latex('10^{-5}');
      assertMathspeak('10 to the negative 5th power');
      mq.latex('x^{-5}');
      assertMathspeak('"x" to the negative 5th power');

      // Superscripts that are not strictly integers should continue to be spoken in longer form
      mq.latex('x^{5.3}');
      assertMathspeak('"x" Superscript, 5.3, Baseline');
      mq.latex('x^{y}');
      assertMathspeak('"x" Superscript, "y", Baseline');
      mq.latex('x^{y^{2}}');
      assertMathspeak('"x" Superscript, "y" squared, Baseline');
    });

    test('plus and minus differentiation', function () {
      // Distinguish between positive vs plus and negative vs. minus
      mq.latex('-25-25');
      assertMathspeak('negative 25 minus 25');
      mq.latex('+25+25');
      assertMathspeak('positive 25 plus 25');
    });

    test('styled text', function () {
      // Test that text-related elements include sensible mathspeak.
      // Letters in a non-wrapped block should be split apart (interpreted as variables):
      mq.latex('this is a test');
      assertMathspeak('"t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t"');
      // Contents of a text block should be returned exactly as entered with no start and end delimiters spoken:
      mq.latex('\\text{this is a test}');
      assertMathspeak('this is a test');
      // Specifically for mathrm, don't split characters and also don't speak delimiters.
      // note content is still interpreted as LaTeX, so we use \ to separate words:
      mq.latex('\\mathrm{this\\ is\\ a\\ test}');
      assertMathspeak('this is a test');
      // Any other font command should be spoken "normally"--
      // letters are split and delimiters are announced for remaining commands:
      mq.latex('\\mathit{this\\ is\\ a\\ test}');
      assertMathspeak(
        'StartItalic Font "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" EndItalic Font'
      );
      mq.latex('\\textcolor{red}{this\\ is\\ a\\ test}');
      assertMathspeak(
        'Start red "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" End red'
      );
      mq.latex('\\class{abc}{this\\ is\\ a\\ test}');
      assertMathspeak(
        'Start abc class "t" "h" "i" "s" "i" "s" "a" "t" "e" "s" "t" End abc class'
      );
    });
  });

  suite('auto-expanding parens', function () {
    suite('simple', function () {
      test('empty parens ()', function () {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(')');
        assertLatex('\\left(\\right)');
      });

      test('straight typing 1+(2+3)+4', function () {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
      });

      test('basic command \\sin(', function () {
        mq.typedText('\\sin(');
        assertLatex('\\sin\\left(\\right)');
      });

      test('wrapping things in parens 1+(2+3)+4', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right)+4');
      });

      test('nested parens 1+(2+(3+4)+5)+6', function () {
        mq.typedText('1+(2+(3+4)+5)+6');
        assertLatex('1+\\left(2+\\left(3+4\\right)+5\\right)+6');
      });
    });

    suite('mismatched brackets', function () {
      test('empty mismatched brackets (] and [}', function () {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(']');
        assertLatex('\\left(\\right]');
        mq.typedText('[');
        assertLatex('\\left(\\right]\\left[\\right]');
        mq.typedText('}');
        assertLatex('\\left(\\right]\\left[\\right\\}');
      });

      test('typing mismatched brackets 1+(2+3]+4', function () {
        mq.typedText('1+');
        assertLatex('1+');
        mq.typedText('(');
        assertLatex('1+\\left(\\right)');
        mq.typedText('2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText(']+4');
        assertLatex('1+\\left(2+3\\right]+4');
      });

      test('wrapping things in mismatched brackets 1+(2+3]+4', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right]+4');
      });

      test('nested mismatched brackets 1+(2+[3+4)+5]+6', function () {
        mq.typedText('1+(2+[3+4)+5]+6');
        assertLatex('1+\\left(2+\\left[3+4\\right)+5\\right]+6');
      });

      suite('restrictMismatchedBrackets', function () {
        setup(function () {
          mq.config({ restrictMismatchedBrackets: true });
        });
        test('typing (|x|+1) works', function () {
          mq.typedText('(|x|+1)');
          assertLatex('\\left(\\left|x\\right|+1\\right)');
        });
        test('typing [x} becomes [{x}]', function () {
          mq.typedText('[x}');
          assertLatex('\\left[\\left\\{x\\right\\}\\right]');
        });
        test('normal matching pairs {f(n), [a,b]} work', function () {
          mq.typedText('{f(n), [a,b]}');
          assertLatex(
            '\\left\\{f\\left(n\\right),\\ \\left[a,b\\right]\\right\\}'
          );
        });
        test('[a,b) and (a,b] still work', function () {
          mq.typedText('[a,b) + (a,b]');
          assertLatex('\\left[a,b\\right)\\ +\\ \\left(a,b\\right]');
        });
      });
    });

    suite('pipes', function () {
      test('empty pipes ||', function () {
        mq.typedText('|');
        assertLatex('\\left|\\right|');
        mq.typedText('|');
        assertLatex('\\left|\\right|');
      });

      test('straight typing 1+|2+3|+4', function () {
        mq.typedText('1+|2+3|+4');
        assertLatex('1+\\left|2+3\\right|+4');
      });

      test('wrapping things in pipes 1+|2+3|+4', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Home Right Right').typedText('|');
        assertLatex('1+\\left|2+3+4\\right|');
        mq.keystroke('Right Right Right').typedText('|');
        assertLatex('1+\\left|2+3\\right|+4');
      });

      suite('can type mismatched paren/pipe group from any side', function () {
        suite('straight typing', function () {
          test('|)', function () {
            mq.typedText('|)');
            assertLatex('\\left|\\right)');
          });

          test('(|', function () {
            mq.typedText('(|');
            assertLatex('\\left(\\right|');
          });
        });

        suite('the other direction', function () {
          test('|)', function () {
            mq.typedText(')');
            assertLatex('\\left(\\right)');
            mq.keystroke('Left').typedText('|');
            assertLatex('\\left|\\right)');
          });

          test('(|', function () {
            mq.typedText('||');
            assertLatex('\\left|\\right|');
            mq.keystroke('Left Left Del');
            assertLatex('\\left|\\right|');
            mq.typedText('(');
            assertLatex('\\left(\\right|');
          });
        });
      });
    });

    suite('backspacing', backspacingTests);

    suite('backspacing with restrictMismatchedBrackets', function () {
      setup(function () {
        mq.config({ restrictMismatchedBrackets: true });
      });

      backspacingTests();
    });

    function backspacingTests() {
      test('typing then backspacing a close-paren in the middle of 1+2+3+4', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-paren then open-paren of 1+(2+3)+4', function () {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open-paren of 1+(2+3)+4', function () {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-bracket then open-paren of 1+(2+3]+4', function () {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open-paren of 1+(2+3]+4', function () {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-bracket then open-paren of 1+(2+3] (nothing after paren group)', function () {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing open-paren of 1+(2+3] (nothing after paren group)', function () {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Left Left Left Left Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing close-bracket then open-paren of (2+3]+4 (nothing before paren group)', function () {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('2+3+4');
      });

      test('backspacing open-paren of (2+3]+4 (nothing before paren group)', function () {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('2+3+4');
      });

      function assertParenBlockNonEmpty() {
        var parenBlock = $(mq.el()).find('.mq-paren+span');
        assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
        assert.ok(
          !parenBlock.hasClass('mq-empty'),
          'paren block auto-expanded, should no longer be gray'
        );
      }

      test('backspacing close-bracket then open-paren of 1+(]+4 (empty paren group)', function () {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(+4\\right)');
        assertParenBlockNonEmpty();
        mq.keystroke('Backspace');
        assertLatex('1++4');
      });

      test('backspacing open-paren of 1+(]+4 (empty paren group)', function () {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1++4');
      });

      test('backspacing close-bracket then open-paren of 1+(] (empty paren group, nothing after)', function () {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(\\right)');
        mq.keystroke('Backspace');
        assertLatex('1+');
      });

      test('backspacing open-paren of 1+(] (empty paren group, nothing after)', function () {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Left Backspace');
        assertLatex('1+');
      });

      test('backspacing close-bracket then open-paren of (]+4 (empty paren group, nothing before)', function () {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(+4\\right)');
        assertParenBlockNonEmpty();
        mq.keystroke('Backspace');
        assertLatex('+4');
      });

      test('backspacing open-paren of (]+4 (empty paren group, nothing before)', function () {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('+4');
      });

      test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing close-bracket then open-paren', function () {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing open-paren', function () {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing close-paren then open-paren', function () {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing open-paren', function () {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens 1+(2+3)+4 then backspacing close-paren then open-paren', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(
          ')'
        );
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens 1+(2+3)+4 then backspacing open-paren', function () {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(
          '('
        );
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-bracket of 1+(2+3] (nothing after) then typing', function () {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText('+4');
        assertLatex('1+\\left(2+3+4\\right)');
      });

      test('backspacing open-paren of (2+3]+4 (nothing before) then typing', function () {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Home Right Backspace');
        assertLatex('2+3+4');
        mq.typedText('1+');
        assertLatex('1+2+3+4');
      });

      test('backspacing paren containing a one-sided paren 0+[(1+2)+3]+4', function () {
        mq.typedText('0+[1+2+3]+4');
        assertLatex('0+\\left[1+2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left').typedText(')');
        assertLatex('0+\\left[\\left(1+2\\right)+3\\right]+4');
        mq.keystroke('Right Right Right Backspace');
        assertLatex('0+\\left[1+2\\right)+3+4');
      });

      test('backspacing paren inside a one-sided paren (0+[1+2]+3)+4', function () {
        mq.typedText('0+[1+2]+3)+4');
        assertLatex('\\left(0+\\left[1+2\\right]+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Backspace');
        assertLatex('0+\\left[1+2+3\\right)+4');
      });

      test('backspacing paren containing and inside a one-sided paren (([1+2]))', function () {
        mq.typedText('(1+2))');
        assertLatex('\\left(\\left(1+2\\right)\\right)');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left(\\left(\\left[1+2\\right]\\right)\\right)');
        mq.keystroke('Right Backspace');
        assertLatex('\\left(\\left(1+2\\right]\\right)');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+2\\right)');
      });

      test('auto-expanding calls .siblingCreated() on new siblings 1+((2+3))', function () {
        mq.typedText('1+((2+3))');
        assertLatex('1+\\left(\\left(2+3\\right)\\right)');
        mq.keystroke('Left Left Left Left Left Left Del');
        assertLatex('1+\\left(\\left(2+3\\right)\\right)');
        mq.keystroke('Left Left Del');
        assertLatex('\\left(1+\\left(2+3\\right)\\right)');
        // now check that the inner open-paren isn't still a ghost
        mq.keystroke('Right Right Right Right Del');
        assertLatex('1+\\left(2+3\\right)');
      });

      test('that unwrapping calls .siblingCreated() on new siblings ((1+2)+(3+4))+5', function () {
        mq.typedText('(1+2+3+4)+5');
        assertLatex('\\left(1+2+3+4\\right)+5');
        mq.keystroke('Home Right Right Right Right').typedText(')');
        assertLatex('\\left(\\left(1+2\\right)+3+4\\right)+5');
        mq.keystroke('Right').typedText('(');
        assertLatex('\\left(\\left(1+2\\right)+\\left(3+4\\right)\\right)+5');
        mq.keystroke('Right Right Right Right Right Backspace');
        assertLatex('\\left(1+2\\right)+\\left(3+4\\right)+5');
        mq.keystroke('Left Left Left Left Backspace');
        assertLatex('\\left(1+2\\right)+3+4+5');
      });

      test('typing Ctrl-Backspace deletes everything to the left of the cursor', function () {
        mq.typedText('12345');
        assertLatex('12345');
        mq.keystroke('Left Left');
        mq.keystroke('Ctrl-Backspace');
        assertLatex('45');
        mq.keystroke('Ctrl-Backspace');
        assertLatex('45');
      });

      test('typing Ctrl-Del deletes everything to the right of the cursor', function () {
        mq.typedText('12345');
        assertLatex('12345');
        mq.keystroke('Left Left');
        mq.keystroke('Ctrl-Del');
        assertLatex('123');
        mq.keystroke('Ctrl-Del');
        assertLatex('123');
      });

      suite('pipes', function () {
        test('typing then backspacing a pipe in the middle of 1+2+3+4', function () {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Left').typedText('|');
          assertLatex('1+2+\\left|3+4\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe then open-pipe of 1+|2+3|+4', function () {
          mq.typedText('1+|2+3|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing open-pipe of 1+|2+3|+4', function () {
          mq.typedText('1+|2+3|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe then open-pipe of 1+|2+3| (nothing after pipe pair)', function () {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3');
        });

        test('backspacing open-pipe of 1+|2+3| (nothing after pipe pair)', function () {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Left Left Left Left Backspace');
          assertLatex('1+2+3');
        });

        test('backspacing close-pipe then open-pipe of |2+3|+4 (nothing before pipe pair)', function () {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('2+3+4');
        });

        test('backspacing open-pipe of |2+3|+4 (nothing before pipe pair)', function () {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('2+3+4');
        });

        function assertParenBlockNonEmpty() {
          var parenBlock = $(mq.el()).find('.mq-paren+span');
          assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
          assert.ok(
            !parenBlock.hasClass('mq-empty'),
            'paren block auto-expanded, should no longer be gray'
          );
        }

        test('backspacing close-pipe then open-pipe of 1+||+4 (empty pipe pair)', function () {
          mq.typedText('1+||+4');
          assertLatex('1+\\left|\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|+4\\right|');
          assertParenBlockNonEmpty();
          mq.keystroke('Backspace');
          assertLatex('1++4');
        });

        test('backspacing open-pipe of 1+||+4 (empty pipe pair)', function () {
          mq.typedText('1+||+4');
          assertLatex('1+\\left|\\right|+4');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1++4');
        });

        test('backspacing close-pipe then open-pipe of 1+|| (empty pipe pair, nothing after)', function () {
          mq.typedText('1+||');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+');
        });

        test('backspacing open-pipe of 1+|| (empty pipe pair, nothing after)', function () {
          mq.typedText('1+||');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Left Backspace');
          assertLatex('1+');
        });

        test('backspacing close-pipe then open-pipe of ||+4 (empty pipe pair, nothing before)', function () {
          mq.typedText('||+4');
          assertLatex('\\left|\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('\\left|+4\\right|');
          assertParenBlockNonEmpty();
          mq.keystroke('Backspace');
          assertLatex('+4');
        });

        test('backspacing open-pipe of ||+4 (empty pipe pair, nothing before)', function () {
          mq.typedText('||+4');
          assertLatex('\\left|\\right|+4');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('+4');
        });

        test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing close-pipe then open-pipe', function () {
          mq.latex('1+\\left|2+3\\right|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing open-pipe', function () {
          mq.latex('1+\\left|2+3\\right|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing close-paren then open-pipe', function () {
          mq.latex('1+\\left|2+3\\right)+4');
          assertLatex('1+\\left|2+3\\right)+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing open-pipe', function () {
          mq.latex('1+\\left|2+3\\right)+4');
          assertLatex('1+\\left|2+3\\right)+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing close-pipe then open-paren', function () {
          mq.latex('1+\\left(2+3\\right|+4');
          assertLatex('1+\\left(2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left(2+3+4\\right)');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing open-paren', function () {
          mq.latex('1+\\left(2+3\\right|+4');
          assertLatex('1+\\left(2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('wrapping selection in pipes 1+|2+3|+4 then backspacing open-pipe', function () {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(
            '|'
          );
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Backspace');
          assertLatex('1+2+3+4');
        });

        test('wrapping selection in pipes 1+|2+3|+4 then backspacing close-pipe then open-pipe', function () {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(
            '|'
          );
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Tab Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe of 1+|2+3| (nothing after) then typing', function () {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|2+3\\right|');
          mq.typedText('+4');
          assertLatex('1+\\left|2+3+4\\right|');
        });

        test('backspacing open-pipe of |2+3|+4 (nothing before) then typing', function () {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Home Right Backspace');
          assertLatex('2+3+4');
          mq.typedText('1+');
          assertLatex('1+2+3+4');
        });

        test('backspacing pipe containing a one-sided pipe 0+|1+|2+3||+4', function () {
          mq.typedText('0+|1+2+3|+4');
          assertLatex('0+\\left|1+2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|\\right|+4');
          mq.keystroke('Shift-Tab Shift-Tab Del');
          assertLatex('0+1+\\left|2+3\\right|+4');
        });

        test('backspacing pipe inside a one-sided pipe 0+|1+|2+3|+4|', function () {
          mq.typedText('0+1+|2+3|+4');
          assertLatex('0+1+\\left|2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
          mq.keystroke('Right Right Del');
          assertLatex('0+\\left|1+2+3\\right|+4');
        });

        test('backspacing pipe containing and inside a one-sided pipe |0+|1+|2+3||+4|', function () {
          mq.typedText('0+|1+2+3|+4');
          assertLatex('0+\\left|1+2+3\\right|+4');
          mq.keystroke('Home').typedText('|');
          assertLatex('\\left|0+\\left|1+2+3\\right|+4\\right|');
          mq.keystroke('Right Right Right Right Right').typedText('|');
          assertLatex('\\left|0+\\left|1+\\left|2+3\\right|\\right|+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('\\left|0+1+\\left|2+3\\right|+4\\right|');
        });

        test('backspacing pipe containing a one-sided pipe facing same way 0+||1+2||+3', function () {
          mq.typedText('0+|1+2|+3');
          assertLatex('0+\\left|1+2\\right|+3');
          mq.keystroke('Home Right Right Right').typedText('|');
          assertLatex('0+\\left|\\left|1+2\\right|\\right|+3');
          mq.keystroke('Tab Tab Backspace');
          assertLatex('0+\\left|\\left|1+2\\right|+3\\right|');
        });

        test('backspacing pipe inside a one-sided pipe facing same way 0+|1+|2+3|+4|', function () {
          mq.typedText('0+1+|2+3|+4');
          assertLatex('0+1+\\left|2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
          mq.keystroke('Right Right Right Right Right Right Right Backspace');
          assertLatex('0+\\left|1+\\left|2+3+4\\right|\\right|');
        });

        test('backspacing open-paren of mismatched paren/pipe group containing a one-sided pipe 0+(1+|2+3||+4', function () {
          mq.latex('0+\\left(1+2+3\\right|+4');
          assertLatex('0+\\left(1+2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left').typedText('|');
          assertLatex('0+\\left(1+\\left|2+3\\right|\\right|+4');
          mq.keystroke('Shift-Tab Shift-Tab Del');
          assertLatex('0+1+\\left|2+3\\right|+4');
        });

        test('backspacing open-paren of mismatched paren/pipe group inside a one-sided pipe 0+|1+(2+3|+4|', function () {
          mq.latex('0+1+\\left(2+3\\right|+4');
          assertLatex('0+1+\\left(2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left(2+3\\right|+4\\right|');
          mq.keystroke('Right Right Del');
          assertLatex('0+\\left|1+2+3\\right|+4');
        });
      });
    }

    suite('typing outside ghost paren', function () {
      test('typing outside ghost paren solidifies ghost 1+(2+3)', function () {
        mq.typedText('1+(2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Right').typedText('+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Left Del');
        assertLatex('\\left(1+2+3\\right)+4');
      });

      test('selected and replaced by LiveFraction solidifies ghosts (1+2)/( )', function () {
        mq.typedText('1+2)/');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
        mq.keystroke('Left Backspace');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
      });

      test('close paren group by typing close-bracket outside ghost paren (1+2]', function () {
        mq.typedText('(1+2');
        assertLatex('\\left(1+2\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+2\\right]');
      });

      test('close adjacent paren group before containing paren group (1+(2+3])', function () {
        mq.typedText('(1+(2+3');
        assertLatex('\\left(1+\\left(2+3\\right)\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right)');
        mq.typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right]');
      });

      test('can type close-bracket on solid side of one-sided paren [](1+2)', function () {
        mq.typedText('(1+2');
        assertLatex('\\left(1+2\\right)');
        mq.moveToLeftEnd().typedText(']');
        assertLatex('\\left[\\right]\\left(1+2\\right)');
      });

      suite('pipes', function () {
        test('close pipe pair from outside to the right |1+2|', function () {
          mq.typedText('|1+2');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Right').typedText('|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Home Del');
          assertLatex('\\left|1+2\\right|');
        });

        test('close pipe pair from outside to the left |1+2|', function () {
          mq.typedText('|1+2|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Home Del');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Left').typedText('|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Ctrl-End Backspace');
          assertLatex('\\left|1+2\\right|');
        });

        test('can type pipe on solid side of one-sided pipe ||||', function () {
          mq.typedText('|');
          assertLatex('\\left|\\right|');
          mq.moveToLeftEnd().typedText('|');
          assertLatex('\\left|\\left|\\right|\\right|');
        });
      });
    });
  });

  suite('autoParenthesizedFunctions', function () {
    var normalConfig = {
      autoParenthesizedFunctions: 'sin cos tan ln',
      autoOperatorNames: 'sin ln',
      autoCommands: 'sum int',
    };
    var subscriptConfig = {
      autoParenthesizedFunctions: 'sin cos tan ln',
      autoOperatorNames: 'sin ln',
      autoCommands: 'sum int',
      disableAutoSubstitutionInSubscripts: true,
    };

    setup(function () {
      mq.config(normalConfig);
    });

    test('individual commands', function () {
      //autoParenthesized and also operatored
      mq.typedText('sin');
      assertLatex('\\sin\\left(\\right)');
      mq.latex('');
      //not parenthesized
      mq.typedText('cot');
      assertLatex('cot');
      mq.latex('');
      //we don't autoparenthesize non-autocommands
      mq.typedText('tan');
      assertLatex('tan');
      mq.latex('');
      //doesn't parenthesize when the middle is completed
      mq.typedText('tn');
      mq.keystroke('Left');
      mq.typedText('a');
      assertLatex('tan');

      mq.latex('');
      //doesn't parenthesize when the middle is completed, but does autoFn
      mq.typedText('sn');
      mq.keystroke('Left');
      mq.typedText('i');
      assertLatex('\\sin');
    });

    test('does not double parenthesize if parenthesized', function () {
      //autoParenthesized and also operatored
      mq.typedText('sin');
      assertLatex('\\sin\\left(\\right)');
      mq.keystroke('Left');
      mq.keystroke('Backspace');
      mq.typedText('n');
      assertLatex('\\sin\\left(\\right)');
    });

    test('works in \\sum', function () {
      mq.typedText('sum');
      assertLatex('\\sum_{ }^{ }');
      mq.typedText('sin');
      assertLatex('\\sum_{\\sin\\left(\\right)}^{ }');
    });

    test('works in \\int', function () {
      mq.typedText('int');
      assertLatex('\\int_{ }^{ }');
      mq.typedText('sin');
      assertLatex('\\int_{\\sin\\left(\\right)}^{ }');
    });

    test('no auto operator names in simple subscripts', function () {
      mq.config(normalConfig);
      mq.typedText('x_');
      assertLatex('x_{ }');
      mq.typedText('sin');
      assertLatex('x_{\\sin\\left(\\right)}');
      mq.latex('');
      mq.config(subscriptConfig);
      mq.typedText('x_');
      assertLatex('x_{ }');
      mq.typedText('sin');
      assertLatex('x_{sin}');
      mq.config(normalConfig);
    });

    test('no auto operator names in simple subscripts when pasting', function () {
      var textarea = $(mq.el()).find('textarea');
      mq.config(normalConfig);
      trigger.paste(textarea[0]);
      textarea.val('x_{sin}');
      trigger.input(textarea[0]);
      assertLatex('x_{\\sin}');
      mq.latex('');
      mq.config(subscriptConfig);
      trigger.paste(textarea[0]);
      textarea.val('x_{sin}');
      trigger.input(textarea[0]);
      assertLatex('x_{sin}');
      mq.config(normalConfig);
    });
  });

  suite('typingSlashCreatesNewFraction', function () {
    setup(function () {
      mq.config({
        typingSlashCreatesNewFraction: true,
      });
    });

    test('typing slash creates new fraction', function () {
      //autoParenthesized and also operatored
      mq.typedText('1/');
      assertLatex('1\\frac{ }{ }');
    });
  });

  suite('autoCommands', function () {
    var normalConfig = {
      autoOperatorNames: 'sin pp',
      autoCommands: 'pi tau phi theta Gamma sum prod sqrt nthroot cbrt percent',
    };
    var subscriptConfig = {
      autoOperatorNames: 'sin pp',
      autoCommands: 'pi tau phi theta Gamma sum prod sqrt nthroot cbrt percent',
      disableAutoSubstitutionInSubscripts: true,
    };

    setup(function () {
      mq.config(normalConfig);
    });

    test('individual commands', function () {
      mq.typedText('sum' + 'n=0');
      mq.keystroke('Up').typedText('100').keystroke('Right');
      assertLatex('\\sum_{n=0}^{100}');
      mq.keystroke('Ctrl-Backspace');

      mq.typedText('prod');
      mq.typedText('n=0').keystroke('Up').typedText('100').keystroke('Right');
      assertLatex('\\prod_{n=0}^{100}');
      mq.keystroke('Ctrl-Backspace');

      mq.typedText('sqrt');
      mq.typedText('100').keystroke('Right');
      assertLatex('\\sqrt{100}');
      mq.keystroke('Ctrl-Backspace');

      mq.typedText('nthroot');
      mq.typedText('n').keystroke('Right').typedText('100').keystroke('Right');
      assertLatex('\\sqrt[n]{100}');
      assertMathspeak('Root Index "n" Start Root 100 End Root');
      mq.keystroke('Ctrl-Backspace');

      mq.typedText('pi');
      assertLatex('\\pi');
      mq.keystroke('Backspace');

      mq.typedText('tau');
      assertLatex('\\tau');
      mq.keystroke('Backspace');

      mq.typedText('phi');
      assertLatex('\\phi');
      mq.keystroke('Backspace');

      mq.typedText('theta');
      assertLatex('\\theta');
      mq.keystroke('Backspace');

      mq.typedText('Gamma');
      assertLatex('\\Gamma');
      mq.keystroke('Backspace');

      mq.typedText('percent');
      assertLatex('\\%\\operatorname{of}');
      mq.keystroke('Backspace');

      mq.typedText('cbrt');
      assertLatex('\\sqrt[3]{}');
      assertMathspeak('Start Cube Root End Cube Root');
      mq.typedText('pi');
      assertLatex('\\sqrt[3]{\\pi}');
    });

    test('sequences of auto-commands and other assorted characters', function () {
      mq.typedText('sin' + 'pi');
      assertLatex('\\sin\\pi');
      mq.keystroke('Left Backspace');
      assertLatex('si\\pi');
      mq.keystroke('Left').typedText('p');
      assertLatex('spi\\pi');
      mq.typedText('i');
      assertLatex('s\\pi i\\pi');
      mq.typedText('p');
      assertLatex('s\\pi pi\\pi');
      mq.keystroke('Right').typedText('n');
      assertLatex('s\\pi pin\\pi');
      mq.keystroke('Left Left Left').typedText('s');
      assertLatex('s\\pi spin\\pi');
      mq.keystroke('Backspace');
      assertLatex('s\\pi pin\\pi');
      mq.keystroke('Del').keystroke('Backspace');
      assertLatex('\\sin\\pi');
    });

    test('has lower "precedence" than operator names', function () {
      mq.typedText('ppi');
      assertLatex('\\operatorname{pp}i');
      mq.keystroke('Left Left').typedText('i');
      assertLatex('\\pi pi');
    });

    test('command contains non-letters', function () {
      assert.throws(function () {
        MQ.config({ autoCommands: 'e1' });
      });
    });

    test('command length less than 2', function () {
      assert.throws(function () {
        MQ.config({ autoCommands: 'e' });
      });
    });

    test('command is a built-in operator name', function () {
      var cmds = (
        'Pr arg deg det dim exp gcd hom inf ker lg lim ln log max min sup' +
        ' limsup liminf injlim projlim Pr'
      ).split(' ');
      for (var i = 0; i < cmds.length; i += 1) {
        assert.throws(function () {
          MQ.config({ autoCommands: cmds[i] });
        }, 'MQ.config({ autoCommands: "' + cmds[i] + '" })');
      }
    });

    test('built-in operator names even after auto-operator names overridden', function () {
      MQ.config({ autoOperatorNames: 'sin inf arcosh cosh cos cosec csc' });
      // ^ happen to be the ones required by autoOperatorNames.test.js
      var cmds = 'Pr arg deg det exp gcd inf lg lim ln log max min sup'.split(
        ' '
      );
      for (var i = 0; i < cmds.length; i += 1) {
        assert.throws(function () {
          MQ.config({ autoCommands: cmds[i] });
        }, 'MQ.config({ autoCommands: "' + cmds[i] + '" })');
      }
    });

    test('no auto commands in simple subscripts', function () {
      mq.config(normalConfig);
      mq.typedText('x_');
      assertLatex('x_{ }');
      mq.typedText('pi');
      assertLatex('x_{\\pi}');
      mq.latex('');
      mq.config(subscriptConfig);
      mq.typedText('x_');
      assertLatex('x_{ }');
      mq.typedText('pi');
      assertLatex('x_{pi}');
      mq.config(normalConfig);
    });

    suite('command list not perfectly space-delimited', function () {
      test('double space', function () {
        assert.throws(function () {
          MQ.config({ autoCommands: 'pi  theta' });
        });
      });

      test('leading space', function () {
        assert.throws(function () {
          MQ.config({ autoCommands: ' pi' });
        });
      });

      test('trailing space', function () {
        assert.throws(function () {
          MQ.config({ autoCommands: 'pi ' });
        });
      });
    });
  });

  suite('inequalities', function () {
    // assertFullyFunctioningInequality() checks not only that the inequality
    // has the right LaTeX and when you backspace it has the right LaTeX,
    // but also that when you backspace you get the right state such that
    // you can either type = again to get the non-strict inequality again,
    // or backspace again and it'll delete correctly.
    function assertFullyFunctioningInequality(
      nonStrict,
      strict,
      nonStrictMathspeak,
      strictMathspeak
    ) {
      assertLatex(nonStrict);
      assertMathspeak(nonStrictMathspeak);
      mq.keystroke('Backspace');
      assertLatex(strict);
      assertMathspeak(strictMathspeak);
      mq.typedText('=');
      assertLatex(nonStrict);
      assertMathspeak(nonStrictMathspeak);
      mq.keystroke('Backspace');
      assertLatex(strict);
      assertMathspeak(strictMathspeak);
      mq.keystroke('Backspace');
      assertLatex('');
      assertMathspeak('');
    }
    test('typing and backspacing <= and >=', function () {
      mq.typedText('<');
      assertLatex('<');
      assertMathspeak('less than');
      mq.typedText('=');
      assertFullyFunctioningInequality(
        '\\le',
        '<',
        'less than or equal to',
        'less than'
      );

      mq.typedText('>');
      assertLatex('>');
      mq.typedText('=');
      assertFullyFunctioningInequality(
        '\\ge',
        '>',
        'greater than or equal to',
        'greater than'
      );

      mq.typedText('<<>>==>><<==');
      assertLatex('<<>\\ge=>><\\le=');
      assertMathspeak(
        'less than less than greater than greater than or equal to equals greater than greater than less than less than or equal to equals'
      );
    });

    test('typing ≤ and ≥ chars directly', function () {
      mq.typedText('≤');
      assertFullyFunctioningInequality(
        '\\le',
        '<',
        'less than or equal to',
        'less than'
      );

      mq.typedText('≥');
      assertFullyFunctioningInequality(
        '\\ge',
        '>',
        'greater than or equal to',
        'greater than'
      );
    });

    test('typing and backspacing \\to', function () {
      mq.typedText('-');
      assertLatex('-');
      assertMathspeak('negative');
      mq.typedText('>');
      assertLatex('\\to');
      assertMathspeak('to');
      mq.typedText('-');
      assertLatex('\\to-');
      assertMathspeak('to negative');
      mq.typedText('>');
      assertLatex('\\to\\to');
      assertMathspeak('to to');
      mq.keystroke('Backspace');
      assertLatex('\\to-');
      assertMathspeak('to negative');
      mq.keystroke('Backspace');
      assertLatex('\\to');
      assertMathspeak('to');
      mq.keystroke('Backspace');
      assertLatex('-');
      assertMathspeak('negative');
      mq.keystroke('Backspace');
      mq.typedText('a->b');
      assertLatex('a\\to b');
      assertMathspeak('"a" to "b"');
      mq.latex('');
      mq.typedText('a→b');
      assertLatex('a\\to b');
      assertMathspeak('"a" to "b"');
    });

    test('typing and backspacing ~', function () {
      mq.typedText('~');
      assertLatex('\\sim');
      assertMathspeak('tilde');
      mq.typedText('~');
      assertLatex('\\approx');
      assertMathspeak('approximately equal');
      mq.typedText('~');
      assertLatex('\\approx\\sim');
      assertMathspeak('approximately equal tilde');
      mq.typedText('~');
      assertLatex('\\approx\\approx');
      assertMathspeak('approximately equal approximately equal');
      mq.keystroke('Backspace');
      assertLatex('\\approx\\sim');
      assertMathspeak('approximately equal tilde');
      mq.keystroke('Backspace');
      assertLatex('\\approx');
      assertMathspeak('approximately equal');
      mq.keystroke('Backspace');
      assertLatex('\\sim');
      assertMathspeak('tilde');
      mq.keystroke('Backspace');
      mq.typedText('a~b');
      assertLatex('a\\sim b');
      assertMathspeak('"a" tilde "b"');
      mq.keystroke('Backspace');
      mq.typedText('~b');
      assertLatex('a\\approx b');
      assertMathspeak('"a" approximately equal "b"');
    });
    test('typing ≈ char directly', function () {
      mq.typedText('≈');
      assertLatex('\\approx');
      assertMathspeak('approximately equal');
      mq.keystroke('Backspace');
      assertLatex('\\sim');
      assertMathspeak('tilde');
    });

    suite('rendered from LaTeX', function () {
      test('control sequences', function () {
        mq.latex('\\le');
        assertFullyFunctioningInequality(
          '\\le',
          '<',
          'less than or equal to',
          'less than'
        );

        mq.latex('\\ge');
        assertFullyFunctioningInequality(
          '\\ge',
          '>',
          'greater than or equal to',
          'greater than'
        );
      });

      test('≤ and ≥ chars', function () {
        mq.latex('≤');
        assertFullyFunctioningInequality(
          '\\le',
          '<',
          'less than or equal to',
          'less than'
        );

        mq.latex('≥');
        assertFullyFunctioningInequality(
          '\\ge',
          '>',
          'greater than or equal to',
          'greater than'
        );
      });
    });
  });

  suite('SupSub behavior options', function () {
    test('charsThatBreakOutOfSupSub', function () {
      assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n+y}');
      mq.latex('');
      assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
      mq.latex('');

      MQ.config({ charsThatBreakOutOfSupSub: '+-=<>' });

      assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n}+y');
      mq.latex('');

      // Unary operators never break out of exponents.
      assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
      mq.latex('');

      // Only break out of exponents if cursor at the end, don't
      // jump from the middle of the exponent out to the right.
      assert.equal(mq.typedText('x^ab').latex(), 'x^{ab}');
      assert.equal(mq.keystroke('Left').typedText('+').latex(), 'x^{a+b}');
      mq.latex('');
    });
    test('supSubsRequireOperand', function () {
      assert.equal(mq.typedText('^').latex(), '^{ }');
      assert.equal(mq.typedText('2').latex(), '^{2}');
      assert.equal(mq.typedText('n').latex(), '^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^{2}');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('^').latex(), 'x^{^{ }}');
      assert.equal(mq.typedText('2').latex(), 'x^{^{2}}');
      assert.equal(mq.typedText('n').latex(), 'x^{^{2n}}');
      mq.latex('');
      assert.equal(mq.typedText('2').latex(), '2');
      assert.equal(mq.keystroke('Shift-Left').typedText('^').latex(), '^{2}');

      mq.latex('');
      MQ.config({ supSubsRequireOperand: true });

      assert.equal(mq.typedText('^').latex(), '');
      assert.equal(mq.typedText('2').latex(), '2');
      assert.equal(mq.typedText('n').latex(), '2n');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^{2}');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^{2}');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('2').latex(), '2');
      assert.equal(mq.keystroke('Shift-Left').typedText('^').latex(), '^{2}');
    });
  });

  suite('alternative symbols when typing / and *', function () {
    test('typingSlashWritesDivisionSymbol', function () {
      mq.typedText('/');
      assertLatex('\\frac{ }{ }');

      mq.config({ typingSlashWritesDivisionSymbol: true });

      mq.keystroke('Backspace').typedText('/');
      assertLatex('\\div');
    });
    test('typingAsteriskWritesTimesSymbol', function () {
      mq.typedText('*');
      assertLatex('\\cdot');

      mq.config({ typingAsteriskWritesTimesSymbol: true });

      mq.keystroke('Backspace').typedText('*');
      assertLatex('\\times');
    });
  });

  suite('typingPercentWritesPercentOf', function () {
    test('typingSlashWritesDivisionSymbol', function () {
      mq.typedText('%');
      assertLatex('\\%');
      mq.keystroke('Backspace');

      mq.config({ typingPercentWritesPercentOf: true });

      mq.typedText('%');
      assertLatex('\\%\\operatorname{of}');
      mq.keystroke('Backspace');
      assertLatex('');
    });

    test('percentof round trips correctly through serializing and parsing', function () {
      mq.latex('\\%\\operatorname{of}');
      assertLatex('\\%\\operatorname{of}');
    });

    test('overline renders as expected', function () {
      mq.latex('0.3\\overline{5}');
      assertLatex('0.3\\overline{5}');
      assertMathspeak('0 .3 StartOverline 5 EndOverline');
    });
  });
});
