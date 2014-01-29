/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(container, root, textbox, editable) {
  var contents = container.contents().detach();

  if (!textbox) {
    container.addClass('mathquill-rendered-math');
  }

  root.jQ = $('<span class="mathquill-root-block"/>').attr(mqBlockId, root.id)
  .appendTo(container);
  root.revert = function() {
    container.empty().unbind('.mathquill')
      .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
      .append(contents);
  };

  root.cursor = Cursor(root);

  root.renderLatex(contents.text());
}

function setupTextarea(editable, container, root, cursor) {
  var textareaSpan = root.textareaSpan = $('<span class="textarea"><textarea></textarea></span>'),
    textarea = textareaSpan.children();

  //prevent native selection except textarea
  container.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });

  // throttle calls to setTextareaSelection(), because setting textarea.value
  // and/or calling textarea.select() can have anomalously bad performance:
  // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
  var textareaSelectionTimeout;
  root.selectionChanged = function() {
    if (textareaSelectionTimeout === undefined) {
      textareaSelectionTimeout = setTimeout(setTextareaSelection);
    }
    forceIERedraw(container[0]);
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
  container.bind('copy', setTextareaSelection);


  if (!editable) {
    var textareaManager = manageTextarea(textarea, { container: container });
    container.prepend('<span class="selectable">$'+root.latex()+'$</span>');
    root.blurred = true;
    textarea.bind('cut paste', false)
    .focus(function() { root.blurred = false; }).blur(function() {
      cursor.clearSelection();
      setTimeout(detach); //detaching during blur explodes in WebKit
    });
    function detach() {
      textareaSpan.detach();
      root.blurred = true;
    }
    return;
  }

  var textareaManager = manageTextarea(textarea, {
    container: container,
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

  container.prepend(textareaSpan);

  textarea.focus(function(e) {
    root.blurred = false;
    if (!cursor.parent)
      cursor.insAtRightEnd(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //re-select textarea contents after tabbing away and back
    }
    else
      cursor.show();
  }).blur(function(e) {
    root.blurred = true;
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
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

    this.eachChild('postOrder', 'dispose');
    this.ends[L] = this.ends[R] = 0;

    //delete this.cursor.selection;
    if (block) {
      block.children().adopt(this, 0, 0);
    }

    var jQ = this.jQ;

    if (block) {
      var html = block.join('html');
      jQ.html(html);
      this.jQize(jQ.children());
      this.finalizeInsert();
    }
    else {
      jQ.empty();
    }

    this.cursor.parent = this;
    this.cursor[L] = this.ends[R];
    this.cursor[R] = 0;
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
    delete cursor.selection;
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
