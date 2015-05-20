suite('autoSubscript', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0], {autoSubscriptNumerals: true});
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  test('auto subscripting variables', function() {
    mq.latex('x');
    mq.typedText('2');
    assert.equal(mq.latex(), 'x_2');
    mq.typedText('3');
    assert.equal(mq.latex(), 'x_{23}');
  });

  test('do not autosubscript functions', function() {
    mq.latex('sin');
    mq.typedText('2');
    assert.equal(mq.latex(), '\\sin2');
    mq.typedText('3');
    assert.equal(mq.latex(), '\\sin23');
  });

  test('autosubscript exponentiated variables', function() {
    mq.latex('x^2');
    mq.typedText('2');
    assert.equal(mq.latex(), 'x_2^2');
    mq.typedText('3');
    assert.equal(mq.latex(), 'x_{23}^2');
  });

  test('do not autosubscript exponentiated functions', function() {
    mq.latex('sin^{2}');
    mq.typedText('2');
    assert.equal(mq.latex(), '\\sin^22');
    mq.typedText('3');
    assert.equal(mq.latex(), '\\sin^223');
  });

  test('do not autosubscript subscripted functions', function() {
    mq.latex('sin_{10}');
    mq.typedText('2');
    assert.equal(mq.latex(), '\\sin_{10}2');
  });


});
