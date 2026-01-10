suite('matrix', function () {
  const $ = window.test_only_jquery;
  var mq, mostRecentlyReportedLatex;
  setup(function () {
    mostRecentlyReportedLatex = NaN; // != to everything
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
      handlers: {
        edit: function () {
          mostRecentlyReportedLatex = mq.latex();
        },
      },
    });
  });

  function prayWellFormedPoint(pt) {
    prayWellFormed(pt.parent, pt[L], pt[R]);
  }

  function assertLatex(latex) {
    prayWellFormedPoint(mq.__controller.cursor);
    assert.equal(mq.latex(), latex);
  }

  suite('Matrices', function () {
    test('add matrix via mq.write', function () {
      mq.write('\\begin{matrix}x&y\\\\1&2\\end{matrix}');
      assertLatex('\\begin{matrix}x&y\\\\1&2\\end{matrix}');
    });

    test('key sequence populates matrix', function () {
      mq.write('\\begin{matrix}x&\\\\&\\end{matrix}')
        .keystroke('Left Left')
        .typedText('a')
        .keystroke('Right')
        .typedText('b')
        .keystroke('Up')
        .typedText('y');

      assertLatex('\\begin{matrix}x&y\\\\a&b\\end{matrix}');
    });

    test('cursor keys navigate around matrix', function () {
      mq.write('\\begin{matrix}&&\\\\&&\\\\&&\\end{matrix}');

      mq.keystroke('Left Left Left')
        .typedText('a')
        .keystroke('Up')
        .typedText('b')
        .keystroke('Right')
        .typedText('c')
        .keystroke('Down')
        .typedText('d');

      assertLatex('\\begin{matrix}&&\\\\b&c&\\\\a&d&\\end{matrix}');
    });

    test('passes over matrices when leftRightIntoCmdGoes is set to up', function () {
      mq.config({ leftRightIntoCmdGoes: 'up' });

      // 1 2 3
      // 4 5 6
      // 7 8 9
      mq.write('\\begin{matrix}1&2&3\\\\4&5&6\\\\7&8&9\\end{matrix}');

      mq.keystroke('Left Left Left Left Left Left Left')
        .typedText('a')
        .keystroke('Right Right Right Right Right Right Right')
        .typedText('b')
        .keystroke('Left Left Left Left')
        .typedText('c');

      // It should've entered the top of the matrix and exited at either end, leading to
      //   1  2c 3
      // a 4  5  6 b
      //   7  8  9
      assertLatex('a\\begin{matrix}1&2c&3\\\\4&5&6\\\\7&8&9\\end{matrix}b');
    });

    test('passes under matrices when leftRightIntoCmdGoes is set to down', function () {
      mq.config({ leftRightIntoCmdGoes: 'down' });

      // 1 2 3
      // 4 5 6
      // 7 8 9
      mq.write('\\begin{matrix}1&2&3\\\\4&5&6\\\\7&8&9\\end{matrix}');

      mq.keystroke('Left Left Left Left Left Left Left')
        .typedText('a')
        .keystroke('Right Right Right Right Right Right Right')
        .typedText('b')
        .keystroke('Left Left Left Left')
        .typedText('c');

      // It should've entered the bottom of the matrix and exited at either end, leading to
      //   1  2  3
      // a 4  5  6 b
      //   7  8c 9
      assertLatex('a\\begin{matrix}1&2&3\\\\4&5&6\\\\7&8c&9\\end{matrix}b');
    });

    test('exits out of matrices on their edges when leftRightIntoCmdGoes is set', function () {
      mq.config({ leftRightIntoCmdGoes: 'up' });

      // 1 2 3
      // 4 5 6
      // 7 8 9
      mq.write('\\begin{matrix}1&2&3\\\\4&5&6\\\\7&8&9\\end{matrix}');

      mq.keystroke('Left Left Left Down')
        .typedText('a')
        .keystroke('Right Right Right')
        .typedText('b');

      // It should've entered the top of the matrix and exited out the side, leading to
      // 1  2  3
      // 4  5a 6 b
      // 7  8  9
      assertLatex('\\begin{matrix}1&2&3\\\\4&5a&6\\\\7&8&9\\end{matrix}b');
    });

    test('delete key removes empty matrix row/column', function () {
      mq.write('\\begin{matrix}a&&b\\\\&c&d\\\\&e&f\\end{matrix}');

      // Row is not yet deleted as there was content
      mq.keystroke('Left Backspace Left');
      assertLatex('\\begin{matrix}a&&b\\\\&c&d\\\\&e&\\end{matrix}');

      // Row is now deleted (delete e, then row)
      mq.keystroke('Backspace Backspace');
      assertLatex('\\begin{matrix}a&&b\\\\&c&d\\end{matrix}');

      // Column is now deleted (delete c, then column)
      mq.keystroke('Left Left Backspace Backspace');
      assertLatex('\\begin{matrix}a&b\\\\&d\\end{matrix}');
    });

    test('brackets are scaled immediately when height is changed', function () {
      mq.write('\\begin{bmatrix}x\\end{bmatrix}');
      function bracketHeight() {
        return $(mq.el())
          .find('.mq-matrix .mq-paren.mq-scaled')[0]
          .getBoundingClientRect().height;
      }
      var height = bracketHeight();
      // Add a fraction to make the matrix higher
      mq.keystroke('Left').write('\\frac{1}{2}');

      assert.ok(
        bracketHeight() > height,
        'matrix bracket height should be increased when height is changed'
      );
    });
  });
});

suite('matrix API methods', function () {
  const $ = window.test_only_jquery;
  var mq;
  setup(function () {
    mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
  });

  test('new matrix', function () {
    mq.matrixCmd('new', 'bmatrix', 2, 3);
    assert.equal(mq.latex(), '\\begin{bmatrix}&&\\\\&&\\end{bmatrix}');
  });
  test('new column right', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('addColumn');
    assert.equal(mq.latex(), '\\begin{bmatrix}1&2&3&\\\\4&5&6&\\end{bmatrix}');
  });
  test('new column left', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('addColumn', -1);
    assert.equal(mq.latex(), '\\begin{bmatrix}1&2&&3\\\\4&5&&6\\end{bmatrix}');
  });
  test('new row after', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('addRow');
    assert.equal(
      mq.latex(),
      '\\begin{bmatrix}1&2&3\\\\4&5&6\\\\&&\\end{bmatrix}'
    );
  });
  test('new row before', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('addRow', -1);
    assert.equal(
      mq.latex(),
      '\\begin{bmatrix}1&2&3\\\\&&\\\\4&5&6\\end{bmatrix}'
    );
  });
  test('delete column', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('deleteColumn');
    assert.equal(mq.latex(), '\\begin{bmatrix}1&2\\\\4&5\\end{bmatrix}');
  });
  test('delete row', function () {
    mq.latex('\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}');
    mq.keystroke('Left'); //into righthandcolumn
    mq.matrixCmd('deleteRow');
    assert.equal(mq.latex(), '\\begin{bmatrix}1&2&3\\end{bmatrix}');
  });
});
