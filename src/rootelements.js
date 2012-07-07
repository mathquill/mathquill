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

  var textareaManager = manageTextarea(textarea, {
    key: function(key, evt) {
      if (editable) cursor.parent.bubble('onKey', key, evt);
    },
    text: function(text) {
      if (editable) cursor.parent.bubble('onText', text);
    },
    cut: function(e) {
      if (cursor.selection) {
        setTimeout(function() {
          cursor.deleteSelection();
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

  // HACK: support middle-click in linux by forwarding the root's
  // paste event to the textarea
  jQ.on('paste', textareaManager.paste);

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
    var latex = cursor.selection ? '$'+cursor.selection.latex()+'$' : '';
    textareaManager.select(latex);
  }

  //prevent native selection except textarea
  jQ.bind('selectstart.mathquill', function(e) {
    if (e.target !== textarea[0]) e.preventDefault();
    e.stopPropagation();
  });

  //drag-to-select event handling
  var anticursor, blink = cursor.blink;
  jQ.bind('mousedown.mathquill', function(e) {
    function mousemove(e) {
      cursor.seek($(e.target), e.pageX, e.pageY);

      if (cursor.prev !== anticursor.prev
          || cursor.parent !== anticursor.parent) {
        cursor.selectFrom(anticursor);
      }

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
      anticursor = undefined;
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
      $(document).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
    }

    setTimeout(function() { textarea.focus(); });
      // preventDefault won't prevent focus on mousedown in IE<9
      // that means immediately after this mousedown, whatever was
      // mousedown-ed will receive focus
      // http://bugs.jquery.com/ticket/10345

    cursor.blink = noop;
    cursor.seek($(e.target), e.pageX, e.pageY);

    anticursor = {parent: cursor.parent, prev: cursor.prev, next: cursor.next};

    if (!editable) jQ.prepend(textareaSpan);

    jQ.mousemove(mousemove);
    $(document).mousemove(docmousemove).mouseup(mouseup);

    return false;
  });

  if (!editable) {
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

  jQ.prepend(textareaSpan);

  //root CSS classes
  jQ.addClass('mathquill-editable');
  if (textbox)
    jQ.addClass('mathquill-textbox');

  //focus and blur handling
  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.appendTo(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(root.selectionChanged); //select textarea after focus
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
    var jQ = this.jQ;

    jQ.children().slice(1).remove();
    this.firstChild = this.lastChild = 0;

    // temporarily take the element out of the displayed DOM
    // while we add stuff to it.  Grab the next or parent node
    // so we know where to put it back.
    // NOTE: careful that it be the next or parent DOM **node** and not
    // HTML element, lest we skip a text node.
    var next = jQ[0].nextSibling,
      parent = jQ[0].parentNode;

    jQ.detach();
    this.cursor.appendTo(this).writeLatex(latex);

    // Put. the element. back.
    // if there's no next element, it's at the end of its parent
    next ? jQ.insertBefore(next) : jQ.appendTo(parent);

    // XXX HACK ALERT
    this.jQ.mathquill('redraw');
    this.blur();
  };
  _.onKey = function(key, e) {
    switch (key) {
    case 'Ctrl-Shift-Backspace':
    case 'Ctrl-Backspace':
      while (this.cursor.prev || this.cursor.selection) {
        this.cursor.backspace();
      }
      break;

    case 'Shift-Backspace':
    case 'Backspace':
      this.cursor.backspace();
      break;

    // Tab or Esc -> go one block right if it exists, else escape right.
    case 'Esc':
    case 'Tab':
      var parent = this.cursor.parent;
      // cursor is in root editable, continue default
      if (parent === this.cursor.root) return;

      if (parent.next) {
        // go one block right
        this.cursor.prependTo(parent.next);
      } else {
        // get out of the block
        this.cursor.insertAfter(parent.parent);
      }

      this.cursor.clearSelection();
      break;

    // Shift-Tab -> go one block left if it exists, else escape left.
    case 'Shift-Tab':
      var parent = this.cursor.parent;
      //cursor is in root editable, continue default
      if (parent === this.cursor.root) return;

      if (parent.prev) {
        // go one block left
        this.cursor.appendTo(parent.prev);
      } else {
        //get out of the block
        this.cursor.insertBefore(parent.parent);
      }

      this.cursor.clearSelection();
      break;

    // Prevent newlines from showing up
    case 'Enter': break;


    // End -> move to the end of the current block.
    case 'End':
      this.cursor.clearSelection().appendTo(this.cursor.parent);
      break;

    // Ctrl-End -> move all the way to the end of the root block.
    case 'Ctrl-End':
      this.cursor.clearSelection().appendTo(this);
      break;

    // Shift-End -> select to the end of the current block.
    case 'Shift-End':
      while (this.cursor.next) {
        this.cursor.selectRight();
      }
      break;

    // Ctrl-Shift-End -> select to the end of the root block.
    case 'Ctrl-Shift-End':
      while (this.cursor.next || this.cursor.parent !== this) {
        this.cursor.selectRight();
      }
      break;

    // Home -> move to the start of the root block or the current block.
    case 'Home':
      this.cursor.clearSelection().prependTo(this.cursor.parent);
      break;

    // Ctrl-Home -> move to the start of the current block.
    case 'Ctrl-Home':
      this.cursor.clearSelection().prependTo(this);
      break;

    // Shift-Home -> select to the start of the current block.
    case 'Shift-Home':
      while (this.cursor.prev) {
        this.cursor.selectLeft();
      }
      break;

    // Ctrl-Shift-Home -> move to the start of the root block.
    case 'Ctrl-Shift-Home':
      while (this.cursor.prev || this.cursor.parent !== this) {
        this.cursor.selectLeft();
      }
      break;

    case 'Left': this.cursor.moveLeft(); break;
    case 'Shift-Left': this.cursor.selectLeft(); break;
    case 'Ctrl-Left': break;

    case 'Right': this.cursor.moveRight(); break;
    case 'Shift-Right': this.cursor.selectRight(); break;
    case 'Ctrl-Right': break;

    case 'Up':
      if (this.cursor.parent.prev) {
        this.cursor.clearSelection().appendTo(this.cursor.parent.prev);
      } else if (this.cursor.prev) {
        this.cursor.clearSelection().prependTo(this.cursor.parent);
      }
      else if (this.cursor.parent !== this) {
        this.cursor.clearSelection().insertBefore(this.cursor.parent.parent);
      }
      break;

    case 'Shift-Up':
      if (this.cursor.prev) {
        while (this.cursor.prev) this.cursor.selectLeft();
      } else {
        this.cursor.selectLeft();
      }

    case 'Ctrl-Up': break;

    case 'Down':
      if (this.cursor.parent.next) {
        this.cursor.clearSelection().prependTo(this.cursor.parent.next);
      } else if (this.cursor.next) {
        this.cursor.clearSelection().appendTo(this.cursor.parent);
      } else if (this.cursor.parent !== this) {
        this.cursor.clearSelection().insertAfter(this.cursor.parent.parent);
      }
      break;

    case 'Shift-Down':
      if (this.cursor.next) {
        while (this.cursor.next) this.cursor.selectRight();
      }
      else {
        this.cursor.selectRight();
      }

    case 'Ctrl-Down': break;

    case 'Del':
      if (e.ctrlKey)
        while (this.cursor.next || this.cursor.selection)
          this.cursor.deleteForward();
      else
        this.cursor.deleteForward();
      break;

    case 'Ctrl-a':
      //so not stopPropagation'd at RootMathCmd
      if (this !== this.cursor.root) return;

      this.cursor.clearSelection().appendTo(this);
      while (this.cursor.prev) this.cursor.selectLeft();
      break;

    default:
      return false;
    }
    e.preventDefault();
    return false;
  };
  _.onText = function(ch) {
    this.cursor.write(ch);
    return false;
  };
});

var RootMathCmd = P(MathCmd, function(_, _super) {
  _.init = function(cursor) {
    _super.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = '<span class="mathquill-rendered-math" #mqCmdId #mqBlockId:0>#mqBlock:0</span>';
  _.createBlocks = function() {
    this.firstChild =
    this.lastChild =
      RootMathBlock();

    this.blocks = [ this.firstChild ];

    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ;

    var cursor = this.firstChild.cursor = this.cursor;
    this.firstChild.onText = function(ch) {
// debugger;
      if (ch !== '$' || cursor.parent !== this)
        cursor.write(ch);
      else if (this.isEmpty()) {
        cursor.insertAfter(this.parent).backspace()
          .insertNew(VanillaSymbol('\\$','$')).show();
      }
      else if (!cursor.next)
        cursor.insertAfter(this.parent);
      else if (!cursor.prev)
        cursor.insertBefore(this.parent);
      else
        cursor.write(ch);

      return false;
    };
  };
  _.latex = function() {
    return '$' + this.firstChild.latex() + '$';
  };
});

var RootTextBlock = P(MathBlock, function(_) {
  _.renderLatex = function(latex) {
    var self = this, cursor = self.cursor;
    self.jQ.children().slice(1).remove();
    self.firstChild = self.lastChild = 0;
    cursor.show().appendTo(self);

    latex = latex.match(/(?:\\\$|[^$])+|\$(?:\\\$|[^$])*\$|\$(?:\\\$|[^$])*$/g) || '';
    for (var i = 0; i < latex.length; i += 1) {
      var chunk = latex[i];
      if (chunk[0] === '$') {
        if (chunk[-1+chunk.length] === '$' && chunk[-2+chunk.length] !== '\\')
          chunk = chunk.slice(1, -1);
        else
          chunk = chunk.slice(1);

        var root = RootMathCmd(cursor);
        cursor.insertNew(root);
        root.firstChild.renderLatex(chunk);
        cursor.show().insertAfter(root);
      }
      else {
        for (var j = 0; j < chunk.length; j += 1)
          this.cursor.insertNew(VanillaSymbol(chunk[j]));
      }
    }
  };
  _.onKey = RootMathBlock.prototype.onKey;
  _.onText = function(ch) {
    this.cursor.deleteSelection();
    if (ch === '$')
      this.cursor.insertNew(RootMathCmd(this.cursor));
    else
      this.cursor.insertNew(VanillaSymbol(ch));

    return false;
  };
});
