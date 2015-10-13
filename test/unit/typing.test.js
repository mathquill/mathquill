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
    prayWellFormedPoint(mq.__controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  suite('LiveFraction', function() {
    test('full MathQuill', function() {
      mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
      // LRN - changed expected latex after disabling Tab key
      assertLatex('\\frac{1}{2+\\frac{\\sin x}{ }}');
      mq.latex('').typedText('1+/2');
      assertLatex('1+\\frac{2}{ }');
      mq.latex('').typedText('1 2/3');
      assertLatex('1\\ \\frac{2}{3}');
    });

    test('MathQuill-basic', function() {
      var mq_basic = MathQuillBasic.MathField($('<span></span>').appendTo('#mock')[0]);
      mq_basic.typedText('1/2');
      assert.equal(mq_basic.latex(), '\\frac{1}{2}');
      $(mq_basic.el()).remove();
    });
  });

  suite('LatexCommandInput', function() {
    test('basic', function() {
      mq.typedText('\\sqrt-x');
      assertLatex('\\sqrt{-x}');
    });

    test('they\'re passed their name', function() {
      mq.cmd('\\alpha');
      assert.equal(mq.latex(), '\\alpha');
    });

    test('replaces selection', function() {
      mq.typedText('49').select().typedText('\\sqrt').keystroke('Enter');
      assertLatex('\\sqrt{49}');
    });

    test('auto-operator names', function() {
      mq.typedText('\\sin^2');
      assertLatex('\\sin^2');
    });

    test('nonexistent LaTeX command', function() {
      mq.typedText('\\asdf+');
      assertLatex('\\text{asdf}+');
    });

    test('dollar sign', function() {
      mq.typedText('$');
      assertLatex('\\$');
    });
  });

  suite('auto-expanding parens', function() {
    suite('simple', function() {
      test('empty parens ()', function() {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(')');
        assertLatex('\\left(\\right)');
      });

      test('straight typing 1+(2+3)+4', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
      });

      test('basic command \\sin(', function () {
        mq.typedText('\\sin(');
        assertLatex('\\sin\\left(\\right)');
      });

      test('wrapping things in parens 1+(2+3)+4', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right)+4');
      });

      test('nested parens 1+(2+(3+4)+5)+6', function() {
        mq.typedText('1+(2+(3+4)+5)+6');
        assertLatex('1+\\left(2+\\left(3+4\\right)+5\\right)+6');
      });
    });

    suite('mismatched brackets', function() {
      test('empty mismatched brackets (] and [}', function() {
        mq.typedText('(');
        assertLatex('\\left(\\right)');
        mq.typedText(']');
        assertLatex('\\left(\\right]');
        mq.typedText('[');
        assertLatex('\\left(\\right]\\left[\\right]');
        mq.typedText('}');
        assertLatex('\\left(\\right]\\left[\\right\\}');
      });

      test('typing mismatched brackets 1+(2+3]+4', function() {
        mq.typedText('1+');
        assertLatex('1+');
        mq.typedText('(');
        assertLatex('1+\\left(\\right)');
        mq.typedText('2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText(']+4');
        assertLatex('1+\\left(2+3\\right]+4');
      });

      test('wrapping things in mismatched brackets 1+(2+3]+4', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Left Left Left Left').typedText('(');
        assertLatex('1+\\left(2+3\\right]+4');
      });

      test('nested mismatched brackets 1+(2+[3+4)+5]+6', function() {
        mq.typedText('1+(2+[3+4)+5]+6');
        assertLatex('1+\\left(2+\\left[3+4\\right)+5\\right]+6');
      });

      suite('restrictMismatchedBrackets', function() {
        setup(function() {
          mq.config({ restrictMismatchedBrackets: true });
        });
        test('typing (|x|+1) works', function() {
          mq.typedText('(|x|+1)');
          assertLatex('\\left(\\left|x\\right|+1\\right)');
        });
        test('typing [x} becomes [{x}]', function() {
          mq.typedText('[x}');
          assertLatex('\\left[\\left\\{x\\right\\}\\right]');
        });
        test('normal matching pairs {f(n), [a,b]} work', function() {
          mq.typedText('{f(n), [a,b]}');
          assertLatex('\\left\\{f\\left(n\\right),\\ \\left[a,b\\right]\\right\\}');
        });
        test('[a,b) and (a,b] still work', function() {
          mq.typedText('[a,b) + (a,b]');
          assertLatex('\\left[a,b\\right)\\ +\\ \\left(a,b\\right]');
        });
      });
    });

    suite('pipes', function() {
      test('empty pipes ||', function() {
        mq.typedText('|');
        assertLatex('\\left|\\right|');
        mq.typedText('|');
        assertLatex('\\left|\\right|');
      });

      test('straight typing 1+|2+3|+4', function() {
        mq.typedText('1+|2+3|+4');
        assertLatex('1+\\left|2+3\\right|+4');
      });

      test('wrapping things in pipes 1+|2+3|+4', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Home Right Right').typedText('|');
        assertLatex('1+\\left|2+3+4\\right|');
        mq.keystroke('Right Right Right').typedText('|');
        assertLatex('1+\\left|2+3\\right|+4');
      });

      suite('can type mismatched paren/pipe group from any side', function() {
        suite('straight typing', function() {
          test('|)', function() {
            mq.typedText('|)');
            assertLatex('\\left|\\right)');
          });

          test('(|', function() {
            mq.typedText('(|');
            assertLatex('\\left(\\right|');
          });
        });

        suite('the other direction', function() {
          test('|)', function() {
            mq.typedText(')');
            assertLatex('\\left(\\right)');
            mq.keystroke('Left').typedText('|');
            assertLatex('\\left|\\right)');
          });

          test('(|', function() {
            mq.typedText('||');
            assertLatex('\\left|\\right|');
            mq.keystroke('Left Backspace');
            assertLatex('\\left|\\right|');
            mq.typedText('(');
            assertLatex('\\left(\\right|');
          });
        });
      });
    });

    suite('backspacing', backspacingTests);

    suite('backspacing with restrictMismatchedBrackets', function() {
      setup(function() {
        mq.config({ restrictMismatchedBrackets: true });
      });

      backspacingTests();
    });

    function backspacingTests() {
      test('typing then backspacing a close-paren in the middle of 1+2+3+4', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left').typedText(')');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-paren then open-paren of 1+(2+3)+4', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open-paren then close-paren of 1+(2+3)+4', function() {
        mq.typedText('1+(2+3)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-bracket then open-paren of 1+(2+3]+4', function() {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing open-paren then close-bracket of 1+(2+3]+4', function() {
        mq.typedText('1+(2+3]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });


      test('backspacing close-bracket then open-paren of 1+(2+3] (nothing after paren group)', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing open-paren then close-bracket of 1+(2+3] (nothing after paren group)', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3');
      });

      test('backspacing close-bracket then open-paren of (2+3]+4 (nothing before paren group)', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('2+3+4');
      });

      test('backspacing open-paren then close-bracket of (2+3]+4 (nothing before paren group)', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[2+3\\right]+4');
        mq.keystroke('Right Right Right Right Right Backspace');
        assertLatex('2+3+4');
      });

      function assertParenBlockNonEmpty() {
        var parenBlock = $(mq.el()).find('.mq-paren+span');
        assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
        assert.ok(!parenBlock.hasClass('mq-empty'),
                  'paren block auto-expanded, should no longer be gray');
      }

      test('backspacing close-bracket then open-paren of 1+(]+4 (empty paren group)', function() {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(+4\\right)');
        assertParenBlockNonEmpty();
        mq.keystroke('Backspace');
        assertLatex('1++4');
      });

      test('backspacing open-paren then close-bracket of 1+(]+4 (empty paren group)', function() {
        mq.typedText('1+(]+4');
        assertLatex('1+\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('\\left[1+\\right]+4');
        assertParenBlockNonEmpty();
        mq.keystroke('Right Backspace');
        assertLatex('1++4');
      });

      test('backspacing close-bracket then open-paren of 1+(] (empty paren group, nothing after)', function() {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(\\right)');
        mq.keystroke('Backspace');
        assertLatex('1+');
      });

      test('backspacing open-paren then close-bracket of 1+(] (empty paren group, nothing after)', function() {
        mq.typedText('1+(]');
        assertLatex('1+\\left(\\right]');
        mq.keystroke('Left Backspace');
        assertLatex('\\left[1+\\right]');
        assertParenBlockNonEmpty();
        mq.keystroke('Right Right Backspace');
        assertLatex('1+');
      });

      test('backspacing close-bracket then open-paren of (]+4 (empty paren group, nothing before)', function() {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('\\left(+4\\right)');
        assertParenBlockNonEmpty();
        mq.keystroke('Backspace');
        assertLatex('+4');
      });

      test('backspacing open-paren then close-bracket of (]+4 (empty paren group, nothing before)', function() {
        mq.typedText('(]+4');
        assertLatex('\\left(\\right]+4');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('\\left[\\right]+4');
        mq.keystroke('Right Right Backspace');
        assertLatex('+4');
      });

      test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing close-bracket then open-paren', function() {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering mismatched brackets 1+(2+3]+4 from LaTeX then backspacing open-paren then close-bracket', function() {
        mq.latex('1+\\left(2+3\\right]+4');
        assertLatex('1+\\left(2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left[1+2+3\\right]+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing close-paren then open-paren', function() {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('rendering paren group 1+(2+3)+4 from LaTeX then backspacing open-paren then close-paren', function() {
        mq.latex('1+\\left(2+3\\right)+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens 1+(2+3)+4 then backspacing close-paren then open-paren', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText(')');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3+4\\right)');
        mq.keystroke('Left Left Left Backspace');
        assertLatex('1+2+3+4');
      });

      test('wrapping selection in parens 1+(2+3)+4 then backspacing open-paren then close-paren', function() {
        mq.typedText('1+2+3+4');
        assertLatex('1+2+3+4');
        mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('(');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
        mq.keystroke('Right Right Right Right Backspace');
        assertLatex('1+2+3+4');
      });

      test('backspacing close-bracket of 1+(2+3] (nothing after) then typing', function() {
        mq.typedText('1+(2+3]');
        assertLatex('1+\\left(2+3\\right]');
        mq.keystroke('Backspace');
        assertLatex('1+\\left(2+3\\right)');
        mq.typedText('+4');
        assertLatex('1+\\left(2+3+4\\right)');
      });

      test('backspacing open-paren of (2+3]+4 (nothing before) then typing', function() {
        mq.typedText('(2+3]+4');
        assertLatex('\\left(2+3\\right]+4');
        mq.keystroke('Home Right Backspace');
        assertLatex('\\left[2+3\\right]+4');
        mq.typedText('1+');
        assertLatex('1+\\left[2+3\\right]+4');
      });

      test('backspacing paren containing a one-sided paren 0+[(1+2)+3]+4', function() {
        mq.typedText('0+[1+2+3]+4');
        assertLatex('0+\\left[1+2+3\\right]+4');
        mq.keystroke('Left Left Left Left Left').typedText(')');
        assertLatex('0+\\left[\\left(1+2\\right)+3\\right]+4');
        mq.keystroke('Right Right Right Backspace');
        assertLatex('0+\\left[1+2\\right)+3+4');
      });

      test('backspacing paren inside a one-sided paren (0+[1+2]+3)+4', function() {
        mq.typedText('0+[1+2]+3)+4');
        assertLatex('\\left(0+\\left[1+2\\right]+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Backspace');
        assertLatex('0+\\left[1+2+3\\right)+4');
      });

      test('backspacing paren containing and inside a one-sided paren (([1+2]))', function() {
        mq.typedText('(1+2))');
        assertLatex('\\left(\\left(1+2\\right)\\right)');
        mq.keystroke('Left Left').typedText(']');
        assertLatex('\\left(\\left(\\left[1+2\\right]\\right)\\right)');
        mq.keystroke('Right Backspace');
        assertLatex('\\left(\\left(1+2\\right]\\right)');
        mq.keystroke('Backspace');
        assertLatex('\\left(1+2\\right)');
      });

      test('auto-expanding calls .siblingCreated() on new siblings 1+((2+3))', function() {
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

      test('that unwrapping calls .siblingCreated() on new siblings ((1+2)+(3+4))+5', function() {
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

      suite('pipes', function() {
        test('typing then backspacing a pipe in the middle of 1+2+3+4', function() {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Left').typedText('|');
          assertLatex('1+2+\\left|3+4\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe then open-pipe of 1+|2+3|+4', function() {
          mq.typedText('1+|2+3|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing open-pipe then close-pipe of 1+|2+3|+4', function() {
          mq.typedText('1+|2+3|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('\\left|1+2+3\\right|+4');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe then open-pipe of 1+|2+3| (nothing after pipe pair)', function() {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3');
        });

        test('backspacing open-pipe then close-pipe of 1+|2+3| (nothing after pipe pair)', function() {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Left Left Left Left Backspace');
          assertLatex('\\left|1+2+3\\right|');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3');
        });

        test('backspacing close-pipe then open-pipe of |2+3|+4 (nothing before pipe pair)', function() {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('2+3+4');
        });

        test('backspacing open-pipe then close-pipe of |2+3|+4 (nothing before pipe pair)', function() {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Right Right Right Right Right Backspace');
          assertLatex('2+3+4');
        });

        function assertParenBlockNonEmpty() {
          var parenBlock = $(mq.el()).find('.mq-paren+span');
          assert.equal(parenBlock.length, 1, 'exactly 1 paren block');
          assert.ok(!parenBlock.hasClass('mq-empty'),
                    'paren block auto-expanded, should no longer be gray');
        }

        test('backspacing close-pipe then open-pipe of 1+||+4 (empty pipe pair)', function() {
          mq.typedText('1+||+4');
          assertLatex('1+\\left|\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|+4\\right|');
          assertParenBlockNonEmpty();
          mq.keystroke('Backspace');
          assertLatex('1++4');
        });

        test('backspacing open-pipe then close-pipe of 1+||+4 (empty pipe pair)', function() {
          mq.typedText('1+||+4');
          assertLatex('1+\\left|\\right|+4');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('\\left|1+\\right|+4');
          assertParenBlockNonEmpty();
          mq.keystroke('Right Backspace');
          assertLatex('1++4');
        });

        test('backspacing close-pipe then open-pipe of 1+|| (empty pipe pair, nothing after)', function() {
          mq.typedText('1+||');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+');
        });

        test('backspacing open-pipe then close-pipe of 1+|| (empty pipe pair, nothing after)', function() {
          mq.typedText('1+||');
          assertLatex('1+\\left|\\right|');
          mq.keystroke('Left Backspace');
          assertLatex('\\left|1+\\right|');
          assertParenBlockNonEmpty();
          mq.keystroke('Right Right Backspace');
          assertLatex('1+');
        });

        test('backspacing close-pipe then open-pipe of ||+4 (empty pipe pair, nothing before)', function() {
          mq.typedText('||+4');
          assertLatex('\\left|\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('\\left|+4\\right|');
          assertParenBlockNonEmpty();
          mq.keystroke('Backspace');
          assertLatex('+4');
        });

        test('backspacing open-pipe then close-pipe of ||+4 (empty pipe pair, nothing before)', function() {
          mq.typedText('||+4');
          assertLatex('\\left|\\right|+4');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('\\left|\\right|+4');
          mq.keystroke('Right Right Backspace');
          assertLatex('+4');
        });

        test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing close-pipe then open-pipe', function() {
          mq.latex('1+\\left|2+3\\right|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering pipe pair 1+|2+3|+4 from LaTeX then backspacing open-pipe then close-pipe', function() {
          mq.latex('1+\\left|2+3\\right|+4');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('\\left|1+2+3\\right|+4');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing close-paren then open-pipe', function() {
          mq.latex('1+\\left|2+3\\right)+4');
          assertLatex('1+\\left|2+3\\right)+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+|2+3)+4 from LaTeX then backspacing open-pipe then close-paren', function() {
          mq.latex('1+\\left|2+3\\right)+4');
          assertLatex('1+\\left|2+3\\right)+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('\\left(1+2+3\\right)+4');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing close-pipe then open-paren', function() {
          mq.latex('1+\\left(2+3\\right|+4');
          assertLatex('1+\\left(2+3\\right|+4');
          mq.keystroke('Left Left Backspace');
          assertLatex('1+\\left(2+3+4\\right)');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('rendering mismatched paren/pipe group 1+(2+3|+4 from LaTeX then backspacing open-paren then close-pipe', function() {
          mq.latex('1+\\left(2+3\\right|+4');
          assertLatex('1+\\left(2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left Backspace');
          assertLatex('\\left|1+2+3\\right|+4');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3+4');
        });

        test('wrapping selection in pipes 1+|2+3|+4 then backspacing open-pipe then close-pipe', function() {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('|');
          assertLatex('1+\\left|2+3\\right|+4');
          mq.keystroke('Backspace');
          assertLatex('\\left|1+2+3\\right|+4');
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+2+3+4');
        });

        test('wrapping selection in pipes 1+|2+3|+4 then backspacing close-pipe then open-pipe', function() {
          mq.typedText('1+2+3+4');
          assertLatex('1+2+3+4');
          mq.keystroke('Left Left Shift-Left Shift-Left Shift-Left').typedText('|');
          assertLatex('1+\\left|2+3\\right|+4');
          // LRN - use arrow keys to break out of pipes rather than Tab (now disabled)
          mq.keystroke('Right Right Right Right Backspace');
          assertLatex('1+\\left|2+3+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('1+2+3+4');
        });

        test('backspacing close-pipe of 1+|2+3| (nothing after) then typing', function() {
          mq.typedText('1+|2+3|');
          assertLatex('1+\\left|2+3\\right|');
          mq.keystroke('Backspace');
          assertLatex('1+\\left|2+3\\right|');
          mq.typedText('+4');
          assertLatex('1+\\left|2+3+4\\right|');
        });

        test('backspacing open-pipe of |2+3|+4 (nothing before) then typing', function() {
          mq.typedText('|2+3|+4');
          assertLatex('\\left|2+3\\right|+4');
          mq.keystroke('Home Right Backspace');
          assertLatex('\\left|2+3\\right|+4');
          mq.typedText('1+');
          assertLatex('1+\\left|2+3\\right|+4');
        });

        test('backspacing pipe containing a one-sided pipe 0+|1+|2+3||+4', function() {
          mq.typedText('0+|1+2+3|+4');
          assertLatex('0+\\left|1+2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|\\right|+4');
          // LRN - use arrow keys to break out of pipes rather than Shift-Tab (now disabled)
          mq.keystroke('Left Left Left Left Del');
          assertLatex('0+1+\\left|2+3\\right|+4');
        });

        test('backspacing pipe inside a one-sided pipe 0+|1+|2+3|+4|', function() {
          mq.typedText('0+1+|2+3|+4');
          assertLatex('0+1+\\left|2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
          mq.keystroke('Right Right Del');
          assertLatex('0+\\left|1+2+3\\right|+4');
        });

        test('backspacing pipe containing and inside a one-sided pipe |0+|1+|2+3||+4|', function() {
          mq.typedText('0+|1+2+3|+4');
          assertLatex('0+\\left|1+2+3\\right|+4');
          mq.keystroke('Home').typedText('|');
          assertLatex('\\left|0+\\left|1+2+3\\right|+4\\right|');
          mq.keystroke('Right Right Right Right Right').typedText('|');
          assertLatex('\\left|0+\\left|1+\\left|2+3\\right|\\right|+4\\right|');
          mq.keystroke('Left Left Left Backspace');
          assertLatex('\\left|0+1+\\left|2+3\\right|+4\\right|');
        });

        test('backspacing pipe containing a one-sided pipe facing same way 0+||1+2||+3', function() {
          mq.typedText('0+|1+2|+3');
          assertLatex('0+\\left|1+2\\right|+3');
          mq.keystroke('Home Right Right Right').typedText('|');
          assertLatex('0+\\left|\\left|1+2\\right|\\right|+3');
          // LRN - use arrow keys to break out of pipes rather than Tab (now disabled)
          mq.keystroke('Right Right Right Right Del');
          assertLatex('0+\\left|\\left|1+2\\right|+3\\right|');
        });

        test('backspacing pipe inside a one-sided pipe facing same way 0+|1+|2+3|+4|', function() {
          mq.typedText('0+1+|2+3|+4');
          assertLatex('0+1+\\left|2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left|2+3\\right|+4\\right|');
          mq.keystroke('Right Right Right Right Right Right Del');
          assertLatex('0+\\left|1+\\left|2+3+4\\right|\\right|');
        });

        test('backspacing open-paren of mismatched paren/pipe group containing a one-sided pipe 0+(1+|2+3||+4', function() {
          mq.latex('0+\\left(1+2+3\\right|+4');
          assertLatex('0+\\left(1+2+3\\right|+4');
          mq.keystroke('Left Left Left Left Left Left').typedText('|');
          assertLatex('0+\\left(1+\\left|2+3\\right|\\right|+4');
          // LRN - use arrow keys to break out of pipes rather than Shift-Tab (now disabled)
          mq.keystroke('Left Left Left Left Del');
          assertLatex('0+1+\\left|2+3\\right|+4');
        });

        test('backspacing open-paren of mismatched paren/pipe group inside a one-sided pipe 0+|1+(2+3|+4|', function() {
          mq.latex('0+1+\\left(2+3\\right|+4');
          assertLatex('0+1+\\left(2+3\\right|+4');
          mq.keystroke('Home Right Right').typedText('|');
          assertLatex('0+\\left|1+\\left(2+3\\right|+4\\right|');
          mq.keystroke('Right Right Del');
          assertLatex('0+\\left|1+2+3\\right|+4');
        });
      });
    }

    suite('typing outside ghost paren', function() {
      test('typing outside ghost paren solidifies ghost 1+(2+3)', function() {
        mq.typedText('1+(2+3');
        assertLatex('1+\\left(2+3\\right)');
        mq.keystroke('Right').typedText('+4');
        assertLatex('1+\\left(2+3\\right)+4');
        mq.keystroke('Left Left Left Left Left Left Backspace');
        assertLatex('\\left(1+2+3\\right)+4');
      });

      test('selected and replaced by LiveFraction solidifies ghosts (1+2)/( )', function() {
        mq.typedText('1+2)/');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
        mq.keystroke('Left Backspace');
        assertLatex('\\frac{\\left(1+2\\right)}{ }');
      });

      test('close paren group by typing close-bracket outside ghost paren (1+2]', function() {
        mq.typedText('(1+2');
        assertLatex('\\left(1+2\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+2\\right]');
      });

      test('close adjacent paren group before containing paren group (1+(2+3])', function() {
        mq.typedText('(1+(2+3');
        assertLatex('\\left(1+\\left(2+3\\right)\\right)');
        mq.keystroke('Right').typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right)');
        mq.typedText(']');
        assertLatex('\\left(1+\\left(2+3\\right]\\right]');
      });

      test('can type close-bracket on solid side of one-sided paren [](1+2)', function() {
        mq.typedText('(1+2');
        assertLatex('\\left(1+2\\right)');
        mq.moveToLeftEnd().typedText(']');
        assertLatex('\\left[\\right]\\left(1+2\\right)');
      });

      suite('pipes', function() {
        test('close pipe pair from outside to the right |1+2|', function() {
          mq.typedText('|1+2');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Right').typedText('|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Home Del');
          assertLatex('\\left|1+2\\right|');
        });

        test('close pipe pair from outside to the left |1+2|', function() {
          mq.typedText('|1+2|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Home Del');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Left').typedText('|');
          assertLatex('\\left|1+2\\right|');
          mq.keystroke('Ctrl-End Backspace');
          assertLatex('\\left|1+2\\right|');
        });

        test('can type pipe on solid side of one-sided pipe ||||', function() {
          mq.typedText('|');
          assertLatex('\\left|\\right|');
          mq.moveToLeftEnd().typedText('|');
          assertLatex('\\left|\\left|\\right|\\right|');
        });
      });
    });
  });

  suite('autoCommands', function() {
    MathQuill.config({
      autoCommands: 'pi tau phi theta Gamma sum lim prod sqrt nthroot'
    });

    test('individual commands', function(){
      mq.typedText('sum' + 'n=0');
      mq.keystroke('Up').typedText('100').keystroke('Right');
      assertLatex('\\sum_{n=0}^{100}');
      mq.keystroke('Backspace');

      mq.typedText('prod');
      mq.typedText('n=0').keystroke('Up').typedText('100').keystroke('Right');
      assertLatex('\\prod_{n=0}^{100}');
      mq.keystroke('Backspace');

      mq.typedText('lim');
      mq.typedText('xy').keystroke('Right');
      assertLatex('\\lim_{xy}');
      mq.keystroke('Backspace');

      mq.typedText('sqrt');
      mq.typedText('100').keystroke('Right');
      assertLatex('\\sqrt{100}');
      mq.keystroke('Backspace').keystroke('Backspace');

      mq.typedText('nthroot');
      mq.typedText('n').keystroke('Right').typedText('100').keystroke('Right');
      assertLatex('\\sqrt[n]{100}');
      mq.keystroke('Backspace').keystroke('Backspace');

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
    });

    test('sequences of auto-commands and other assorted characters', function() {
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

    test('command contains non-letters', function() {
      assert.throws(function() { MathQuill.config({ autoCommands: 'e1' }); });
    });

    test('command length less than 2', function() {
      assert.throws(function() { MathQuill.config({ autoCommands: 'e' }); });
    });

    test('command is a built-in operator name', function() {
      var cmds = ('Pr arg deg det dim exp gcd hom inf ker lg ln log max min sup'
                  + ' limsup liminf injlim projlim Pr').split(' ');
      for (var i = 0; i < cmds.length; i += 1) {
        assert.throws(function() { MathQuill.config({ autoCommands: cmds[i] }) },
                      'MathQuill.config({ autoCommands: "'+cmds[i]+'" })');
      }
    });

    test('built-in operator names even after auto-operator names overridden', function() {
      MathQuill.config({ autoOperatorNames: 'sin inf arcosh cosh cos cosec csc' });
        // ^ happen to be the ones required by autoOperatorNames.test.js
      var cmds = 'Pr arg deg det exp gcd inf lg ln log max min sup'.split(' ');
      for (var i = 0; i < cmds.length; i += 1) {
        assert.throws(function() { MathQuill.config({ autoCommands: cmds[i] }) },
                      'MathQuill.config({ autoCommands: "'+cmds[i]+'" })');
      }
    });

    suite('command list not perfectly space-delimited', function() {
      test('double space', function() {
        assert.throws(function() { MathQuill.config({ autoCommands: 'pi  theta' }); });
      });

      test('leading space', function() {
        assert.throws(function() { MathQuill.config({ autoCommands: ' pi' }); });
      });

      test('trailing space', function() {
        assert.throws(function() { MathQuill.config({ autoCommands: 'pi ' }); });
      });
    });
  });

  suite('unItalicizedTextCmds (Units)', function() {
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0], {
        unItalicizedTextCmds: ['g', 'mol', 'kg']
      });
    });

    test('are wrapped in \\text block', function(){
      mq.typedText('mol');
      assertLatex('\\text{mol}');
    });

    test('does not affect adjacent text', function(){
      mq.typedText('xmolx');
      assertLatex('x\\text{mol}x');
    });

    test('can be entered multiple times', function(){
      mq.typedText('molmolkg');
      assertLatex('\\text{mol}\\text{mol}\\text{kg}');
    });

    test('supports different string lengths, including 1 char', function(){
      mq.typedText('g kg mol');
      assertLatex('\\text{g}\\ \\text{kg}\\ \\text{mol}');
    });
  });

  suite('max depth option', function() {
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0], { maxDepth: 2 });
    });

    test('quietly refuses to enter math deeper than maxDepth', function(){
      mq.typedText('\\sqrt \\sqrt \\sqrt \\sqrt x');
      assertLatex('\\sqrt{\\ \\sqrt{ }}');
    });
  });

  suite('polyatomic SupSub', function() {
    var valid = ['x_x{}^y', 'x_{ }{}^{ }', 'x_{x+123}{}^y', 'x_x{}^{y+123}', 'x_{x+123}{}^y'];

    test('empty braces are kept when syntax is valid', function() {
      for (var i in valid) {
        mq.latex(valid[i]);
        assertLatex(valid[i]);
      }
    });

    test('empty braces are stripped when either subscript or superscript are missing', function() {
      mq.latex('x_x{}');
      assertLatex('x_x');

      mq.latex('x_{}^y');
      assertLatex('x_{ }^y');
    });
  });


  suite('inequalities', function() {
    // assertFullyFunctioningInequality() checks not only that the inequality
    // has the right LaTeX and when you backspace it has the right LaTeX,
    // but also that when you backspace you get the right state such that
    // you can either type = again to get the non-strict inequality again,
    // or backspace again and it'll delete correctly.
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

  suite('SupSub behavior options', function() {
    test('charsThatBreakOutOfSupSub', function() {
      assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n+y}');
      mq.latex('');
      assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
      mq.latex('');

      MathQuill.config({ charsThatBreakOutOfSupSub: '+-=<>' });

      assert.equal(mq.typedText('x^2n+y').latex(), 'x^{2n}+y');
      mq.latex('');
      // Unary operators never break out of exponents.
      assert.equal(mq.typedText('x^+2n').latex(), 'x^{+2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^-2n').latex(), 'x^{-2n}');
      mq.latex('');
      assert.equal(mq.typedText('x^=2n').latex(), 'x^{=2n}');
      mq.latex('');
    });
    test('supSubsRequireOperand', function() {
      assert.equal(mq.typedText('^').latex(), '^{ }');
      assert.equal(mq.typedText('2').latex(), '^2');
      assert.equal(mq.typedText('n').latex(), '^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^2');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('^').latex(), 'x^{^{ }}');
      assert.equal(mq.typedText('2').latex(), 'x^{^2}');
      assert.equal(mq.typedText('n').latex(), 'x^{^{2n}}');

      mq.latex('');
      MathQuill.config({ supSubsRequireOperand: true });

      assert.equal(mq.typedText('^').latex(), '');
      assert.equal(mq.typedText('2').latex(), '2');
      assert.equal(mq.typedText('n').latex(), '2n');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^2');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
      mq.latex('');
      assert.equal(mq.typedText('x').latex(), 'x');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('^').latex(), 'x^{ }');
      assert.equal(mq.typedText('2').latex(), 'x^2');
      assert.equal(mq.typedText('n').latex(), 'x^{2n}');
    });
  });

  suite('Matrices', function() {
    test('type \\matrix', function() {
      mq.typedText('\\matrix-x');
      assertLatex('\\begin{matrix}-x&\\\\&\\end{matrix}');
    });

    test('add matrix via mq.write', function() {
      mq.write('\\begin{matrix}x&y\\\\1&2\\end{matrix}');
      assertLatex('\\begin{matrix}x&y\\\\1&2\\end{matrix}');
    });

    test('key bindings add rows and columns to matrix', function() {
      mq.typedText('\\matrix-x');

      mq.keystroke('Shift-Spacebar');
      assertLatex('\\begin{matrix}-x&&\\\\&&\\end{matrix}');

      mq.keystroke('Shift-Enter');
      assertLatex('\\begin{matrix}-x&&\\\\&&\\\\&&\\end{matrix}');
    });

    test('key sequence populates matrix', function() {
      mq.typedText('\\matrix-x')
        .keystroke('Right').typedText('y')
        .keystroke('Down Left').typedText('a')
        .keystroke('Right').typedText('b')

      assertLatex('\\begin{matrix}-x&y\\\\a&b\\end{matrix}');
    });

    test('cursor keys navigate around matrix', function() {
      mq.write('\\begin{matrix}&&\\\\&&\\\\&&\\end{matrix}');

      mq.keystroke('Left Left Left').typedText('a')
        .keystroke('Up').typedText('b')
        .keystroke('Right').typedText('c')
        .keystroke('Down').typedText('d');

      assertLatex('\\begin{matrix}&&\\\\b&c&\\\\a&d&\\end{matrix}');
    });

    test('delete key removes empty matrix row/column', function() {
      mq.write('\\begin{matrix}a&&b\\\\&c&d\\\\&e&f\\end{matrix}');

      // Row is not yet deleted as there was content
      mq.keystroke('Left Backspace Left');
      assertLatex('\\begin{matrix}a&&b\\\\&c&d\\\\&e&\\end{matrix}');

      // Row is now deleted (delete e, then row)
      mq.keystroke('Backspace Backspace');
      assertLatex('\\begin{matrix}a&&b\\\\&c&d\\end{matrix}');

      // Column is now deleted (delete c, then column)
      mq.keystroke('Backspace Backspace');
      assertLatex('\\begin{matrix}a&b\\\\&d\\end{matrix}');
    });

    suite('Matrix size limits', function() {
      test('are enforced when user adds new rows/columns', function() {
        mq.typedText('\\matrix-x');

        for (var i=0; i<10; i++) {
          mq.keystroke('Shift-Spacebar Shift-Enter');
        }

        assertLatex('\\begin{matrix}-x&&&&\\\\&&&&\\\\&&&&\\\\&&&&\\\\&&&&\\end{matrix}');
      });

      test('are enforced when creating a new matrix', function() {
        mq.write('\\begin{matrix}0&1&2&3&4&5\\\\6&7&8&9&a&b\\\\c&d&e&f&g&h\\\\i&j&k&l&m&n\\\\o&p&q&r&s&t\\\\u&v&w&x&y&z\\end{matrix}');
        assertLatex('\\begin{matrix}0&1&2&3&4\\\\6&7&8&9&a\\\\c&d&e&f&g\\\\i&j&k&l&m\\\\o&p&q&r&s\\end{matrix}');
      });
    });

    test('brackets are scaled immediately', function() {
      mq.write('\\begin{bmatrix}x\\end{bmatrix}');
      function bracketHeight() {
        return $(mq.el()).find('.mq-matrix .mq-paren.mq-scaled')[0].getBoundingClientRect().height;
      }
      var height = bracketHeight();
      mq.keystroke('Left Shift-Enter');

      assert.ok(bracketHeight() > height,
        'matrix bracket height should be increased when new row is added');
    });
  });
  suite('Chemistry Symbols', function() {
    test('add bond via mq.write', function() {
      mq.write('\\ce{\\bond{#}}');
      assertLatex('\\ce{\\bond{#}}');
    });
    test('invalid bond types not added', function() {
      mq.write('\\ce{\\bond{x}}');
      assertLatex('\\ce{}');
    });
    test('move cursor over each bond as single character', function() {
      mq.write('\\pi\\ce{\\bond{#}}');
      mq.keystroke('Left').typedText('\\sigma');
      assertLatex('\\pi\\sigma\\ce{\\bond{#}}');
    });
    test('backspace deletes each bond as single character', function() {
      mq.write('1\\ce{\\bond{#}}2');
      mq.keystroke('Backspace Backspace');
      assertLatex('1');
    });
    test('dotted bond maps to correct characters', function() {
      mq.write('\\ce{\\bond{....}}');
      assert.equal("····", $(mq.el()).text());
    });
    test('multiple bonds can be written', function() {
      mq.write('\\ce{\\bond{....}}\\ce{\\bond{<-}}');
      assertLatex('\\ce{\\bond{....}}\\ce{\\bond{<-}}');
    });
    test('cursor seeks to just outside bond symbol', function() {
      mq.write('\\ce{\\bond{#}}\\sigma');
      $(mq.el()).find('.mq-ce').trigger('mousedown');
      mq.typedText('\\pi');
      assertLatex('\\ce{\\bond{#}}\\pi\\sigma');
    });
  });

  suite('Mathbb font', function() {
    function assertVarCount(len) {
      assert.equal($(mq.el()).find('var').length, len);
    }

    function assertContains(text, str) {
      assert.ok(text.indexOf(str) > -1, 'expected string "' + text + '" to contain "' + str + '"');
    }

    test('can be typed in', function() {
      mq.typedText('\\mathbb').keystroke('Spacebar').typedText('ABCXYZ');
      assertLatex('\\mathbb{ABCXYZ}');
      assertVarCount('ABCXYZ'.length);
    });

    test('can be directly set', function() {
      mq.latex('\\mathbb{ABCXYZ}');
      assertLatex('\\mathbb{ABCXYZ}');
      assertVarCount('ABCXYZ'.length);
    });

    test('adds doublestruck characters', function() {
      mq.latex('\\mathbb{CHNPQRZ}');
      text = mq.el().textContent;
      assertContains(text, 'ℂ');
      assertContains(text, 'ℍ');
      assertContains(text, 'ℤ');
    });

    test('can deleteOutOf without throwing error', function() {
      mq.latex('\\mathbb{H}');
      mq.keystroke('Left Left Backspace Backspace');
    });

    test('reverts to normal text on deleteOutOf', function() {
      mq.latex('\\mathbb{CH}');
      mq.keystroke('Left Left Left Backspace');
      assertLatex('CH');
    });
  });

  suite('square root', function() {
    function sqrtHeight() {
      return $(mq.el()).find('.mq-sqrt-prefix')[0].getBoundingClientRect().height;
    }

    test('scales to fit contents', function(){
      mq.latex('\\sqrt{x}');
      var height = sqrtHeight();
      mq.latex('\\sqrt{\\frac{1}{2}}');
      assert.ok(sqrtHeight() > height, 'sqrt prefix height should increase to fit contents');
    });
  });
});
