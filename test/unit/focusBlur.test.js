suite('focusBlur', function() {
  function assertHasFocus(mq, name, invert) {
    assert.ok(!!invert ^ $(mq.el()).find('textarea').is(':focus'), name + (invert ? ' does not have focus' : ' has focus'));
  }

  suite('handlers can shift focus away', function() {
    var mq, mq2, wasUpOutOfCalled;
    setup(function() {
      mq = MQ.MathField($('<span></span>').appendTo('#mock')[0], {
        handlers: {
          upOutOf: function() {
            wasUpOutOfCalled = true;
            mq2.focus();
          }
        }
      });
      mq2 = MQ.MathField($('<span></span>').appendTo('#mock')[0]);
      wasUpOutOfCalled = false;
    });
    teardown(function() {
      $(mq.el()).add(mq2.el()).remove();
    });

    function triggerUpOutOf(mq) {
      $(mq.el()).find('textarea').trigger(jQuery.Event('keydown', { which: 38 }));
      assert.ok(wasUpOutOfCalled);
    }

    test('normally', function() {
      mq.focus();
      assertHasFocus(mq, 'mq');

      triggerUpOutOf(mq);
      assertHasFocus(mq2, 'mq2');
    });

    test('even if there\'s a selection', function(done) {
      mq.focus();
      assertHasFocus(mq, 'mq');

      mq.typedText('asdf');
      assert.equal(mq.latex(), 'asdf');

      mq.keystroke('Shift-Left');
      setTimeout(function() {
        assert.equal($(mq.el()).find('textarea').val(), 'f');

        triggerUpOutOf(mq);
        assertHasFocus(mq2, 'mq2');
        done();
      });
    });
  });

  test('select behaves normally after blurring and re-focusing', function(done) {
    var mq = MQ.MathField($('<span></span>').appendTo('#mock')[0]);

    mq.focus();
    assertHasFocus(mq, 'mq');

    mq.typedText('asdf');
    assert.equal(mq.latex(), 'asdf');

    mq.keystroke('Shift-Left');
    setTimeout(function() {
      assert.equal($(mq.el()).find('textarea').val(), 'f');

      mq.blur();
      assertHasFocus(mq, 'mq', 'not');
      setTimeout(function() {
        assert.equal($(mq.el()).find('textarea').val(), '');

        mq.focus();
        assertHasFocus(mq, 'mq');

        mq.keystroke('Shift-Left');
        setTimeout(function() {
          assert.equal($(mq.el()).find('textarea').val(), 'd');

          $(mq.el()).remove();
          done();
        });
      }, 10);
    });
  });
});
