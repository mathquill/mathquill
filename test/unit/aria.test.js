// ARIA alert tests
// note: we introduce a 100ms delay before checking the value of the alert because it takes a small amount of time for the alert to render for a screen reader

suite('aria', function() {
  var mq, $aria;
  setup(function() {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    $aria = $('body').find('.mq-aria-alert');
  });

  function assertAriaEqual(alertText) {
    setTimeout(function() {
      return assert.equal(alertText, $aria.text());
    }.bind(this), 100);
  }

  test('aria alert element exists', function() {
    setTimeout(function() {
      assert.ok($aria.length, 1);
    }.bind(this),100);
  });

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
    assertAriaEqual('over');
    mq.keystroke('Backspace');
    assertAriaEqual('1');
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
    mq.latex('sqrt(x)');
    mq.keystroke('Home');
    assertAriaEqual('beginning of block s q r t "x');
    mq.keystroke('End');
    assertAriaEqual('end of block s q r t "x');
    mq.keystroke('Ctrl-Home');
    assertAriaEqual('beginning of MathQuill Input s q r t "x"');
    mq.keystroke('Ctrl-End');
    assertAriaEqual('end of MathQuill Input s q r t "x"');
  });

});
