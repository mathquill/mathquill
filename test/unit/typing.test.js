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
    prayWellFormedPoint(mq.controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  test('LiveFraction', function() {
    mq.typedText('1/2').keystroke('Tab').typedText('+sinx/');
    assertLatex('\\frac{1}{2}+\\frac{\\sin x}{ }');
    mq.latex('').typedText('1+/2');
    assertLatex('1+\\frac{2}{ }');
  });

  suite('auto-expanding parens', function() {
    test('empty parens', function() {
      mq.typedText('(');
      assertLatex('\\left(\\right)');
      mq.typedText(')');
      assertLatex('\\left(\\right)');
    });

    test('straight typing', function() {
      mq.typedText('1+(2+3)+4');
      assertLatex('1+\\left(2+3\\right)+4');
    });

    test('wrapping things in parens', function() {
      mq.typedText('1+2+3+4');
      assertLatex('1+2+3+4');
      mq.keystroke('Left Left').typedText(')');
      assertLatex('\\left(1+2+3\\right)+4');
      mq.keystroke('Left Left Left Left').typedText('(');
      assertLatex('1+\\left(2+3\\right)+4');
    });
  });
});
