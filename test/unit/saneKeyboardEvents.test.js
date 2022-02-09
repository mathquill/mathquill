suite('saneKeyboardEvents', function () {
  var el;

  function supportsSelectionAPI() {
    return 'selectionStart' in el[0];
  }

  function mockController(opts) {
    return {
      addTextareaEventListeners(listeners) {
        for (let key in listeners) {
          el[0].addEventListener(key, listeners[key]);
        }
      },
      ...opts,
    };
  }

  setup(function () {
    el = $('<textarea>').appendTo('#mock');
  });

  test('normal keys', function (done) {
    var counter = 0;
    saneKeyboardEvents(
      el[0],
      mockController({
        keystroke: noop,
        typedText: function (text, keydown, keypress) {
          counter += 1;
          assert.ok(counter <= 1, 'callback is only called once');
          assert.equal(text, 'a', 'text comes back as a');
          assert.equal(el.val(), '', 'the textarea remains empty');

          done();
        },
      })
    );

    trigger.keydown(el[0], 'a');
    trigger.keypress(el[0], 'a');
    el.val('a');
  });

  test('normal keys without keypress', function (done) {
    var counter = 0;
    saneKeyboardEvents(
      el[0],
      mockController({
        keystroke: noop,
        typedText: function (text) {
          counter += 1;
          assert.ok(counter <= 1, 'callback is only called once');
          assert.equal(text, 'a', 'text comes back as a');
          assert.equal(el.val(), '', 'the textarea remains empty');

          done();
        },
      })
    );

    trigger.keydown(el[0], 'a');
    trigger.keyup(el[0], 'a');
    el.val('a');
  });

  test('one keydown only', function (done) {
    var counter = 0;

    saneKeyboardEvents(
      el[0],
      mockController({
        keystroke: function (key, evt) {
          counter += 1;
          assert.ok(counter <= 1, 'callback is called only once');
          assert.equal(key, 'Backspace', 'key is correctly set');

          done();
        },
      })
    );

    trigger.keydown(el[0], 'Backspace');
  });

  test('a series of keydowns only', function (done) {
    var counter = 0;

    saneKeyboardEvents(
      el[0],
      mockController({
        keystroke: function (key, keydown) {
          counter += 1;
          assert.ok(counter <= 3, 'callback is called at most 3 times');

          assert.ok(keydown);
          assert.equal(key, 'Left');

          if (counter === 3) done();
        },
      })
    );

    trigger.keydown(el[0], 'ArrowLeft');
    trigger.keydown(el[0], 'ArrowLeft');
    trigger.keydown(el[0], 'ArrowLeft');
  });

  test('one keydown and a series of keypresses', function (done) {
    var counter = 0;

    saneKeyboardEvents(
      el[0],
      mockController({
        keystroke: function (key, keydown) {
          counter += 1;
          assert.ok(counter <= 3, 'callback is called at most 3 times');

          assert.ok(keydown);
          assert.equal(key, 'Backspace');

          if (counter === 3) done();
        },
      })
    );

    trigger.keydown(el[0], 'Backspace');
    trigger.keypress(el[0], 'Backspace');
    trigger.keypress(el[0], 'Backspace');
    trigger.keypress(el[0], 'Backspace');
  });

  suite('select', function () {
    test("select populates the textarea but doesn't call .typedText()", function () {
      var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));

      shim.select('foobar');

      assert.equal(el.val(), 'foobar');
      trigger.keydown(el[0]);
      assert.equal(el.val(), 'foobar', 'value remains after keydown');

      if (supportsSelectionAPI()) {
        trigger.keypress(el[0]);
        assert.equal(el.val(), 'foobar', 'value remains after keypress');
        trigger.input(el[0]);
        assert.equal(
          el.val(),
          'foobar',
          'value remains after flush after keypress'
        );
      }
    });

    test(
      "select populates the textarea but doesn't call text" +
        ' on keydown, even when the selection is not properly' +
        ' detectable',
      function () {
        var shim = saneKeyboardEvents(
          el[0],
          mockController({ keystroke: noop })
        );

        shim.select('foobar');
        // monkey-patch the dom-level selection so that hasSelection()
        // returns false, as in IE < 9.
        el[0].selectionStart = el[0].selectionEnd = 0;

        trigger.keydown(el[0]);
        assert.equal(el.val(), 'foobar', 'value remains after keydown');
      }
    );

    test('blurring', function () {
      var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));

      shim.select('foobar');
      el.trigger('blur');
      el.focus();

      // IE < 9 doesn't support selection{Start,End}
      if (supportsSelectionAPI()) {
        assert.equal(
          el[0].selectionStart,
          0,
          'it is not selected at the start'
        );
        assert.equal(el[0].selectionEnd, 0, 'it is not selected at the end');
      }

      assert.equal(el.val(), '', 'it has no content');
    });

    test('blur then empty selection', function () {
      var shim = saneKeyboardEvents(el[0], mockController({ keystroke: noop }));
      shim.select('foobar');
      el.blur();
      shim.select('');
      assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
    });

    test('blur in keystroke handler', function (done) {
      if (!document.hasFocus()) {
        console.warn(
          'The test "blur in keystroke handler" needs the document to have ' +
            'focus. Only when the document has focus does .select() on an ' +
            'element also focus it, which is part of the problematic behavior ' +
            'we are testing robustness against. (Specifically, erroneously ' +
            'calling .select() in a timeout after the textarea has blurred, ' +
            '"stealing back" focus.)\n' +
            'Normally, the page being open and focused is enough to have focus, ' +
            'but with the Developer Tools open, it depends on whether you last ' +
            'clicked on something in the Developer Tools or on the page itself. ' +
            'Click the page, or close the Developer Tools, and Refresh.'
        );
        $('#mock').empty(); // LOL next line skips teardown https://git.io/vaUWq
        this.skip();
      }

      var shim = saneKeyboardEvents(
        el[0],
        mockController({
          keystroke: function (key) {
            assert.equal(key, 'Left');
            el[0].blur();
          },
        })
      );

      shim.select('foobar');
      assert.ok(document.activeElement === el[0], 'textarea focused');

      trigger.keydown(el[0], 'ArrowLeft');
      assert.ok(document.activeElement !== el[0], 'textarea blurred');

      setTimeout(function () {
        assert.ok(document.activeElement !== el[0], 'textarea remains blurred');
        done();
      });
    });

    suite(
      "selected text after keypress or paste doesn't get mistaken" +
        ' for inputted text',
      function () {
        test('select() immediately after paste', function () {
          var pastedText;
          var onPaste = function (text) {
            pastedText = text;
          };
          var shim = saneKeyboardEvents(
            el[0],
            mockController({
              paste: function (text) {
                onPaste(text);
              },
            })
          );

          trigger.paste(el[0]);
          el.val('$x^2+1$');

          shim.select('$\\frac{x^2+1}{2}$');
          assert.equal(pastedText, '$x^2+1$');
          assert.equal(el.val(), '$\\frac{x^2+1}{2}$');

          onPaste = null;

          shim.select('$2$');
          assert.equal(el.val(), '$2$');
        });

        test('select() after paste/input', function () {
          var pastedText;
          var onPaste = function (text) {
            pastedText = text;
          };
          var shim = saneKeyboardEvents(
            el[0],
            mockController({
              paste: function (text) {
                onPaste(text);
              },
            })
          );

          trigger.paste(el[0]);
          el.val('$x^2+1$');

          trigger.input(el[0]);
          assert.equal(pastedText, '$x^2+1$');
          assert.equal(el.val(), '');

          onPaste = null;

          shim.select('$\\frac{x^2+1}{2}$');
          assert.equal(el.val(), '$\\frac{x^2+1}{2}$');

          shim.select('$2$');
          assert.equal(el.val(), '$2$');
        });

        test('select() immediately after keydown/keypress', function () {
          var typedText;
          var onText = function (text) {
            typedText = text;
          };
          var shim = saneKeyboardEvents(
            el[0],
            mockController({
              keystroke: noop,
              typedText: function (text) {
                onText(text);
              },
            })
          );

          trigger.keydown(el[0], 'a');
          trigger.keypress(el[0], 'a');
          el.val('a');

          shim.select('$\\frac{a}{2}$');
          assert.equal(typedText, 'a');
          assert.equal(el.val(), '$\\frac{a}{2}$');

          onText = null;

          shim.select('$2$');
          assert.equal(el.val(), '$2$');
        });

        test('select() after keydown/keypress/input', function () {
          var typedText;
          var onText = function (text) {
            typedText = text;
          };
          var shim = saneKeyboardEvents(
            el[0],
            mockController({
              keystroke: noop,
              typedText: function (text) {
                onText(text);
              },
            })
          );

          trigger.keydown(el[0], 'a');
          trigger.keypress(el[0], 'a');
          el.val('a');

          trigger.input(el[0]);
          assert.equal(typedText, 'a');

          onText = null;

          shim.select('$\\frac{a}{2}$');
          assert.equal(el.val(), '$\\frac{a}{2}$');

          shim.select('$2$');
          assert.equal(el.val(), '$2$');
        });

        suite(
          'unrecognized keys that move cursor and clear selection',
          function () {
            test('without keypress', function () {
              var shim = saneKeyboardEvents(
                el[0],
                mockController({ keystroke: noop })
              );

              shim.select('a');
              assert.equal(el.val(), 'a');

              if (!supportsSelectionAPI()) return;

              trigger.keydown(el[0], 'ArrowLeft', { altKey: true });
              el[0].selectionEnd = 0;
              trigger.keyup(el[0], 'ArrowLeft', { altKey: true });
              assert.ok(el[0].selectionStart !== el[0].selectionEnd);

              el.blur();
              shim.select('');
              assert.ok(
                document.activeElement !== el[0],
                'textarea remains blurred'
              );
            });

            test('with keypress, many characters selected', function () {
              var shim = saneKeyboardEvents(
                el[0],
                mockController({ keystroke: noop })
              );

              shim.select('many characters');
              assert.equal(el.val(), 'many characters');

              if (!supportsSelectionAPI()) return;

              trigger.keydown(el[0], 'ArrowLeft', { altKey: true });
              trigger.keypress(el[0], 'ArrowLeft', { altKey: true });
              el[0].selectionEnd = 0;

              trigger.keyup(el[0]);
              assert.ok(el[0].selectionStart !== el[0].selectionEnd);

              el.blur();
              shim.select('');
              assert.ok(
                document.activeElement !== el[0],
                'textarea remains blurred'
              );
            });
          }
        );
      }
    );
  });

  suite('paste', function () {
    test('paste event only', function (done) {
      saneKeyboardEvents(
        el[0],
        mockController({
          paste: function (text) {
            assert.equal(text, '$x^2+1$');

            done();
          },
        })
      );

      trigger.paste(el[0]);
      el.val('$x^2+1$');
    });

    test('paste after keydown/keypress', function (done) {
      saneKeyboardEvents(
        el[0],
        mockController({
          keystroke: noop,
          paste: function (text) {
            assert.equal(text, 'foobar');
            done();
          },
        })
      );

      // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
      // without an `input` event
      trigger.keydown(el[0], 'V', { ctrlKey: true });
      trigger.keypress(el[0], 'v', { ctrlKey: true });
      trigger.paste(el[0]);
      el.val('foobar');
    });

    test('paste after keydown/keypress/input', function (done) {
      saneKeyboardEvents(
        el[0],
        mockController({
          keystroke: noop,
          paste: function (text) {
            assert.equal(text, 'foobar');
            done();
          },
        })
      );

      // Ctrl-V in Firefox or Opera, according to unixpapa.com/js/key.html
      // with an `input` event
      trigger.keydown(el[0], 'V', { ctrlKey: true });
      trigger.keypress(el[0], 'v', { ctrlKey: true });
      trigger.paste(el[0]);
      el.val('foobar');
      trigger.input(el[0]);
    });

    test('keypress timeout happening before paste timeout', function (done) {
      saneKeyboardEvents(
        el[0],
        mockController({
          keystroke: noop,
          paste: function (text) {
            assert.equal(text, 'foobar');
            done();
          },
        })
      );

      trigger.keydown(el[0], 'V', { ctrlKey: true });
      trigger.keypress(el[0], 'v', { ctrlKey: true });
      trigger.paste(el[0]);
      el.val('foobar');

      // this synthesizes the keypress timeout calling handleText()
      // before the paste timeout happens.
      trigger.input(el[0]);
    });

    test('pasting into a focused textarea should not fire a redundant focus event', function (done) {
      el.focus();

      var focusCalled = false;
      el.focus(function () {
        focusCalled = true;
      });

      saneKeyboardEvents(
        el[0],
        mockController({
          paste: function () {
            assert.ok(
              !focusCalled,
              'Pasting into a focused mathquill should not fire a focus event'
            );
            done();
          },
        })
      );

      // Simulate a paste
      trigger.paste(el[0]);
      el.val('2');
      trigger.input(el[0]);
    });
  });

  suite('copy', function () {
    test('only runs handler once even if handler synchronously selects', function () {
      // ...which MathQuill does and resulted in a stack overflow: https://git.io/vosm0
      var shim = saneKeyboardEvents(
        el[0],
        mockController({
          copy: function () {
            shim.select();
          },
        })
      );

      trigger.copy(el[0]);
    });
  });
});
