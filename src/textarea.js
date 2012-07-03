/*************************************************
 * Textarea Manager
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
 * cross-browser issues that arise must be deal
 * with here, and if necessary, the API updated.
 *
 * Organization:
 * - key values map and stringify()
 * - manageTextarea()
 *    + defer() and flush()
 *    + event handler logic
 *    + attach event handlers and export methods
 ************************************************/

var manageTextarea = (function() {
  // The following [key values][1] map was compiled from the
  // [DOM3 Events appendix section on key codes][2] and
  // [a widely cited report on cross-browser tests of key codes][3],
  // except for 10: 'Enter', which I've empirically observed in Safari on iOS
  // and doesn't appear to conflict with any other known key codes.
  //
  // [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
  // [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
  // [3]: http://unixpapa.com/js/key.html
  var KEY_VALUES = {
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

    144: 'NumLock'
  };

  // To the extent possible, create a normalized string representation
  // of the key combo (i.e., key code and modifier keys).
  function stringify(evt) {
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

  // hook up the events
  return function manageTextarea(el, handlers) {
    var keydown = null;
    var keypress = null;

    if (!handlers) handlers = {};
    var textCallback = handlers.text || noop;
    var keyCallback = handlers.key || noop;
    var pasteCallback = handlers.paste || noop;
    var onCut = handlers.cut || noop;

    // TODO: don't assume el is the textarea itself
    var textarea = $(el);


    // defer() runs fn immediately after the current thread.
    // flush() will run it even sooner, if possible.
    // flush always needs to be called before defer, and is called a
    // few other places besides.
    var timeout, deferredFn;
    function defer(fn) {
      timeout = setTimeout(fn);
      deferredFn = fn;
    }
    function flush() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
        deferredFn();
      }
    }


    // -*- public methods -*- //
    function select(text) {
      flush();

      textarea.val(text);
      if (text) textarea[0].select();
    }

    // -*- helper subroutines -*- //

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, since it uses
    // document.selection instead.
    function hasSelection() {
      var dom = textarea[0];

      if (!('selectionStart' in dom)) return false;
      return dom.selectionStart !== dom.selectionEnd;
    }

    function popText(callback) {
      var text = textarea.val();
      textarea.val('');
      if (text) callback(text);
    }

    function handleKey() {
      keyCallback(stringify(keydown), keydown);
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      flush();

      keydown = e;
      keypress = null;

      handleKey();
    }

    function onKeypress(e) {
      flush();

      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      defer(function() {
        // If there is a selection, the contents of the textarea couldn't
        // possibly have just been typed in.
        // This happens in browsers like Firefox and Opera that fire
        // keypress for keystrokes that are not text entry and leave the
        // selection in the textarea alone, such as Ctrl-C.
        if (hasSelection()) return;

        popText(textCallback);
      });
    }

    function onBlur() {
      flush();
      keydown = keypress = null;
    }

    function onInput() {
      flush();
    }

    function onPaste(e) {
      flush();
      defer(function() {
        popText(pasteCallback);
      });
    }

    // set up events
    textarea.bind({
      keydown: onKeydown,
      keypress: onKeypress,
      blur: onBlur,
      input: onInput,
      paste: onPaste,
      cut: onCut
    });

    // -*- expose public methods -*- //
    return {
      select: select,
      paste: onPaste
    }
  };
}());
