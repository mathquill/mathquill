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

  test('test florin spacing', function () {
    var mq,
        mock = $('#mock');

    mq = MathQuill.MathField($('<span></span>').appendTo(mock)[0]);
    mq.typedText("f'");

    var mqF = $(mq.el()).find('.mq-f');
    var testVal = parseFloat(mqF.css('margin-right')) - parseFloat(mqF.css('margin-left'));
    assert.ok(testVal > 0, 'this should be truthy') ;

    $(mq.el()).remove();
  });

  test('unary PlusMinus before separator', function () {
    var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    mq.latex('(-1,-1-1)-1,(+1;+1+1)+1,(\\pm1,\\pm1\\pm1)\\pm1');
    var spans = $(mq.el()).find('.mq-root-block').find('span');
    assert.equal(spans.length, 35, 'PlusMinus expression parsed incorrectly');

    function isBinaryOperator(i) { return $(spans[i]).hasClass('mq-binary-operator'); }
    function assertBinaryOperator(i, s) { assert.ok(isBinaryOperator(i), '"' + s + '" should be binary'); }
    function assertUnaryOperator(i, s) { assert.ok(!isBinaryOperator(i), '"' + s + '" should be unary'); }

    assertUnaryOperator(1, '(-');
    assertUnaryOperator(4, '(-1,-');
    assertBinaryOperator(6, '(-1,-1-');
    assertBinaryOperator(9, '(-1,-1-1)-');
    assertUnaryOperator(13, '(-1,-1-1)-1,(+');
    assertUnaryOperator(16, '(-1,-1-1)-1,(+1;+');
    assertBinaryOperator(18, '(-1,-1-1)-1,(+1;+1+');
    assertBinaryOperator(21, '(-1,-1-1)-1,(+1;+1+1)+');
    assertUnaryOperator(25, '(-1,-1-1)-1,(+1;+1+1)+1,(\pm');
    assertUnaryOperator(28, '(-1,-1-1)-1,(+1;+1+1)+1,(\pm1,\pm');
    assertBinaryOperator(30, '(-1,-1-1)-1,(+1;+1+1)+1,(\pm1,\pm1\pm');
    assertBinaryOperator(33, '(-1,-1-1)-1,(+1;+1+1)+1,(\pm1,\pm1\pm1)\pm');

    $(mq.el()).remove();
  });

  test('operator name spacing e.g. sin x', function() {
    var mq = MathQuill.MathField($('<span></span>').appendTo(mock)[0]);

    mq.typedText('sin');
    var n = jQuery('#mock var.mq-operator-name:last');
    assert.equal(n.text(), 'n');
    assert.ok(!n.is('.mq-last'));

    mq.typedText('x');
    assert.ok(n.is('.mq-last'));

    mq.keystroke('Left').typedText('(');
    assert.ok(!n.is('.mq-last'));

    mq.keystroke('Backspace').typedText('^');
    assert.ok(!n.is('.mq-last'));
    var supsub = jQuery('#mock .mq-supsub');
    assert.ok(supsub.is('.mq-after-operator-name'));

    mq.typedText('2').keystroke('Tab').typedText('(');
    assert.ok(!supsub.is('.mq-after-operator-name'));

    $(mq.el()).empty();
  });
});
