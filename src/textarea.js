var manageTextarea = (function() {
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
    if (evt.originalEvent && evt.originalEvent.metaKey) modifiers.push('Meta');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    key = special || String.fromCharCode(which);

    if (!modifiers.length && !special) return key;

    modifiers.push(key);
    return modifiers.join('-');
  }

  // hook up the events
  return function manageTextarea(el, handlers) {
    var textTimeout;
    var keydown = null;
    var keypress = null;
    var paste = null;

    if (!handlers) handlers = {};
    var textCallback = handlers.text || noop;
    var keyCallback = handlers.key || noop;
    var pasteCallback = handlers.paste || noop;
    var cutCallback = handlers.cut || noop;

    // TODO: don't assume el is the textarea itself
    var textarea = $(el);

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, since it uses
    // document.selection instead.
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
      textTimeout = undefined;

      // the two cases things might show up
      // in the textarea outside of normal
      // text input are if the user is selecting
      // text, or has just pasted.
      // TODO: make sure we're not relying on this
      // in IE < 9, since hasSelection() will always
      // be false.
      if (paste || hasSelection()) return;

      var text = popText();

      if (text) {
        textCallback(text, keydown, keypress);
      }
    }

    function flushText() {
      if (textTimeout) {
        clearTimeout(textTimeout);
        handleText();
      }
    }

    function handleKey() {
      keyCallback(stringify(keydown), keydown);
    }

    function handlePaste() {
      var text = popText();

      if (text) pasteCallback(text, paste);

      paste = null;
    }

    // -*- public methods -*- //
    function select(text) {
      textarea.val(text);
      if (text) textarea[0].select();
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      flushText();

      keydown = e;
      keypress = null;

      handleKey();
    }

    function onKeypress(e) {
      flushText();

      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      textTimeout = setTimeout(handleText);
    }

    function onBlur() {
      flushText();
      keydown = keypress = null;
    }

    function onInput() {
      if (textTimeout) clearTimeout(textTimeout);
      handleText();
    }

    function onPaste(e) {
      paste = e;
      setTimeout(handlePaste);
    }

    var onCut = cutCallback;

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
    return {
      select: select,
      paste: onPaste
    }
  };
})();
