suite('aria', function() {
  var mq;
  setup(function() {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
  });

  function assertAriaEqual(alertText) {
    assert.equal(alertText, mq.__controller.aria.msg);
  }

  test('typing and backspacing over simple expression', function() {
    mq.typedText('1');
    assertAriaEqual('1');
    mq.typedText('+');
    assertAriaEqual('plus');
    mq.typedText('1');
    assertAriaEqual('1');
    mq.typedText('=');
    assertAriaEqual('equals');
    mq.typedText('2');
    assertAriaEqual('2');
    mq.keystroke('Backspace');
    assertAriaEqual('2');
    mq.keystroke('Backspace');
    assertAriaEqual('equals');
    mq.keystroke('Backspace');
    assertAriaEqual('1');
    mq.keystroke('Backspace');
    assertAriaEqual('plus');
    mq.keystroke('Backspace');
    assertAriaEqual('1');
  });

  test('typing and backspacing a fraction', function() {
    mq.typedText('1');
    assertAriaEqual('1');
    mq.typedText('/');
    assertAriaEqual('over');
    mq.typedText('2');
    assertAriaEqual('2');
    mq.keystroke('Backspace');
    assertAriaEqual('2');
    mq.keystroke('Backspace');
    assertAriaEqual('Over');
    mq.keystroke('Backspace');
    assertAriaEqual('1');
  });

  test('navigating a fraction', function() {
    mq.typedText('1');
    assertAriaEqual('1');
    mq.typedText('/');
    assertAriaEqual('over');
    mq.typedText('2');
    assertAriaEqual('2');
    mq.keystroke('Up');
    assertAriaEqual('numerator 1');
    mq.keystroke('Down');
    assertAriaEqual('denominator 2');
    mq.latex('');
  });

  test('typing and backspacing through parenthesies', function() {
    mq.typedText('(');
    assertAriaEqual('left parenthesis');
    mq.typedText('1');
    assertAriaEqual('1');
    mq.typedText('*');
    assertAriaEqual('times');
    mq.typedText('2');
    assertAriaEqual('2');
    mq.typedText(')');
    assertAriaEqual('right parenthesis');
    mq.keystroke('Backspace');
    assertAriaEqual('right parenthesis');
    mq.keystroke('Backspace');
    assertAriaEqual('2');
    mq.keystroke('Backspace');
    assertAriaEqual('times');
    mq.keystroke('Backspace');
    assertAriaEqual('1');
    mq.keystroke('Backspace');
    assertAriaEqual('left parenthesis');
  });

  test('testing beginning and end alerts', function() {
    mq.typedText('sqrt(x)');
    mq.keystroke('Home');
    assertAriaEqual('beginning of block s q r t left parenthesis, "x" , right parenthesis');
    mq.keystroke('End');
    assertAriaEqual('end of block s q r t left parenthesis, "x" , right parenthesis');
    mq.keystroke('Ctrl-Home');
    assertAriaEqual('beginning of MathQuill Input s q r t left parenthesis, "x" , right parenthesis');
    mq.keystroke('Ctrl-End');
    assertAriaEqual('end of MathQuill Input s q r t left parenthesis, "x" , right parenthesis');
  });

});
