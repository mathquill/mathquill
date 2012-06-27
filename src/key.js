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

  // hook up the events
  return function key(handlers) {
    var textTimeout;
    var keydown = null;
    var keypress = null;
    var textarea = $(this);

    pray('text and key handlers are present',
      !!(handlers.text && handlers.key)
    );

    // -*- private methods -*- //
    function handleText() {
      textTimeout = undefined;

      var text = textarea.val();
      textarea.val('');

      if (text) {
        handlers.text(text, keydown, keypress);
      }
    }

    function handleKey() {
      var res = handlers.key(stringify(keydown), keydown)

      if (res === false) keydown.preventDefault();
    }

    function flush() {
      if (textTimeout) {
        clearTimeout(textTimeout);
        handleText();
      }
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

      textTimeout = setTimeout(handleText);
    }

    function onBlur() {
      flush();
      keydown = keypress = null;
    }

    function onInput() {
      flush();
    }

    // set up events
    return textarea
      .bind('keydown', onKeydown)
      .bind('keypress', onKeypress)
      .bind('blur', onBlur)
      .bind('input', onInput)
    ;
  };
})();
