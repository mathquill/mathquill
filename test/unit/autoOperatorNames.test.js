suite('autoOperatorNames', function() {
  var mq;
  setup(function() {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function assertLatex(input, expected) {
    var result = mq.latex();
    assert.equal(result, expected,
      input+', got \''+result+'\', expected \''+expected+'\''
    );
  }

  test('simple LaTeX parsing, typing', function() {
    function assertAutoOperatorNamesWork(str, latex) {
      var count = 0;
      var _autoUnItalicize = Letter.prototype.autoUnItalicize;
      Letter.prototype.autoUnItalicize = function() {
        count += 1;
        return _autoUnItalicize.apply(this, arguments);
      };

      mq.latex(str);
      assertLatex('parsing \''+str+'\'', latex);
      assert.equal(count, 1);

      mq.latex(latex);
      assertLatex('parsing \''+latex+'\'', latex);
      assert.equal(count, 2);

      mq.latex('');
      for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
      assertLatex('typing \''+str+'\'', latex);
      assert.equal(count, 2 + str.length);
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

  test('deleting', function() {
    var count = 0;
    var _autoUnItalicize = Letter.prototype.autoUnItalicize;
    Letter.prototype.autoUnItalicize = function() {
      count += 1;
      return _autoUnItalicize.apply(this, arguments);
    };

    var str = 'cscscscscscsc';
    for (var i = 0; i < str.length; i += 1) mq.typedText(str.charAt(i));
    assertLatex('typing \''+str+'\'', '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length);

    mq.moveToLeftEnd().keystroke('Del');
    assertLatex('deleted first char', 's\\csc s\\csc s\\csc');
    assert.equal(count, str.length + 1);

    mq.typedText('c');
    assertLatex('typed back first char', '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length + 2);

    mq.typedText('+');
    assertLatex('typed plus to interrupt sequence of letters', 'c+s\\csc s\\csc s\\csc');
    assert.equal(count, str.length + 4);

    mq.keystroke('Backspace');
    assertLatex('deleted plus', '\\csc s\\csc s\\csc sc');
    assert.equal(count, str.length + 5);
  });

  suite('override autoOperatorNames', function() {
    test('basic', function() {
      MQ.config({ autoOperatorNames: 'sin lol' });
      mq.typedText('arcsintrololol');
      assert.equal(mq.latex(), 'arc\\sin tro\\operatorname{lol}ol');
    });

    test('command contains non-letters', function() {
      assert.throws(function() { MQ.config({ autoOperatorNames: 'e1' }); });
    });

    test('command length less than 2', function() {
      assert.throws(function() { MQ.config({ autoOperatorNames: 'e' }); });
    });

    suite('command list not perfectly space-delimited', function() {
      test('double space', function() {
        assert.throws(function() { MQ.config({ autoOperatorNames: 'pi  theta' }); });
      });

      test('leading space', function() {
        assert.throws(function() { MQ.config({ autoOperatorNames: ' pi' }); });
      });

      test('trailing space', function() {
        assert.throws(function() { MQ.config({ autoOperatorNames: 'pi ' }); });
      });
    });
  });
});
