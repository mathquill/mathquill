/** Poller that fires once every tick. */
class EveryTick<Args extends unknown[] = []> {
  private timeoutId: number;
  constructor(private fn: (...args: Args | []) => void) {}

  listen(fn: (...args: Args | []) => void) {
    this.fn = fn;
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(this.fn);
  }

  listenOnce(fn: (...args: Args | []) => void) {
    this.listen((...args: Args | []) => {
      this.clearListener();
      fn(...args);
    });
  }

  clearListener() {
    this.fn = noop;
    clearTimeout(this.timeoutId);
  }

  trigger(...args: Args | []) {
    this.fn(...args);
  }
}

/*************************************************
 * Sane Keyboard Events Shim
 *
 * An abstraction layer wrapping the textarea in
 * an object with methods to manipulate and listen
 * to events on, that hides all the nasty cross-
 * browser incompatibilities behind a uniform API.
 *
 * Design goal: This is a *HARD* internal
 * abstraction barrier. Cross-browser
 * inconsistencies are not allowed to leak through
 * and be dealt with by event handlers. All future
 * cross-browser issues that arise must be dealt
 * with here, and if necessary, the API updated.
 *
 * Organization:
 * - key values map and stringify()
 * - saneKeyboardEvents()
 *    + defer() and flush()
 *    + event handler logic
 *    + attach event handlers and export methods
 ************************************************/
