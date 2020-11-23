/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/

Controller.open(function(_) {
  Options.p.substituteTextarea = function() {
    return $('<textarea autocapitalize=off autocomplete=off autocorrect=off ' +
               'spellcheck=false x-palm-disable-ste-all=true/>')[0];
  };
  _.createTextarea = function() {
    var textareaSpan = this.textareaSpan = $('<span class="mq-textarea"></span>'),
      textarea = this.options.substituteTextarea();
    if (!textarea.nodeType) {
      throw 'substituteTextarea() must return a DOM element, got ' + textarea;
    }
    textarea = this.textarea = $(textarea).appendTo(textareaSpan);

    var ctrlr = this;
    ctrlr.cursor.selectionChanged = function() { ctrlr.selectionChanged(); };
  };
  _.selectionChanged = function() {
    var ctrlr = this;

    // throttle calls to setTextareaSelection(), because setting textarea.value
    // and/or calling textarea.select() can have anomalously bad performance:
    // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
    //
    // Note, this timeout may be cleared by the blur handler in focusBlur.js
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
      //cleanLatex prunes unnecessary spaces. defined in latex.js
      latex = this.cleanLatex(this.cursor.selection.join('latex'));
      if (this.options.statelessClipboard) {
        // FIXME: like paste, only this works for math fields; should ask parent
        latex = '$' + latex + '$';
      }
    }
    this.selectFn(latex);
  };
  _.staticMathTextareaEvents = function() {
    var ctrlr = this, root = ctrlr.root, cursor = ctrlr.cursor,
      textarea = ctrlr.textarea, textareaSpan = ctrlr.textareaSpan;

    this.container.prepend('<span aria-hidden="true" class="mq-selectable">$'+ctrlr.exportLatex()+'$</span>');
    ctrlr.blurred = true;
    textarea.bind('cut paste', false);
    if (ctrlr.options.disableCopyPaste) {
      textarea.bind('copy', false);
    } else {
      textarea.bind('copy', function() { ctrlr.setTextareaSelection(); })
    }
    textarea.focus(function() { ctrlr.blurred = false; }).blur(function() {
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
    var ariaLabel = ctrlr && ctrlr.ariaLabel !== 'Math Input' ? ctrlr.ariaLabel + ': ' : '';
    ctrlr.container.attr('aria-label', ariaLabel + root.mathspeak().trim());

    // This is gross, but necessary.
    // On Windows, ChromeOS, Android, and iOS, supplying role="math" allows users of
    // JAWS, NVDA, ChromeVox, Talkback, and VoiceOver to read the mathspeak version of an equation
    // which we supply as the container's aria-label attribute.
    // Omitting role="math" makes the container invisible to JAWS and iOS VoiceOver.
    // At time of writing (8/20/2019), the exact opposite is true of the Mac--
    // Supplying role="math" makes the content of the container invisible to VoiceOver there,
    // and omitting it makes the material available to Mac users.
    // For now, the solution is to render role="math" unless the user is on Mac.
    // Bug report: https://feedbackassistant.apple.com/feedback/7076111
    // Update: As of 11/23/2020, this problem becomes slightly more complicated now that iOS 13+ on iPads masquerades as a Mac.
    // The same work-around applies, but now we must detect a spoofed Mac.
    // Technique based on https://stackoverflow.com/questions/57765958/how-to-detect-ipad-and-ipad-os-version-in-ios-13-and-up

    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var isIOS = (/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !window.Stream;
    var isMac = navigator.appVersion.indexOf("Mac") !== -1 && !isIOS;
    if (!isMac)
      ctrlr.container.attr('role', 'math');
  };
  Options.p.substituteKeyboardEvents = saneKeyboardEvents;
  _.editablesTextareaEvents = function() {
    var ctrlr = this, textarea = ctrlr.textarea, textareaSpan = ctrlr.textareaSpan;

    var keyboardEventsShim = this.options.substituteKeyboardEvents(textarea, this);
    this.selectFn = function(text) { keyboardEventsShim.select(text); };
    this.container.prepend(textareaSpan);
    this.focusBlurEvents();
  };
  _.typedText = function(ch) {
    if (ch === '\n') return this.handle('enter');
    var cursor = this.notify().cursor;
    cursor.parent.write(cursor, ch);
    this.scrollHoriz();
  };
  _.cut = function() {
    var ctrlr = this, cursor = ctrlr.cursor;
    if (cursor.selection) {
      setTimeout(function() {
        ctrlr.notify('edit'); // deletes selection if present
        cursor.parent.bubble(function (node) { node.reflow(); });
        if (ctrlr.options && ctrlr.options.onCut) {
          ctrlr.options.onCut();
        }
      });
    }
  };
  _.copy = function() {
    this.setTextareaSelection();
  };
  _.paste = function(text) {
    // TODO: document `statelessClipboard` config option in README, after
    // making it work like it should, that is, in both text and math mode
    // (currently only works in math fields, so worse than pointless, it
    //  only gets in the way by \text{}-ifying pasted stuff and $-ifying
    //  cut/copied LaTeX)
    if (this.options.statelessClipboard) {
      if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      }
      else {
        text = '\\text{'+text+'}';
      }
    }
    // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
    this.writeLatex(text).cursor.show();
    this.scrollHoriz();
    if (this.options && this.options.onPaste) {
      this.options.onPaste();
    }
  };
});
