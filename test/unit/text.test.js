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
    var cursor = Cursor(block).insAtRightEnd(block);

    cursor.moveLeft();
    assertSplit(cursor.jQ, 'abc', null);

    cursor.moveLeft();
    assertSplit(cursor.jQ, 'ab', 'c');

    cursor.moveLeft();
    assertSplit(cursor.jQ, 'a', 'bc');

    cursor.moveLeft();
    assertSplit(cursor.jQ, null, 'abc');

    cursor.moveRight();
    assertSplit(cursor.jQ, 'a', 'bc');

    cursor.moveRight();
    assertSplit(cursor.jQ, 'ab', 'c');

    cursor.moveRight();
    assertSplit(cursor.jQ, 'abc', null);
  });
});
