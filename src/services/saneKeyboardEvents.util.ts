/** Poller that fires once every tick. */
class EveryTick<Args extends unknown[] = []> {
  private timeoutId: number;
  private fn: (...args: Args | []) => void = noop;
  constructor() {}

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
 * An abstraction layer over the raw browser browser events
 * on the textarea that hides all the nasty cross-
 * browser incompatibilities behind a uniform API.
 *
 * Design goal: This is a *HARD* internal
 * abstraction barrier. Cross-browser
 * inconsistencies are not allowed to leak through
 * and be dealt with by event handlers. All future
 * cross-browser issues that arise must be dealt
 * with here, and if necessary, the API updated.
 ************************************************/
var saneKeyboardEvents = (function () {
  // The following [key values][1] map was compiled from the
  // [DOM3 Events appendix section on key codes][2] and
  // [a widely cited report on cross-browser tests of key codes][3],
  // except for 10: 'Enter', which I've empirically observed in Safari on iOS
  // and doesn't appear to conflict with any other known key codes.
  //
  // [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
  // [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
  // [3]: http://unixpapa.com/js/key.html
  const WHICH_TO_MQ_KEY_STEM: Record<number, string | undefined> = {
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

  const KEY_TO_MQ_KEY_STEM: Record<string, string | undefined> = {
    ArrowRight: 'Right',
    ArrowLeft: 'Left',
    ArrowDown: 'Down',
    ArrowUp: 'Up',
    Delete: 'Del',
    Escape: 'Esc',
    ' ': 'Spacebar',
  };

  function isArrowKey(e: KeyboardEvent) {
    // The keyPress event in FF reports which=0 for some reason. The new
    // .key property seems to report reasonable results, so we're using that
    switch (getMQKeyStem(e)) {
      case 'Right':
      case 'Left':
      case 'Down':
      case 'Up':
        return true;
    }
    return false;
  }

  function isLowercaseAlphaCharacter(s: string) {
    return s.length === 1 && s >= 'a' && s <= 'z';
  }

  function getMQKeyStem(evt: KeyboardEvent) {
    // Translate browser key names to MQ's internal naming system
    //
    // Ref: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    if (evt.key === undefined) {
      const which = evt.which || evt.keyCode;
      return WHICH_TO_MQ_KEY_STEM[which] || String.fromCharCode(which);
    }
    if (isLowercaseAlphaCharacter(evt.key)) return evt.key.toUpperCase();
    return KEY_TO_MQ_KEY_STEM[evt.key] ?? evt.key;
  }

  /** To the extent possible, create a normalized string representation
   * of the key combo (i.e., key code and modifier keys). */
  function getMQKeyName(evt: KeyboardEvent) {
    const key = getMQKeyStem(evt);
    var modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    if (!modifiers.length) return key;

    // Don't append the key name if it already exists as a modifier, e.g. Ctrl-Control and Shift-Shift is nonsensical.
    if (key !== 'Alt' && key !== 'Control' && key !== 'Meta' && key !== 'Shift')
      modifiers.push(key);
    return modifiers.join('-');
  }

  return function saneKeyboardEvents(
    /** Usually the textarea associated with a MQ instance, but can be another kind of element if `substituteTextarea` was used to replace it with something else. */
    textarea: HTMLElement,
    controller: Controller
  ) {
    var keydown: KeyboardEvent | null = null;
    var keypress: KeyboardEvent | null = null;

    // everyTick.listen() is called after key or clipboard events to
    // say "Hey, I think something was just typed" or "pasted" etc,
    // so that at all subsequent opportune times (next event or timeout),
    // will check for expected typed or pasted text.
    // Need to check repeatedly because #135: in Safari 5.1 (at least),
    // after selecting something and then typing, the textarea is
    // incorrectly reported as selected during the input event (but not
    // subsequently).
    const everyTick = new EveryTick<[Event]>();

    function guardedTextareaSelect() {
      try {
        // IE can throw an 'Incorrect Function' error if you
        // try to select a textarea that is hidden. It seems
        // likely that we don't really care if the selection
        // fails to happen in this case. Why would the textarea
        // be hidden? And who would even be able to tell?
        if (textarea instanceof HTMLTextAreaElement) textarea.select();
      } catch (e) {}
    }

    // -*- public methods -*- //
    function select(text: string) {
      // check textarea at least once/one last time before munging (so
      // no race condition if selection happens after keypress/paste but
      // before checkTextarea), then never again ('cos it's been munged)
      everyTick.trigger();
      everyTick.clearListener();

      if (textarea instanceof HTMLTextAreaElement) textarea.value = text;
      if (text) guardedTextareaSelect();
      shouldBeSelected = !!text;
    }
    var shouldBeSelected = false;

    // -*- helper subroutines -*- //

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, which don't support
    // HTMLTextareaElement::selection{Start,End}.
    function hasSelection() {
      if (!('selectionStart' in textarea)) return false;
      if (!(textarea instanceof HTMLTextAreaElement)) return false;
      return textarea.selectionStart !== textarea.selectionEnd;
    }

    function handleKey() {
      if (controller.options && controller.options.overrideKeystroke) {
        controller.options.overrideKeystroke(getMQKeyName(keydown!), keydown!);
      } else {
        controller.keystroke(getMQKeyName(keydown!), keydown!);
      }
    }

    // -*- event handlers -*- //
    function onKeydown(e: KeyboardEvent) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
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

    function onKeypress(e: KeyboardEvent) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
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
      } else {
        everyTick.listenOnce(maybeReselect);
      }
    }

    function onKeyup(e: KeyboardEvent) {
      everyTick.trigger(e);
      if (e.target !== textarea) return;
      // Handle case of no keypress event being sent
      if (!!keydown && !keypress) {
        // only check for typed text if this key can type text. Otherwise
        // you can end up with mathquill thinking text was typed if you
        // use the mq.keystroke('Right') command while a single character
        // is selected. Only detected in FF.
        if (!isArrowKey(e)) {
          everyTick.listen(typedText);
        } else {
          everyTick.listenOnce(maybeReselect);
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
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      var text = textarea.value;

      // In Linux and Chrome or Chrome OS, users may issue the Ctrl-Shift-U command to input a Unicode character.
      // Unfortunately, when the system is in this state, Chrome sends a keydown of "Ctrl-Shift-Unidentified" in Linux, "Ctrl-Shift-U" on Windows/Mac, or "Ctrl-Shift-Process" in the latest Chrome OS.
      // Equally vexing is that the keyup correctly comes back as Ctrl-Shift-U.
      // Furthermore, an input event with the value "u" is still processed in Linux and Chrome OS due to the down/up mismatch.
      // The end result is that a spurious "u" is sent followed by the intended character.
      // Due to how this feature works, it's vital to completely ignore Ctrl-Shift-U no matter how the input event appears to Mathquill as clearing the textarea by mistake breaks the expected input flow.
      if (
        keydown &&
        !keydown.altKey &&
        keydown.ctrlKey &&
        !keydown.metaKey &&
        keydown.shiftKey &&
        (keydown.key === 'U' ||
          keydown.key === 'Unidentified' ||
          keydown.key === 'Process')
      )
        return;
      if (text.length === 1) {
        textarea.value = '';
        if (controller.options && controller.options.overrideTypedText) {
          controller.options.overrideTypedText(text);
        } else {
          controller.typedText(text);
        }
      } // in Firefox, keys that don't type text, just clear seln, fire keypress
      // https://github.com/mathquill/mathquill/issues/293#issuecomment-40997668
      else maybeReselect(); // re-select if that's why we're here
    }

    function maybeReselect() {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      if (textarea.value.length > 1) {
        guardedTextareaSelect();
      }
    }

    function onBlur() {
      keydown = null;
      keypress = null;
      everyTick.clearListener();
      if (textarea instanceof HTMLTextAreaElement) textarea.value = '';
    }

    function onPaste(e: Event) {
      everyTick.trigger();
      if (e.target !== textarea) return;

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
      if (document.activeElement !== textarea) {
        textarea.focus();
      }

      everyTick.listen(function pastedText() {
        if (!(textarea instanceof HTMLTextAreaElement)) return;
        var text = textarea.value;
        textarea.value = '';
        if (text) controller.paste(text);
      });
    }

    function onInput(e: Event) {
      everyTick.trigger(e);
    }

    if (controller.options && controller.options.disableCopyPaste) {
      controller.addTextareaEventListeners({
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
          everyTick.trigger();
          e.preventDefault();
        },
        input: onInput,
      });
    } else {
      controller.addTextareaEventListeners({
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
        input: onInput,
      });
    }

    // -*- export public methods -*- //
    return { select };
  };
})();
