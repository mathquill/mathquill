/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/
Options.prototype.substituteTextarea = function () {
  return $(
    '<textarea autocapitalize=off autocomplete=off autocorrect=off ' +
      'spellcheck=false x-palm-disable-ste-all=true/>'
  )[0];
};
Options.prototype.substituteKeyboardEvents = saneKeyboardEvents;

class Controller extends Controller_scrollHoriz {
  selectFn: (text: string) => void;

  createTextarea() {
    var textareaSpan = (this.textareaSpan = $(
        '<span class="mq-textarea"></span>'
      )),
      textarea = this.options.substituteTextarea();
    if (!textarea.nodeType) {
      throw 'substituteTextarea() must return a DOM element, got ' + textarea;
    }
    this.textarea = $(textarea).appendTo(textareaSpan);
    this.aria.setContainer(this.textareaSpan);

    var ctrlr = this;
    ctrlr.cursor.selectionChanged = function () {
      ctrlr.selectionChanged();
    };
  }
  selectionChanged() {
    var ctrlr = this;

    // throttle calls to setTextareaSelection(), because setting textarea.value
    // and/or calling textarea.select() can have anomalously bad performance:
    // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
    //
    // Note, this timeout may be cleared by the blur handler in focusBlur.js
    if (!ctrlr.textareaSelectionTimeout) {
      ctrlr.textareaSelectionTimeout = setTimeout(function () {
        ctrlr.setTextareaSelection();
      });
    }
  }
  setTextareaSelection() {
    this.textareaSelectionTimeout = 0;
    var latex = '';
    if (this.cursor.selection) {
      //cleanLatex prunes unnecessary spaces. defined in latex.js
      latex = this.cleanLatex(this.cursor.selection.join('latex'));
      if (this.options.statelessClipboard) {
        // FIXME: like paste, only this works for math fields; should ask parent
        latex = '$' + latex + '$';
      }
    }
    this.selectFn(latex);
  }
  staticMathTextareaEvents() {
    var ctrlr = this;
    var cursor = ctrlr.cursor;
    const textarea = ctrlr.getTextareaOrThrow();
    const textareaSpan = ctrlr.getTextareaSpanOrThrow();

    this.container.prepend(
      jQuery('<span aria-hidden="true" class="mq-selectable">').text(
        '$' + ctrlr.exportLatex() + '$'
      )
    );
    this.mathspeakSpan = $('<span class="mq-mathspeak"></span>');
    this.container.prepend(this.mathspeakSpan);
    ctrlr.blurred = true;
    textarea.bind('cut paste', false);
    if (ctrlr.options.disableCopyPaste) {
      textarea.bind('copy', false);
    } else {
      textarea.bind('copy', function () {
        ctrlr.setTextareaSelection();
      });
    }
    textarea
      .focus(function () {
        ctrlr.blurred = false;
      })
      .blur(function () {
        if (cursor.selection) cursor.selection.clear();
        setTimeout(detach); //detaching during blur explodes in WebKit
      });
    function detach() {
      textareaSpan.detach();
      ctrlr.blurred = true;
    }

    ctrlr.selectFn = function (text: string) {
      textarea.val(text);
      if (text) textarea.select();
    };
    this.updateMathspeak();
  }
  editablesTextareaEvents() {
    var ctrlr = this;
    const textarea = ctrlr.getTextareaOrThrow();
    const textareaSpan = ctrlr.getTextareaSpanOrThrow();

    var keyboardEventsShim = this.options.substituteKeyboardEvents(
      textarea,
      this
    );
    this.selectFn = function (text: string) {
      keyboardEventsShim.select(text);
    };
    this.container.prepend(textareaSpan);
    this.focusBlurEvents();
    this.updateMathspeak();
  }
  unbindEditablesEvents() {
    var ctrlr = this;
    const textarea = ctrlr.getTextareaOrThrow();
    const textareaSpan = ctrlr.getTextareaSpanOrThrow();

    this.selectFn = function (text: string) {
      textarea.val(text);
      if (text) textarea.select();
    };
    textareaSpan.remove();

    this.unbindFocusBlurEvents();

    ctrlr.blurred = true;
    textarea.bind('cut paste', false);
  }
  typedText(ch: string) {
    if (ch === '\n') return this.handle('enter');
    var cursor = this.notify(undefined).cursor;
    cursor.parent.write(cursor, ch);
    this.scrollHoriz();
  }
  cut() {
    var ctrlr = this,
      cursor = ctrlr.cursor;
    if (cursor.selection) {
      setTimeout(function () {
        ctrlr.notify('edit'); // deletes selection if present
        cursor.parent.bubble(function (node) {
          (node as MQNode).reflow();
          return undefined;
        });
        if (ctrlr.options && ctrlr.options.onCut) {
          ctrlr.options.onCut();
        }
      });
    }
  }
  copy() {
    this.setTextareaSelection();
  }
  paste(text: string) {
    // TODO: document `statelessClipboard` config option in README, after
    // making it work like it should, that is, in both text and math mode
    // (currently only works in math fields, so worse than pointless, it
    //  only gets in the way by \text{}-ifying pasted stuff and $-ifying
    //  cut/copied LaTeX)
    if (this.options.statelessClipboard) {
      if (text.slice(0, 1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      } else {
        text = '\\text{' + text + '}';
      }
    }
    // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
    this.writeLatex(text).cursor.show();
    this.scrollHoriz();
    if (this.options && this.options.onPaste) {
      this.options.onPaste();
    }
  }
  updateMathspeak() {
    var ctrlr = this;
    // If the controller's ARIA label doesn't end with a punctuation mark, add a colon by default to better separate it from mathspeak.
    var ariaLabel = ctrlr.getAriaLabel();
    var labelWithSuffix = /[A-Za-z0-9]$/.test(ariaLabel)
      ? ariaLabel + ':'
      : ariaLabel;
    var mathspeak = ctrlr.root.mathspeak().trim();
    this.aria.clear();

    const textarea = ctrlr.getTextareaOrThrow();
    // For static math, provide mathspeak in a visually hidden span to allow screen readers and other AT to traverse the content.
    // For editable math, assign the mathspeak to the textarea's ARIA label (AT can use text navigation to interrogate the content).
    // Be certain to include the mathspeak for only one of these, though, as we don't want to include outdated labels if a field's editable state changes.
    // By design, also take careful note that the ariaPostLabel is meant to exist only for editable math (e.g. to serve as an evaluation or error message)
    // so it is not included for static math mathspeak calculations.
    // The mathspeakSpan should exist only for static math, so we use its presence to decide which approach to take.
    if (!!ctrlr.mathspeakSpan) {
      textarea.attr('aria-label', '');
      ctrlr.mathspeakSpan.text((labelWithSuffix + ' ' + mathspeak).trim());
    } else {
      textarea.attr(
        'aria-label',
        (labelWithSuffix + ' ' + mathspeak + ' ' + ctrlr.ariaPostLabel).trim()
      );
    }
  }
}
