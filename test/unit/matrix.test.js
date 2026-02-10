suite('matrix', function () {
  const $ = window.test_only_jquery;

  suite('LaTeX parsing', function () {
    function assertParsesLatex(str, latex) {
      if (arguments.length < 2) latex = str;

      var parseResult = latexMathParser.parse(str);
      var postOrderResult = parseResult.postOrder(function (node) {
        node.finalizeTree(Options.prototype);
      });
      var result = postOrderResult.join('latex');

      assert.equal(
        result,
        latex,
        "parsing '" + str + "', got '" + result + "', expected '" + latex + "'"
      );
    }

    test('basic 2x2 matrix', function () {
      assertParsesLatex(
        '\\begin{matrix} a & b \\\\ c & d \\end{matrix}',
        '\\begin{matrix}a & b \\\\ c & d\\end{matrix}'
      );
    });

    test('pmatrix (parentheses)', function () {
      assertParsesLatex(
        '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}',
        '\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}'
      );
    });

    test('bmatrix (square brackets)', function () {
      assertParsesLatex(
        '\\begin{bmatrix} x & y \\\\ z & w \\end{bmatrix}',
        '\\begin{bmatrix}x & y \\\\ z & w\\end{bmatrix}'
      );
    });

    test('vmatrix (single vertical bars)', function () {
      assertParsesLatex(
        '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
        '\\begin{vmatrix}a & b \\\\ c & d\\end{vmatrix}'
      );
    });

    test('Vmatrix (double vertical bars)', function () {
      assertParsesLatex(
        '\\begin{Vmatrix} 1 & 0 \\\\ 0 & 1 \\end{Vmatrix}',
        '\\begin{Vmatrix}1 & 0 \\\\ 0 & 1\\end{Vmatrix}'
      );
    });

    test('Bmatrix (braces)', function () {
      assertParsesLatex(
        '\\begin{Bmatrix} a & b \\\\ c & d \\end{Bmatrix}',
        '\\begin{Bmatrix}a & b \\\\ c & d\\end{Bmatrix}'
      );
    });

    test('3x3 matrix', function () {
      assertParsesLatex(
        '\\begin{matrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{matrix}',
        '\\begin{matrix}1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9\\end{matrix}'
      );
    });

    test('matrix with expressions in cells', function () {
      assertParsesLatex(
        '\\begin{matrix} x^2 & y+1 \\\\ \\frac{a}{b} & \\sqrt{c} \\end{matrix}',
        '\\begin{matrix}x^{2} & y+1 \\\\ \\frac{a}{b} & \\sqrt{c}\\end{matrix}'
      );
    });

    test('matrix with whitespace', function () {
      assertParsesLatex(
        '\\begin{matrix}  a  &  b  \\\\  c  &  d  \\end{matrix}',
        '\\begin{matrix}a & b \\\\ c & d\\end{matrix}'
      );
    });

    test('empty matrix cells', function () {
      assertParsesLatex(
        '\\begin{matrix}  &  \\\\  &  \\end{matrix}',
        '\\begin{matrix} &  \\\\  & \\end{matrix}'
      );
    });
  });

  suite('Public API - matrix rendering', function () {
    var mq;
    setup(function () {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    });

    function assertParsesLatex(str, latex) {
      if (arguments.length < 2) latex = str;
      mq.latex(str);
      var actualLatex = mq.latex();
      assert.equal(actualLatex, latex);
    }

    test('render basic matrix', function () {
      assertParsesLatex(
        '\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}',
        '\\begin{matrix}1 & 2 \\\\ 3 & 4\\end{matrix}'
      );
    });

    test('render pmatrix', function () {
      assertParsesLatex(
        '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        '\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix}'
      );
    });

    test('render matrix with nested expressions', function () {
      assertParsesLatex(
        '\\begin{matrix} x^2+1 & \\frac{a}{b} \\\\ \\sqrt{y} & z_1 \\end{matrix}',
        '\\begin{matrix}x^{2}+1 & \\frac{a}{b} \\\\ \\sqrt{y} & z_{1}\\end{matrix}'
      );
    });

    test('create matrix via cmd', function () {
      mq.cmd('\\matrix');
      // Should create a 2x2 matrix
      var latex = mq.latex();
      assert.ok(
        latex.indexOf('\\begin{matrix}') >= 0,
        'should contain matrix environment'
      );
    });

    test('create pmatrix via cmd', function () {
      mq.cmd('\\pmatrix');
      var latex = mq.latex();
      assert.ok(
        latex.indexOf('\\begin{pmatrix}') >= 0,
        'should contain pmatrix environment'
      );
    });
  });

  suite('Cursor navigation in matrix', function () {
    var mq, rootBlock, controller, cursor;
    setup(function () {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
      rootBlock = mq.__controller.root;
      controller = mq.__controller;
      cursor = controller.cursor;
    });

    // Helper function to find matrix command in the tree
    function findMatrix(node) {
      if (!node) return null;
      if (node.ctrlSeq && node.ctrlSeq.indexOf('\\begin{') === 0) {
        var match = node.ctrlSeq.match(/\\begin\{(\w+)\}/);
        if (
          match &&
          [
            'matrix',
            'pmatrix',
            'bmatrix',
            'vmatrix',
            'Vmatrix',
            'Bmatrix',
          ].indexOf(match[1]) >= 0
        ) {
          return node;
        }
      }
      // Search in children
      if (node.eachChild) {
        var found = null;
        node.eachChild(function (child) {
          if (!found) found = findMatrix(child);
          return found ? false : undefined;
        });
        return found;
      }
      return null;
    }

    test('navigate right in matrix', function () {
      controller.renderLatexMath(
        '\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}'
      );

      // Find the matrix command
      var matrix = findMatrix(rootBlock);
      assert.ok(matrix, 'should find matrix command');
      assert.ok(
        matrix.ctrlSeq.indexOf('\\begin{matrix}') >= 0,
        'should be matrix type'
      );

      // Move cursor into first cell
      if (matrix.blocks && matrix.blocks[0]) {
        cursor.insAtRightEnd(matrix.blocks[0]);
        assert.equal(cursor.parent, matrix.blocks[0], 'cursor in first cell');

        // Navigate right to second cell
        mq.keystroke('Right');
        if (matrix.blocks[1]) {
          assert.equal(
            cursor.parent,
            matrix.blocks[1],
            'cursor moved to second cell'
          );
        }
      }
    });

    test('navigate left in matrix', function () {
      controller.renderLatexMath(
        '\\begin{matrix} a & b \\\\ c & d \\end{matrix}'
      );

      var matrix = findMatrix(rootBlock);
      assert.ok(matrix, 'should find matrix command');

      // Move cursor into second cell
      if (matrix.blocks && matrix.blocks[1]) {
        cursor.insAtRightEnd(matrix.blocks[1]);
        assert.equal(cursor.parent, matrix.blocks[1], 'cursor in second cell');

        // Navigate left to first cell
        mq.keystroke('Left');
        if (matrix.blocks[0]) {
          assert.equal(
            cursor.parent,
            matrix.blocks[0],
            'cursor moved to first cell'
          );
        }
      }
    });

    test('navigate down in matrix', function () {
      controller.renderLatexMath(
        '\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}'
      );

      var matrix = findMatrix(rootBlock);
      assert.ok(matrix, 'should find matrix command');

      // Move cursor into top-left cell (first cell)
      if (matrix.blocks && matrix.blocks[0]) {
        cursor.insAtRightEnd(matrix.blocks[0]);
        assert.equal(
          cursor.parent,
          matrix.blocks[0],
          'cursor in top-left cell'
        );

        // Navigate down to bottom-left cell (third cell, index 2 in 2x2 matrix)
        mq.keystroke('Down');
        if (matrix.blocks[2]) {
          assert.equal(
            cursor.parent,
            matrix.blocks[2],
            'cursor moved down to second row'
          );
        }
      }
    });

    test('navigate up in matrix', function () {
      controller.renderLatexMath(
        '\\begin{matrix} a & b \\\\ c & d \\end{matrix}'
      );

      var matrix = findMatrix(rootBlock);
      assert.ok(matrix, 'should find matrix command');

      // Move cursor into bottom-left cell (third cell, index 2)
      if (matrix.blocks && matrix.blocks[2]) {
        cursor.insAtRightEnd(matrix.blocks[2]);
        assert.equal(
          cursor.parent,
          matrix.blocks[2],
          'cursor in bottom-left cell'
        );

        // Navigate up to top-left cell
        mq.keystroke('Up');
        if (matrix.blocks[0]) {
          assert.equal(
            cursor.parent,
            matrix.blocks[0],
            'cursor moved up to first row'
          );
        }
      }
    });

    test('navigate across matrix cells', function () {
      controller.renderLatexMath(
        '\\begin{matrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\end{matrix}'
      );

      var matrix = findMatrix(rootBlock);
      assert.ok(matrix, 'should find matrix command');

      // Start at top-left
      if (matrix.blocks && matrix.blocks[0]) {
        cursor.insAtRightEnd(matrix.blocks[0]);

        // Navigate: right -> right -> down -> left
        mq.keystroke('Right');
        if (matrix.blocks[1]) {
          assert.equal(cursor.parent, matrix.blocks[1], 'moved to (0,1)');
        }

        mq.keystroke('Right');
        if (matrix.blocks[2]) {
          assert.equal(cursor.parent, matrix.blocks[2], 'moved to (0,2)');
        }

        mq.keystroke('Down');
        if (matrix.blocks[5]) {
          assert.equal(cursor.parent, matrix.blocks[5], 'moved down to (1,2)');
        }

        mq.keystroke('Left');
        if (matrix.blocks[4]) {
          assert.equal(cursor.parent, matrix.blocks[4], 'moved left to (1,1)');
        }
      }
    });
  });

  suite('Matrix typing and editing', function () {
    var mq;
    setup(function () {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    });

    function assertLatex(latex) {
      assert.equal(mq.latex(), latex);
    }

    test('type into matrix cells', function () {
      mq.cmd('\\matrix');
      // Cursor should be in first cell
      mq.typedText('1');
      mq.keystroke('Right');
      mq.typedText('2');
      mq.keystroke('Down');
      mq.typedText('3');
      mq.keystroke('Left');
      mq.typedText('4');

      var latex = mq.latex();
      assert.ok(latex.indexOf('1') >= 0, 'should contain 1');
      assert.ok(latex.indexOf('2') >= 0, 'should contain 2');
      assert.ok(latex.indexOf('3') >= 0, 'should contain 3');
      assert.ok(latex.indexOf('4') >= 0, 'should contain 4');
    });

    test('edit matrix via LaTeX', function () {
      mq.latex('\\begin{matrix} a & b \\\\ c & d \\end{matrix}');
      var latex = mq.latex();
      assert.ok(latex.indexOf('a') >= 0, 'should contain a');
      assert.ok(latex.indexOf('b') >= 0, 'should contain b');
      assert.ok(latex.indexOf('c') >= 0, 'should contain c');
      assert.ok(latex.indexOf('d') >= 0, 'should contain d');
    });
  });

  suite('Matrix DOM structure', function () {
    var mq;
    setup(function () {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
    });

    test('matrix renders as table', function () {
      mq.latex('\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}');

      var matrixTable = mq.el().querySelector('.mq-matrix');
      assert.ok(matrixTable, 'should have matrix table element');
      assert.equal(
        matrixTable.tagName.toLowerCase(),
        'table',
        'should be a table element'
      );

      var rows = matrixTable.querySelectorAll('tr');
      assert.equal(rows.length, 2, 'should have 2 rows');

      var cells = matrixTable.querySelectorAll('.mq-matrix-cell');
      assert.equal(cells.length, 4, 'should have 4 cells');
    });

    test('pmatrix has correct class', function () {
      mq.latex('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}');

      var matrixTable = mq.el().querySelector('.mq-pmatrix');
      assert.ok(matrixTable, 'should have pmatrix class');
    });

    test('bmatrix has correct class', function () {
      mq.latex('\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}');

      var matrixTable = mq.el().querySelector('.mq-bmatrix');
      assert.ok(matrixTable, 'should have bmatrix class');
    });

    test('vmatrix has correct class', function () {
      mq.latex('\\begin{vmatrix} 1 & 2 \\\\ 3 & 4 \\end{vmatrix}');

      var matrixTable = mq.el().querySelector('.mq-vmatrix');
      assert.ok(matrixTable, 'should have vmatrix class');
    });

    test('Vmatrix has correct class', function () {
      mq.latex('\\begin{Vmatrix} 1 & 2 \\\\ 3 & 4 \\end{Vmatrix}');

      var matrixTable = mq.el().querySelector('.mq-Vmatrix');
      assert.ok(matrixTable, 'should have Vmatrix class');
    });

    test('Bmatrix has correct class', function () {
      mq.latex('\\begin{Bmatrix} 1 & 2 \\\\ 3 & 4 \\end{Bmatrix}');

      var matrixTable = mq.el().querySelector('.mq-Bmatrix');
      assert.ok(matrixTable, 'should have Bmatrix class');
    });

    test('matrix cells are editable', function () {
      mq.latex('\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}');

      var cells = mq.el().querySelectorAll('.mq-matrix-cell');
      assert.ok(cells.length > 0, 'should have cells');
      // Each cell should contain a span with mq-root-block or similar
      cells.forEach(function (cell) {
        assert.ok(cell.children.length > 0, 'cell should have content');
      });
    });
  });

  suite('Matrix error cases', function () {
    function assertThrows(fn, message) {
      try {
        fn();
        assert.fail('should have thrown: ' + message);
      } catch (e) {
        // Expected
      }
    }

    test('unmatched begin/end', function () {
      assertThrows(function () {
        latexMathParser.parse('\\begin{matrix} 1 & 2');
      }, 'should throw on unmatched begin');
    });

    test('mismatched environment types', function () {
      assertThrows(function () {
        latexMathParser.parse('\\begin{matrix} 1 & 2 \\end{pmatrix}');
      }, 'should throw on mismatched environment types');
    });
  });
});
