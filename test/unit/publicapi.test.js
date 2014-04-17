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

    test('latex while there\'s a selection', function() {
      mq.latex('a');
      assert.equal(mq.latex(), 'a');
      mq.select();
      assert.equal(mq.controller.cursor.selection.join('latex'), 'a');
      mq.latex('b');
      assert.equal(mq.latex(), 'b');
      mq.typedText('c');
      assert.equal(mq.latex(), 'bc');
    });

    test('.html() trivial case', function() {
      mq.latex('x+y');
      assert.equal(mq.html(), '<var>x</var><span class="binary-operator">+</span><var>y</var>');
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

  suite('.cmd(...)', function() {
    var mq;
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('basic', function() {
      mq.cmd('x');
      assert.equal(mq.latex(), 'x');
      mq.cmd('y');
      assert.equal(mq.latex(), 'xy');
      mq.cmd('^');
      assert.equal(mq.latex(), 'xy^{ }');
      mq.cmd('2');
      assert.equal(mq.latex(), 'xy^2');
      mq.keystroke('Right Shift-Left Shift-Left Shift-Left').cmd('\\sqrt');
      assert.equal(mq.latex(), '\\sqrt{xy^2}');
    });
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

  suite('statelessClipboard option', function() {
    suite('default', function() {
      var mq, textarea;
      setup(function() {
        mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
        textarea = $(mq.el()).find('textarea');;
      });
      teardown(function() {
        $(mq.el()).remove();
      });
      function assertPaste(paste, latex) {
        if (arguments.length < 2) latex = paste;
        mq.latex('');
        textarea.trigger('paste').val(paste).trigger('input');
        assert.equal(mq.latex(), latex);
      }

      test('numbers and letters', function() {
        assertPaste('123xyz');
      });
      test('a sentence', function() {
        assertPaste('Lorem ipsum is a placeholder text commonly used to '
                    + 'demonstrate the graphical elements of a document or '
                    + 'visual presentation.',
                    'Loremipsumisaplaceholdertextcommonlyusedtodemonstrate'
                    + 'thegraphicalelementsofadocumentorvisualpresentation.');
      });
      test('actual LaTeX', function() {
        assertPaste('a_nx^n+a_{n+1}x^{n+1}');
        assertPaste('\\frac{1}{2\\sqrt{x}}');
      });
      test('\\text{...}', function() {
        assertPaste('\\text{lol}');
        assertPaste('1+\\text{lol}+2');
        assertPaste('\\frac{\\text{apples}}{\\text{oranges}}');
      });
      test('selection', function(done) {
        mq.latex('x^2').select();
        setTimeout(function() {
          assert.equal(textarea.val(), 'x^2');
          done();
        });
      });
    });
    suite('statelessClipboard set to true', function() {
      var mq, textarea;
      setup(function() {
        mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0],
                                 { statelessClipboard: true });
        textarea = $(mq.el()).find('textarea');;
      });
      teardown(function() {
        $(mq.el()).remove();
      });
      function assertPaste(paste, latex) {
        if (arguments.length < 2) latex = paste;
        mq.latex('');
        textarea.trigger('paste').val(paste).trigger('input');
        assert.equal(mq.latex(), latex);
      }

      test('numbers and letters', function() {
        assertPaste('123xyz', '\\text{123xyz}');
      });
      test('a sentence', function() {
        assertPaste('Lorem ipsum is a placeholder text commonly used to '
                    + 'demonstrate the graphical elements of a document or '
                    + 'visual presentation.',
                    '\\text{Lorem ipsum is a placeholder text commonly used to '
                    + 'demonstrate the graphical elements of a document or '
                    + 'visual presentation.}');
      });
      test('backslashes', function() {
        assertPaste('something \\pi something \\asdf',
                    '\\text{something \\pi something \\asdf}');
      });
      // TODO: braces (currently broken)
      test('actual math LaTeX wrapped in dollar signs', function() {
        assertPaste('$a_nx^n+a_{n+1}x^{n+1}$', 'a_nx^n+a_{n+1}x^{n+1}');
        assertPaste('$\\frac{1}{2\\sqrt{x}}$', '\\frac{1}{2\\sqrt{x}}');
      });
      test('selection', function(done) {
        mq.latex('x^2').select();
        setTimeout(function() {
          assert.equal(textarea.val(), '$x^2$');
          done();
        });
      });
    });
  });
});
