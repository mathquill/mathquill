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
      width: ''
    });
  });
});
