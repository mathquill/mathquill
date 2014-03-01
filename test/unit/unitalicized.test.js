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

  function countAutoUnItalicizeCalls(incrementCount) {
    var _autoUnItalicize = Letter.prototype.autoUnItalicize;
    Letter.prototype.autoUnItalicize = function() {
      incrementCount();
      return _autoUnItalicize.apply(this, arguments);
    };
  }

  test('simple LaTeX parsing, typing', function() {
    function assertUnitalicizedCommandWorks(str, latex) {
      var count = 0;
      countAutoUnItalicizeCalls(function() { count += 1; });

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

  test('deleting, typing in the middle', function() {
    var count = 0;
    countAutoUnItalicizeCalls(function() { count += 1; });

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

  test('typing on either side', function() {
    var count = 0;
    countAutoUnItalicizeCalls(function() { count += 1; });

    mq.latex('sin');
    assertLatex('parsing \'sin\'', '\\sin');
    assert.equal(count, 1);

    mq.typedText('1');
    assertLatex('typed \'1\' at the end', '\\sin1');
    assert.equal(count, 1, 'typing at the end should not run autoUnItalicize');

    mq.moveToLeftEnd().typedText('0');
    assertLatex('typed \'0\' at the beginning', '0\\sin1');
    assert.equal(count, 1, 'typing at the beginning should not run autoUnItalicize');
  });
});
