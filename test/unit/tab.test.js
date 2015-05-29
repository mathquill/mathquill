suite('tab behavior', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    rootBlock = mq.__controller.root;
    controller = mq.__controller;
    cursor = controller.cursor;
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  test('tab without selection', function() {
    mq.latex('\\frac{1}{2}');
    mq.keystroke('Left Left');
    var frac = rootBlock.ends[L],
      denom = frac.ends[R];

    assert.equal(cursor.parent, denom, 'cursor is in the denominator');
    mq.keystroke('Tab');
    assert.equal(cursor.parent, rootBlock, 'cursor is in the root block');
  });

  test('tab with selection', function() {
    mq.latex('\\frac{1}{2}');
    mq.keystroke('Left Shift-Left');
    var frac = rootBlock.ends[L],
      denom = frac.ends[R];

    assert.equal(!!cursor.selection, true, 'there is text selected')
    assert.equal(cursor.parent, denom, 'cursor is in the denominator');
    mq.keystroke('Tab');

    var frac = rootBlock.ends[L],
      denom = frac.ends[R];

    assert.equal(!!cursor.selection, false, 'there is no text selected')
    assert.equal(cursor.parent, denom, 'cursor is still the denominator');

    mq.keystroke('Tab');
    assert.equal(cursor.parent, rootBlock, 'cursor is at the root block');
  });

});
