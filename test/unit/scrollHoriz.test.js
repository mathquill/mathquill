suite('scrollHoriz', function () {
  var mq;
  var $el;
  setup(function () {
    $el = $('<span style="display:inline-block; width: 100px"></span>');
    mq = MQ.MathField($el.appendTo('#mock')[0]);
  });

  test('classes added as expected', function (done) {
    mq.latex('beginning ------------ end');
    var $root = $el.find('.mq-root-block');
    assert.ok(
      $root.is(':not(.mq-editing-overflow-left)'),
      'no left overflow class'
    );
    assert.ok(
      $root.is(':not(.mq-editing-overflow-right)'),
      'no right overflow class'
    );
    assert.equal($root.scrollLeft(), 0, 'unscrolled');
    mq.focus();
    assert.ok(
      $root.is(':not(.mq-editing-overflow-left)'),
      'no left overflow class'
    );
    assert.ok(
      $root.is('.mq-editing-overflow-right'),
      'has right overflow class'
    );
    mq.keystroke('Shift-Right');
    setTimeout(function () {
      assert.ok(
        $root.is('.mq-editing-overflow-left'),
        'has left overflow class'
      );
      assert.ok(
        $root.is(':not(.mq-editing-overflow-right)'),
        'no right overflow class'
      );
      assert.ok($root.scrollLeft() > 0, 'now scrolled');
      mq.blur();
      setTimeout(function () {
        assert.ok(
          $root.is(':not(.mq-editing-overflow-left)'),
          'left overflow class removed'
        );
        assert.ok(
          $root.is(':not(.mq-editing-overflow-right)'),
          'no right overflow class'
        );
        assert.equal($root.scrollLeft(), 0, 'scrolled back left');
        done();
      }, 200);
    }, 200);
  });
});
