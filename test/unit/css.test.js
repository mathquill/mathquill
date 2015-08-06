suite('CSS', function() {
  test('math field doesn\'t fuck up ancestor\'s .scrollWidth', function() {
    var mock = $('#mock').css({
      fontSize: '16px',
      height: '25px', // must be greater than font-size * 115% + 2 * 2px (padding) + 2 * 1px (border)
      width: '25px'
    })[0];
    assert.equal(mock.scrollHeight, 25);
    assert.equal(mock.scrollWidth, 25);

    var mq = MathQuill.MathField($('<span style="box-sizing:border-box;height:100%;width:100%"></span>').appendTo(mock)[0]);
    assert.equal(mock.scrollHeight, 25);
    assert.equal(mock.scrollWidth, 25);

    $(mq.el()).remove();
    $(mock).css({
      fontSize: '',
      height: '',
      widht: ''
    });
  });

  test('test polyatomic symbol rendering', function () {
    var mq,
        mock = $('#mock');

    mq = MathQuill.MathField($('<span></span>').appendTo(mock)[0]);
    mq.typedText("f'");

    var mqF = $(mq.el()).find('.mq-f');
    var testVal = parseFloat(mqF.css('margin-right')) - parseFloat(mqF.css('margin-left'));
    assert.ok(testVal > 0, 'this should be truthy') ;
    mq.latex('C_2{}^{2-}H_2{}^3');

    var element = $(mq.el()).find('.mq-sup');
    assert.equal(element.css('float'), 'right');
    assert.equal(element.css('display'), 'block');
    assert.equal(parseFloat(element.css('margin-top')), parseFloat(element.css('font-size')) * -1);
  });

  test('test atomic symbol rendering', function () {
    var mq,
        mock = $('#mock');

    mq = MathQuill.MathField($('<span></span>').appendTo(mock)[0]);
    mq.latex('_2{}^{2-}CH_2{}^3');

    var element = $(mq.el()).find('.mq-sup');
    assert.equal(element.css('float'), 'right');
    assert.equal(element.css('display'), 'block');
    assert.equal(parseFloat(element.css('margin-top')), parseFloat(element.css('font-size')) * -1);
  });

  test('test florin spacing', function () {
    var mq,
        mock = $('#mock');

    mq = MathQuill.MathField($('<span></span>').appendTo(mock)[0]);
    mq.typedText("f'");

    var mqF = $(mq.el()).find('.mq-f');
    var testVal = parseFloat(mqF.css('margin-right')) - parseFloat(mqF.css('margin-left'));
    assert.ok(testVal > 0, 'this should be truthy') ;
  });
});
