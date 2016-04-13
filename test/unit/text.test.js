suite('text', function() {

  function assertSplit(jQ, prev, next) {
    var dom = jQ[0];

    if (prev) {
      assert.ok(dom.previousSibling instanceof Text);
      assert.equal(prev, dom.previousSibling.data);
    }
    else {
      assert.ok(!dom.previousSibling);
    }

    if (next) {
      assert.ok(dom.nextSibling instanceof Text);
      assert.equal(next, dom.nextSibling.data);
    }
    else {
      assert.ok(!dom.nextSibling);
    }
  }

  test('changes the text nodes as the cursor moves around', function() {
    var ctrlr = Controller(MathBlock(), 0, Options()), cursor = ctrlr.cursor;
    ctrlr.renderLatexMath('\\text{abc}');
    ctrlr.root.jQize();

    ctrlr.moveLeft();
    assertSplit(cursor.jQ, 'abc', null);

    ctrlr.moveLeft();
    assertSplit(cursor.jQ, 'ab', 'c');

    ctrlr.moveLeft();
    assertSplit(cursor.jQ, 'a', 'bc');

    ctrlr.moveLeft();
    assertSplit(cursor.jQ, null, 'abc');

    ctrlr.moveRight();
    assertSplit(cursor.jQ, 'a', 'bc');

    ctrlr.moveRight();
    assertSplit(cursor.jQ, 'ab', 'c');

    ctrlr.moveRight();
    assertSplit(cursor.jQ, 'abc', null);
  });

  test('does not change latex as the cursor moves around', function() {
    var ctrlr = Controller(MathBlock(), 0, Options()), cursor = ctrlr.cursor;
    ctrlr.renderLatexMath('\\text{x}');
    ctrlr.root.jQize();

    ctrlr.moveLeft();
    ctrlr.moveLeft();
    ctrlr.moveLeft();

    assert.equal(ctrlr.root.latex(), '\\text{x}');
  });

  test('stepping out of an empty block deletes it', function() {
    var mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    var controller = mq.__controller;
    var cursor = controller.cursor;

    try {
      mq.latex('\\text{x}');

      mq.keystroke('Left');
      assertSplit(cursor.jQ, 'x');

      mq.keystroke('Backspace');
      assertSplit(cursor.jQ);

      mq.keystroke('Right');
      assertSplit(cursor.jQ);
      assert.equal(cursor[L], 0);
    } finally {
      $(mq.el()).remove();
    }
  });

  test('typing $ in a textblock splits it', function() {
    var mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    var controller = mq.__controller;
    var cursor = controller.cursor;

    try {
      mq.latex('\\text{asdf}');
      mq.keystroke('Left Left Left');
      assertSplit(cursor.jQ, 'as', 'df');

      mq.typedText('$');
      assert.equal(mq.latex(), '\\text{as}\\text{df}');
    } finally {
      $(mq.el()).remove();
    }
  });
});
