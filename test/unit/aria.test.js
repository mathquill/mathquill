suite('aria', function () {
  const $ = window.test_only_jquery;
  var mathField;
  var container;
  setup(function () {
    container = $('<span></span>').appendTo('#mock')[0];
    mathField = MQ.MathField(container);
  });

  function assertAriaEqual(alertText) {
    assert.equal(alertText, mathField.__controller.aria.msg);
  }

  test('mathfield has aria-hidden on mq-root-block', function () {
    mathField.latex('1+\\frac{1}{x}');
    var ariaHiddenChildren = $(container).find('[aria-hidden]="true"');
    assert.equal(ariaHiddenChildren.length, 1, '1 aria-hidden element');
    assert.ok(
      ariaHiddenChildren.hasClass('mq-root-block'),
      'aria-hidden is set on mq-root-block'
    );
  });

  test('Static math aria-hidden', function () {
    var staticMath = MQ.StaticMath(container);
    staticMath.latex('1+\\frac{1}{x}');
    var ariaHiddenChildren = $(container).find('[aria-hidden]="true"');
    assert.equal(ariaHiddenChildren.length, 1, '1 aria-hidden element');
    assert.ok(
      ariaHiddenChildren.hasClass('mq-root-block'),
      'aria-hidden is set on mq-root-block'
    );
  });

  test('MathQuillMathField aria-hidden', function () {
    var staticMath = MQ.StaticMath(container);
    staticMath.latex('1+\\sqrt{\\MathQuillMathField{x^2+y^2}}+\\frac{1}{x}');
    var textArea = $(container).find('textarea');
    assert.equal(textArea.length, 1, 'One text area for inner editable field');
    assert.equal(
      textArea.closest('[aria-hidden]="true"').length,
      0,
      'Textarea has no aria-hidden parent'
    );
    var mathSpeak = $(container).find('.mq-mathspeak');
    assert.equal(mathSpeak.length, 1, 'One mathspeak region');
    assert.equal(
      mathSpeak.closest('[aria-hidden]="true"').length,
      0,
      'Textarea has no aria-hidden parent'
    );
    var nHiddenTexts = 0;
    var allChildren = $(container).find('*');
    allChildren.each(function (_i, elt) {
      if (elt.textContent === '') return;
      if (
        $(elt).has('.mq-mathspeak').length === 1 ||
        $(elt).closest('.mq-mathspeak').length === 1
      )
        return;

      if (
        $(elt).has('[aria-hidden]="true').length === 1 ||
        $(elt).closest('[aria-hidden]="true').length === 1
      ) {
        nHiddenTexts += 1;
        return;
      }

      assert.ok(
        false,
        'All children with text content have an aria-hidden parent, or are part of mathspeak'
      );
    });
    assert.ok(
      nHiddenTexts > 0,
      'At least one element with text content is aria-hidden'
    );
  });

  test('typing and backspacing over simple expression', function () {
    mathField.typedText('1');
    assertAriaEqual('1');
    mathField.typedText('+');
    assertAriaEqual('plus');
    mathField.typedText('1');
    assertAriaEqual('1');
    mathField.typedText('=');
    assertAriaEqual('equals');
    mathField.typedText('2');
    assertAriaEqual('2');
    mathField.keystroke('Backspace');
    assertAriaEqual('2');
    mathField.keystroke('Backspace');
    assertAriaEqual('equals');
    mathField.keystroke('Backspace');
    assertAriaEqual('1');
    mathField.keystroke('Backspace');
    assertAriaEqual('plus');
    mathField.keystroke('Backspace');
    assertAriaEqual('1');
  });

  test('typing and backspacing a fraction', function () {
    mathField.typedText('1');
    assertAriaEqual('1');
    mathField.typedText('/');
    assertAriaEqual('over');
    mathField.typedText('2');
    assertAriaEqual('2');

    // We have logic to shorten the speak we return for common numeric fractions and superscripts.
    // While editing, however, the slightly longer form (but unambiguous) form of the item should be spoken.
    // In this case, we would shorten the fraction 1/2 to "1 half" when reading,
    // but navigating around the equation should result in "StartFraction, 1 Over 2, EndFraction."
    mathField.keystroke('Tab');
    assertAriaEqual('after StartFraction, 1 Over 2 , EndFraction');

    mathField.keystroke('Backspace');
    assertAriaEqual('end of denominator 2');
    mathField.keystroke('Backspace');
    assertAriaEqual('2');
    mathField.keystroke('Backspace');
    assertAriaEqual('Over');
    mathField.keystroke('Backspace');
    assertAriaEqual('1');
  });

  test('navigating a fraction', function () {
    mathField.typedText('1');
    assertAriaEqual('1');
    mathField.typedText('/');
    assertAriaEqual('over');
    mathField.typedText('2');
    assertAriaEqual('2');
    mathField.keystroke('Up');
    assertAriaEqual('numerator 1');
    mathField.keystroke('Down');
    assertAriaEqual('denominator 2');
    mathField.latex('');
  });

  test('typing and backspacing through parenthesies', function () {
    mathField.typedText('(');
    assertAriaEqual('left parenthesis');
    mathField.typedText('1');
    assertAriaEqual('1');
    mathField.typedText('*');
    assertAriaEqual('times');
    mathField.typedText('2');
    assertAriaEqual('2');
    mathField.typedText(')');
    assertAriaEqual('right parenthesis');
    mathField.keystroke('Backspace');
    assertAriaEqual('right parenthesis');
    mathField.keystroke('Backspace');
    assertAriaEqual('2');
    mathField.keystroke('Backspace');
    assertAriaEqual('times');
    mathField.keystroke('Backspace');
    assertAriaEqual('1');
    mathField.keystroke('Backspace');
    assertAriaEqual('left parenthesis');
  });

  test('testing beginning and end alerts', function () {
    mathField.typedText('sqrt(x)');
    mathField.keystroke('Home');
    assertAriaEqual(
      'beginning of block "s" "q" "r" "t" left parenthesis, "x" , right parenthesis'
    );
    mathField.keystroke('End');
    assertAriaEqual(
      'end of block "s" "q" "r" "t" left parenthesis, "x" , right parenthesis'
    );
    mathField.keystroke('Ctrl-Home');
    assertAriaEqual(
      'beginning of Math Input "s" "q" "r" "t" left parenthesis, "x" , right parenthesis'
    );
    mathField.keystroke('Ctrl-End');
    assertAriaEqual(
      'end of Math Input "s" "q" "r" "t" left parenthesis, "x" , right parenthesis'
    );
  });

  test('testing aria-label for interactive and static math', function (done) {
    mathField.focus();
    mathField.typedText('sqrt(x)');
    mathField.blur();
    setTimeout(function () {
      assert.equal(
        mathField.__controller.textarea.getAttribute('aria-label'),
        'Math Input: "s" "q" "r" "t" left parenthesis, "x" , right parenthesis'
      );
      done();
    });
    var staticMath = MQ.StaticMath(
      $('<span class="mathquill-static-math">y=\\frac{2x}{3y}</span>').appendTo(
        '#mock'
      )[0]
    );
    assert.equal(
      '"y" equals StartFraction, 2 "x" Over 3 "y" , EndFraction',
      staticMath.__controller.mathspeakSpan.textContent
    );
    assert.equal('', staticMath.getAriaLabel());
    staticMath.setAriaLabel('Static Label');
    assert.equal(
      'Static Label: "y" equals StartFraction, 2 "x" Over 3 "y" , EndFraction',
      staticMath.__controller.mathspeakSpan.textContent
    );
    assert.equal('Static Label', staticMath.getAriaLabel());
    staticMath.latex('2+2');
    assert.equal(
      'Static Label: 2 plus 2',
      staticMath.__controller.mathspeakSpan.textContent
    );
  });

  test('testing aria-label for tokens', function () {
    var staticMath = MQ.StaticMath(container);
    staticMath.latex('\\token{123}');
    assert.equal(
      'token 123',
      staticMath.mathspeak().trim(),
      'default token mathspeak is correct'
    );

    $('<span aria-label="point 123"></span>').appendTo(
      $(container).find('.mq-token')[0]
    );
    assert.equal(
      'point 123',
      staticMath.mathspeak().trim(),
      "token's child aria-label used for mathspeak"
    );
  });
});
