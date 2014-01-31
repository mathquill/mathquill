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
        var block = Node.byId[$(this).attr(mqBlockId)];
        block.renderLatex(latex);
        if (block.blurred) block.cursor.hide().parent.blur();
      }).end();
    }

    var blockId = this.children('.mathquill-root-block').attr(mqBlockId);
    return blockId && Node.byId[blockId].latex();
  case 'text':
    var blockId = this.children('.mathquill-root-block').attr(mqBlockId);
    return blockId && Node.byId[blockId].text();
  case 'html':
    return this.children(':last').html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.children('.mathquill-root-block').each(function() {
        var block = Node.byId[$(this).attr(mqBlockId)];
        block.cursor.writeLatex(latex)
        if (block.blurred) block.cursor.hide().parent.blur();
      }).end();
  case 'cmd':
    if (arguments.length > 1)
      return this.children('.mathquill-root-block').each(function() {
        var block = Node.byId[$(this).attr(mqBlockId)], cursor = block.cursor;
        var seln = cursor.prepareWrite();
        if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
        else cursor.parent.write(latex, seln);
        if (block.blurred) cursor.hide().parent.blur();
      }).end();
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
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

      root.renderLatex(contents.text());
      root.editable = editable;
      mouseEvents(root.jQ);
      createTextarea(container, root);
      if (editable) {
        container.addClass('mathquill-editable');
        if (textbox) container.addClass('mathquill-textbox');
        var textareaManager = editablesTextareaEvents(container, root);
        setRootSelectionChangedFn(container, root, function(text) {
          textareaManager.select(text);
        });
      }
      else {
        staticMathTextareaEvents(container, root);
        setRootSelectionChangedFn(container, root, function(text) {
          root.textarea.val(text);
          if (text) root.textarea.select();
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

