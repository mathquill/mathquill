/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox) {
    jQ.addClass('mathquill-rendered-math');
  }

  root.jQ = jQ.attr(mqBlockId, root.id);
  root.revert = function() {
    jQ.empty().unbind('.mathquill')
      .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
      .append(contents);
  };

  var cursor = root.cursor = Cursor(root);

  root.renderLatex(contents.text());

  //textarea stuff
  var textareaSpan = root.textarea = $('<span class="textarea"><textarea></textarea></span>'),
    textarea = textareaSpan.children();

  /******
   * TODO [Han]: Document this
   */
  var textareaSelectionTimeout;
  root.selectionChanged = function() {
    if (textareaSelectionTimeout === undefined) {
      textareaSelectionTimeout = setTimeout(setTextareaSelection);
    }
    forceIERedraw(jQ[0]);
  };
  function setTextareaSelection() {
    textareaSelectionTimeout = undefined;
    var latex = '';
    if (cursor.selection) {
      latex = cursor.selection.fold('', function(latex, el) {
        return latex + el.latex();
      });
      latex = '$' + latex + '$';
    }
    textareaManager.select(latex);
  }

  //prevent native selection except textarea
  jQ.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });

  //drag-to-select event handling
  var blink = cursor.blink;
  jQ.bind('mousedown.mathquill', function(e) {
    function mousemove(e) {
      cursor.seek($(e.target), e.pageX, e.pageY).select();
      // focus the least-common-ancestor block:
      if (cursor.selection) cursor.insRightOf(cursor.selection.ends[R]);
      return false;
    }

    // docmousemove is attached to the document, so that
    // selection still works when the mouse leaves the window.
    function docmousemove(e) {
      // [Han]: i delete the target because of the way seek works.
      // it will not move the mouse to the target, but will instead
      // just seek those X and Y coordinates.  If there is a target,
      // it will try to move the cursor to document, which will not work.
      // cursor.seek needs to be refactored.
      delete e.target;

      return mousemove(e);
    }

    function mouseup(e) {
      cursor.endSelection();
      cursor.blink = blink;
      if (!cursor.selection) {
        if (editable) {
          cursor.show();
        }
        else {
          textareaSpan.detach();
        }
      }

      // delete the mouse handlers now that we're not dragging anymore
      jQ.unbind('mousemove', mousemove);
      $(e.target.ownerDocument).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
    }

    setTimeout(function() { textarea.focus(); });
      // preventDefault won't prevent focus on mousedown in IE<9
      // that means immediately after this mousedown, whatever was
      // mousedown-ed will receive focus
      // http://bugs.jquery.com/ticket/10345

    cursor.blink = noop;
    cursor.seek($(e.target), e.pageX, e.pageY).startSelection();

    if (!editable) jQ.prepend(textareaSpan);

    jQ.mousemove(mousemove);
    $(e.target.ownerDocument).mousemove(docmousemove).mouseup(mouseup);

    return false;
  });

  if (!editable) {
    var textareaManager = manageTextarea(textarea, { container: jQ });
    jQ.bind('cut paste', false).bind('copy', setTextareaSelection)
      .prepend('<span class="selectable">$'+root.latex()+'$</span>');
    textarea.blur(function() {
      cursor.clearSelection();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      textareaSpan.detach();
    }
    return;
  }

  var textareaManager = manageTextarea(textarea, {
    container: jQ,
    key: function(key, evt) {
      cursor.parent.keystroke(key, evt, cursor);
    },
    text: function(ch) {
      cursor.parent.write(cursor, ch, cursor.prepareWrite());
    },
    cut: function(e) {
      if (cursor.selection) {
        setTimeout(function() {
          cursor.prepareEdit();
          cursor.parent.bubble('redraw');
        });
      }

      e.stopPropagation();
    },
    paste: function(text) {
      // FIXME HACK the parser in RootTextBlock needs to be moved to
      // Cursor::writeLatex or something so this'll work with
      // MathQuill textboxes
      if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      }
      else {
        text = '\\text{' + text + '}';
      }

      cursor.writeLatex(text).show();
    }
  });

  jQ.prepend(textareaSpan);

  //root CSS classes
  jQ.addClass('mathquill-editable');
  if (textbox)
    jQ.addClass('mathquill-textbox');

  //focus and blur handling
  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.insAtRightEnd(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //re-select textarea contents after tabbing away and back
    }
    else
      cursor.show();
    e.stopPropagation();
  }).blur(function(e) {
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
    e.stopPropagation();
  });

  jQ.bind('focus.mathquill blur.mathquill', function(e) {
    textarea.trigger(e);
  }).blur();
}

