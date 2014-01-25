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
      Node.byId[$(this).attr(mqBlockId)].textarea.children().trigger(cmd);
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
        if (!block.textarea.focused) block.cursor.hide().parent.blur();
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
        if (!block.textarea.focused) block.cursor.hide().parent.blur();
      }).end();
  case 'cmd':
    if (arguments.length > 1)
      return this.children('.mathquill-root-block').each(function() {
        var block = Node.byId[$(this).attr(mqBlockId)], cursor = block.cursor;
        var seln = cursor.prepareWrite();
        if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
        else cursor.parent.write(latex, seln);
        if (!block.textarea.focused) cursor.hide().parent.blur();
      }).end();
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
    return this.each(function() {
      var container = $(this), root = RootBlock();
      createRoot(container, root, textbox, editable);
      var cursor = root.cursor;
      var textarea = setupTextarea(editable, container, root, cursor);
      mouseEvents(editable, container, root, cursor, textarea, root.textarea);
      if (!editable) return;
      rootCSSClasses(container, textbox);
      focusBlurEvents(root, cursor, textarea);
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

