/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/

Controller.open(function(_) {
  _.createTextarea = function() {
    // TODO: everywhere else stop depending on root.textareaSpan, and rm it
    var textareaSpan = this.textareaSpan = this.root.textareaSpan =
        $('<span class="textarea"><textarea></textarea></span>'),
      textarea = this.textarea = textareaSpan.children();

    //prevent native selection except in textarea
    this.container.bind('selectstart.mathquill', function(e) {
      var tagName = e.target.tagName;
      if (!(tagName && tagName.toLowerCase() === 'textarea')) return false;
    });

    var ctrlr = this;
    ctrlr.cursor.selectionChanged = function() { ctrlr.selectionChanged(); };
    ctrlr.container.bind('copy', function() { ctrlr.setTextareaSelection(); });
  };
  _.selectionChanged = function() {
    var ctrlr = this;
    forceIERedraw(ctrlr.container[0]);

    // throttle calls to setTextareaSelection(), because setting textarea.value
    // and/or calling textarea.select() can have anomalously bad performance:
    // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
    if (ctrlr.textareaSelectionTimeout === undefined) {
      ctrlr.textareaSelectionTimeout = setTimeout(function() {
        ctrlr.setTextareaSelection();
      });
    }
  };
  _.setTextareaSelection = function() {
    this.textareaSelectionTimeout = undefined;
    var latex = '';
    if (this.cursor.selection) {
      latex = '$' + this.cursor.selection.join('latex') + '$';
    }
    this.selectFn(latex);
  };
  _.staticMathTextareaEvents = function() {
    var ctrlr = this, root = ctrlr.root, cursor = ctrlr.cursor,
      textarea = ctrlr.textarea, textareaSpan = ctrlr.textareaSpan;

    this.container.prepend('<span class="selectable">$'+ctrlr.exportLatex()+'$</span>');
    ctrlr.blurred = true;
    textarea.bind('cut paste', false)
    .focus(function() { ctrlr.blurred = false; }).blur(function() {
      if (cursor.selection) cursor.selection.clear();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      textareaSpan.detach();
      ctrlr.blurred = true;
    }

    ctrlr.selectFn = function(text) {
      textarea.val(text);
      if (text) textarea.select();
    };
  };
  _.editablesTextareaEvents = function() {
    var ctrlr = this, root = ctrlr.root, cursor = ctrlr.cursor,
      textarea = ctrlr.textarea, textareaSpan = ctrlr.textareaSpan;

    var keyboardEventsShim = saneKeyboardEvents(textarea, this);
    this.selectFn = function(text) { keyboardEventsShim.select(text); };

    this.container.prepend(textareaSpan)
    .on('cut', function(e) {
      if (cursor.selection) {
        setTimeout(function() {
          ctrlr.notify('edit'); // deletes selection if present
          cursor.parent.bubble('edited');
        });
      }
    });

    this.focusBlurEvents();
  };
  var disabledChars = '';
  MathQuill.disableCharsWithoutOperand = function(c) { disabledChars += c; };
  _.typedText = function(ch) {
    if (!this.cursor[L] && disabledChars.indexOf(ch) > -1) return;
    if (ch === '\n') {
      if (this.root.handlers.enter) this.root.handlers.enter(this.API);
      return;
    }
    var cursor = this.notify().cursor;
    cursor.parent.write(cursor, ch, cursor.show().replaceSelection());
    this.scrollHoriz();
  };
  _.paste = function(text) {
    // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
    if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
      text = text.slice(1, -1);
    }
    else {
      text = '\\text{' + text + '}';
    }

    this.writeLatex(text).cursor.show();
  };
});
