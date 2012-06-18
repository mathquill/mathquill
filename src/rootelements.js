/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox) {
    jQ.addClass('mathquill-rendered-math');
  }

  root.jQ = jQ.data(jQueryDataKey, {
    block: root,
    revert: function() {
      jQ.empty().unbind('.mathquill')
        .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
        .append(contents);
    }
  });

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
    var latex = cursor.selection ? '$'+cursor.selection.latex()+'$' : '';
    textarea.val(latex);
    if (latex) {
      textarea[0].select();
    }
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

    textarea.focus();

    cursor.blink = $.noop;
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

  //clipboard event handling
  jQ.bind('cut', function(e) {
    setTextareaSelection();
    if (cursor.selection)
      setTimeout(function(){ cursor.deleteSelection(); cursor.parent.bubble('redraw'); });
    e.stopPropagation();
  })
  .bind('copy', function(e) {
    setTextareaSelection();
    e.stopPropagation();
  })
  .bind('paste', function(e) {
    pasting = true;
    setTimeout(paste);
    e.stopPropagation();
  });

  function paste() {
    //FIXME HACK the parser in RootTextBlock needs to be moved to
    //Cursor::writeLatex or something so this'll work with MathQuill textboxes
    var latex = textarea.val();
    if (latex.slice(0,1) === '$' && latex.slice(-1) === '$') {
      latex = latex.slice(1, -1);
    }
    else {
      latex = '\\text{' + latex + '}';
    }
    cursor.writeLatex(latex).show();
    textarea.val('');
    pasting = false;
  }

  //keyboard events and text input, see Wiki page "Keyboard Events"
  var lastKeydn, lastKeydnHappened, lastKeypressWhich, pasting = false;
  jQ.bind('keydown.mathquill', function(e) {
    lastKeydn = e;
    lastKeydnHappened = true;
    cursor.parent.bubble('keydown', e);
  }).bind('keypress.mathquill', function(e) {
    //on auto-repeated key events, keypress may get triggered but not keydown
    if (lastKeydnHappened)
      lastKeydnHappened = false;
    else
      cursor.parent.bubble('keydown', lastKeydn);

    //make sure setTextareaSelection() doesn't happen before textInput(), where we
    //check if any text was typed
    if (textareaSelectionTimeout !== undefined)
      clearTimeout(textareaSelectionTimeout);

    //after keypress event, trigger virtual textInput event if text was
    //input to textarea
    setTimeout(textInput);
  });

  function textInput() {
    if (pasting || (
      'selectionStart' in textarea[0]
      && textarea[0].selectionStart !== textarea[0].selectionEnd
    )) return;
    var text = textarea.val();
    if (text) {
      textarea.val('');
      for (var i = 0; i < text.length; i += 1) {
        cursor.parent.bubble('textInput', text.charAt(i));
      }
      textareaSelectionTimeout = undefined;
    }
    else {
      if (textareaSelectionTimeout !== undefined)
        setTextareaSelection();
    }
  }
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
    // while we add stuff to it.  Grab the next element or the parent
    // so we know where to put it back.
    var next = jQ.next(),
        parent = jQ.parent();

    jQ.detach();
    this.cursor.appendTo(this).writeLatex(latex);

    // Put. the element. back.
    // if there's no next element, it's at the end of its parent
    next.length ? next.before(jQ) : parent.append(jQ);

    // XXX HACK ALERT
    this.jQ.mathquill('redraw');
    this.blur();
  };
  _.keydown = function(e)
  {
    e.ctrlKey = e.ctrlKey || e.metaKey;
    switch ((e.originalEvent && e.originalEvent.keyIdentifier) || e.which) {
    case 8: //backspace
    case 'Backspace':
    case 'U+0008':
      if (e.ctrlKey)
        while (this.cursor.prev || this.cursor.selection)
          this.cursor.backspace();
      else
        this.cursor.backspace();
      break;
    case 27: //may as well be the same as tab until we figure out what to do with it
    case 'Esc':
    case 'U+001B':
    case 9: //tab
    case 'Tab':
    case 'U+0009':
      if (e.ctrlKey) break;

      var parent = this.cursor.parent;
      if (e.shiftKey) { //shift+Tab = go one block left if it exists, else escape left.
        if (parent === this.cursor.root) //cursor is in root editable, continue default
          return this.skipTextInput = true;
        else if (parent.prev) //go one block left
          this.cursor.appendTo(parent.prev);
        else //get out of the block
          this.cursor.insertBefore(parent.parent);
      }
      else { //plain Tab = go one block right if it exists, else escape right.
        if (parent === this.cursor.root) //cursor is in root editable, continue default
          return this.skipTextInput = true;
        else if (parent.next) //go one block right
          this.cursor.prependTo(parent.next);
        else //get out of the block
          this.cursor.insertAfter(parent.parent);
      }

      this.cursor.clearSelection();
      break;
    case 13: //enter
    case 'Enter':
      break;
    case 35: //end
    case 'End':
      if (e.shiftKey)
        while (this.cursor.next || (e.ctrlKey && this.cursor.parent !== this))
          this.cursor.selectRight();
      else //move to the end of the root block or the current block.
        this.cursor.clearSelection().appendTo(e.ctrlKey ? this : this.cursor.parent);
      break;
    case 36: //home
    case 'Home':
      if (e.shiftKey)
        while (this.cursor.prev || (e.ctrlKey && this.cursor.parent !== this))
          this.cursor.selectLeft();
      else //move to the start of the root block or the current block.
        this.cursor.clearSelection().prependTo(e.ctrlKey ? this : this.cursor.parent);
      break;
    case 37: //left
    case 'Left':
      if (e.ctrlKey) break;

      if (e.shiftKey)
        this.cursor.selectLeft();
      else
        this.cursor.moveLeft();
      break;
    case 38: //up
    case 'Up':
      if (e.ctrlKey) break;

      if (e.shiftKey) {
        if (this.cursor.prev)
          while (this.cursor.prev)
            this.cursor.selectLeft();
        else
          this.cursor.selectLeft();
      }
      else if (this.cursor.parent.prev)
        this.cursor.clearSelection().appendTo(this.cursor.parent.prev);
      else if (this.cursor.prev)
        this.cursor.clearSelection().prependTo(this.cursor.parent);
      else if (this.cursor.parent !== this)
        this.cursor.clearSelection().insertBefore(this.cursor.parent.parent);
      break;
    case 39: //right
    case 'Right':
      if (e.ctrlKey) break;

      if (e.shiftKey)
        this.cursor.selectRight();
      else
        this.cursor.moveRight();
      break;
    case 40: //down
    case 'Down':
      if (e.ctrlKey) break;

      if (e.shiftKey) {
        if (this.cursor.next)
          while (this.cursor.next)
            this.cursor.selectRight();
        else
          this.cursor.selectRight();
      }
      else if (this.cursor.parent.next)
        this.cursor.clearSelection().prependTo(this.cursor.parent.next);
      else if (this.cursor.next)
        this.cursor.clearSelection().appendTo(this.cursor.parent);
      else if (this.cursor.parent !== this)
        this.cursor.clearSelection().insertAfter(this.cursor.parent.parent);
      break;
    case 46: //delete
    case 'Del':
    case 'U+007F':
      if (e.ctrlKey)
        while (this.cursor.next || this.cursor.selection)
          this.cursor.deleteForward();
      else
        this.cursor.deleteForward();
      break;
    case 65: //the 'A' key, as in Ctrl+A Select All
    case 'A':
    case 'U+0041':
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (this !== this.cursor.root) //so not stopPropagation'd at RootMathCmd
          return;

        this.cursor.clearSelection().appendTo(this);
        while (this.cursor.prev)
          this.cursor.selectLeft();
        break;
      }
    default:
      this.skipTextInput = false;
      return false;
    }
    this.skipTextInput = true;
    e.preventDefault();
    return false;
  };
  _.textInput = function(ch) {
    if (!this.skipTextInput)
      this.cursor.write(ch);
    return false;
  };
});

var RootMathCmd = P(MathCmd, function(_, _super) {
  _.init = function(cursor) {
    MathCmd.prototype.init.call(this, '$');
    this.cursor = cursor;
  };
  _.htmlTemplate = ['<span class="mathquill-rendered-math"></span>'];
  _.createBlocks = function() {
    this.firstChild =
    this.lastChild =
    this.jQ.data(jQueryDataKey).block = RootMathBlock();

    this.firstChild.parent = this;
    this.firstChild.jQ = this.jQ;

    var cursor = this.firstChild.cursor = this.cursor;
    this.firstChild.textInput = function(ch) {
      if (this.skipTextInput) return false;

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
  _.keydown = RootMathBlock.prototype.keydown;
  _.textInput = function(ch) {
    if (this.skipTextInput) return false;

    this.cursor.deleteSelection();
    if (ch === '$')
      this.cursor.insertNew(RootMathCmd(this.cursor));
    else
      this.cursor.insertNew(VanillaSymbol(ch));

    return false;
  };
});
