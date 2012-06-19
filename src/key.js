$.fn.key = (function() {
  var SPECIAL = {
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    27: 'Esc'
    // TODO: more
  };

  function stringify(evt) {
    var which = evt.which || evt.keyCode;
    var special = SPECIAL[which];
    var key;
    var modifiers = [];

    if (evt.ctrlKey) modifiers.push('Ctrl');
    if (evt.altKey) modifiers.push('Alt');
    if (evt.shiftKey) modifiers.push('Shift');

    key = special || String.fromCharCode(which);

    if (!modifiers.length && !special) return key;

    modifiers.push(key);
    return '<'+modifiers.join('-')+'>';
  }

  function embellish(evt) {
    evt.key = stringify(evt);
  }

  // hook up the events
  return function key(cb) {
    var lastKeydown, lastKeydownHappened, lastKeypressWhich;

    function keydown(e) {
      lastKeydown = e;
      lastKeydownHappened = true;
      embellish(e);
      cb(e);
    }

    // on auto-repeated key events,
    // keypress may get triggered but not keydown.
    // This manually auto-repeats.
    function keypress(e) {
      if (lastKeydownHappened) {
        lastKeydownHappened = false;
      }
      else {
        cb(lastKeydown);
      }
    }

    return $(this)
      .bind('keydown.mathquill', keydown)
      .bind('keypress.mathquill', keypress)
    ;
  };
})();