var RootMathBlock = P(MathBlock, function(_, _super) {
  _.latex = function() {
    return _super.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
  };
  _.text = function() {
    return this.foldChildren('', function(text, child) {
      return text + child.text();
    });
  };
  _.renderLatex = function(latex) {
    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);
    log('parsed latex');

    this.eachChild('postOrder', 'dispose');
    log('postOrder-ed dispose, about to delete children from edit tree');
    this.ends[L] = this.ends[R] = 0;
    log('cleared children from edit tree');

    if (block) {
      block.children().adopt(this, 0, 0);
      log('adopted into edit tree');
    }

    var jQ = this.jQ;

    if (this.textarea) this.textarea.detach();
    log ('detached textarea');

    if (block) {
      var html = block.join('html');
      log('generated html');
      jQ.html(html);
      log('set innerHTML');
      this.jQize(jQ.children());
      log('jQize-d');
      this.finalizeInsert();
      log('this.finalizeInsert()');
    }
    else {
      jQ.empty();
      log('emptied jQ');
    }
    if (this.textarea) jQ.prepend(this.textarea);
    log('prepended textarea');

    this.cursor.insAtRightEnd(this);
    log('appended cursor');
  };
});

var RootMathCommand = P(MathCommand, function(_, _super) {
  _.init = function(cursor) {
    _super.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = '<span class="mathquill-rendered-math">&0</span>';
  _.createBlocks = function() {
    this.ends[L] =
    this.ends[R] =
      RootMathBlock();

    this.blocks = [ this.ends[L] ];

    this.ends[L].parent = this;

    this.ends[L].cursor = this.cursor;
    this.ends[L].write = function(cursor, ch, replacedFragment) {
      if (ch !== '$')
        MathBlock.prototype.write.call(this, cursor, ch, replacedFragment);
      else if (this.isEmpty()) {
        cursor.insRightOf(this.parent).backspace().show();
        VanillaSymbol('\\$','$').createLeftOf(cursor);
      }
      else if (!cursor[R])
        cursor.insRightOf(this.parent);
      else if (!cursor[L])
        cursor.insLeftOf(this.parent);
      else
        MathBlock.prototype.write.call(this, cursor, ch, replacedFragment);
    };
  };
  _.latex = function() {
    return '$' + this.ends[L].latex() + '$';
  };
});

var RootTextBlock = P(MathBlock, function(_, _super) {
  _.renderLatex = function(latex) {
    var self = this;
    var cursor = self.cursor;
    self.jQ.children().slice(1).remove();
    self.eachChild('postOrder', 'dispose');
    self.ends[L] = self.ends[R] = 0;
    cursor.show().insAtRightEnd(self);

    var regex = Parser.regex;
    var string = Parser.string;
    var eof = Parser.eof;
    var all = Parser.all;

    // Parser RootMathCommand
    var mathMode = string('$').then(latexMathParser)
      // because TeX is insane, math mode doesn't necessarily
      // have to end.  So we allow for the case that math mode
      // continues to the end of the stream.
      .skip(string('$').or(eof))
      .map(function(block) {
        // HACK FIXME: this shouldn't have to have access to cursor
        var rootMathCommand = RootMathCommand(cursor);

        rootMathCommand.createBlocks();
        var rootMathBlock = rootMathCommand.ends[L];
        block.children().adopt(rootMathBlock, 0, 0);

        return rootMathCommand;
      })
    ;

    var escapedDollar = string('\\$').result('$');
    var textChar = escapedDollar.or(regex(/^[^$]/)).map(VanillaSymbol);
    var latexText = mathMode.or(textChar).many();
    var commands = latexText.skip(eof).or(all.result(false)).parse(latex);

    if (commands) {
      for (var i = 0; i < commands.length; i += 1) {
        commands[i].adopt(self, self.ends[R], 0);
      }

      self.jQize().appendTo(self.jQ);

      self.finalizeInsert();
    }
  };
  _.keystroke = function(key) {
    if (key === 'Spacebar' || key === 'Shift-Spacebar') return;
    return _super.keystroke.apply(this, arguments);
  };
  _.write = function(cursor, ch, replacedFragment) {
    if (replacedFragment) replacedFragment.remove();
    if (ch === '$')
      RootMathCommand(cursor).createLeftOf(cursor);
    else {
      var html;
      if (ch === '<') html = '&lt;';
      else if (ch === '>') html = '&gt;';
      VanillaSymbol(ch, html).createLeftOf(cursor);
    }
  };
});
