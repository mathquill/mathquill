suite('Public API', function() {
  suite('global functions', function() {
    test('null', function() {
      assert.equal(MQ(), null);
      assert.equal(MQ(0), null);
      assert.equal(MQ('<span/>'), null);
      assert.equal(MQ($('<span/>')[0]), null);
      assert.equal(MQ.MathField(), null);
      assert.equal(MQ.MathField(0), null);
      assert.equal(MQ.MathField('<span/>'), null);
    });

    test('MQ.MathField()', function() {
      var el = $('<span>x^2</span>');
      var mathField = MQ.MathField(el[0]);
      assert.ok(mathField instanceof MQ.MathField);
      assert.ok(mathField instanceof MQ.EditableField);
      assert.ok(mathField instanceof MQ);
    });

    test('identity of API object returned by MQ()', function() {
      var mathFieldSpan = $('<span/>')[0];
      var mathField = MQ.MathField(mathFieldSpan);

      assert.ok(MQ(mathFieldSpan) !== mathField);

      assert.equal(MQ(mathFieldSpan).id, mathField.id);
      assert.equal(MQ(mathFieldSpan).id, MQ(mathFieldSpan).id);

      assert.equal(MQ(mathFieldSpan).data, mathField.data);
      assert.equal(MQ(mathFieldSpan).data, MQ(mathFieldSpan).data);
    });

    test('blurred when created', function() {
      var el = $('<span/>');
      MQ.MathField(el[0]);
      var rootBlock = el.find('.mq-root-block');
      assert.ok(rootBlock.hasClass('mq-empty'));
      assert.ok(!rootBlock.hasClass('mq-hasCursor'));
    });
  });

  suite('mathquill-basic', function() {
    var mq;
    setup(function() {
      mq = MQBasic.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('typing \\', function() {
      mq.typedText('\\');
      assert.equal(mq.latex(), '\\backslash');
    });

    test('typing $', function() {
      mq.typedText('$');
      assert.equal(mq.latex(), '\\$');
    });

    test('parsing of advanced symbols', function() {
      mq.latex('\\oplus');
      assert.equal(mq.latex(), ''); // TODO: better LaTeX parse error behavior
    });
  });

  suite('basic API methods', function() {
    var mq;
    setup(function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    });
    teardown(function() {
      $(mq.el()).remove();
    });

    test('.revert()', function() {
      var mq = MQ.MathField($('<span>some <code>HTML</code></span>')[0]);
      assert.equal(mq.revert().html(), 'some <code>HTML</code>');
    });

    test('select, clearSelection', function() {
      mq.latex('n+\\frac{n}{2}');
      assert.ok(!mq.__controller.cursor.selection);
      mq.select();
      assert.equal(mq.__controller.cursor.selection.join('latex'), 'n+\\frac{n}{2}');
      mq.clearSelection();
      assert.ok(!mq.__controller.cursor.selection);
    });

    test('latex while there\'s a selection', function() {
      mq.latex('a');
      assert.equal(mq.latex(), 'a');
      mq.select();
      assert.equal(mq.__controller.cursor.selection.join('latex'), 'a');
      mq.latex('b');
      assert.equal(mq.latex(), 'b');
      mq.typedText('c');
      assert.equal(mq.latex(), 'bc');
    });

    test('.html() trivial case', function() {
      mq.latex('x+y');
      assert.equal(mq.html(), '<var>x</var><span class="mq-binary-operator">+</span><var>y</var>');
    });
    
    test('.text() with incomplete commands', function() {
      assert.equal(mq.text(), '');
      mq.typedText('\\');
      assert.equal(mq.text(), '\\');
      mq.typedText('s');
      assert.equal(mq.text(), '\\s');
      mq.typedText('qrt');
      assert.equal(mq.text(), '\\sqrt');
    });
    
    test('.text() with complete commands', function() {
      mq.latex('\\sqrt{}');
      assert.equal(mq.text(), 'sqrt()');
      mq.latex('\\nthroot[]{}');
      assert.equal(mq.text(), 'sqrt[]()');
      mq.latex('\\frac{}{}');
      assert.equal(mq.text(), '(/)');
      mq.latex('\\frac{3}{5}');
      assert.equal(mq.text(), '(3/5)');
      mq.latex('\\div');
      assert.equal(mq.text(), '[/]');
      mq.latex('^{}');
      assert.equal(mq.text(), '**');
      mq.latex('3^{4}');
      assert.equal(mq.text(), '3**4');
    });

    test('.moveToDirEnd(dir)', function() {
      mq.latex('a x^2 + b x + c = 0');
      assert.equal(mq.__controller.cursor[L].ctrlSeq, '0');
      assert.equal(mq.__controller.cursor[R], 0);
      mq.moveToLeftEnd();
      assert.equal(mq.__controller.cursor[L], 0);
      assert.equal(mq.__controller.cursor[R].ctrlSeq, 'a');
      mq.moveToRightEnd();
      assert.equal(mq.__controller.cursor[L].ctrlSeq, '0');
      assert.equal(mq.__controller.cursor[R], 0);
    });
  });

  test('edit handler interface versioning', function() {
    var count = 0;

    // interface version 2 (latest)
    var mq2 = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
      handlers: {
        edit: function(_mq) {
          assert.equal(mq2.id, _mq.id);
          count += 1;
        }
      }
    });
    assert.equal(count, 0);
    mq2.latex('x^2');
    assert.equal(count, 2); // sigh, once for postOrder and once for bubble

    count = 0;
    // interface version 1
    var MQ1 = MathQuill.getInterface(1);
    var mq1 = MQ1.MathField($('<span></span>').appendTo('#mock')[0], {
      handlers: {
        edit: function(_mq) {
          if (count <= 2) assert.equal(mq1, undefined);
          else assert.equal(mq1.id, _mq.id);
          count += 1;
        }
      }
    });
    assert.equal(count, 2);
  });

  suite('*OutOf handlers', function() {
    testHandlers('MQ.MathField() constructor', function(options) {
      return MQ.MathField($('<span></span>').appendTo('#mock')[0], options);
    });
    testHandlers('MQ.MathField::config()', function(options) {
      return MQ.MathField($('<span></span>').appendTo('#mock')[0]).config(options);
    });
    testHandlers('.config() on \\MathQuillMathField{} in a MQ.StaticMath', function(options) {
      return MQ.MathField($('<span></span>').appendTo('#mock')[0]).config(options);
    });
    suite('global MQ.config()', function() {
      testHandlers('a MQ.MathField', function(options) {
        MQ.config(options);
        return MQ.MathField($('<span></span>').appendTo('#mock')[0]);
      });
      testHandlers('\\MathQuillMathField{} in a MQ.StaticMath', function(options) {
        MQ.config(options);
        return MQ.StaticMath($('<span>\\MathQuillMathField{}</span>').appendTo('#mock')[0]).innerFields[0];
      });
      teardown(function() {
        MQ.config({ handlers: undefined });
      });
    });
    function testHandlers(title, mathFieldMaker) {
      test(title, function() {
        var enterCounter = 0, upCounter = 0, moveCounter = 0, deleteCounter = 0,
          dir = null;

        var mq = mathFieldMaker({
          handlers: {
            enter: function(_mq) {
              assert.equal(arguments.length, 1);
              assert.equal(_mq.id, mq.id);
              enterCounter += 1;
            },
            upOutOf: function(_mq) {
              assert.equal(arguments.length, 1);
              assert.equal(_mq.id, mq.id);
              upCounter += 1;
            },
            moveOutOf: function(_dir, _mq) {
              assert.equal(arguments.length, 2);
              assert.equal(_mq.id, mq.id);
              dir = _dir;
              moveCounter += 1;
            },
            deleteOutOf: function(_dir, _mq) {
              assert.equal(arguments.length, 2);
              assert.equal(_mq.id, mq.id);
              dir = _dir;
              deleteCounter += 1;
            }
          }
        });

        mq.latex('n+\\frac{n}{2}'); // starts at right edge
        assert.equal(moveCounter, 0);

        mq.typedText('\n'); // nothing happens
        assert.equal(enterCounter, 1);

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

        $('#mock').empty();
      });
    }
  });

  suite('.cmd(...)', function() {
    var mq;
    setup(function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
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

    test('backslash commands are passed their name', function() {
      mq.cmd('\\alpha');
      assert.equal(mq.latex(), '\\alpha');
    });

    test('replaces selection', function() {
      mq.typedText('49').select().cmd('\\sqrt');
      assert.equal(mq.latex(), '\\sqrt{49}');
    });

    test('operator name', function() {
      mq.cmd('\\sin');
      assert.equal(mq.latex(), '\\sin');
    });

    test('nonexistent LaTeX command is noop', function() {
      mq.typedText('49').select().cmd('\\asdf').cmd('\\sqrt');
      assert.equal(mq.latex(), '\\sqrt{49}');
    });
  });

  suite('spaceBehavesLikeTab', function() {
    var mq, rootBlock, cursor;
    test('space behaves like tab with default opts', function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
      rootBlock = mq.__controller.root;
      cursor = mq.__controller.cursor;

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
      mq = MQ.MathField( $('<span></span>').appendTo('#mock')[0], opts)
      rootBlock = mq.__controller.root;
      cursor = mq.__controller.cursor;

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
    test('space behaves like tab when globally set to true', function() {
      MQ.config({ spaceBehavesLikeTab: true });

      mq = MQ.MathField( $('<span></span>').appendTo('#mock')[0]);
      rootBlock = mq.__controller.root;
      cursor = mq.__controller.cursor;

      mq.latex('\\sqrt{x}');

      mq.keystroke('Left');
      mq.keystroke('Spacebar');
      assert.equal(cursor.parent, rootBlock, 'cursor in root block');
      assert.equal(cursor[R], 0, 'cursor at end of block');

      $(mq.el()).remove();
    });
  });

  suite('statelessClipboard option', function() {
    suite('default', function() {
      var mq, textarea;
      setup(function() {
        mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
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
        mq = MQ.MathField($('<span></span>').appendTo('#mock')[0],
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
        MQ.MathField($('<span></span>')[0], { leftRightIntoCmdGoes: 1 });
      });
    });
    suite('default', function() {
      var mq;
      setup(function() {
        mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
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
        mq = MQ.MathField($('<span></span>').appendTo('#mock')[0],
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

  suite('sumStartsWithNEquals', function() {
    test('sum defaults to empty limits', function() {
      var mq = MQ.MathField($('<span>').appendTo('#mock')[0]);
      assert.equal(mq.latex(), '');

      mq.cmd('\\sum');
      assert.equal(mq.latex(), '\\sum_{ }^{ }');

      mq.cmd('n');
      assert.equal(mq.latex(), '\\sum_n^{ }', 'cursor in lower limit');

      $(mq.el()).remove();
    });
    test('sum starts with `n=`', function() {
      var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
        sumStartsWithNEquals: true
      });
      assert.equal(mq.latex(), '');

      mq.cmd('\\sum');
      assert.equal(mq.latex(), '\\sum_{n=}^{ }');

      mq.cmd('0');
      assert.equal(mq.latex(), '\\sum_{n=0}^{ }', 'cursor after the `n=`');

      $(mq.el()).remove();
    });
  });

  suite('substituteTextarea', function() {
    test('doesn\'t blow up on selection', function() {
      var mq = MQ.MathField($('<span>').appendTo('#mock')[0], {
        substituteTextarea: function() {
          return $('<span tabindex=0 style="display:inline-block;width:1px;height:1px" />')[0];
        }
      });

      assert.equal(mq.latex(), '');
      mq.write('asdf');
      mq.select();

      $(mq.el()).remove();
    });
  });
});
