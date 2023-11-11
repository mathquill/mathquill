suite('up/down', function () {
  var mq, rootBlock, controller, cursor;
  setup(function () {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    rootBlock = mq.__controller.root;
    controller = mq.__controller;
    cursor = controller.cursor;
  });

  test('up/down in out of exponent', function () {
    controller.renderLatexMath('x^{nm}');
    var exp = rootBlock.ends[R],
      expBlock = exp.ends[L];
    assert.equal(exp.latex(), '^{nm}', 'right end el is exponent');
    assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
    assert.equal(cursor[L], exp, 'cursor is at the end of root block');

    mq.keystroke('Up');
    assert.equal(cursor.parent, expBlock, 'cursor up goes into exponent');

    mq.keystroke('Down');
    assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
    assert.equal(
      cursor[L],
      exp,
      'down when cursor at end of exponent puts cursor after exponent'
    );

    mq.keystroke('Up Left Left');
    assert.equal(cursor.parent, expBlock, 'cursor up left stays in exponent');
    assert.equal(cursor[L], 0, 'cursor is at the beginning of exponent');

    mq.keystroke('Down');
    assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
    assert.equal(
      cursor[R],
      exp,
      'cursor down in beginning of exponent puts cursor before exponent'
    );

    mq.keystroke('Up Right');
    assert.equal(cursor.parent, expBlock, 'cursor up left stays in exponent');
    assert.equal(cursor[L].latex(), 'n', 'cursor is in the middle of exponent');
    assert.equal(cursor[R].latex(), 'm', 'cursor is in the middle of exponent');

    mq.keystroke('Down');
    assert.equal(cursor.parent, rootBlock, 'cursor down leaves exponent');
    assert.equal(
      cursor[R],
      exp,
      'cursor down in middle of exponent puts cursor before exponent'
    );
  });

  // literally just swapped up and down, exponent with subscript, nm with 12
  test('up/down in out of subscript', function () {
    controller.renderLatexMath('a_{12}');
    var sub = rootBlock.ends[R],
      subBlock = sub.ends[L];
    assert.equal(sub.latex(), '_{12}', 'right end el is subscript');
    assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
    assert.equal(cursor[L], sub, 'cursor is at the end of root block');

    mq.keystroke('Down');
    assert.equal(cursor.parent, subBlock, 'cursor down goes into subscript');

    mq.keystroke('Up');
    assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
    assert.equal(
      cursor[L],
      sub,
      'up when cursor at end of subscript puts cursor after subscript'
    );

    mq.keystroke('Down Left Left');
    assert.equal(
      cursor.parent,
      subBlock,
      'cursor down left stays in subscript'
    );
    assert.equal(cursor[L], 0, 'cursor is at the beginning of subscript');

    mq.keystroke('Up');
    assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
    assert.equal(
      cursor[R],
      sub,
      'cursor up in beginning of subscript puts cursor before subscript'
    );

    mq.keystroke('Down Right');
    assert.equal(
      cursor.parent,
      subBlock,
      'cursor down left stays in subscript'
    );
    assert.equal(
      cursor[L].latex(),
      '1',
      'cursor is in the middle of subscript'
    );
    assert.equal(
      cursor[R].latex(),
      '2',
      'cursor is in the middle of subscript'
    );

    mq.keystroke('Up');
    assert.equal(cursor.parent, rootBlock, 'cursor up leaves subscript');
    assert.equal(
      cursor[R],
      sub,
      'cursor up in middle of subscript puts cursor before subscript'
    );
  });

  test('up/down into and within fraction', function () {
    controller.renderLatexMath('\\frac{12}{34}');
    var frac = rootBlock.ends[L],
      numer = frac.ends[L],
      denom = frac.ends[R];
    assert.equal(frac.latex(), '\\frac{12}{34}', 'fraction is in root block');
    assert.equal(
      frac,
      rootBlock.ends[R],
      'fraction is sole child of root block'
    );
    assert.equal(
      numer.latex(),
      '12',
      'numerator is left end child of fraction'
    );
    assert.equal(
      denom.latex(),
      '34',
      'denominator is right end child of fraction'
    );

    mq.keystroke('Up');
    assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
    assert.equal(
      cursor[R],
      0,
      'cursor up from right of fraction inserts at right end of numerator'
    );

    mq.keystroke('Down');
    assert.equal(cursor.parent, denom, 'cursor down goes into denominator');
    assert.equal(
      cursor[R],
      0,
      'cursor down from numerator inserts at right end of denominator'
    );

    mq.keystroke('Up');
    assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
    assert.equal(
      cursor[R],
      0,
      'cursor up from denominator inserts at right end of numerator'
    );

    mq.keystroke('Left Left Left');
    assert.equal(cursor.parent, rootBlock, 'cursor outside fraction');
    assert.equal(cursor[R], frac, 'cursor before fraction');

    mq.keystroke('Up');
    assert.equal(cursor.parent, numer, 'cursor up goes into numerator');
    assert.equal(
      cursor[L],
      0,
      'cursor up from left of fraction inserts at left end of numerator'
    );

    mq.keystroke('Left');
    assert.equal(cursor.parent, rootBlock, 'cursor outside fraction');
    assert.equal(cursor[R], frac, 'cursor before fraction');

    mq.keystroke('Down');
    assert.equal(cursor.parent, denom, 'cursor down goes into denominator');
    assert.equal(
      cursor[L],
      0,
      'cursor down from left of fraction inserts at left end of denominator'
    );
  });

  test('nested subscripts and fractions', function () {
    controller.renderLatexMath(
      '\\frac{d}{dx_{\\frac{24}{36}0}}\\sqrt{x}=x^{\\frac{1}{2}}'
    );
    var exp = rootBlock.ends[R],
      expBlock = exp.ends[L],
      half = expBlock.ends[L],
      halfNumer = half.ends[L],
      halfDenom = half.ends[R];

    mq.keystroke('Left');
    assert.equal(cursor.parent, expBlock, 'cursor left goes into exponent');

    mq.keystroke('Down');
    assert.equal(
      cursor.parent,
      halfDenom,
      'cursor down goes into denominator of half'
    );

    mq.keystroke('Down');
    assert.equal(
      cursor.parent,
      rootBlock,
      'down again puts cursor back in root block'
    );
    assert.equal(
      cursor[L],
      exp,
      'down from end of half puts cursor after exponent'
    );

    var derivative = rootBlock.ends[L],
      dBlock = derivative.ends[L],
      dxBlock = derivative.ends[R],
      sub = dxBlock.ends[R],
      subBlock = sub.ends[L],
      subFrac = subBlock.ends[L],
      subFracNumer = subFrac.ends[L],
      subFracDenom = subFrac.ends[R];

    cursor.insAtLeftEnd(rootBlock);
    mq.keystroke('Down Right Right Down');
    assert.equal(cursor.parent, subBlock, 'cursor in subscript');

    mq.keystroke('Up');
    assert.equal(
      cursor.parent,
      subFracNumer,
      'cursor up from beginning of subscript goes into subscript fraction numerator'
    );

    mq.keystroke('Up');
    assert.equal(
      cursor.parent,
      dxBlock,
      'cursor up from subscript fraction numerator goes out of subscript'
    );
    assert.equal(
      cursor[R],
      sub,
      'cursor up from subscript fraction numerator goes before subscript'
    );

    mq.keystroke('Down Down');
    assert.equal(
      cursor.parent,
      subFracDenom,
      'cursor in subscript fraction denominator'
    );

    mq.keystroke('Up Up');
    assert.equal(
      cursor.parent,
      dxBlock,
      'cursor up up from subscript fraction denominator thats not at right end goes out of subscript'
    );
    assert.equal(
      cursor[R],
      sub,
      'cursor up up from subscript fraction denominator thats not at right end goes before subscript'
    );

    cursor.insAtRightEnd(subBlock);
    controller.backspace();
    assert.equal(subFrac[R], 0, 'subscript fraction is at right end');
    assert.equal(cursor[L], subFrac, 'cursor after subscript fraction');

    mq.keystroke('Down');
    assert.equal(
      cursor.parent,
      subFracDenom,
      'cursor in subscript fraction denominator'
    );

    mq.keystroke('Up Up');
    assert.equal(
      cursor.parent,
      dxBlock,
      'cursor up up from subscript fraction denominator that is at right end goes out of subscript'
    );
    assert.equal(
      cursor[L],
      sub,
      'cursor up up from subscript fraction denominator that is at right end goes after subscript'
    );
  });

  test('integral in exponent', function () {
    controller.renderLatexMath('2^{\\int_0^1}');
    var exp = rootBlock.ends[R],
      expBlock = exp.ends[L];

    mq.keystroke('Up');
    mq.keystroke('Up');
    assert.equal(cursor.parent.latex(), '1', 'cursor up goes to upper limit');
    var upperRect = cursor.parent.jQ[0].getBoundingClientRect();

    mq.keystroke('Down');
    assert.equal(cursor.parent.latex(), '0', 'cursor down goes to lower limit');
    var lowerRect = cursor.parent.jQ[0].getBoundingClientRect();

    mq.keystroke('Up');
    assert.equal(cursor.parent.latex(), '1', 'cursor up goes to upper limit');

    var upperAboveLower = upperRect.bottom < lowerRect.top;
    assert.equal(
      upperAboveLower,
      true,
      'cursor actually moves downward for lower limit'
    );
  });

  test('\\MathQuillMathField{} in a fraction', function () {
    var outer = MQ.StaticMath(
      $('<span>\\frac{\\MathQuillMathField{n}}{2}</span>').appendTo('#mock')[0]
    );
    var inner = MQ($(outer.el()).find('.mq-editable-field')[0]);

    assert.equal(inner.__controller.cursor.parent, inner.__controller.root);
    inner.keystroke('Down');
    assert.equal(inner.__controller.cursor.parent, inner.__controller.root);
  });
});
