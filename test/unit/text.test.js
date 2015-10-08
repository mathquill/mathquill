suite('text', function() {

  function fromLatex(latex) {
    var block = latexMathParser.parse(latex);
    block.jQize();

    return block;
  }

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
    var block = fromLatex('\\text{abc}');
    var ctrlr = Controller({ __options: 0 }, block);
    var cursor = ctrlr.cursor.insAtRightEnd(block);

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
    var block = fromLatex('\\text{x}');
    var ctrlr = Controller({ __options: 0 }, block);
    var cursor = ctrlr.cursor.insAtRightEnd(block);

    ctrlr.moveLeft();
    ctrlr.moveLeft();
    ctrlr.moveLeft();

    assert.equal(block.latex(), '\\text{x}');
  });

  test('updates in the DOM from typing after stepping out of and back into an empty block', function() {
    var mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    var controller = mq.__controller;
    var cursor = controller.cursor;

    try {
      mq.latex('\\text{x}');

      mq.keystroke('Left');
      assertSplit(cursor.jQ, 'x');

      mq.keystroke('Backspace');
      assertSplit(cursor.jQ);

      mq.keystroke('Right Left');
      assertSplit(cursor.jQ);

      mq.typedText('y');
      assertSplit(cursor.jQ, 'y');
    } finally {
      $(mq.el()).remove();
    }
  });

  suite('deleteOutOf', function() {
    var mq, cursor, rootBlock, textBlock;

    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
      cursor = mq.__controller.cursor;
      rootBlock = mq.__controller.root;
      mq.latex("\\text{x}");
      textBlock = rootBlock.ends[L];
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('moves cursor to the left when backspacing out', function() {
      mq.keystroke("Left Left");
      assert.equal(cursor.parent, textBlock, 'cursor is in text block');
      assert.equal(cursor[R].text, 'x', 'cursor to the left of the text');
      assert.equal(cursor[L], 0, 'cursor at left end of the text block');

      mq.keystroke('Backspace');
      assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
      assert.equal(cursor[R], textBlock, 'cursor to the left of the text block');
      assert.equal(cursor[L], 0, 'cursor at left end of the root block');
      assert.equal(mq.latex(), '\\text{x}', 'text block still present');
    });

    test('moves cursor to the right when deleting out', function() {
      mq.keystroke("Left");
      assert.equal(cursor.parent, textBlock, 'cursor is in text block');
      assert.equal(cursor[R], 0, 'cursor at right end of the text block');
      assert.equal(cursor[L].text, 'x', 'cursor to the right of the text');

      mq.keystroke('Del');
      assert.equal(cursor.parent, rootBlock, 'cursor is in root block');
      assert.equal(cursor[R], 0, 'cursor at right end of the root block');
      assert.equal(cursor[L], textBlock, 'cursor to the right of the text block');
      assert.equal(mq.latex(), '\\text{x}', 'text block still present');
    });
  });
});
