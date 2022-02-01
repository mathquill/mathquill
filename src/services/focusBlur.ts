ControllerBase.onNotify(function (cursor, e) {
  // these try to cover all ways that mathquill can be modified
  if (e === 'edit' || e === 'replace' || e === undefined) {
    var controller = cursor.controller;
    if (!controller) return;
    if (!controller.options.enableDigitGrouping) return;

    // TODO - maybe reconsider these 3 states and drop down to only 2
    //
    // blurred === false means we are focused. blurred === true or
    // blurred === undefined means we are not focused.
    if (controller.blurred !== false) return;

    controller.disableGroupingForSeconds(1);
  }
});

class Controller_focusBlur extends Controller_exportText {
  blurred: boolean;
  __disableGroupingTimeout: number;
  textareaSelectionTimeout: number;

  disableGroupingForSeconds(seconds: number) {
    clearTimeout(this.__disableGroupingTimeout);
    if (seconds === 0) {
      this.root.domFrag().removeClass('mq-suppress-grouping');
    } else {
      this.root.domFrag().addClass('mq-suppress-grouping');
      this.__disableGroupingTimeout = setTimeout(() => {
        this.root.domFrag().removeClass('mq-suppress-grouping');
      }, seconds * 1000);
    }
  }

  private blurTimeout: number;
  private handleTextareaFocus = () => {
    const cursor = this.cursor;
    this.updateMathspeak();
    this.blurred = false;
    clearTimeout(this.blurTimeout);
    this.container.addClass('mq-focused');
    if (!cursor.parent) cursor.insAtRightEnd(this.root);
    if (cursor.selection) {
      cursor.selection.domFrag().removeClass('mq-blur');
      this.selectionChanged(); //re-select textarea contents after tabbing away and back
    } else {
      cursor.show();
    }
    this.setOverflowClasses();
  };
  private handleTextareaBlur = () => {
    if (this.textareaSelectionTimeout) {
      clearTimeout(this.textareaSelectionTimeout);
      this.textareaSelectionTimeout = 0;
    }
    this.disableGroupingForSeconds(0);
    this.blurred = true;
    this.blurTimeout = setTimeout(() => {
      // wait for blur on window; if
      this.root.postOrder(function (node) {
        node.intentionalBlur();
      }); // none, intentional blur: #264
      this.cursor.clearSelection().endSelection();
      this.blur();
      this.updateMathspeak();
      this.scrollHoriz();
    });
    $(window).bind('blur', this.handleWindowBlur);
  };

  private handleWindowBlur = () => {
    // blur event also fired on window, just switching
    clearTimeout(this.blurTimeout); // tabs/windows, not intentional blur
    if (this.cursor.selection)
      this.cursor.selection.domFrag().addClass('mq-blur');
    this.blur();
    this.updateMathspeak();
  };

  private blur() {
    // not directly in the textarea blur handler so as to be
    this.cursor.hide().parent.blur(this.cursor); // synchronous with/in the same frame as
    this.container.removeClass('mq-focused'); // clearing/blurring selection
    $(window).unbind('blur', this.handleWindowBlur);

    if (this.options && this.options.resetCursorOnBlur) {
      this.cursor.resetToEnd(this);
    }
  }

  focusBlurEvents() {
    var ctrlr = this,
      cursor = ctrlr.cursor;
    const textarea = ctrlr.getTextareaOrThrow();
    textarea.focus(this.handleTextareaFocus).blur(this.handleTextareaBlur);
    ctrlr.blurred = true;
    cursor.hide().parent.blur(cursor);
  }
  unbindFocusBlurEvents() {
    var textarea = this.getTextareaOrThrow();
    textarea.unbind('focus blur');
  }
}

/**
 * TODO: I wanted to move MathBlock::focus and blur here, it would clean
 * up lots of stuff like, TextBlock::focus is set to MathBlock::focus
 * and TextBlock::blur calls MathBlock::blur, when instead they could
 * use inheritance and super_.
 *
 * Problem is, there's lots of calls to .focus()/.blur() on nodes
 * outside Controller::focusBlurEvents(), such as .postOrder('blur') on
 * insertion, which if MathBlock::blur becomes MQNode::blur, would add the
 * 'blur' CSS class to all MQSymbol's (because .isEmpty() is true for all
 * of them).
 *
 * I'm not even sure there aren't other troublesome calls to .focus() or
 * .blur(), so this is TODO for now.
 */
