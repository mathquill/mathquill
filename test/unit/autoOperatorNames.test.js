suite('autoOperatorNames', function () {
  var mq;
  var normalConfig = {
    autoCommands: 'sum int',
  };
  var subscriptConfig = {
    autoCommands: 'sum int',
    disableAutoSubstitutionInSubscripts: true,
  };

  setup(function () {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    mq.config(normalConfig);
  });

  function assertLatex(input, expected) {
    var result = mq.latex();
    assert.equal(
      result,
      expected,
      input + ", got '" + result + "', expected '" + expected + "'"
    );
  }

  function assertText(input, expected) {
    var result = mq.text();
    assert.equal(
      result,
      expected,
      input + ", got '" + result + "', expected '" + expected + "'"
    );
  }

  test('simple LaTeX parsing, typing', function () {
    function assertAutoOperatorNamesWork(str, latex) {
      var count = 0;
      var _autoUnItalicize = Letter.prototype.autoUnItalicize;
      Letter.prototype.autoUnItalicize = function () {
        count += 1;
        return _autoUnItalicize.apply(this, arguments);
      };

      mq.latex(str);
      assertLatex("parsing '" + str + "'", latex);
      assert.equal(count, 1);

      // Since Latex doesn't change, count should remain at 1.
      mq.latex(latex);
      assertLatex("parsing '" + latex + "'", latex);
      assert.equal(count, 1);

      mq.latex('');
      for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
      assertLatex("typing '" + str + "'", latex);
      assert.equal(count, 1 + str.length);
    }

    assertAutoOperatorNamesWork('sin', '\\sin');
    assertAutoOperatorNamesWork('inf', '\\inf');
    assertAutoOperatorNamesWork('arcosh', '\\operatorname{arcosh}');
    assertAutoOperatorNamesWork('acosh', 'a\\cosh');
    assertAutoOperatorNamesWork('cosine', '\\cos ine');
    assertAutoOperatorNamesWork('arcosecant', 'ar\\operatorname{cosec}ant');
    assertAutoOperatorNamesWork('cscscscscscsc', '\\csc s\\csc s\\csc sc');
    assertAutoOperatorNamesWork('scscscscscsc', 's\\csc s\\csc s\\csc');
  });

  test('works in \\sum', function () {
    mq.typedText('sum');
    mq.typedText('sin');
    assertLatex('sum allows operatorname', '\\sum_{\\sin}^{ }');
  });

  test('works in \\int', function () {
    mq.typedText('int');
    mq.typedText('sin');
    assertLatex('int allows operatorname', '\\int_{\\sin}^{ }');
  });

  test('no auto operator names in simple subscripts when typing', function () {
    mq.config(normalConfig);
    mq.typedText('x_');
    mq.typedText('sin');
    assertLatex('subscripts turn to operatorname', 'x_{\\sin}');
    mq.latex('');
    mq.config(subscriptConfig);
    mq.typedText('x_');
    mq.typedText('sin');
    assertLatex('subscripts do not turn to operatorname', 'x_{sin}');
    mq.config(normalConfig);
  });

  test('no auto operator names in simple subscripts when pasting', function () {
    var textarea = $(mq.el()).find('textarea');
    mq.config(normalConfig);
    textarea.trigger('paste').val('x_{sin}').trigger('input');
    assertLatex('subscripts turn to operatorname', 'x_{\\sin}');
    mq.latex('');
    mq.config(subscriptConfig);
    textarea.trigger('paste').val('x_{sin}').trigger('input');
    assertLatex('subscripts do not turn to operatorname', 'x_{sin}');
    mq.config(normalConfig);
  });

  test('text() output', function () {
    function assertTranslatedCorrectly(latexStr, text) {
      mq.latex(latexStr);
      assertText('outputting ' + latexStr, text);
    }

    assertTranslatedCorrectly('\\sin', 'sin');
    assertTranslatedCorrectly('\\sin\\left(xy\\right)', 'sin(x*y)');
  });

  test('deleting', function () {
    var count = 0;
    var _autoUnItalicize = Letter.prototype.autoUnItalicize;
    Letter.prototype.autoUnItalicize = function () {
      count += 1;
      return _autoUnItalicize.apply(this, arguments);
    };

    var str = 'cscscscscscsc';
    for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
    assertLatex("typing '" + str + "'", '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length);

    mq.moveToLeftEnd().keystroke('Del');
    assertLatex('deleted first char', 's\\csc s\\csc s\\csc');
    assert.equal(count, str.length + 1);

    mq.typedText('c');
    assertLatex('typed back first char', '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length + 2);

    mq.typedText('+');
    assertLatex(
      'typed plus to interrupt sequence of letters',
      'c+s\\csc s\\csc s\\csc'
    );
    assert.equal(count, str.length + 4);

    mq.keystroke('Backspace');
    assertLatex('deleted plus', '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length + 5);
  });

  suite('override autoOperatorNames', function () {
    test('basic', function () {
      mq.config({ autoOperatorNames: 'sin lol' });
      mq.typedText('arcsintrololol');
      assert.equal(mq.latex(), 'arc\\sin tro\\operatorname{lol}ol');
    });

    test('command contains non-letters', function () {
      assert.throws(function () {
        MQ.config({ autoOperatorNames: 'e1' });
      });
    });

    test('command length less than 2', function () {
      assert.throws(function () {
        MQ.config({ autoOperatorNames: 'e' });
      });
    });

    suite('command list not perfectly space-delimited', function () {
      test('double space', function () {
        assert.throws(function () {
          MQ.config({ autoOperatorNames: 'pi  theta' });
        });
      });

      test('leading space', function () {
        assert.throws(function () {
          MQ.config({ autoOperatorNames: ' pi' });
        });
      });

      test('trailing space', function () {
        assert.throws(function () {
          MQ.config({ autoOperatorNames: 'pi ' });
        });
      });
    });
  });
});
