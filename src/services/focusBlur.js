Controller.open(function(_) {
  this.onNotify(function (e) {
    // these try to cover all ways that mathquill can be modified
    if (e === 'edit' || e === 'replace' || e === undefined) {
      var controller = this.controller;
      if (!controller) return;
      if (!controller.options.enableDigitGrouping) return;

      // blurred === false means we are focused. blurred === true or
      // blurred === undefined means we are not focused.
      if (controller.blurred !== false) return;

      controller.disableGroupingForSeconds(1);
    }
  });

  _.disableGroupingForSeconds = function (seconds) {
    clearTimeout(this.__disableGroupingTimeout);
    var jQ = this.root.jQ;

    if (seconds === 0) {
      jQ.removeClass('mq-suppress-grouping');
    } else {
      jQ.addClass('mq-suppress-grouping');
      this.__disableGroupingTimeout = setTimeout(function () {
        jQ.removeClass('mq-suppress-grouping');
      }, seconds * 1000);
    }
  }

  _.focusBlurEvents = function() {
    var ctrlr = this, root = ctrlr.root, cursor = ctrlr.cursor;
    var blurTimeout;
    ctrlr.textarea.focus(function() {
      updateAria();
      ctrlr.blurred = false;
      clearTimeout(blurTimeout);
      ctrlr.container.addClass('mq-focused');
      if (!cursor.parent) cursor.insAtRightEnd(root);
      if (cursor.selection) {
        cursor.selection.jQ.removeClass('mq-blur');
        ctrlr.selectionChanged(); //re-select textarea contents after tabbing away and back
      } else {
        cursor.show();
      }
      ctrlr.setOverflowClasses();

    }).blur(function() {
      if (ctrlr.textareaSelectionTimeout) {
        clearTimeout(ctrlr.textareaSelectionTimeout);
        ctrlr.textareaSelectionTimeout = undefined;
      }
      ctrlr.disableGroupingForSeconds(0);
      ctrlr.blurred = true;
      blurTimeout = setTimeout(function() { // wait for blur on window; if
        root.postOrder(function (node) { node.intentionalBlur(); }); // none, intentional blur: #264
        cursor.clearSelection().endSelection();
        blur();
        updateAria();
        ctrlr.scrollHoriz();
      });
      $(window).bind('blur', windowBlur);
    });
    function windowBlur() { // blur event also fired on window, just switching
      clearTimeout(blurTimeout); // tabs/windows, not intentional blur
      if (cursor.selection) cursor.selection.jQ.addClass('mq-blur');
      blur();
      updateAria();
    }
    function blur() { // not directly in the textarea blur handler so as to be
      cursor.hide().parent.blur(); // synchronous with/in the same frame as
      ctrlr.container.removeClass('mq-focused'); // clearing/blurring selection
      $(window).unbind('blur', windowBlur);

      if (ctrlr.options && ctrlr.options.resetCursorOnBlur) {
        cursor.resetToEnd(ctrlr);
      }
    }
    function updateAria() {
      var mqAria = (ctrlr.ariaLabel+': ' + root.mathspeak() + ' ' + ctrlr.ariaPostLabel).trim();
      aria.jQ.empty();
      ctrlr.textarea.attr('aria-label', mqAria);
      ctrlr.container.attr('aria-label', mqAria);
    }
    updateAria();
    ctrlr.blurred = true;
    cursor.hide().parent.blur();
  };
});

/**
 * TODO: I wanted to move MathBlock::focus and blur here, it would clean
 * up lots of stuff like, TextBlock::focus is set to MathBlock::focus
 * and TextBlock::blur calls MathBlock::blur, when instead they could
 * use inheritance and super_.
 *
 * Problem is, there's lots of calls to .focus()/.blur() on nodes
 * outside Controller::focusBlurEvents(), such as .postOrder('blur') on
 * insertion, which if MathBlock::blur becomes Node::blur, would add the
 * 'blur' CSS class to all Symbol's (because .isEmpty() is true for all
 * of them).
 *
 * I'm not even sure there aren't other troublesome calls to .focus() or
 * .blur(), so this is TODO for now.
 */
