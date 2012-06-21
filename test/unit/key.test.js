suite('key', function() {
  var el;
  var Event = $.Event

  setup(function() {
    el = $('<textarea>').appendTo('#mock');
  });

  teardown(function() {
    el.remove();
  });

  test('normal keys', function(done) {
    var counter = 0;
    el.key(function(evt) {
      counter += 1;
      assert.ok(counter <= 1, 'callback is only called once');
      assert.equal(evt.text, 'a', 'text comes back as a');
      assert.equal(evt.key, 'a', 'from charcode comes back as a');
      assert.equal(el.val(), '', 'the textarea remains empty');

      assert.ok(evt.keydown, 'has a keydown');
      assert.equal(evt.keydown.type, 'keydown', 'has the correct keydown');

      assert.ok(evt.keypress, 'has a keypress');
      assert.equal(evt.keypress.type, 'keypress', 'has the correct keypress');

      done();
    });

    el.trigger(Event('keydown', { which: 97 }));
    el.trigger(Event('keypress', { which: 97 }));
    el.val('a');
  });

  test('one keydown only', function(done) {
    var counter = 0;

    el.key(function(evt) {
      counter += 1;
      assert.ok(counter <= 1, 'callback is called only once');
      assert.equal(evt.text, '', 'no text is set');
      assert.equal(evt.key, 'Backspace', 'key is correctly set');

      done();
    });

    el.trigger(Event('keydown', { which: 8 }));
  });

  test('a series of keydowns only', function(done) {
    var counter = 0;

    el.key(function(evt) {
      counter += 1;
      assert.ok(counter <= 3, 'callback is called at most 3 times');

      assert.ok(evt.keydown);
      assert.isNull(evt.keypress);
      assert.equal(evt.text, 'a');
      assert.equal(evt.key, 'a');

      if (counter === 3) done();
    });

    el.trigger(Event('keydown', { which: 97 }));
    el.val('a');
    el.trigger(Event('keydown', { which: 97 }));
    el.val('a');
    el.trigger(Event('keydown', { which: 97 }));
    el.val('a');
  });

  test('one keydown and a series of keypresses', function(done) {
    var counter = 0;

    el.key(function(evt) {
      counter += 1;
      assert.ok(counter <= 3, 'callback is called at most 3 times');

      assert.ok(evt.keydown);
      assert.ok(evt.keypress);
      assert.equal(evt.text, '');
      assert.equal(evt.key, 'Backspace');

      if (counter === 3) done();
    });

    el.trigger(Event('keydown', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
    el.trigger(Event('keypress', { which: 8 }));
  });
});
