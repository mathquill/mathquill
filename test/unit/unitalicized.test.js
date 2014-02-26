suite('auto-unitalicized commands', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
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
    function assertUnitalicizedCommandWorks(str, latex) {
      var count = 0;
      var _autoUnItalicize = Variable.prototype.autoUnItalicize;
      Variable.prototype.autoUnItalicize = function() {
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

    assertUnitalicizedCommandWorks('sin', '\\sin');
    assertUnitalicizedCommandWorks('arcosh', '\\arcosh');
    assertUnitalicizedCommandWorks('acosh', 'a\\cosh');
    assertUnitalicizedCommandWorks('cosine', '\\cos ine');
    assertUnitalicizedCommandWorks('arcosecant', 'ar\\cosec ant');
    assertUnitalicizedCommandWorks('cscscscscscsc', '\\csc s\\csc s\\csc sc');
    assertUnitalicizedCommandWorks('scscscscscsc', 's\\csc s\\csc s\\csc');
  });

  test('deleting', function() {
    var count = 0;
    var _autoUnItalicize = Variable.prototype.autoUnItalicize;
    Variable.prototype.autoUnItalicize = function() {
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
});
