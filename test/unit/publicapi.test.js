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
      assert.equal(cursor[L].ctrlSeq, '\\ ', 'left of the cursor is ' + cursor[L].ctrlSeq);
      assert.equal(cursor[R], 0, 'right of the cursor is ' + cursor[R]);
      mq.keystroke('Backspace');

      mq.keystroke('Shift-Spacebar');
      mq.typedText(' ');
      assert.equal(cursor[L].ctrlSeq, '\\ ', 'left of the cursor is ' + cursor[L].ctrlSeq);
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

  suite('leftRightIntoCmdGoes: "up"/"down"', function() {
    test('"up" or "down" required', function() {
      assert.throws(function() {
        MathQuill.MathField($('<span></span>')[0], { leftRightIntoCmdGoes: 1 });
      });
    });
    suite('default', function() {
      var mq;
      setup(function() {
        mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
      });
      teardown(function() {
        $(mq.el()).remove();
      });

      test('fractions', function() {
        mq.latex('\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
        assert.equal(mq.latex(), '\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.moveToLeftEnd().typedText('a');
        assert.equal(mq.latex(), 'a\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('b');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('c');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('d');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('e');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('f');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('g');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('h');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('i');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{3}{4}}');

        mq.keystroke('Right').typedText('j');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{4}}');

        mq.keystroke('Right Right').typedText('k');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}}');

        mq.keystroke('Right Right').typedText('l');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}l}');

        mq.keystroke('Right').typedText('m');
        assert.equal(mq.latex(), 'a\\frac{b1}{cx}d+\\frac{e\\frac{f1}{g2}h}{i\\frac{j3}{k4}l}m');
      });

      test('supsub', function() {
        mq.latex('x_a+y^b+z_a^b+w');
        assert.equal(mq.latex(), 'x_a+y^b+z_a^b+w');

        mq.moveToLeftEnd().typedText('1');
        assert.equal(mq.latex(), '1x_a+y^b+z_a^b+w');

        mq.keystroke('Right Right').typedText('2');
        assert.equal(mq.latex(), '1x_{2a}+y^b+z_a^b+w');

        mq.keystroke('Right Right').typedText('3');
        assert.equal(mq.latex(), '1x_{2a}3+y^b+z_a^b+w');

        mq.keystroke('Right Right Right').typedText('4');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}+z_a^b+w');

        mq.keystroke('Right Right').typedText('5');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_a^b+w');

        mq.keystroke('Right Right Right').typedText('6');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^b+w');

        mq.keystroke('Right Right').typedText('7');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^{7b}+w');

        mq.keystroke('Right Right').typedText('8');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_{6a}^{7b}8+w');
      });

      test('nthroot', function() {
        mq.latex('\\sqrt[n]{x}');
        assert.equal(mq.latex(), '\\sqrt[n]{x}');

        mq.moveToLeftEnd().typedText('1');
        assert.equal(mq.latex(), '1\\sqrt[n]{x}');

        mq.keystroke('Right').typedText('2');
        assert.equal(mq.latex(), '1\\sqrt[2n]{x}');

        mq.keystroke('Right Right').typedText('3');
        assert.equal(mq.latex(), '1\\sqrt[2n]{3x}');

        mq.keystroke('Right Right').typedText('4');
        assert.equal(mq.latex(), '1\\sqrt[2n]{3x}4');
      });
    });
    suite('"up"', function() {
      var mq;
      setup(function() {
        mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0],
                                 { leftRightIntoCmdGoes: 'up' });
      });
      teardown(function() {
        $(mq.el()).remove();
      });

      test('fractions', function() {
        mq.latex('\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');
        assert.equal(mq.latex(), '\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.moveToLeftEnd().typedText('a');
        assert.equal(mq.latex(), 'a\\frac{1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('b');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('c');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('d');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('e');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}}{\\frac{3}{4}}');

        mq.keystroke('Right Right').typedText('f');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}f}{\\frac{3}{4}}');

        mq.keystroke('Right').typedText('g');
        assert.equal(mq.latex(), 'a\\frac{b1}{x}c+\\frac{d\\frac{e1}{2}f}{\\frac{3}{4}}g');
      });

      test('supsub', function() {
        mq.latex('x_a+y^b+z_a^b+w');
        assert.equal(mq.latex(), 'x_a+y^b+z_a^b+w');

        mq.moveToLeftEnd().typedText('1');
        assert.equal(mq.latex(), '1x_a+y^b+z_a^b+w');

        mq.keystroke('Right Right').typedText('2');
        assert.equal(mq.latex(), '1x_{2a}+y^b+z_a^b+w');

        mq.keystroke('Right Right').typedText('3');
        assert.equal(mq.latex(), '1x_{2a}3+y^b+z_a^b+w');

        mq.keystroke('Right Right Right').typedText('4');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}+z_a^b+w');

        mq.keystroke('Right Right').typedText('5');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_a^b+w');

        mq.keystroke('Right Right Right').typedText('6');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_a^{6b}+w');

        mq.keystroke('Right Right').typedText('7');
        assert.equal(mq.latex(), '1x_{2a}3+y^{4b}5+z_a^{6b}7+w');
      });

      test('nthroot', function() {
        mq.latex('\\sqrt[n]{x}');
        assert.equal(mq.latex(), '\\sqrt[n]{x}');

        mq.moveToLeftEnd().typedText('1');
        assert.equal(mq.latex(), '1\\sqrt[n]{x}');

        mq.keystroke('Right').typedText('2');
        assert.equal(mq.latex(), '1\\sqrt[2n]{x}');

        mq.keystroke('Right Right').typedText('3');
        assert.equal(mq.latex(), '1\\sqrt[2n]{3x}');

        mq.keystroke('Right Right').typedText('4');
        assert.equal(mq.latex(), '1\\sqrt[2n]{3x}4');
      });
    });
  });
});
