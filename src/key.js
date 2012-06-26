$.fn.key = (function() {
  var SPECIAL = {
    8: 'Backspace',
    9: 'Tab',

    // for iPhone
    10: 'Enter',

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

    // TODO: more
  };

  function stringify(evt) {
    var which = evt.which || evt.keyCode;
    var special = SPECIAL[which];
    var key;
    var modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    key = special || String.fromCharCode(which);

    if (!modifiers.length && !special) return key;

    modifiers.push(key);
    return modifiers.join('-');
  }

  function embellish(evt) {
    evt.key = stringify(evt);
  }

  // hook up the events
  return function key(callbacks) {
    var notifyTimeout;
    var keydown = null;
    var keypress = null;
    var textarea = $(this);
    var justFocused;

    // -*- private methods -*- //
    function notify() {
      var text = textarea.val();
      textarea.val('');

      if (text) {
        callbacks.text(text, keydown, keypress);
      }
      else {
        callbacks.key(stringify(keydown), keydown, keypress);
      }
    }

    function flush() {
      if (notifyTimeout) return notify();

      notifyTimeout = setTimeout(function() {
        notify();
        notifyTimeout = null;
      });
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      flush();

      keydown = e;
      keypress = null;
      justFocused = false;
    }

    function onKeypress(e) {
      // skip phantom keypresses right after focus.
      if (justFocused) return;

      // flush on keypresses after the first in the episode,
      // for auto-repeated keypresses.
      if (keypress) {
        flush();
      }
      else {
        pray('keypress happens before timeout', notifyTimeout !== null);
      }

      keypress = e;
    }

    function onFocus() { justFocused = true; }

    // set up events
    return textarea
      .bind('keydown.keyboard', onKeydown)
      .bind('keypress.keyboard', onKeypress)
      .bind('focus.keyboard', onFocus)
    ;
  };
})();
