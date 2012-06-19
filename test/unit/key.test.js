suite('key', function() {
  var el;

  function makeEvent(opts) { return $.Event('keydown', opts); }

  setup(function() {
    el = $('<div>').appendTo('body');
  });

  test('Normal keys', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, 'a');
      done();
    });

    el.trigger(makeEvent({ which: 97 }));
  });

  test('Normal keys with one modifier', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, '<Ctrl-a>');
      done();
    });

    el.trigger(makeEvent({ which: 97, ctrlKey: true }));
  });

  test('Normal keys with multiple modifiers', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, '<Ctrl-Alt-a>');
      done();
    });

    el.trigger(makeEvent({ which: 97, ctrlKey: true, altKey: true }));
  });

  test('Simple special key', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, '<Backspace>');
      done();
    });

    el.trigger(makeEvent({ keyCode: 8 }));
  });

  test('Special key with one modifier', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, '<Shift-Backspace>');
      done();
    });

    el.trigger(makeEvent({ keyCode: 8, shiftKey: true }));
  });

  test('Special key with multiple modifiers', function(done) {
    el.key(function(evt) {
      assert.equal(evt.key, '<Alt-Shift-Backspace>');
      done();
    });

    el.trigger(makeEvent({ keyCode: 8, shiftKey: true, altKey: true }));
  });
});
