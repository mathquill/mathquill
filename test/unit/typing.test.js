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
  });
});
