/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/
Options.prototype.substituteTextarea = function () {
  return h('textarea', {
    autocapitalize: 'off',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: false,
    'x-palm-disable-ste-all': true,
  });
};
function defaultSubstituteKeyboardEvents(jq: $, controller: Controller) {
  return saneKeyboardEvents(jq[0] as HTMLTextAreaElement, controller);
}
Options.prototype.substituteKeyboardEvents = defaultSubstituteKeyboardEvents;

type TextareaKeyboardEvents =
  | 'keydown'
  | 'keypress'
  | 'keyup'
  | 'input'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'focusout';

type TextareaKeyboardEventListeners = Partial<{
  [K in TextareaKeyboardEvents]: (event: HTMLElementEventMap[K]) => any;
}>;

class Controller extends Controller_scrollHoriz {
  keyboardEventListeners: TextareaKeyboardEventListeners = {};

  selectFn: (text: string) => void;

  createTextarea() {
    var textareaSpan = (this.textareaSpan = $(
        h('span', { class: 'mq-textarea' })
      )),
      textarea = this.options.substituteTextarea();
    if (!textarea.nodeType) {
      throw 'substituteTextarea() must return a DOM element, got ' + textarea;
    }
    this.textarea = jQToDOMFragment($(textarea))
      .appendTo(jQToDOMFragment(textareaSpan).oneElement())
      .toJQ();

    var ctrlr = this;
    ctrlr.cursor.selectionChanged = function () {
      ctrlr.selectionChanged();
    };
  }

  /** Add the given event listeners on this.textarea, replacing the existing listener for that event if it exists. */
  addTextareaEventListeners(listeners: TextareaKeyboardEventListeners) {
    if (!this.textarea) return;
    const textarea = jQToDOMFragment(this.textarea).oneElement();
    for (const key in listeners) {
      const event = key as keyof typeof listeners;
      this.removeTextareaEventListener(event);
      textarea.addEventListener(event, listeners[event] as EventListener);
    }
  }

  private removeTextareaEventListener(event: TextareaKeyboardEvents) {
    if (!this.textarea) return;
    const textarea = jQToDOMFragment(this.textarea).oneElement();
    const listener = this.keyboardEventListeners[event];
    if (!listener) return;
    textarea.removeEventListener(event, listener as EventListener);
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

    this.mathspeakSpan = $(h('span', { class: 'mq-mathspeak' }));
    domFrag(this.container).prepend(jQToDOMFragment(this.mathspeakSpan));
    ctrlr.blurred = true;
    this.removeTextareaEventListener('cut');
    this.removeTextareaEventListener('paste');
    if (ctrlr.options.disableCopyPaste) {
      this.removeTextareaEventListener('copy');
    } else {
      this.addTextareaEventListeners({
        copy: function () {
          ctrlr.setTextareaSelection();
        },
      });
    }
    // TODO: It seems like it's a problem to never unbind these in the case where we take an editable
    // mathquill, make it static, and then make it editable again.  But I don't think we're unbinding them
    // on main -- need to confirm this.
    textarea[0].addEventListener('focus', function () {
      ctrlr.blurred = false;
    });
    textarea[0].addEventListener('blur', function () {
      if (cursor.selection) cursor.selection.clear();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      jQToDOMFragment(textareaSpan).detach();
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

    if (this.options.version === 1) {
      var keyboardEventsShim = this.options.substituteKeyboardEvents(
        textarea,
        this
      );
      this.selectFn = function (text: string) {
        keyboardEventsShim.select(text);
      };
    } else {
      const { select } = saneKeyboardEvents(
        jQToDOMFragment(textarea).oneElement() as HTMLTextAreaElement,
        this
      );
      this.selectFn = select;
    }

    domFrag(this.container).prepend(jQToDOMFragment(textareaSpan));
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
    jQToDOMFragment(textareaSpan).remove();

    this.unbindFocusBlurEvents();

    ctrlr.blurred = true;
    this.removeTextareaEventListener('cut');
    this.removeTextareaEventListener('paste');
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
