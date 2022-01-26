suite('resetCursorOnBlur', function () {
  var $el;
  setup(function () {
    $el = $('<span style="display:inline-block; width: 100px"></span>');
  });

  test('remembers cursor position by default', function (done) {
    var mq = MQ.MathField($el.appendTo('#mock')[0]);

    mq.latex('a=2');
    mq.focus();
    mq.keystroke('Left');
    mq.typedText('1');
    assert.equal('a=12', mq.latex());

    mq.blur();
    setTimeout(function () {
      mq.focus();
      setTimeout(function () {
        mq.typedText('3');
        assert.equal('a=132', mq.latex());
        done();
      }, 1);
    }, 1);
  });

  test('forgets cursor position with resetCursorOnBlur option', function (done) {
    var mq = MQ.MathField($el.appendTo('#mock')[0], {
      resetCursorOnBlur: true,
    });

    mq.latex('a=2');
    mq.focus();
    mq.keystroke('Left');
    mq.typedText('1');
    assert.equal('a=12', mq.latex());

    mq.blur();
    setTimeout(function () {
      mq.focus();
      setTimeout(function () {
        mq.typedText('3');
        assert.equal('a=123', mq.latex());
        done();
      }, 1);
    }, 1);
  });
});
