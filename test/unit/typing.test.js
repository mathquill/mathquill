suite('typing with auto-replaces', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function prayWellFormedPoint(pt) { prayWellFormed(pt.parent, pt[L], pt[R]); }
  function assertLatex(latex) {
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  test('LiveFraction', function() {
    mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
    assertLatex('\\frac{1}{2}+\\frac{\\sin x}{ }');
    mq.latex('').typedText('1+/2');
    assertLatex('1+\\frac{2}{ }');
  });

  suite('auto-expanding parens', function() {
    suite('simple', function() {
      test('empty parens', function() {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(')');
        assertLatex('\\left(\\right)');
      });

      test('straight typing', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
      });

      test('wrapping things in parens', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right)+4');
      });
    });

    suite('mis-matched brackets', function() {
      test('empty mis-matched brackets', function() {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(']');
        assertLatex('\\left(\\right]');
      });

      test('typing mis-matched brackets', function() {
        mq.typedText('1+');
        assertLatex('1+');
        mq.typedText('(');
        assertLatex('1+\\left(\\right)');
        mq.typedText('2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText(']+4');
        assertLatex('1+\\left(2+3\\right]+4');
      });

      test('wrapping things in mis-matched brackets', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right]+4');
      });
    });

    suite('backspacing', function() {
      test('typing then backspacing a paren', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close paren then open paren', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open paren then close paren', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close bracket then open paren', function() {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open paren then close bracket', function() {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });


      test('backspacing close bracket then open paren at end', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing open paren then close bracket at end', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing close bracket then open paren at beginning', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('2+3+4');
      });

      test('backspacing open paren then close bracket at beginning', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[2+3\\right]+4');
        mq.keystroke('Right Right Right Right Right Backspace');
        assertLatex('2+3+4');
      });

      test('backspacing close bracket then open paren of empty paren group', function() {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(+4\\right)');
        mq.keystroke('Backspace');
        assertLatex('1++4');
      });

      test('backspacing open paren then close bracket of empty paren group', function() {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('\\left[1+\\right]+4');
        mq.keystroke('Right Backspace');
        assertLatex('1++4');
      });

      test('backspacing close bracket then open paren at end of empty paren group', function() {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(\\right)');
        mq.keystroke('Backspace');
        assertLatex('1+');
      });

      test('backspacing open paren then close bracket at end of empty paren group', function() {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Left Backspace');
        assertLatex('\\left[1+\\right]');
        mq.keystroke('Right Right Backspace');
        assertLatex('1+');
      });

      test('backspacing close bracket then open paren at beginning of empty paren group', function() {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(+4\\right)');
        mq.keystroke('Backspace');
        assertLatex('+4');
      });

      test('backspacing open paren then close bracket at beginning of empty paren group', function() {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('\\left[\\right]+4');
        mq.keystroke('Right Right Backspace');
        assertLatex('+4');
      });

      test('rendering mis-matched brackets from LaTeX then backspacing close bracket then open paren', function() {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering mis-matched brackets from LaTeX then backspacing open paren then close bracket', function() {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren from LaTeX then backspacing close paren then open paren', function() {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren from LaTeX then backspacing open paren then close paren', function() {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens then backspacing close paren then open paren', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(')');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens then backspacing open paren then close paren', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('(');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close bracket at the end then typing', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText('+4');
        assertLatex('1+\\left(2+3+4\\right)');
      });

      test('backspacing open paren at the beginning then typing', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Home Right Backspace');
        assertLatex('\\left[2+3\\right]+4');
        mq.typedText('1+');
        assertLatex('1+\\left[2+3\\right]+4');
      });

      test('backspacing paren containing a one-sided paren', function() {
        mq.typedText('0+[1+2+3}+4');
        assertLatex('0+\\left[1+2+3\\right\\}+4');
        mq.keystroke('Left Left Left Left Left').typedText(')');
        assertLatex('0+\\left[\\left(1+2\\right)+3\\right\\}+4');
        mq.keystroke('Right Right Right Backspace');
        assertLatex('0+\\left[1+2\\right)+3+4');
      });

      test('backspacing paren inside a one-sided paren', function() {
        mq.typedText('0+[1+2}+3)+4');
        assertLatex('\\left(0+\\left[1+2\\right\\}+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Backspace');
        assertLatex('0+\\left[1+2+3\\right)+4');
      });

      test('backspacing paren containing and inside a one-sided paren', function() {
        mq.typedText('(1+2))');
        assertLatex('\\left(\\left(1+2\\right)\\right)');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left(\\left(\\left[1+2\\right]\\right)\\right)');
        mq.keystroke('Right Backspace');
        assertLatex('\\left(\\left(1+2\\right]\\right)');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+2\\right)');
      });

      test('auto-expanding calls .siblingCreated() on new siblings', function() {
        mq.typedText('1+((2+3))');
        assertLatex('1+\\left(\\left(2+3\\right)\\right)');
        mq.keystroke('Left Left Left Left Left Backspace');
        assertLatex('1+\\left(\\left(2+3\\right)\\right)');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+\\left(2+3\\right)\\right)');
        // now check that the inner open-paren isn't still a ghost
        mq.keystroke('Right Right Right Right Del');
        assertLatex('1+\\left(2+3\\right)');
      });

      test('that unwrapping calls .siblingCreated() on new siblings', function() {
        mq.typedText('(1+2+3+4)+5');
        assertLatex('\\left(1+2+3+4\\right)+5');
        mq.keystroke('Home Right Right Right Right').typedText(')');
        assertLatex('\\left(\\left(1+2\\right)+3+4\\right)+5');
        mq.keystroke('Right').typedText('(');
        assertLatex('\\left(\\left(1+2\\right)+\\left(3+4\\right)\\right)+5');
        mq.keystroke('Right Right Right Right Right Backspace');
        assertLatex('\\left(1+2\\right)+\\left(3+4\\right)+5');
        mq.keystroke('Left Left Left Left Backspace');
        assertLatex('\\left(\\left(1+2\\right)+3+4\\right)+5');
      });

      test('selected and replaced by LiveFraction solidifies ghosts', function() {
        mq.typedText('1+2)/');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
        mq.keystroke('Left Backspace');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
      });
    });

    suite('typing outside ghost paren', function() {
      test('paren no longer one-sided after typing outside ghost paren', function() {
        mq.typedText('1+(2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Right').typedText('+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
      });

      test('close bracket pair by typing close-bracket outside ghost paren', function() {
        mq.typedText('(1+2');
        assertLatex('\\left(1+2\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+2\\right]');
      });

      test('close adjacent bracket pair before containing bracket pair', function() {
        mq.typedText('(1+(2+3');
        assertLatex('\\left(1+\\left(2+3\\right)\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right)');
        mq.typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right]');
      });
    });
  });

  suite('inequalities', function() {
    function assertFullyFunctioningInequality(nonStrict, strict) {
      assertLatex(nonStrict);
      mq.keystroke('Backspace');
      assertLatex(strict);
      mq.typedText('=');
      assertLatex(nonStrict);
      mq.keystroke('Backspace');
      assertLatex(strict);
      mq.keystroke('Backspace');
      assertLatex('');
    }
    test('typing and backspacing <= and >=', function() {
      mq.typedText('<');
      assertLatex('<');
      mq.typedText('=');
      assertFullyFunctioningInequality('\\le', '<');

      mq.typedText('>');
      assertLatex('>');
      mq.typedText('=');
      assertFullyFunctioningInequality('\\ge', '>');

      mq.typedText('<<>>==>><<==');
      assertLatex('<<>\\ge=>><\\le=');
    });

    test('typing ≤ and ≥ chars directly', function() {
      mq.typedText('≤');
      assertFullyFunctioningInequality('\\le', '<');

      mq.typedText('≥');
      assertFullyFunctioningInequality('\\ge', '>');
    });

    suite('rendered from LaTeX', function() {
      test('control sequences', function() {
        mq.latex('\\le');
        assertFullyFunctioningInequality('\\le', '<');

        mq.latex('\\ge');
        assertFullyFunctioningInequality('\\ge', '>');
      });

      test('≤ and ≥ chars', function() {
        mq.latex('≤');
        assertFullyFunctioningInequality('\\le', '<');

        mq.latex('≥');
        assertFullyFunctioningInequality('\\ge', '>');
      });
    });
  });
});
