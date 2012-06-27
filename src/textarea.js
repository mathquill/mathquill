var makeTextarea = (function() {
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
  return function makeTextarea(el, handlers) {
    var textTimeout;
    var keydown = null;
    var keypress = null;
    var paste = null;

    // TODO: don't assume el is the textarea itself
    var textarea = $(el);

    pray('text and key handlers are present',
      !!(handlers.text && handlers.key)
    );

    function hasSelection() {
      var dom = textarea[0];

      if (!('selectionStart' in dom)) return false;
      if (dom.selectionStart === dom.selectionEnd) return false;
      return true;
    }

    // -*- private methods -*- //
    function popText() {
      var text = textarea.val();
      textarea.val('');
      return text;
    }

    function handleText() {
      if (textTimeout) {
        clearTimeout(textTimeout);
        textTimeout = undefined;
      }

      if (paste || hasSelection()) return;

      var text = popText();

      if (text) {
        handlers.text(text, keydown, keypress);
      }
    }

    function handleKey() {
      handlers.key(stringify(keydown), keydown);
    }

    function handlePaste() {
      var text = popText();

      if (text) handlers.paste(text, paste);

      paste = null;
    }

    // -*- public methods -*- //
    function select(text) {
      textarea.val(text);
      if (text) textarea[0].select();
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      handleText();

      keydown = e;
      keypress = null;

      handleKey();
    }

    function onKeypress(e) {
      handleText();

      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      textTimeout = setTimeout(handleText);
    }

    function onBlur() {
      handleText();
      keydown = keypress = null;
    }

    function onInput() {
      handleText();
    }

    function onPaste(e) {
      paste = e;
      setTimeout(handlePaste);
    }

    var onCut = handlers.cut;

    // set up events
    textarea
      .bind('keydown', onKeydown)
      .bind('keypress', onKeypress)
      .bind('blur', onBlur)
      .bind('input', onInput)
      .bind('paste', onPaste)
      .bind('cut', onCut)
    ;

    // -*- expose public methods -*- //
    return { select: select }
  };
})();
