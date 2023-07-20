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

  test('math can be selected', function() {
    mq.latex('x^2+y^2');

    var rootX = root.jQ.offset().left;
    root.jQ.trigger(createEvent('mousedown', rootX + 1));
    root.jQ.trigger(createEvent('mousemove', rootX + root.jQ.width() - 1));
    root.jQ.trigger('mouseup');

    assert.equal(cursor.selection.join('latex'), 'x^2+y^2');
  });

  test('subsequent selection', function() {
    mq.latex('abc');

    var rootX = root.jQ.offset().left;
    var rootWidth = root.jQ.width();
    var averageCharWidth = rootWidth / 3;

    root.jQ.trigger(createEvent('mousedown', rootX + 1));
    root.jQ.trigger(createEvent('mousemove', rootX + averageCharWidth));
    root.jQ.trigger('mouseup');

    assert.equal(cursor.selection.join('latex'), 'a');

    root.jQ.trigger(createEvent('mousedown', rootX + rootWidth - 1));
    root.jQ.trigger(createEvent('mousemove', rootX + rootWidth - averageCharWidth));
    root.jQ.trigger('mouseup');

    assert.equal(cursor.selection.join('latex'), 'c');
  });

  test('keyboard select continues mouse select', function() {
    mq.latex('abc');

    var rootX = root.jQ.offset().left;
    root.jQ.trigger(createEvent('mousedown', rootX + 1));
    root.jQ.trigger(createEvent('mousemove', rootX + root.jQ.width() - 1));
    root.jQ.trigger('mouseup');

    assert.equal(cursor.selection.join('latex'), 'abc');

    mq.keystroke('Shift-Left');

    assert.equal(cursor.selection.join('latex'), 'ab');
  });

  test('keyboard select doesn\'t break mouse select', function() {
    mq.latex('abc');

    var rootX = root.jQ.offset().left;
    root.jQ.trigger(createEvent('mousedown', rootX + 1));
    root.jQ.trigger(createEvent('mousemove', rootX + root.jQ.width() - 1));

    assert.equal(cursor.selection.join('latex'), 'abc');

    mq.keystroke('Shift-Left');

    assert.equal(cursor.selection.join('latex'), 'ab');

    root.jQ.trigger(createEvent('mousemove', rootX + root.jQ.width() - 1));
    root.jQ.trigger('mouseup');

    assert.equal(cursor.selection.join('latex'), 'abc');
  });

  suite('text blocks', function() {
    var textBlock, textBlockX;

    setup(function() {
      mq.latex('\\text{abc}');

      textBlock = root.ends[L];
      textBlockX = textBlock.jQ.offset().left;
    });

    function assertSelection(expectedSelection) {
      assert.equal(cursor.selection.join('latex'), expectedSelection);

      var textBlockChildren = textBlock.jQ.children();
      assert.equal(textBlockChildren.length, 1, 'text block has one child');
      assert.ok(textBlockChildren.hasClass('mq-selection'), 'child has mq-selection class');
      assert.equal(textBlockChildren.prop('tagName'), 'SPAN', 'text block child is a span');
      assert.equal(textBlockChildren.text(), expectedSelection, 'selection span contains text ' + expectedSelection);
    }

    test('text can be selected', function() {
      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + 1));
      textBlock.jQ.trigger(createEvent('mousemove', textBlockX + textBlock.jQ.width() - 1));
      textBlock.jQ.trigger('mouseup');

      assertSelection('abc');
    });

    test('immediate subsequent selection', function() {
      var textBlockWidth = textBlock.jQ.width();
      var averageCharWidth = textBlockWidth / 3;

      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + 1));
      textBlock.jQ.trigger(createEvent('mousemove', textBlockX + averageCharWidth));
      textBlock.jQ.trigger('mouseup');

      assertSelection('a');

      textBlock.jQ.trigger(createEvent('mousedown', textBlockX + textBlockWidth - 1));
      textBlock.jQ.trigger(createEvent('mousemove', textBlockX + textBlockWidth - averageCharWidth));
      textBlock.jQ.trigger('mouseup');

      assertSelection('c');
    });
  });
});