var saneKeyboardEvents: SubstituteKeyboardEvents = (function () {
  // The following [key values][1] map was compiled from the
  // [DOM3 Events appendix section on key codes][2] and
  // [a widely cited report on cross-browser tests of key codes][3],
  // except for 10: 'Enter', which I've empirically observed in Safari on iOS
  // and doesn't appear to conflict with any other known key codes.
  //
  // [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
  // [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
  // [3]: http://unixpapa.com/js/key.html
  const KEY_VALUES: Record<number, string | undefined> = {
    8: 'Backspace',
    9: 'Tab',

    10: 'Enter', // for Safari on iOS

    13: 'Enter',

    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    20: 'CapsLock',

    27: 'Esc',

    32: 'Spacebar',

    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',

    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',

    45: 'Insert',

    46: 'Del',

    144: 'NumLock',
  };

  // To the extent possible, create a normalized string representation
  // of the key combo (i.e., key code and modifier keys).
  function stringify(evt: JQ_KeyboardEvent) {
    var which = evt.which || evt.keyCode;
    var keyVal = KEY_VALUES[which];
    var key;
    var modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.originalEvent && evt.originalEvent.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    key = keyVal || String.fromCharCode(which);

    if (!modifiers.length && !keyVal) return key;

    modifiers.push(key);
    return modifiers.join('-');
  }

  // create a keyboard events shim that calls callbacks at useful times
  // and exports useful public methods
  return function saneKeyboardEvents(el: $, controller: Controller) {
    var keydown: JQ_KeyboardEvent | null = null;
    var keypress: KeyboardEvent | null = null;

    var textarea = $(el);
    var target = controller.container?.toJQ() || $(textarea);

    // everyTick.listen() is called after key or clipboard events to
    // say "Hey, I think something was just typed" or "pasted" etc,
    // so that at all subsequent opportune times (next event or timeout),
    // will check for expected typed or pasted text.
    // Need to check repeatedly because #135: in Safari 5.1 (at least),
    // after selecting something and then typing, the textarea is
    // incorrectly reported as selected during the input event (but not
    // subsequently).
    const everyTick = new EveryTick<[Event]>(noop);
    target.bind('keydown keypress input keyup paste', function (e: Event) {
      everyTick.trigger(e);
    });

    function guardedTextareaSelect() {
      try {
        // IE can throw an 'Incorrect Function' error if you
        // try to select a textarea that is hidden. It seems
        // likely that we don't really care if the selection
        // fails to happen in this case. Why would the textarea
        // be hidden? And who would even be able to tell?
        (textarea[0] as HTMLTextAreaElement).select();
      } catch (e) {}
    }

    // -*- public methods -*- //
    function select(text: string) {
      // check textarea at least once/one last time before munging (so
      // no race condition if selection happens after keypress/paste but
      // before checkTextarea), then never again ('cos it's been munged)
      everyTick.trigger();
      everyTick.clearListener();

      textarea.val(text);
      if (text) guardedTextareaSelect();
      shouldBeSelected = !!text;
    }
    var shouldBeSelected = false;

    // -*- helper subroutines -*- //

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, which don't support
    // HTMLTextareaElement::selection{Start,End}.
    function hasSelection() {
      var dom = textarea[0] as HTMLTextAreaElement;

      if (!('selectionStart' in dom)) return false;
      return dom.selectionStart !== dom.selectionEnd;
    }

    function handleKey() {
      if (controller.options && controller.options.overrideKeystroke) {
        controller.options.overrideKeystroke(stringify(keydown!), keydown!);
      } else {
        controller.keystroke(stringify(keydown!), keydown!);
      }
    }

    // -*- event handlers -*- //
    function onKeydown(e: KeyboardEvent) {
      if (e.target !== textarea[0]) return;

      keydown = e;
      keypress = null;

      if (shouldBeSelected)
        everyTick.listenOnce(function (e?: Event) {
          if (!(e && e.type === 'focusout')) {
            // re-select textarea in case it's an unrecognized key that clears
            // the selection, then never again, 'cos next thing might be blur
            guardedTextareaSelect();
          }
        });

      handleKey();
    }

    function isArrowKey(e: JQ_KeyboardEvent) {
      if (!e || !e.originalEvent) return false;

      // The keyPress event in FF reports which=0 for some reason. The new
      // .key property seems to report reasonable results, so we're using that
      switch (e.originalEvent.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
        case 'ArrowDown':
        case 'ArrowUp':
          return true;
      }

      return false;
    }

    function onKeypress(e: KeyboardEvent) {
      if (e.target !== textarea[0]) return;

      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      // only check for typed text if this key can type text. Otherwise
      // you can end up with mathquill thinking text was typed if you
      // use the mq.keystroke('Right') command while a single character
      // is selected. Only detected in FF.
      if (!isArrowKey(e)) {
        everyTick.listen(typedText);
      }
    }

    function onKeyup(e: KeyboardEvent) {
      if (e.target !== textarea[0]) return;

      // Handle case of no keypress event being sent
      if (!!keydown && !keypress) {
        // only check for typed text if this key can type text. Otherwise
        // you can end up with mathquill thinking text was typed if you
        // use the mq.keystroke('Right') command while a single character
        // is selected. Only detected in FF.
        if (!isArrowKey(e)) {
          everyTick.listen(typedText);
        }
      }
    }

    function typedText() {
      // If there is a selection, the contents of the textarea couldn't
      // possibly have just been typed in.
      // This happens in browsers like Firefox and Opera that fire
      // keypress for keystrokes that are not text entry and leave the
      // selection in the textarea alone, such as Ctrl-C.
      // Note: we assume that browsers that don't support hasSelection()
      // also never fire keypress on keystrokes that are not text entry.
      // This seems reasonably safe because:
      // - all modern browsers including IE 9+ support hasSelection(),
      //   making it extremely unlikely any browser besides IE < 9 won't
      // - as far as we know IE < 9 never fires keypress on keystrokes
      //   that aren't text entry, which is only as reliable as our
      //   tests are comprehensive, but the IE < 9 way to do
      //   hasSelection() is poorly documented and is also only as
      //   reliable as our tests are comprehensive
      // If anything like #40 or #71 is reported in IE < 9, see
      // b1318e5349160b665003e36d4eedd64101ceacd8
      if (hasSelection()) return;

      var text = (textarea[0] as HTMLTextAreaElement).value;
      if (text.length === 1) {
        textarea.val('');
        if (controller.options && controller.options.overrideTypedText) {
          controller.options.overrideTypedText(text);
        } else {
          controller.typedText(text);
        }
      } // in Firefox, keys that don't type text, just clear seln, fire keypress
      // https://github.com/mathquill/mathquill/issues/293#issuecomment-40997668
      else if (text) guardedTextareaSelect(); // re-select if that's why we're here
    }

    function onBlur() {
      keydown = null;
      keypress = null;
      everyTick.clearListener();
      textarea.val('');
    }

    function onPaste(e: Event) {
      if (e.target !== textarea[0]) return;

      // browsers are dumb.
      //
      // In Linux, middle-click pasting causes onPaste to be called,
      // when the textarea is not necessarily focused.  We focus it
      // here to ensure that the pasted text actually ends up in the
      // textarea.
      //
      // It's pretty nifty that by changing focus in this handler,
      // we can change the target of the default action.  (This works
      // on keydown too, FWIW).
      //
      // And by nifty, we mean dumb (but useful sometimes).
      if (document.activeElement !== textarea[0]) {
        textarea[0].focus();
      }

      everyTick.listen(function pastedText() {
        var text = (textarea[0] as HTMLTextAreaElement).value;
        textarea.val('');
        if (text) controller.paste(text);
      });
    }

    // -*- attach event handlers -*- //

    if (controller.options && controller.options.disableCopyPaste) {
      target.bind({
        keydown: onKeydown,
        keypress: onKeypress,
        keyup: onKeyup,
        focusout: onBlur,
        copy: function (e: Event) {
          e.preventDefault();
        },
        cut: function (e: Event) {
          e.preventDefault();
        },
        paste: function (e: Event) {
          e.preventDefault();
        },
      });
    } else {
      target.bind({
        keydown: onKeydown,
        keypress: onKeypress,
        keyup: onKeyup,
        focusout: onBlur,
        cut: function () {
          everyTick.listenOnce(function () {
            controller.cut();
          });
        },
        copy: function () {
          everyTick.listenOnce(function () {
            controller.copy();
          });
        },
        paste: onPaste,
      });
    }

    // -*- export public methods -*- //
    return {
      select: select,
    };
  };
})();
