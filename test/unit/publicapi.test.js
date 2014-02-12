suite('Public API', function() {
  var mq;
  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
  });
  teardown(function() {
    $(mq.el()).remove();
  });

  test('select, clearSelection', function() {
    mq.latex('n+\\frac{n}{2}');
    assert.ok(!mq.controller.cursor.selection);
    mq.select();
    assert.equal(mq.controller.cursor.selection.join('latex'), 'n+\\frac{n}{2}');
    mq.clearSelection();
    assert.ok(!mq.controller.cursor.selection);
  });

  test('.moveToDirEnd(dir)', function() {
    mq.latex('a x^2 + b x + c = 0');
    assert.equal(mq.controller.cursor[L].ctrlSeq, '0');
    assert.equal(mq.controller.cursor[R], 0);
    mq.moveToLeftEnd();
    assert.equal(mq.controller.cursor[L], 0);
    assert.equal(mq.controller.cursor[R].ctrlSeq, 'a');
    mq.moveToRightEnd();
    assert.equal(mq.controller.cursor[L].ctrlSeq, '0');
    assert.equal(mq.controller.cursor[R], 0);
  });
});
