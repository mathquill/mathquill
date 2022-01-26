/*********************************************
 * Controller for a MathQuill instance
 ********************************************/
class ControllerBase {
  id: number;
  data: ControllerData;
  root: ControllerRoot;
  container: $;
  options: CursorOptions;
  aria: Aria;
  ariaLabel: string;
  ariaPostLabel: string;
  cursor: Cursor;
  editable: boolean | undefined;
  _ariaAlertTimeout: number;
  KIND_OF_MQ: KIND_OF_MQ;
  textarea: $ | undefined;
  textareaSpan: $ | undefined;
  mathspeakSpan: $ | undefined;

  constructor(root: ControllerRoot, container: $, options: CursorOptions) {
    this.id = root.id;
    this.data = {};

    this.root = root;
    this.container = container;
    this.options = options;

    this.aria = new Aria(this.getControllerSelf());
    this.ariaLabel = 'Math Input';
    this.ariaPostLabel = '';

    root.controller = this.getControllerSelf();

    this.cursor = root.cursor = new Cursor(
      root,
      options,
      this.getControllerSelf()
    );
    // TODO: stop depending on root.cursor, and rm it
  }

  getControllerSelf() {
    // dance we have to do to tell this thing it's a full controller
    return this as any as Controller;
  }

  handle(name: HandlerName, dir?: Direction) {
    var handlers = this.options.handlers;
    if (handlers && handlers.fns[name]) {
      var mq = new handlers.APIClasses[this.KIND_OF_MQ](this);
      if (dir === L || dir === R) handlers.fns[name](dir, mq);
      else handlers.fns[name](mq);
    }
  }

  static notifyees: ((cursor: Cursor, e: ControllerEvent) => void)[] = [];
  static onNotify(f: (cursor: Cursor, e: ControllerEvent) => void) {
    ControllerBase.notifyees.push(f);
  }
  notify(e: ControllerEvent) {
    for (var i = 0; i < ControllerBase.notifyees.length; i += 1) {
      ControllerBase.notifyees[i](this.cursor, e);
    }
    return this;
  }
  setAriaLabel(ariaLabel: string) {
    var oldAriaLabel = this.getAriaLabel();
    if (ariaLabel && typeof ariaLabel === 'string' && ariaLabel !== '') {
      this.ariaLabel = ariaLabel;
    } else if (this.editable) {
      this.ariaLabel = 'Math Input';
    } else {
      this.ariaLabel = '';
    }
    // If this field doesn't have focus, update its computed mathspeak value.
    // We check for focus because updating the aria-label attribute of a focused element will cause most screen readers to announce the new value (in our case, label along with the expression's mathspeak).
    // If the field does have focus at the time, it will be updated once a blur event occurs.
    // Unless we stop using fake text inputs and emulating screen reader behavior, this is going to remain a problem.
    if (this.ariaLabel !== oldAriaLabel && !this.containerHasFocus()) {
      this.updateMathspeak();
    }
    return this;
  }
  getAriaLabel() {
    if (this.ariaLabel !== 'Math Input') {
      return this.ariaLabel;
    } else if (this.editable) {
      return 'Math Input';
    } else {
      return '';
    }
  }
  setAriaPostLabel(ariaPostLabel: string, timeout: number) {
    if (
      ariaPostLabel &&
      typeof ariaPostLabel === 'string' &&
      ariaPostLabel !== ''
    ) {
      if (ariaPostLabel !== this.ariaPostLabel && typeof timeout === 'number') {
        if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
        this._ariaAlertTimeout = setTimeout(() => {
          if (this.containerHasFocus()) {
            // Voice the new label, but do not update content mathspeak to prevent double-speech.
            this.aria.alert(
              this.root.mathspeak().trim() + ' ' + ariaPostLabel.trim()
            );
          } else {
            // This mathquill does not have focus, so update its mathspeak.
            this.updateMathspeak();
          }
        }, timeout);
      }
      this.ariaPostLabel = ariaPostLabel;
    } else {
      if (this._ariaAlertTimeout) clearTimeout(this._ariaAlertTimeout);
      this.ariaPostLabel = '';
    }
    return this;
  }
  getAriaPostLabel() {
    return this.ariaPostLabel || '';
  }
  containerHasFocus() {
    return (
      document.activeElement &&
      this.container &&
      this.container[0] &&
      this.container[0].contains(document.activeElement)
    );
  }

  getTextareaOrThrow() {
    var textarea = this.textarea;
    if (!textarea) throw new Error('expected a textarea');
    return textarea;
  }

  getTextareaSpanOrThrow() {
    var textareaSpan = this.textareaSpan;
    if (!textareaSpan) throw new Error('expected a textareaSpan');
    return textareaSpan;
  }

  // based on http://www.gh-mathspeak.com/examples/quick-tutorial/
  // and http://www.gh-mathspeak.com/examples/grammar-rules/
  exportMathSpeak() {
    return this.root.mathspeak();
  }

  // overridden
  updateMathspeak() {}
  scrollHoriz() {}
  selectionChanged() {}
  setOverflowClasses() {}
}
