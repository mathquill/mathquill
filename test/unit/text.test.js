suite('text', function () {
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
    assert.equal(mostRecentlyReportedLatex, latex, 'assertLatex failed');
    assert.equal(mq.latex(), latex, 'assertLatex failed');
  }

  function fromLatex(latex) {
    var block = latexMathParser.parse(latex);
    block.jQize();

    return block;
  }

  // return HTML string for the given node or DocumentFragment
  function domToString(dom) {
    const div = document.createElement('div');
    div.appendChild(dom);
    return div.innerHTML;
  }

  function assertSplit(jQ, prev, next) {
    var dom = jQ[0];

    if (prev) {
      assert.ok(dom.previousSibling instanceof Text);
      assert.equal(prev, dom.previousSibling.data, 'assertSplit failed');
    } else {
      assert.ok(!dom.previousSibling);
    }

    if (next) {
      assert.ok(dom.nextSibling instanceof Text);
      assert.equal(next, dom.nextSibling.data, 'assertSplit failed');
    } else {
      assert.ok(!dom.nextSibling);
    }
  }

  test('changes the text nodes as the cursor moves around', function () {
    mq.latex('\\text{abc}');
    var ctrlr = mq.__controller;
    var cursor = ctrlr.cursor;

    ctrlr.moveLeft();
    assertSplit(cursor.getJQ(), 'abc', null);

    ctrlr.moveLeft();
    assertSplit(cursor.getJQ(), 'ab', 'c');

    ctrlr.moveLeft();
    assertSplit(cursor.getJQ(), 'a', 'bc');

    ctrlr.moveLeft();
    assertSplit(cursor.getJQ(), null, 'abc');

    ctrlr.moveRight();
    assertSplit(cursor.getJQ(), 'a', 'bc');

    ctrlr.moveRight();
    assertSplit(cursor.getJQ(), 'ab', 'c');

    ctrlr.moveRight();
    assertSplit(cursor.getJQ(), 'abc', null);
  });

  test('does not change latex as the cursor moves around', function () {
    mq.latex('\\text{x}');
    var ctrlr = mq.__controller;

    ctrlr.moveLeft();
    ctrlr.moveLeft();
    ctrlr.moveLeft();

    assert.equal(mq.latex(), '\\text{x}');
  });

  suite('typing', function () {
    test('stepping out of an empty block deletes it', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{x}');
      assertLatex('\\text{x}');

      mq.keystroke('Left');
      assertSplit(cursor.getJQ(), 'x');
      assertLatex('\\text{x}');

      mq.keystroke('Backspace');
      assertSplit(cursor.getJQ());
      assertLatex('');

      mq.keystroke('Right');
      assertSplit(cursor.getJQ());
      assert.equal(cursor[L], 0);
      assertLatex('');
    });

    test('typing $ in a textblock splits it', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{asdf}');
      assertLatex('\\text{asdf}');

      mq.keystroke('Left Left Left');
      assertSplit(cursor.getJQ(), 'as', 'df');
      assertLatex('\\text{asdf}');

      mq.typedText('$');
      assertLatex('\\text{as}\\text{df}');
    });
  });

  suite('pasting', function () {
    test('sanity', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{asdf}');
      mq.keystroke('Left Left Left');
      assertSplit(cursor.getJQ(), 'as', 'df');

      controller.paste('foo');

      assertSplit(cursor.getJQ(), 'asfoo', 'df');
      assertLatex('\\text{asfoodf}');
      prayWellFormedPoint(cursor);
    });

    test('pasting a dollar sign', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{asdf}');
      mq.keystroke('Left Left Left');
      assertSplit(cursor.getJQ(), 'as', 'df');

      controller.paste('$foo');

      assertSplit(cursor.getJQ(), 'as$foo', 'df');
      assertLatex('\\text{as$foodf}');
      prayWellFormedPoint(cursor);
    });

    test('pasting a backslash', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{asdf}');
      mq.keystroke('Left Left Left');
      assertSplit(cursor.getJQ(), 'as', 'df');

      controller.paste('\\pi');

      assertSplit(cursor.getJQ(), 'as\\pi', 'df');
      assertLatex('\\text{as\\backslash pidf}');
      prayWellFormedPoint(cursor);
    });

    test('pasting a curly brace', function () {
      var controller = mq.__controller;
      var cursor = controller.cursor;

      mq.latex('\\text{asdf}');
      mq.keystroke('Left Left Left');
      assertSplit(cursor.getJQ(), 'as', 'df');

      controller.paste('{');

      assertSplit(cursor.getJQ(), 'as{', 'df');
      assertLatex('\\text{as\\{df}');
      prayWellFormedPoint(cursor);
    });
  });

  test('HTML for subclassed text blocks', function () {
    var block = fromLatex('\\text{abc}');
    var _id = block.html().childNodes[0].getAttribute('mathquill-command-id');
    function id() {
      _id = parseInt(_id) + 3;
      return `"${_id}"`;
    }

    block = fromLatex('\\text{abc}');
    assert.equal(
      domToString(block.html()),
      '<span class="mq-text-mode" mathquill-command-id=' + id() + '>abc</span>'
    );
    block = fromLatex('\\textit{abc}');
    assert.equal(
      domToString(block.html()),
      '<i class="mq-text-mode" mathquill-command-id=' + id() + '>abc</i>'
    );
    block = fromLatex('\\textbf{abc}');
    assert.equal(
      domToString(block.html()),
      '<b class="mq-text-mode" mathquill-command-id=' + id() + '>abc</b>'
    );
    block = fromLatex('\\textsf{abc}');
    assert.equal(
      domToString(block.html()),
      '<span class="mq-sans-serif mq-text-mode" mathquill-command-id=' +
        id() +
        '>abc</span>'
    );
    block = fromLatex('\\texttt{abc}');
    assert.equal(
      domToString(block.html()),
      '<span class="mq-monospace mq-text-mode" mathquill-command-id=' +
        id() +
        '>abc</span>'
    );
    block = fromLatex('\\textsc{abc}');
    assert.equal(
      domToString(block.html()),
      '<span style="font-variant:small-caps" class="mq-text-mode" mathquill-command-id=' +
        id() +
        '>abc</span>'
    );
    block = fromLatex('\\uppercase{abc}');
    assert.equal(
      domToString(block.html()),
      '<span style="text-transform:uppercase" class="mq-text-mode" mathquill-command-id=' +
        id() +
        '>abc</span>'
    );
    block = fromLatex('\\lowercase{abc}');
    assert.equal(
      domToString(block.html()),
      '<span style="text-transform:lowercase" class="mq-text-mode" mathquill-command-id=' +
        id() +
        '>abc</span>'
    );
  });
});
