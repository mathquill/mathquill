/*********************************************
 * Root math elements with event delegation.
 ********************************************/

function createRoot(jQ, root, textbox, editable) {
  var contents = jQ.contents().detach();

  if (!textbox)
    jQ.addClass('mathquill-rendered-math');

  root.jQ = jQ.data(jQueryDataKey, {
    block: root,
    revert: function() {
      jQ.empty().unbind('.mathquill')
        .removeClass('mathquill-rendered-math mathquill-editable mathquill-textbox')
        .append(contents);
    }
  });

  var cursor = root.cursor = new Cursor(root);

  root.renderLatex(contents.text());

  if (!editable) //if static, quit once we render the LaTeX
    return;

  root.textarea = $('<span class="textarea"><textarea></textarea></span>')
    .prependTo(jQ.addClass('mathquill-editable'));
  var textarea = root.textarea.children();
  if (textbox)
    jQ.addClass('mathquill-textbox');

  textarea.focus(function(e) {
    if (!cursor.parent)
      cursor.appendTo(root);
    cursor.parent.jQ.addClass('hasCursor');
    if (cursor.selection) {
      cursor.selection.jQ.removeClass('blur');
      setTimeout(function(){ cursor.selectLatex(); });
    } else
      cursor.show();
    e.stopPropagation();
  }).blur(function(e) {
    cursor.hide().parent.blur();
    if (cursor.selection)
      cursor.selection.jQ.addClass('blur');
    e.stopPropagation();
  });

  //trigger virtual textInput event (see Wiki page "Keyboard Events")
  function textInput() {
    var text = textarea.val();
    if (!text) return;
    textarea.val('');
    // textarea can contain more than one character
    // when typing quickly on slower platforms;
    // so process each character separately
    for (var i=0; i<text.length; i++) {
        cursor.parent.textInput(text[i]);
    }
  }

  var lastKeydn = {}; //see Wiki page "Keyboard Events"
  jQ.bind('focus.mathquill blur.mathquill', function(e) {
    textarea.trigger(e);
  }).bind('keydown.mathquill', function(e) { //see Wiki page "Keyboard Events"
    lastKeydn.evt = e;
    lastKeydn.happened = true;
    lastKeydn.returnValue = cursor.parent.keydown(e);
    if (lastKeydn.returnValue)
      return true;
    else {
      e.stopImmediatePropagation();
      return false;
    }
  }).bind('keypress.mathquill', function(e) {
    //on auto-repeated key events, keypress may get triggered but not keydown
    //  (see Wiki page "Keyboard Events")
    if (lastKeydn.happened)
      lastKeydn.happened = false;
    else
      lastKeydn.returnValue = cursor.parent.keydown(lastKeydn.evt);

    //prevent default and cancel keypress if keydown returned false,
    //even in browsers where that doesn't automatically happen
    //  (see Wiki page "Keyboard Events")
    if (!lastKeydn.returnValue)
      return false;

    //after keypress event, trigger virtual textInput event if text was
    //input to textarea
    //  (see Wiki page "Keyboard Events")
    setTimeout(textInput);
  }).bind('mousedown.mathquill', function(e) {
    cursor.seek($(e.target), e.pageX, e.pageY).blink = $.noop;

    anticursor = new Cursor(root);
    anticursor.jQ = anticursor._jQ = $();
    if (cursor.next)
      anticursor.insertBefore(cursor.next);
    else
      anticursor.appendTo(cursor.parent);

    jQ.mousemove(mousemove);
    $(document).mousemove(docmousemove).mouseup(mouseup);

    setTimeout(function(){textarea.focus();});
  }).bind('cut', function() {
    if (cursor.selection)
      cursor.deleteSelection();
  }).bind('paste', function() {
    setTimeout(function() {
      cursor.writeLatex(textarea.val()).clearSelection();
    });
  }).bind('selectstart.mathquill', function(e) {
    if (e.target != textarea[0])
      e.preventDefault();
    e.stopPropagation();
  }).blur();

  function mousemove(e) {
    cursor.seek($(e.target), e.pageX, e.pageY);

    if (cursor.prev === anticursor.prev && cursor.parent === anticursor.parent)
      cursor.clearSelection();
    else
      cursor.selectFrom(anticursor);

    return false;
  }
  function docmousemove(e) {
    delete e.target;
    return mousemove(e);
  }
  function mouseup(e) {
    anticursor = undefined;
    cursor.blink = blink;
    if (!cursor.selection) cursor.show();
    jQ.unbind('mousemove', mousemove);
    $(document).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
  }

  var anticursor, blink = cursor.blink;
}

