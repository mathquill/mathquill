suite('Public API', function() {
  suite('global functions', function() {
    test('null', function() {
      assert.equal(MathQuill(), null);
      assert.equal(MathQuill(0), null);
      assert.equal(MathQuill('<span/>'), null);
      assert.equal(MathQuill($('<span/>')[0]), null);
      assert.equal(MathQuill.MathField(), null);
      assert.equal(MathQuill.MathField(0), null);
      assert.equal(MathQuill.MathField('<span/>'), null);
    });

    test('MathQuill.MathField()', function() {
      var el = $('<span>x^2</span>').appendTo('#mock');
      var mathField = MathQuill.MathField(el[0]);
      assert.ok(mathField instanceof MathQuill.MathField);
      assert.ok(mathField instanceof MathQuill.EditableField);
      assert.ok(mathField instanceof MathQuill);
    });

    test('identity of API object returned by MathQuill()', function() {
      var mathFieldSpan = $('<span/>')[0];
      var mathfield = MathQuill.MathField(mathFieldSpan);
      assert.equal(MathQuill(mathFieldSpan), mathfield);
      assert.equal(MathQuill(mathFieldSpan), MathQuill(mathFieldSpan));
    });

    test('blurred when created', function() {
      var el = $('<span/>');
      MathQuill.MathField(el[0]);
      var rootBlock = el.find('.mq-root-block');
      assert.ok(rootBlock.hasClass('mq-empty'));
      assert.ok(!rootBlock.hasClass('mq-hasCursor'));
    });
  });
  suite('basic API methods', function() {
    var mq;
    setup(function() {
      mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('.revert()', function() {
      var mq = MathQuill.MathField($('<span>some <code>HTML</code></span>')[0]);
      assert.equal(mq.revert().html(), 'some <code>HTML</code>');
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
      assert.equal(mq.html(), '<var>x</var><span class="mq-binary-operator">+</span><var>y</var>');
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
