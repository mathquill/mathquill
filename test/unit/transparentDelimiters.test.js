suite('transparentDelimiters', function() {
  test('transparent class properly applied to empty delimiters' function() {
    var el = $('<span></span>');
    var mq = MQ.MathField(el.appendTo('#mock')[0]);

    // Test that parens are not transparent by default.
    mq.typedText('sin(').keystroke('Tab');
    assert.equal(mq.latex(), '\\sin\\left(\\right)');
    assert.equal(el.find('.mq-transparent-delimiter').length, 0);

    // Make parens transparent and verify the mq-transparent-delimiter class is applied.
    mq.latex('');
    mq.config({
      transparentDelimiters: 'left('
    });
    mq.typedText('sin(').keystroke('Tab');
    assert.equal(mq.latex(), '\\sin\\left(\\right)');
    assert.equal(el.find('.mq-transparent-delimiter').length, 1);
  });
});
