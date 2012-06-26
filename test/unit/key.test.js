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
    el.key({
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
      key: $.noop
    });

    el.trigger(Event('keydown', { which: 97 }));
    el.trigger(Event('keypress', { which: 97 }));
    el.val('a');
  });

  test('one keydown only', function(done) {
    var counter = 0;

    el.key({
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

    el.key({
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

    el.key({
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
});
