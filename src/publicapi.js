/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
jQuery.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'focus':
  case 'blur':
    return this.children('.mathquill-root-block').each(function() {
      Node.byId[$(this).attr(mqBlockId)].textareaSpan.children().trigger(cmd);
    }).end();
  case 'redraw':
    return this.children('.mathquill-root-block').each(function() {
      (function postOrderRedraw(el) {
        el.eachChild(postOrderRedraw);
        if (el.redraw) el.redraw();
      }(Node.byId[$(this).attr(mqBlockId)]));
    }).end();
  case 'revert':
    return this.children('.mathquill-root-block').each(function() {
      Node.byId[$(this).attr(mqBlockId)].revert();
    }).end();
  case 'latex':
    if (arguments.length > 1) {
      return this.children('.mathquill-root-block').each(function() {
        var controller = Node.byId[$(this).attr(mqBlockId)].controller;
        if (controller.textbox) controller.renderLatexText(latex);
        else controller.renderLatexMath(latex);
        if (controller.blurred) controller.cursor.hide().parent.blur();
      }).end();
    }

    var blockId = this.children('.mathquill-root-block').attr(mqBlockId);
    return blockId && Node.byId[blockId].controller.exportLatex();
  case 'text':
    var blockId = this.children('.mathquill-root-block').attr(mqBlockId);
    return blockId && Node.byId[blockId].controller.exportText();
  case 'html':
    return this.children(':last').html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.children('.mathquill-root-block').each(function() {
        var controller = Node.byId[$(this).attr(mqBlockId)].controller;
        controller.cursor.writeLatex(latex)
        if (controller.blurred) controller.cursor.hide().parent.blur();
      }).end();
  case 'cmd':
    if (arguments.length > 1)
      return this.children('.mathquill-root-block').each(function() {
        var controller = Node.byId[$(this).attr(mqBlockId)].controller,
          cursor = controller.cursor, seln = cursor.prepareWrite();
        if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
        else cursor.parent.write(latex, seln);
        if (controller.blurred) cursor.hide().parent.blur();
      }).end();
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : MathBlock;
    return this.each(function() {
      var container = $(this), root = RootBlock();

      if (!textbox) {
        container.addClass('mathquill-rendered-math');
      }

      var contents = container.contents().detach();
      root.revert = function() {
        container.empty().unbind('.mathquill')
          .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
          .append(contents);
      };

      root.jQ = $('<span class="mathquill-root-block"/>').attr(mqBlockId, root.id)
      .appendTo(container);

      var ctlr = root.controller = Controller(root);
      root.cursor = ctlr.cursor; // TODO: stop depending on root.cursor, and rm it

      if (textbox) ctlr.renderLatexText(contents.text());
      else ctlr.renderLatexMath(contents.text());

      ctlr.textbox = textbox;
      ctlr.editable = editable;
      mouseEvents(root.jQ);
      ctlr.createTextarea(container);
      if (editable) {
        container.addClass('mathquill-editable');
        if (textbox) container.addClass('mathquill-textbox');
        var keyboardEventsShim = ctlr.editablesTextareaEvents(container);
        ctlr.setRootSelectionChangedFn(container, function(text) {
          keyboardEventsShim.select(text);
        });
      }
      else {
        ctlr.staticMathTextareaEvents(container);
        ctlr.setRootSelectionChangedFn(container, function(text) {
          ctlr.textarea.val(text);
          if (text) ctlr.textarea.select();
        });
      }
    });
  }
};


//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
jQuery(function() {
  jQuery('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
  jQuery('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
  jQuery('.mathquill-embedded-latex').mathquill();
});

