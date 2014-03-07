suite('typing with auto-replaces', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function prayWellFormedPoint(pt) { prayWellFormed(pt.parent, pt[L], pt[R]); }

  test('LiveFraction', function() {
    mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '\\frac{1}{2}+\\frac{\\sin x}{ }');

    mq.latex('').typedText('1+/2');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '1+\\frac{2}{ }');
  });

  test('live parens (HalfBracket\'s)', function() {
    mq.typedText('(');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '(');

    mq.typedText('1+2');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '(1+2');

    mq.typedText('+(3+4');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '(1+2+(3+4');

    mq.typedText(')');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '(1+2+\\left(3+4\\right)');

    mq.typedText(')');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '\\left(1+2+\\left(3+4\\right)\\right)');

    mq.keystroke('Left').keystroke('Backspace');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '\\left(1+2+(3+4\\right)');

    mq.keystroke('Del');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '(1+2+(3+4');

    mq.latex('1+\\left(\\right)').keystroke('Backspace');
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), '1+(');
  });
});
