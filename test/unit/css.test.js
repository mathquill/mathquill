suite('CSS', function() {
  test('math field doesn\'t fuck up ancestor\'s .scrollWidth', function() {
    var mock = $('#mock').css({
      fontSize: '16px',
      height: '25px', // must be greater than font-size * 115% + 2 * 2px (padding) + 2 * 1px (border)
      width: '25px'
    })[0];
    assert.equal(mock.scrollHeight, 25);
    assert.equal(mock.scrollWidth, 25);

    var mq = MQ.MathField($('<span style="box-sizing:border-box;height:100%;width:100%"></span>').appendTo(mock)[0]);
    assert.equal(mock.scrollHeight, 25);
    assert.equal(mock.scrollWidth, 25);

    $(mq.el()).remove();
    $(mock).css({
      fontSize: '',
      height: '',
      width: ''
    });
  });

  test('empty root block does not collapse', function() {
    var testEl = $('<span></span>').appendTo('#mock');
    var mq = MQ.MathField(testEl[0]);
    var rootEl = testEl.find('.mq-root-block');

    assert.ok(rootEl.hasClass('mq-empty'), 'Empty root block should have the mq-empty class name.');
    assert.ok(rootEl.height() > 0, 'Empty root block height should be above 0.');

    testEl.remove();
  });

  test('empty block does not collapse', function() {
    var testEl = $('<span>\\frac{}{}</span>').appendTo('#mock');
    var mq = MQ.MathField(testEl[0]);
    var numeratorEl = testEl.find('.mq-numerator');

    assert.ok(numeratorEl.hasClass('mq-empty'), 'Empty numerator should have the mq-empty class name.');
    assert.ok(numeratorEl.height() > 0, 'Empty numerator height should be above 0.');

    testEl.remove();
  });
});
