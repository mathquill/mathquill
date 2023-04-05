suite('autoSubscriptNumeralsAndCharsThatBreakOutOfSupSub', function () {
  const $ = window.test_only_jquery;
  var mq;
  setup(function () {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
      charsThatBreakOutOfSupSub: '+-=<>',
      autoSubscriptNumerals: true,
    });
    rootBlock = mq.__controller.root;
    controller = mq.__controller;
    cursor = controller.cursor;
  });

  test('combined behavior works as expected', function () {
    assert.equal(mq.typedText('x_2n+y').latex(), 'x_{2n}+y');
    mq.latex('');

    // Unary operators never break out of subscript.
    assert.equal(mq.typedText('x_+2n').latex(), 'x_{+2n}');
    mq.latex('');
    assert.equal(mq.typedText('x_-2n').latex(), 'x_{-2n}');
    mq.latex('');
    assert.equal(mq.typedText('x_=2n').latex(), 'x_{=2n}');
    mq.latex('');

    // Only break out of exponents if cursor at the end, don't
    // jump from the middle of the exponent out to the right.
    assert.equal(mq.typedText('x_ab').latex(), 'x_{ab}');
    assert.equal(mq.keystroke('Left').typedText('+').latex(), 'x_{a+b}');
    mq.latex('');
  });
});
