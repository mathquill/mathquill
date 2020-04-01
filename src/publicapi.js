/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
jQuery.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        rootBlock = blockId && MathElement[blockId];
      if (rootBlock) {
        (function postOrderRedraw(el) {
          el.eachChild(postOrderRedraw);
          if (el.redraw) el.redraw();
        }(rootBlock));
      }
    });
  case 'revert':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        block = blockId && MathElement[blockId];
      if (block && block.revert)
        block.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId];
        if (block)
          block.renderLatex(latex);
      });
    }

    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.latex();
  case 'text':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId];
    return block && block.text();
  case 'html':
    return this.html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
  case 'writeIn':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (block.staticEquation)
          cursor = block.staticEquationCursors[0];

        if (cursor)
          cursor.writeLatex(latex).parent.blur();
        if (cmd === 'writeIn') {
          if (cursor[L] instanceof LatexCmds.nthroot) 
            cursor.moveLeftWithin(cursor[L]);
          else if (cursor[L] instanceof SupSub && cursor[L][L] instanceof EmptyNullBlock)
            for (var i=0; i<3; i++) 
              cursor.moveLeft(); // EmptyNullBlock confuses the cursor
          else
            cursor.hopLeft().moveRight();
          // this is a really complicated way of getting at the
          // textarea that drives the interactivity so we can
          // re-enable text input
          cursor.root.textarea.children()[0].focus();
        }
      });
  case 'cmd':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;

        if (cursor) {
          var seln = cursor.prepareWrite();
          if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
          else cursor.insertCh(latex, seln);
          cursor.hide().parent.blur();
        }
      });
  case 'charCount':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId],
      cursor = block && block.cursor;
    return block.charCount();
  case 'hasEmptyBlocks':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId],
      cursor = block && block.cursor;
    return block.hasEmptyBlocks();
  case 'maxNestedBlocks':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId],
      cursor = block && block.cursor;
    return block.getMaxNesting();
  case 'allowLatex':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;
        if (cursor) {
          cursor.allowLatex = latex;
          if (latex) {
            CharCmds['\\'] = LatexCommandInput;
          } else {
            CharCmds['\\'] = LatexCmds.backslash;
          }
        }
      });
  case 'mapCharCmd':
    if (arguments.length === 3)
      CharCmds[latex] = LatexCmds[arguments[2]];
    return this;
  case 'unmapCharCmd':
    if (arguments.length > 1)
      delete CharCmds[latex];
    return this;
  case 'allowSpace':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && MathElement[blockId],
          cursor = block && block.cursor;
        if (cursor)
          cursor.allowSpace = latex;
      });
  case 'isCursorInFraction':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && MathElement[blockId],
      cursor = block && block.cursor;
    var parent;
    return (typeof cursor !== "undefined" && cursor !== null ? (parent = cursor.parent) != null ? parent.parent : void 0 : void 0) instanceof LatexCmds.fraction;
  default:
    var textbox = cmd === 'textbox',
      editable = textbox || cmd === 'editable',
      RootBlock = textbox ? RootTextBlock : RootMathBlock;
    return this.each(function() {
      createRoot($(this), RootBlock(), textbox, editable);
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

