suite('quietEmptyDelimiters', function () {
  test('transparent class properly applied to empty delimiters when typing', function () {
    var el = $('<span></span>');
    var mq = MQ.MathField(el.appendTo('#mock')[0]);

    // Test that parens are not transparent by default.
    mq.typedText('sin(').keystroke('Tab');
    assert.equal(mq.latex(), '\\sin\\left(\\right)');
    assert.equal(el.find('.mq-quiet-delimiter').length, 0);

    // Make parens transparent and verify the mq-quiet-delimiter class is applied.
    mq.latex('');
    mq.config({
      quietEmptyDelimiters: '(',
    });
    mq.typedText('sin(').keystroke('Tab');
    assert.equal(mq.latex(), '\\sin\\left(\\right)');
    assert.equal(el.find('.mq-quiet-delimiter').length, 1);
  });

  test('transparent class properly applied to empty delimiters when setting LaTeX', function () {
    var el = $('<span></span>');
    var mq = MQ.MathField(el.appendTo('#mock')[0]);

    // Test that parens are not transparent by default.
    mq.latex('\\sin\\left(\\right)');
    assert.equal(el.find('.mq-quiet-delimiter').length, 0);

    // Make parens transparent and verify the mq-quiet-delimiter class is applied.
    mq.latex('');
    mq.config({
      quietEmptyDelimiters: '(',
    });
    mq.latex('\\sin\\left(\\right)');
    assert.equal(el.find('.mq-quiet-delimiter').length, 1);
  });
});
