/*********************************************
 * Root math elements with event delegation.
 ********************************************/

var Controller = P(function(_) {
  _.init = function(root) {
    this.root = root;
    this.cursor = Cursor(root);
  };
});

function createTextarea(container, root) {
  var textareaSpan = root.textareaSpan = $('<span class="textarea"><textarea></textarea></span>'),
    textarea = root.textarea = textareaSpan.children();

  //prevent native selection except textarea
  container.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });
}

function setRootSelectionChangedFn(container, root, selectFn) {
  var cursor = root.cursor;

  // throttle calls to setTextareaSelection(), because setting textarea.value
  // and/or calling textarea.select() can have anomalously bad performance:
  // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
  var textareaSelectionTimeout;
  root.selectionChanged = function() {
    if (textareaSelectionTimeout === undefined) {
      textareaSelectionTimeout = setTimeout(setTextareaSelection);
    }
    forceIERedraw(container[0]);
  };
  function setTextareaSelection() {
    textareaSelectionTimeout = undefined;
    var latex = '';
    if (cursor.selection) {
      latex = cursor.selection.fold('', function(latex, el) {
        return latex + el.latex();
      });
      latex = '$' + latex + '$';
    }
    selectFn(latex);
  }
  container.bind('copy', setTextareaSelection);
}

function staticMathTextareaEvents(container, root) {
  var cursor = root.cursor, textarea = root.textarea,
    textareaSpan = root.textareaSpan;

  container.prepend('<span class="selectable">$'+root.controller.exportLatex()+'$</span>');
  root.blurred = true;
  textarea.bind('cut paste', false)
  .focus(function() { root.blurred = false; }).blur(function() {
    if (cursor.selection) cursor.selection.clear();
    setTimeout(detach); //detaching during blur explodes in WebKit
  });
  function detach() {
    textareaSpan.detach();
    root.blurred = true;
  }
}

function editablesTextareaEvents(container, root) {
  var cursor = root.cursor, textarea = root.textarea,
    textareaSpan = root.textareaSpan;

  var textareaManager = manageTextarea(textarea, {
    container: container,
    key: function(key, evt) {
      cursor.parent.keystroke(key, evt, cursor);
    },
    text: function(ch) {
      cursor.parent.write(cursor, ch, cursor.prepareWrite());
    },
    cut: function(e) {
      if (cursor.selection) {
        setTimeout(function() {
          cursor.prepareEdit();
          cursor.parent.bubble('redraw');
        });
      }

      e.stopPropagation();
    },
    paste: function(text) {
      // FIXME HACK the parser in RootTextBlock needs to be moved to
      // Cursor::writeLatex or something so this'll work with
      // MathQuill textboxes
      if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      }
      else {
        text = '\\text{' + text + '}';
      }

      cursor.writeLatex(text).show();
    }
  });

  container.prepend(textareaSpan);

  textarea.focus(function(e) {
    root.blurred = false;
    if (!cursor.parent)
      cursor.insAtRightEnd(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //re-select textarea contents after tabbing away and back
    }
    else
      cursor.show();
  }).blur(function(e) {
    root.blurred = true;
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
  }).blur();

  return textareaManager;
}

var RootMathBlock = P(MathBlock, function(_, _super) {
});

var RootMathCommand = P(MathCommand, function(_, _super) {
  _.init = function(cursor) {
    _super.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = '<span class="mathquill-rendered-math">&0</span>';
  _.createBlocks = function() {
    this.ends[L] =
    this.ends[R] =
      RootMathBlock();

    this.blocks = [ this.ends[L] ];

    this.ends[L].parent = this;

    this.ends[L].cursor = this.cursor;
    this.ends[L].write = function(cursor, ch, replacedFragment) {
      if (ch !== '$')
        MathBlock.prototype.write.call(this, cursor, ch, replacedFragment);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent).backspace().show();
        VanillaSymbol('\\$','$').createLeftOf(cursor);
      }
      else if (!cursor[R])
        cursor.insRightOf(this.parent);
      else if (!cursor[L])
        cursor.insLeftOf(this.parent);
      else
        MathBlock.prototype.write.call(this, cursor, ch, replacedFragment);
    };
  };
  _.latex = function() {
    return '$' + this.ends[L].latex() + '$';
  };
});

var RootTextBlock = P(MathBlock, function(_, _super) {
  _.keystroke = function(key) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return _super.keystroke.apply(this, arguments);
  };
  _.write = function(cursor, ch, replacedFragment) {
    if (replacedFragment) replacedFragment.remove();
    if (ch === '$')
      RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  };
});
