/**
 * Front-end code: Event-handling, HTML DOM manipulation (via jQuery)
 */

//A fake cursor in the fake textbox that the math is rendered in.
function Cursor(block)
{
  //API for the blinking cursor
  var intervalId;
  this.show = function()
  {
    if(intervalId)
      clearInterval(intervalId);
    this.jQ.removeClass('blink');
    var cursor = this;
    intervalId = setInterval(function(){
      cursor.jQ.toggleClass('blink');
    }, 500);
    return this;
  };
  this.hide = function()
  {
    if(intervalId)
      clearInterval(intervalId);
    intervalId = undefined;
    this.jQ.addClass('blink');
    return this;
  };

  this.jQ = $('<span class="cursor"></span>');
  if(block)
    this.prependTo(block);
}
Cursor.prototype = {
  prev: null,
  next: null,
  parent: null,
  setParentEmpty: function()
  {
    if(this.parent)
      this.parent.setEmpty().jQ.removeClass('hasCursor').change();
    return this;
  },
  detach: function()
  {
    this.setParentEmpty();
    this.prev = this.next = this.parent = null;
    this.jQ.detach();
    return this;
  },
  insertBefore: function(el)
  {
    this.setParentEmpty();
    this.next = el;
    this.prev = el.prev;
    this.parent = el.parent;
    this.parent.focus().jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first()); 
    return this;
  },
  insertAfter: function(el)
  {
    this.setParentEmpty();
    this.prev = el;
    this.next = el.next
    this.parent = el.parent;
    this.parent.focus().jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  }, 
  prependTo: function(el)
  {
    this.setParentEmpty();
    this.next = el.firstChild;
    this.prev = null;
    this.parent = el;
    this.parent.removeEmpty().focus().jQ.addClass('hasCursor');
    this.jQ.prependTo(el.jQ);
    return this;
  },
  appendTo: function(el)
  {
    this.setParentEmpty();
    this.prev = el.lastChild;
    this.next = null;
    this.parent = el;
    this.parent.removeEmpty().focus().jQ.addClass('hasCursor');
    this.jQ.appendTo(el.jQ);
    return this;
  },
  moveLeft: function()
  {
    if(this.selection)
      this.insertBefore(this.selection.prev ? this.selection.prev.next : this.parent.firstChild).clearSelection();
    else
      if(this.prev)
        if(this.prev.lastChild)
          this.appendTo(this.prev.lastChild)
        else
          this.hopLeft();
      else //we're at the beginning of a block
        if(this.parent.prev)
          this.appendTo(this.parent.prev);
        else if(this.parent.parent)
          this.insertBefore(this.parent.parent);
    //otherwise we're at the beginning of the root, so do nothing.
    return this.show().jQ.change();
  },
  moveRight: function()
  {
    if(this.selection)
      this.insertAfter(this.selection.next ? this.selection.next.prev : this.parent.lastChild).clearSelection();
    else
      if(this.next)
        if(this.next.firstChild)
          this.prependTo(this.next.firstChild)
        else
          this.hopRight();
      else //we're at the end of a block
        if(this.parent.next)
          this.prependTo(this.parent.next);
        else if(this.parent.parent)
          this.insertAfter(this.parent.parent);
    //otherwise we're at the end of the root, so do nothing.
    return this.show().jQ.change();
  },
  hopLeft: function()
  {
    this.jQ.insertBefore(this.prev.jQ.first());
    this.next = this.prev;
    this.prev = this.prev.prev;
    return this;
  },
  hopRight: function()
  {
    this.jQ.insertAfter(this.next.jQ.last());
    this.prev = this.next;
    this.next = this.next.next;
    return this;
  },
  write: function(cmd)
  {
    if(this.selection)
    {
      this.prev = this.selection.prev;
      this.next = this.selection.next;
    }

    if(cmd.match(/[a-z]/i))
      cmd = new Variable(cmd);
    else if(cmd.match(/\d/))
      cmd = new VanillaSymbol(cmd);
    else if(cmd = SingleCharacterCommands[cmd])
      cmd = cmd(this.selection);
    else
    {
      todo();
      return {show: $.noop};
    }

    if(this.selection)
    {
      if(cmd instanceof Symbol)
        this.selection.remove();
      delete this.selection;
    }

    return this.insertNew(cmd);
  },
  insertNew: function(cmd)
  {
    cmd.parent = this.parent;
    cmd.next = this.next;
    cmd.prev = this.prev;
    if(this.prev)
      this.prev.next = cmd;
    else
      this.parent.firstChild = cmd;
    if(this.next)
      this.next.prev = cmd;
    else
      this.parent.lastChild = cmd;
    cmd.jQ.insertBefore(this.jQ);

    //adjust context-sensitive spacing
    cmd.respace();
    if(this.next)
      this.next.respace();
    if(this.prev)
      this.prev.respace();

    this.prev = cmd;

    cmd.placeCursor(this);

    this.jQ.change();

    return this;
  },
  unwrapParent: function()
  {
    var gramp = this.parent.parent, greatgramp = gramp.parent, cursor = this, prev = gramp.prev;
    gramp.eachChild(function()
    {
      if(this.isEmpty())
        return;

      this.eachChild(function()
      {
        this.parent = greatgramp;
        this.jQ.insertBefore(gramp.jQ);
      });
      this.firstChild.prev = prev;
      if(prev)
        prev.next = this.firstChild;
      else
        this.firstChild.parent.firstChild = this.firstChild;

      prev = this.lastChild;
    });
    prev.next = gramp.next;
    if(prev.next)
      prev.next.prev = prev;
    else
      greatgramp.lastChild = prev;

    if(!this.prev)
      if(this.next)
        this.prev = this.next.prev;
      else
        while(!this.prev)
          if(this.parent = this.parent.prev)
            this.prev = this.parent.lastChild;
          else
          {
            this.prev = gramp.prev;
            break;
          }
    if(this.prev)
      this.insertAfter(this.prev);
    else
      this.insertBefore(greatgramp.firstChild);

    gramp.jQ.remove();

    if(gramp.prev)
      gramp.prev.respace();
    if(gramp.next)
      gramp.next.respace();
  },
  backspace: function()
  {
    if(this.deleteSelection());
    else if(this.prev)
      if(this.prev.isEmpty())
        this.prev = this.prev.remove().prev;
      else
        this.selectLeft();
    else if(this.parent.parent)
      if(this.parent.parent.isEmpty())
        return this.insertAfter(this.parent.parent).backspace();
      else
        this.unwrapParent();

    if(this.prev)
      this.prev.respace();
    if(this.next)
      this.next.respace();
    this.jQ.change();

    return this;
  },
  deleteForward: function()
  {
    if(this.deleteSelection());
    else if(this.next)
      if(this.next.isEmpty())
        this.next = this.next.remove().next;
      else
        this.selectRight();
    else if(this.parent.parent)
      if(this.parent.parent.isEmpty())
        return this.insertBefore(this.parent.parent).deleteForward();
      else
        this.unwrapParent();

    if(this.prev)
      this.prev.respace();
    if(this.next)
      this.next.respace();
    this.jQ.change();

    return this;
  },
  selectLeft: function()
  {
    if(this.selection)
      if(this.selection.prev === this.prev) //if cursor is at left edge of selection,
      {
        if(this.prev) //then extend left if possible
        {
          this.hopLeft(); //we want to insertBefore(prev.jQ) before we do prependTo so this.jQ will be outside selection.jQ
          this.next.jQ.prependTo(this.selection.jQ);
          this.selection.prev = this.prev;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertBefore(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at right edge of selection, retract left
      {
        this.prev.jQ.insertAfter(this.selection.jQ);
        this.hopLeft();
        this.selection.next = this.next;
        if(this.selection.prev === this.prev)
          this.deleteSelection();
      }
    else
      if(this.prev)
        this.hopLeft().hide().selection = new Selection(this.parent, this.prev, this.next.next);
      else //end of a block
        if(this.parent.parent)
          this.insertBefore(this.parent.parent).hide().selection = new Selection(this.parent, this.prev, this.next.next);
  },
  selectRight: function()
  {
    if(this.selection)
      if(this.selection.next === this.next) //if cursor is at right edge of selection,
      {
        if(this.next) //then extend right if possible
        {
          this.hopRight();
          this.prev.jQ.appendTo(this.selection.jQ);
          this.selection.next = this.next;
        }
        else if(this.parent.parent) //else level up if possible
          this.insertAfter(this.parent.parent).selection.levelUp();
      }
      else //else cursor is at left edge of selection, retract right
      {
        this.next.jQ.insertBefore(this.selection.jQ);
        this.hopRight();
        this.selection.prev = this.prev;
        if(this.selection.next === this.next)
          this.deleteSelection();
      }
    else
      if(this.next)
        this.hopRight().hide().selection = new Selection(this.parent, this.prev.prev, this.next);
      else //end of a block
        if(this.parent.parent)
          this.insertAfter(this.parent.parent).hide().selection = new Selection(this.parent, this.prev.prev, this.next);
  },
  clearSelection: function()
  {
    if(this.show().selection)
    {
      this.selection.clear();
      delete this.selection;
    }
    return this;
  },
  deleteSelection: function()
  {
    if(this.show().selection)
    {
      this.jQ.insertBefore(this.selection.jQ);
      this.prev = this.selection.prev;
      this.next = this.selection.next;
      this.selection.remove();
      delete this.selection;
      return true;
    }
    else
      return false;
  },
}

function Selection(parent, prev, next)
{
  MathFragment.apply(this, arguments);
}
Selection.prototype = $.extend(new MathFragment, {
  jQinit: function(children)
  {
    return this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //wrapAll clones, so can't do .wrapAll(this.jQ = $(...));
  },
  levelUp: function()
  {
    this.jQ.children().unwrap();
    this.jQinit(this.parent.parent.jQ);

    this.prev = this.parent.parent.prev;
    this.next = this.parent.parent.next;
    this.parent = this.parent.parent.parent;

    return this;
  },
  clear: function()
  {
    this.jQ.replaceWith(this.jQ.children());
    return this;
  },
  blockify: function()
  {
    var selectedJQ = this.jQ.children();
    this.jQ.replaceWith(selectedJQ);
    this.jQ = selectedJQ;
    return MathFragment.prototype.blockify.call(this);
  },
});

//The actual, publically exposed method of jQuery.prototype, available
//(and meant to be called) on jQuery-wrapped HTML DOM elements.
function mathquill(tabindex)
{
  if(!(typeof tabindex === 'function'))
    var i = tabindex || 0, tabindex = function(){ return i; };

  return this.each(function()
  {
    var math = new MathBlock;
    math.focus = function(){ this.jQ.focus(); return this; };
    math.jQ = $('<span class="mathquill-editable-math mathquill-rendered-math" tabindex="'+tabindex.apply(this,arguments)+'"></span>').data('[[mathquill internal data]]', {block: math}).replaceAll(this);

    var cursor = math.cursor = new Cursor(math);

    var continueDefault, lastKeydnEvt; //see Wiki page "Keyboard Events"
    math.jQ.focus(function()
    {
      if(cursor.parent)
      {
        if(cursor.parent.isEmpty())
          cursor.jQ.appendTo(cursor.parent.removeEmpty().jQ).change();
      }
      else
        cursor.appendTo(root);
      cursor.parent.jQ.addClass('hasCursor');
      if(cursor.selection)
        cursor.selection.jQ.removeClass('blur');
      else
        cursor.show();
    }).blur(function(e){
      cursor.setParentEmpty().hide();
      if(cursor.selection)
        cursor.selection.jQ.addClass('blur');
    }).click(function(e)
    {
      var clicked = $(e.target);
      if(clicked.hasClass('empty'))
      {
        cursor.prependTo(clicked.data('[[mathquill internal data]]').block).jQ.change();
        return false;
      }
      var cmd = clicked.data('[[mathquill internal data]]');
      //all clickables not MathCommands are either LatexBlocks or like sqrt radicals or parens,
      //both of whose immediate parents are LatexCommands
      if(!(cmd && (cmd = cmd.cmd)) && !((cmd = (clicked = clicked.parent()).data('[[mathquill internal data]]')) && (cmd = cmd.cmd)))
        return;
      cursor.clearSelection();
      if((e.pageX - clicked.offset().left)*2 < clicked.outerWidth())
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);
      return false;
    }).keydown(function(e)
    {
      //see Wiki page "Keyboard Events"
      lastKeydnEvt = e;
      e.happened = true;
      continueDefault = false;

      e.ctrlKey = e.ctrlKey || e.metaKey;
      switch(e.which)
      {
        case 8: //backspace
          if(e.ctrlKey)
            while(cursor.prev)
              cursor.backspace();
          else
            cursor.backspace();
          return false;
        case 27: //esc does something weird in keypress, may as well be the same as tab until we figure out what to do with it
        case 9: //tab
          if(e.ctrlKey)
            return continueDefault = true;
          var parent = cursor.parent, gramp = parent.parent;
          if(e.shiftKey) //shift+Tab = go one block left if it exists, else escape left.
          {
            if(!gramp) //cursor is in the root, continue default
              return continueDefault = true;
            else if(parent.prev) //go one block left
              cursor.appendTo(parent.prev);
            else //get out of the block
              cursor.insertBefore(gramp);
          }
          else //plain Tab = go one block right if it exists, else escape right.
          {
            if(!gramp) //cursor is in the root, continue default
              return continueDefault = true;
            else if(parent.next) //go one block right
              cursor.prependTo(parent.next);
            else //get out of the block
              cursor.insertAfter(gramp);
          }
          cursor.clearSelection();
          return false;
        case 13: //enter
          if(e.ctrlKey)
            return continueDefault = true;
          return false;
        case 35: //end
          if(e.ctrlKey) //move to the end of the root math block.
            cursor.clearSelection().appendTo(math);
          else //else move to the end of the current block.
            cursor.clearSelection().appendTo(cursor.parent);
          return false;
        case 36: //home
          if(e.ctrlKey) //move to the start of the root math block.
            cursor.clearSelection().prependTo(math);
          else //else move to the start of the current block.
            cursor.clearSelection().prependTo(cursor.parent);
          return false;
        case 37: //left
          if(e.ctrlKey)
            return continueDefault = true;
          if(e.shiftKey)
            cursor.selectLeft();
          else
            cursor.moveLeft();
          return false;
        case 38: //up
          if(e.ctrlKey)
            return continueDefault = true;
          return false;
        case 39: //right
          if(e.ctrlKey)
            return continueDefault = true;
          if(e.shiftKey)
            cursor.selectRight();
          else
            cursor.moveRight();
          return false;
        case 40: //down
          if(e.ctrlKey)
            return continueDefault = true;
          return false;
        case 46: //delete
          if(e.ctrlKey)
            while(cursor.next)
              cursor.deleteForward();
          else
            cursor.deleteForward();
          return false;
        default:
          if(e.ctrlKey)
            return continueDefault = true; //don't capture Ctrl+anything other than the above
          continueDefault = null; //as in 'neither'. Do nothing, pass to keypress.
          return;
      }
    }).keypress(function(e)
    {
      //on auto-repeat, keypress may get triggered but not keydown (see Wiki page "Keyboard Events")
      if(!lastKeydnEvt.happened)
        $(this).trigger(lastKeydnEvt);

      if(continueDefault !== null)
      {
        lastKeydnEvt.happened = false;
        return continueDefault;
      }

      cursor.write(String.fromCharCode(e.which)).show();

      return false;
    }).focus();
  });
};
