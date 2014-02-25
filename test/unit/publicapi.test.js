suite('Public API', function() {
  suite('simple', function() {
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

  test('*OutOf handlers', function() {
    var upCounter = 0, moveCounter = 0, dir = null, deleteCounter = 0;

    var mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0], {
      handlers: {
        upOutOf: function() { upCounter += 1; },
        moveOutOf: function(d) { moveCounter += 1; dir = d; },
        deleteOutOf: function(d) { deleteCounter += 1; dir = d; }
      }
    });

    mq.latex('n+\\frac{n}{2}'); // starts at right edge
    assert.equal(moveCounter, 0);

    mq.keystroke('Right'); // stay at right edge
    assert.equal(moveCounter, 1);
    assert.equal(dir, R);

    mq.keystroke('Right'); // stay at right edge
    assert.equal(moveCounter, 2);
    assert.equal(dir, R);

    mq.keystroke('Left'); // right edge of denominator
    assert.equal(moveCounter, 2);
    assert.equal(upCounter, 0);

    mq.keystroke('Up'); // right edge of numerator
    assert.equal(moveCounter, 2);
    assert.equal(upCounter, 0);

    mq.keystroke('Up'); // stays at right edge of numerator
    assert.equal(upCounter, 1);

    mq.keystroke('Up'); // stays at right edge of numerator
    assert.equal(upCounter, 2);

    // go to left edge
    mq.keystroke('Left').keystroke('Left').keystroke('Left').keystroke('Left');
    assert.equal(moveCounter, 2);

    mq.keystroke('Left'); // stays at left edge
    assert.equal(moveCounter, 3);
    assert.equal(dir, L);
    assert.equal(deleteCounter, 0);

    mq.keystroke('Backspace'); // stays at left edge
    assert.equal(deleteCounter, 1);
    assert.equal(dir, L);

    mq.keystroke('Backspace'); // stays at left edge
    assert.equal(deleteCounter, 2);
    assert.equal(dir, L);

    mq.keystroke('Left'); // stays at left edge
    assert.equal(moveCounter, 4);
    assert.equal(dir, L);

    $(mq.el()).remove();
  });

  suite('spaceBehavesLikeTab', function() {
    var mq, rootBlock, cursor;
    test('space behaves like tab with default opts', function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
      rootBlock = mq.controller.root;
      cursor = mq.controller.cursor;

      mq.latex('\\sqrt{x}');
      mq.keystroke('Left');

      mq.keystroke('Spacebar');
      mq.typedText(' ');
      assert.equal(cursor[L].ctrlSeq, '\\:', 'left of the cursor is ' + cursor[L].ctrlSeq);
      assert.equal(cursor[R], 0, 'right of the cursor is ' + cursor[R]);
      mq.keystroke('Backspace');

      mq.keystroke('Shift-Spacebar');
      mq.typedText(' ');
      assert.equal(cursor[L].ctrlSeq, '\\:', 'left of the cursor is ' + cursor[L].ctrlSeq);
      assert.equal(cursor[R], 0, 'right of the cursor is ' + cursor[R]);

      $(mq.el()).remove();
    });
    test('space behaves like tab when spaceBehavesLikeTab is true', function() {
      var opts = { 'spaceBehavesLikeTab': true };
      mq = MathQuill.MathField( $('<span></span>').appendTo('#mock')[0], opts)
      rootBlock = mq.controller.root;
      cursor = mq.controller.cursor;

      mq.latex('\\sqrt{x}');

      mq.keystroke('Left');
      mq.keystroke('Spacebar');
      assert.equal(cursor[L].parent, rootBlock, 'parent of the cursor is  ' + cursor[L].ctrlSeq);
      assert.equal(cursor[R], 0, 'right cursor is ' + cursor[R]);

      mq.keystroke('Left');
      mq.keystroke('Shift-Spacebar');
      assert.equal(cursor[L], 0, 'left cursor is ' + cursor[L]);
      assert.equal(cursor[R], rootBlock.ends[L], 'parent of rootBlock is ' + cursor[R]);

      $(mq.el()).remove();
    });
  });
});
