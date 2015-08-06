suite('backspace', function() {
  var mq, rootBlock, controller, cursor;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    rootBlock = mq.__controller.root;
    controller = mq.__controller;
    cursor = controller.cursor;
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  function prayWellFormedPoint(pt) { prayWellFormed(pt.parent, pt[L], pt[R]); }
  function assertLatex(latex) {
    prayWellFormedPoint(mq.__controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  test('backspace through exponent', function() {
    controller.renderLatexMath('x^{nm}');
    var exp = rootBlock.ends[R],
      expBlock = exp.ends[L];
    assert.equal(exp.latex(), '^{nm}', 'right end el is exponent');
    assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
    assert.equal(cursor[L], exp, 'cursor is at the end of root block');

    mq.keystroke('Backspace');
    assert.equal(cursor.parent, expBlock, 'cursor up goes into exponent on backspace');
    assertLatex('x^{nm}');

    mq.keystroke('Backspace');
    assert.equal(cursor.parent, expBlock, 'cursor still in exponent');
    assertLatex('x^n');

    mq.keystroke('Backspace');
    assert.equal(cursor.parent, expBlock, 'still in exponent, but it is empty');
    assertLatex('x^{ }');

    mq.keystroke('Backspace');
    assert.equal(cursor.parent, rootBlock, 'backspace tears down exponent');
    assertLatex('x');
  });

  test('backspace through complex fraction', function() {
    controller.renderLatexMath('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');

    //first backspace moves to denominator
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');

    //first backspace moves to denominator in denominator
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{3}}');

    //finally delete a character
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{2}+\\frac{2}{ }}');

    //destroy fraction
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{2}+2}');

    mq.keystroke('Backspace');
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{2}}');

    mq.keystroke('Backspace');
    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{\\frac{1}{ }}');

    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{1}');

    mq.keystroke('Backspace');
    assertLatex('1+\\frac{1}{ }');

    mq.keystroke('Backspace');
    assertLatex('1+1');
  });



  test('backspace through compound subscript', function() {
    mq.latex('x_{2_2}');

    //first backspace goes into the subscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{2_2}');

    //second one goes into the subscripts' subscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{2_2}');

    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{2_{ }}');

    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2');

    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{ }');

    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x');
  });

  test('backspace through simple subscript', function() {
    mq.latex('x_{2+3}');

    assert.equal(cursor.parent, rootBlock, 'start in the root block');

    //backspace goes down
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{2+3}');
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{2+}');
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2');
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{ }');
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x');
  });

  test('backspace through subscript & superscript', function() {
    mq.latex('x_2^{32}');

    //first backspace takes us into the exponent
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2^{32}');

    //second backspace is within the exponent
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2^3');

    //clear out exponent
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2^{ }');

    //unpeel exponent
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2');

    //into subscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_2');

    //clear out subscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x_{ }');

    //unpeel exponent
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'x');

    //clear out math field
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'');
  });

  test('backspace through nthroot', function() {
    mq.latex('\\sqrt[3]{x}');

    //first backspace takes us inside the nthroot
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'\\sqrt[3]{x}');

    //second backspace removes the x
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'\\sqrt[3]{}');

    //third one destroys the cube root, but leaves behind the 3
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'3');

    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'');
  });

  test('backspace through large operator', function() {
    mq.latex('\\sum_{n=1}^3x');

    //first backspace takes out the argument
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'\\sum_{n=1}^3');

    //up into the superscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'\\sum_{n=1}^3');

    //up into the superscript
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'\\sum_{n=1}^{ }');

    //destroy the sum, preserve the subscript (a little surprising)
    mq.keystroke('Backspace');
    assert.equal(mq.latex(),'n=1');
  });
});
