/*********************************************************
 * The actual jQuery plugin and document ready handlers.
 ********************************************************/

//The publicy exposed method of jQuery.prototype, available (and meant to be
//called) on jQuery-wrapped HTML DOM elements.
$.fn.mathquill = function(cmd, latex) {
  switch (cmd) {
  case 'redraw':
    this.find(':not(:has(:first))')
      .mathquill('[[mathquill internal data]]').cmd.redraw();
    return this;
  case 'revert':
    return this.each(function() {
      var data = $(this).data('[[mathquill internal data]]');
      if (data && data.revert)
        data.revert();
    });
  case 'latex':
    if (arguments.length > 1) {
      return this.each(function() {
        var data = $(this).data('[[mathquill internal data]]');
        if (data && data.block && data.block.renderLatex)
          data.block.renderLatex(latex);
      });
    }

    var data = this.data('[[mathquill internal data]]');
    return data && data.block && data.block.latex();
  case 'html':
    return this.html().replace(/<span class="?cursor( blink)?"?><\/span>/i, '')
      .replace(/<span class="?textarea"?><textarea><\/textarea><\/span>/i, '');
  case 'write':
    latex = latex.charAt(0) === '\\' ? latex.slice(1) : latex;
    if (arguments.length > 1)
      return this.each(function() {
        var
          data = $(this).data('[[mathquill internal data]]'),
          block = data && data.block, cursor = block && block.cursor
        ;

        if (cursor) {
          cursor.show().write(latex);
          block.blur();
        }
      });
  default:
    var textbox = cmd === 'textbox', editable = textbox || cmd === 'editable';
    return this.each(function() {
      createRoot($(this), textbox, editable);
    });
  }
};

//on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
//elements according to their CSS class.
$(function() {
  $('.mathquill-embedded-latex').mathquill();
  $('.mathquill-editable').mathquill('editable');
  $('.mathquill-textbox').mathquill('textbox');
});
