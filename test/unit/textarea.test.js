suite('key', function() {
  var el;
  var Event = $.Event

  function shouldNotBeCalled() {
    assert.ok(false, 'this function should not be called');
  }

  setup(function() {
    el = $('<textarea>').appendTo('#mock');
  });

  teardown(function() {
    el.remove();
  });

  test('normal keys', function(done) {
    var counter = 0;
    makeTextarea(el, {
      text: function(text, keydown, keypress) {
        counter += 1;
        assert.ok(counter <= 1, 'callback is only called once');
        assert.equal(text, 'a', 'text comes back as a');
        assert.equal(el.val(), '', 'the textarea remains empty');

        assert.ok(keydown, 'has a keydown');
        assert.equal(keydown.type, 'keydown', 'has the correct keydown');

        assert.ok(keypress, 'has a keypress');
        assert.equal(keypress.type, 'keypress', 'has the correct keypress');

        done();
      },
    });

    el.trigger(Event('keydown', { which: 97 }));
    el.trigger(Event('keypress', { which: 97 }));
    el.val('a');
  });

  test('one keydown only', function(done) {
    var counter = 0;

    makeTextarea(el, {
      key: function(key, evt) {
        counter += 1;
        assert.ok(counter <= 1, 'callback is called only once');
        assert.equal(key, 'Backspace', 'key is correctly set');

        done();
      },
      text: shouldNotBeCalled
    });

    el.trigger(Event('keydown', { which: 8 }));
  });

  test('a series of keydowns only', function(done) {
    var counter = 0;

    makeTextarea(el, {
      key: function(key, keydown) {
        counter += 1;
        assert.ok(counter <= 3, 'callback is called at most 3 times');

        assert.ok(keydown);
        assert.equal(key, 'Left');

        if (counter === 3) done();
      },
      text: shouldNotBeCalled
    });

    el.trigger(Event('keydown', { which: 37 }));
    el.trigger(Event('keydown', { which: 37 }));
    el.trigger(Event('keydown', { which: 37 }));
  });

  test('one keydown and a series of keypresses', function(done) {
    var counter = 0;

    makeTextarea(el, {
      key: function(key, keydown) {
        counter += 1;
        assert.ok(counter <= 3, 'callback is called at most 3 times');

        assert.ok(keydown);
        assert.equal(key, 'Backspace');

        if (counter === 3) done();
      },
      text: shouldNotBeCalled
    });

    el.trigger(Event('keydown', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
  });

  suite('select', function() {
    test('select populates the textarea but doesn\'t call text', function() {
      var manager = makeTextarea(el, {
        text: shouldNotBeCalled,
      });

      manager.select('foobar');

      assert.equal(el.val(), 'foobar');
      el.trigger('input');
      assert.equal(el.val(), 'foobar', 'value remains after input');
      el.trigger('keydown');
      assert.equal(el.val(), 'foobar', 'value remains after keydown');
    });

    test('blurring', function() {
      var manager = makeTextarea(el, {
        text: shouldNotBeCalled,
      });

      manager.select('foobar');
      el.trigger('blur');
      el.focus();
      assert.equal(el[0].selectionStart, 0, 'it\'s selected from the start');
      assert.equal(el[0].selectionEnd, 6, 'it\'s selected to the end');
      assert.equal(el.val(), 'foobar', 'it still has content');
    });
  });

  suite('paste', function() {
    test('paste event only', function(done) {
      makeTextarea(el, {
        text: shouldNotBeCalled,
        paste: function(text) {
          assert.equal(text, '$x^2+1$');

          done();
        }
      });

      el.trigger('paste');
      el.val('$x^2+1$');
    });

    test('paste after keydown/keypress', function(done) {
      makeTextarea(el, {
        text: shouldNotBeCalled,
        paste: function(text) {
          assert.equal(text, 'foobar');
          done();
        }
      });

      // somebody presses Ctrl-V
      el.trigger('keydown', { which: 86, ctrlKey: true });
      el.trigger('keypress', { which: 118, ctrlKey: true });
      el.trigger('paste');
      el.val('foobar');
    });

    test('keypress timeout happening before paste timeout', function(done) {
      makeTextarea(el, {
        text: shouldNotBeCalled,
        paste: function(text) {
          assert.equal(text, 'foobar');
          done();
        }
      });

      el.trigger('keydown', { which: 86, ctrlKey: true });
      el.trigger('keypress', { which: 118, ctrlKey: true });
      el.trigger('paste');
      el.val('foobar');

      // this synthesizes the keypress timeout calling handleText()
      // before the paste timeout happens.
      el.trigger('input');
    });
  });
});