function RootMathBlock(){}
_ = RootMathBlock.prototype = new MathBlock;
_.latex = function() {
  return MathBlock.prototype.latex.call(this).replace(/(\\[a-z]+) (?![a-z])/ig,'$1');
};
_.text = function() {
  return this.foldChildren('', function(text, child) {
    return text + child.text();
  });
};
_.renderLatex = function(latex) {
  this.jQ.children().slice(1).remove();
  this.firstChild = this.lastChild = 0;
  this.cursor.appendTo(this).writeLatex(latex);
  this.blur();
};
_.keydown = function(e)
{
  this.skipTextInput = true;
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
      if (parent === this) //cursor is in root editable, continue default
        break;
      else if (parent.prev) //go one block left
        this.cursor.appendTo(parent.prev);
      else //get out of the block
        this.cursor.insertBefore(parent.parent);
    }
    else { //plain Tab = go one block right if it exists, else escape right.
      if (parent === this) //cursor is in root editable, continue default
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
    e.preventDefault();
    return true;
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
      if (this !== this.cursor.root) //so not stopPropagation'd at RootMathCommand
        return this.parent.keydown(e);

      this.cursor.clearSelection().appendTo(this);
      while (this.cursor.prev)
        this.cursor.selectLeft();
      e.preventDefault();
      return false;
    }
    else
      this.skipTextInput = false;
    return true;
  default:
    this.skipTextInput = false;
    return true;
  }
  return false;
};
_.textInput = function(ch) {
  if (!this.skipTextInput)
    this.cursor.write(ch);
};

function RootMathCommand(cursor) {
  MathCommand.call(this, '$');
  this.firstChild.cursor = cursor;
  this.firstChild.textInput = function(ch) {
    if (this.skipTextInput) return;

    if (ch !== '$' || cursor.parent !== this)
      cursor.write(ch);
    else if (this.isEmpty()) {
      cursor.insertAfter(this.parent).backspace()
        .insertNew(new VanillaSymbol('\\$','$')).show();
    }
    else if (!cursor.next)
      cursor.insertAfter(this.parent);
    else if (!cursor.prev)
      cursor.insertBefore(this.parent);
    else
      cursor.write(ch);
  };
}
_ = RootMathCommand.prototype = new MathCommand;
_.html_template = ['<span class="mathquill-rendered-math"></span>'];
_.initBlocks = function() {
  this.firstChild =
  this.lastChild =
  this.jQ.data(jQueryDataKey).block =
    new RootMathBlock;

  this.firstChild.parent = this;
  this.firstChild.jQ = this.jQ;
};
_.latex = function() {
  return '$' + this.firstChild.latex() + '$';
};

function RootTextBlock(){}
_ = RootTextBlock.prototype = new MathBlock;
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

      var root = new RootMathCommand(cursor);
      cursor.insertNew(root);
      root.firstChild.renderLatex(chunk);
      cursor.show().insertAfter(root);
    }
    else {
      for (var j = 0; j < chunk.length; j += 1)
        this.cursor.insertNew(new VanillaSymbol(chunk[j]));
    }
  }
};
_.keydown = RootMathBlock.prototype.keydown;
_.textInput = function(ch) {
  if (this.skipTextInput) return;

  this.cursor.deleteSelection();
  if (ch === '$')
    this.cursor.insertNew(new RootMathCommand(this.cursor));
  else
    this.cursor.insertNew(new VanillaSymbol(ch));
};

