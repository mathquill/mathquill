suite('mouse events', function() {
  var mq, ctrlr, cursor, root;

  setup(function() {
    mq = MathQuill.MathField($('<span></span>').appendTo('#mock')[0]);
    ctrlr = mq.__controller;
    cursor = ctrlr.cursor;
    root = ctrlr.root;
  });
  teardown(function() {
    ctrlr.container.trigger('mouseup');
    $(mq.el()).remove();
  });

  function createEvent(type, pageX) {
    var event = jQuery.Event(type);
    event.pageX = pageX;
    return event;
  }

  function assertAnticursor() {
    var anticursor = cursor.anticursor;

    assert.ok(anticursor, 'anticursor set on cursor');
    assert.equal(anticursor[L], cursor[L], 'cursor and anticursor have the same left end');
    assert.equal(anticursor[R], cursor[R], 'cursor and anticursor have the same right end');
    assert.equal(anticursor.parent, cursor.parent, 'cursor and anticursor have the same parent');
    assert.ok(anticursor.ancestors, 'ancestors set on anticursor');
  }

  test('mousedown sets anticursor and ancestors', function() {
    assert.ok(!cursor.anticursor);

    ctrlr.container.trigger("mousedown");

    assertAnticursor();
  });

  suite('text blocks', function() {
    var textBlock, textBlockX;

    setup(function() {
      mq.latex('\\text{abc}');

      textBlock = root.ends[L];
      textBlockX = textBlock.jQ.offset().left;
    });

    test('mousedown sets anticursor and ancestors', function() {
      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + 1));

      assert.equal(cursor.parent, textBlock);
      assertAnticursor();
    });

    test('mousemove does not discard ancestors', function() {
      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + 1));
      textBlock.jQ.trigger(createEvent('mousemove', textBlockX + 1));

      assert.equal(cursor.parent, textBlock);
      assertAnticursor();
    });

    test('text can be selected', function() {
      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + 1));
      textBlock.jQ.trigger(createEvent('mousemove', textBlockX + textBlock.jQ.width() - 1));
      textBlock.jQ.trigger('mouseup');

      var textBlockChildren = textBlock.jQ.children();
      assert.equal(textBlockChildren.length, 1, 'text block has one child');
      assert.ok(textBlockChildren.hasClass('mq-selection'), 'child has mq-selection class');
      assert.equal(textBlockChildren.prop('tagName'), 'SPAN', 'text block child is a span');
      assert.equal(textBlockChildren.text(), 'abc', 'selection span contains text abc');
    });
  });
});