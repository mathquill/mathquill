suite('key', function() {
  var el;
  var Event = jQuery.Event

  function supportsSelectionAPI() {
    return 'selectionStart' in el[0];
  }

  setup(function() {
    el = $('<textarea>').appendTo('#mock');
  });

  teardown(function() {
    el.remove();
  });

  test('normal keys', function(done) {
    var counter = 0;
    saneKeyboardEvents(el, {
      keystroke: noop,
      typedText: function(text, keydown, keypress) {
        counter += 1;
        assert.ok(counter <= 1, 'callback is only called once');
        assert.equal(text, 'a', 'text comes back as a');
        assert.equal(el.val(), '', 'the textarea remains empty');

        done();
      }
    });

    el.trigger(Event('keydown', { which: 97 }));
    el.trigger(Event('keypress', { which: 97 }));
    el.val('a');
  });

  test('one keydown only', function(done) {
    var counter = 0;

    saneKeyboardEvents(el, {
      keystroke: function(key, evt) {
        counter += 1;
        assert.ok(counter <= 1, 'callback is called only once');
        assert.equal(key, 'Backspace', 'key is correctly set');

        done();
      }
    });

    el.trigger(Event('keydown', { which: 8 }));
  });

  test('a series of keydowns only', function(done) {
    var counter = 0;

    saneKeyboardEvents(el, {
      keystroke: function(key, keydown) {
        counter += 1;
        assert.ok(counter <= 3, 'callback is called at most 3 times');

        assert.ok(keydown);
        assert.equal(key, 'Left');

        if (counter === 3) done();
      }
    });

    el.trigger(Event('keydown', { which: 37 }));
    el.trigger(Event('keydown', { which: 37 }));
    el.trigger(Event('keydown', { which: 37 }));
  });

  test('one keydown and a series of keypresses', function(done) {
    var counter = 0;

    saneKeyboardEvents(el, {
      keystroke: function(key, keydown) {
        counter += 1;
        assert.ok(counter <= 3, 'callback is called at most 3 times');

        assert.ok(keydown);
        assert.equal(key, 'Backspace');

        if (counter === 3) done();
      }
    });

    el.trigger(Event('keydown', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
  });

  suite('select', function() {
    test('select populates the textarea but doesn\'t call .typedText()', function() {
      var shim = saneKeyboardEvents(el, { keystroke: noop });

      shim.select('foobar');

      assert.equal(el.val(), 'foobar');
      el.trigger('keydown');
      assert.equal(el.val(), 'foobar', 'value remains after keydown');

      if (supportsSelectionAPI()) {
        el.trigger('keypress');
        assert.equal(el.val(), 'foobar', 'value remains after keypress');
        el.trigger('input');
        assert.equal(el.val(), 'foobar', 'value remains after flush after keypress');
      }
    });

    test('select populates the textarea but doesn\'t call text' +
         ' on keydown, even when the selection is not properly' +
         ' detectable', function() {
      var shim = saneKeyboardEvents(el, { keystroke: noop });

      shim.select('foobar');
      // monkey-patch the dom-level selection so that hasSelection()
      // returns false, as in IE < 9.
      el[0].selectionStart = el[0].selectionEnd = 0;

      el.trigger('keydown');
      assert.equal(el.val(), 'foobar', 'value remains after keydown');
    });

    test('blurring', function() {
      var shim = saneKeyboardEvents(el, { keystroke: noop });

      shim.select('foobar');
      el.trigger('blur');
      el.focus();

      // IE < 9 doesn't support selection{Start,End}
      if (supportsSelectionAPI()) {
        assert.equal(el[0].selectionStart, 0, 'it\'s selected from the start');
        assert.equal(el[0].selectionEnd, 6, 'it\'s selected to the end');
      }

      assert.equal(el.val(), 'foobar', 'it still has content');
    });

    suite('selected text after keypress or paste doesn\'t get mistaken' +
         ' for inputted text', function() {
      test('select() immediately after paste', function() {
        var pastedText;
        var onPaste = function(text) { pastedText = text; };
        var shim = saneKeyboardEvents(el, {
          paste: function(text) { onPaste(text); }
        });

        el.trigger('paste').val('$x^2+1$');

        shim.select('$\\frac{x^2+1}{2}$');
        assert.equal(pastedText, '$x^2+1$');
        assert.equal(el.val(), '$\\frac{x^2+1}{2}$');

        onPaste = null;

        shim.select('$2$');
        assert.equal(el.val(), '$2$');
      });

      test('select() after paste/input', function() {
        var pastedText;
        var onPaste = function(text) { pastedText = text; };
        var shim = saneKeyboardEvents(el, {
          paste: function(text) { onPaste(text); }
        });

        el.trigger('paste').val('$x^2+1$');

        el.trigger('input');
        assert.equal(pastedText, '$x^2+1$');
        assert.equal(el.val(), '');

        onPaste = null;

        shim.select('$\\frac{x^2+1}{2}$');
        assert.equal(el.val(), '$\\frac{x^2+1}{2}$');

        shim.select('$2$');
        assert.equal(el.val(), '$2$');
      });

      test('select() immediately after keydown/keypress', function() {
        var typedText;
        var onText = function(text) { typedText = text; };
        var shim = saneKeyboardEvents(el, {
          keystroke: noop,
          typedText: function(text) { onText(text); }
        });

        el.trigger(Event('keydown', { which: 97 }));
        el.trigger(Event('keypress', { which: 97 }));
        el.val('a');

        shim.select('$\\frac{a}{2}$');
        assert.equal(typedText, 'a');
        assert.equal(el.val(), '$\\frac{a}{2}$');

        onText = null;

        shim.select('$2$');
        assert.equal(el.val(), '$2$');
      });

      test('select() after keydown/keypress/input', function() {
        var typedText;
        var onText = function(text) { typedText = text; };
        var shim = saneKeyboardEvents(el, {
          keystroke: noop,
          typedText: function(text) { onText(text); }
        });

        el.trigger(Event('keydown', { which: 97 }));
        el.trigger(Event('keypress', { which: 97 }));
        el.val('a');

        el.trigger('input');
        assert.equal(typedText, 'a');

        onText = null;

        shim.select('$\\frac{a}{2}$');
        assert.equal(el.val(), '$\\frac{a}{2}$');

        shim.select('$2$');
        assert.equal(el.val(), '$2$');
      });
    });
  });

  suite('paste', function() {
    test('paste event only', function(done) {
      saneKeyboardEvents(el, {
        paste: function(text) {
          assert.equal(text, '$x^2+1$');

          done();
        }
      });

      el.trigger('paste');
      el.val('$x^2+1$');
    });

    test('paste after keydown/keypress', function(done) {
      saneKeyboardEvents(el, {
        keystroke: noop,
        paste: function(text) {
          assert.equal(text, 'foobar');
          done();
        }
      });

      // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
      // without an `input` event
      el.trigger('keydown', { which: 86, ctrlKey: true });
      el.trigger('keypress', { which: 118, ctrlKey: true });
      el.trigger('paste');
      el.val('foobar');
    });

    test('paste after keydown/keypress/input', function(done) {
      saneKeyboardEvents(el, {
        keystroke: noop,
        paste: function(text) {
          assert.equal(text, 'foobar');
          done();
        }
      });

      // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
      // with an `input` event
      el.trigger('keydown', { which: 86, ctrlKey: true });
      el.trigger('keypress', { which: 118, ctrlKey: true });
      el.trigger('paste');
      el.val('foobar');
      el.trigger('input');
    });

    test('keypress timeout happening before paste timeout', function(done) {
      saneKeyboardEvents(el, {
        keystroke: noop,
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
