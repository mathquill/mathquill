/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
$.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    return this.each(function() {
      var blockId = $(this).attr(mqBlockId),
        rootBlock = blockId && Node.byId[blockId];
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
        block = blockId && Node.byId[blockId];
      if (block && block.revert)
        block.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && Node.byId[blockId];
        if (block)
          block.renderLatex(latex);
      });
    }

    var blockId = $(this).attr(mqBlockId),
      block = blockId && Node.byId[blockId];
    return block && block.latex();
  case 'text':
    var blockId = $(this).attr(mqBlockId),
      block = blockId && Node.byId[blockId];
    return block && block.text();
  case 'html':
    return this.html().replace(/ ?hasCursor|hasCursor /, '')
      .replace(/ class=(""|(?= |>))/g, '')
      .replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && Node.byId[blockId],
          cursor = block && block.cursor;

        if (cursor)
          cursor.writeLatex(latex).parent.blur();
      });
  case 'cmd':
    if (arguments.length > 1)
      return this.each(function() {
        var blockId = $(this).attr(mqBlockId),
          block = blockId && Node.byId[blockId],
          cursor = block && block.cursor;

        if (cursor) {
          var seln = cursor.prepareWrite();
          if (/^\\[a-z]+$/i.test(latex)) cursor.insertCmd(latex.slice(1), seln);
          else cursor.insertCh(latex, seln);
          cursor.hide().parent.blur();
        }
      });
  default:
    var RootClass;
    if (cmd === 'textbox') RootClass = RootTextBlock;
    else if (cmd === 'eqnarray') RootClass = RootEqnArray;
    else RootClass = RootMathBlock;

    var textbox = cmd === 'textbox';
    var eqnarray = cmd === 'eqnarray';
    var editable = textbox || cmd === 'editable';

    return this.each(function() {
      createRoot($(this), RootClass(), textbox, editable);

      // [Jay]
      // XXX THIS SHIT IS HACKTASTICK XXX
      // Eqnarray b0rks when clicking or selecting.
      //
      // better things to do with this:
      // a) implement navigation/selection in eqnarray
      // b) make createRoot less monolithic, so we can override
      //    things such that these don't get bound, instead of
      //    unbinding them here.
      //
      // This line should be deleted when either a) or b) is
      // accomplished.
      if (cmd === 'eqnarray') $(this).unbind('.mathquill');
    });
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function() {
  $('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
  $('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
  $('.mathquill-eqnarray:not(.mathquill-rendered-math)').mathquill('eqnarray');
  $('.mathquill-embedded-latex').mathquill();
});

