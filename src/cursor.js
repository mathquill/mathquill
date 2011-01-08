/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
function Cursor(root) {
  this.parent = root;
  var jQ = this.jQ = this._jQ = $('<span class="cursor"></span>');

  //API for the blinking cursor
  function blink(){ jQ.toggleClass('blink'); }
  var intervalId;
  this.show = function() {
    this.jQ = this._jQ.removeClass('blink');
    if (intervalId) //already was shown, just restart interval
      clearInterval(intervalId);
    else { //was hidden and detached, insert this.jQ back into HTML DOM
      if (this.next) {
        if (this.selection && this.selection.prev === this.prev)
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this.next.jQ);
      }
      else
        this.jQ.appendTo(this.parent.jQ);
      this.parent.focus();
    }
    intervalId = setInterval(blink, 500);
    return this;
  };
  this.hide = function() {
    if (intervalId)
      clearInterval(intervalId);
    intervalId = undefined;
    this.jQ.detach();
    this.jQ = $();
    return this;
  };
}
Cursor.prototype = {
  prev: 0,
  next: 0,
  parent: 0,
  redraw: function() {
    for (var ancestor = this.parent; ancestor; ancestor = ancestor.parent)
      if (ancestor.redraw)
        ancestor.redraw();
  },
  insertAt: function(parent, next, prev) {
    var old_parent = this.parent;

    this.parent = parent;
    this.next = next;
    this.prev = prev;

    old_parent.blur(); //blur may need to know cursor's destination
  },
  insertBefore: function(el) {
    this.insertAt(el.parent, el, el.prev)
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first());
    return this;
  },
  insertAfter: function(el) {
    this.insertAt(el.parent, el.next, el);
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  },
  prependTo: function(el) {
    this.insertAt(el, el.firstChild, 0);
    if (el.parent)
      this.jQ.prependTo(el.jQ);
    else //only root has no parent
      this.jQ.insertAfter(el.textarea);
    el.focus();
    return this;
  },
  appendTo: function(el) {
    this.insertAt(el, 0, el.lastChild);
    this.jQ.appendTo(el.jQ);
    el.focus();
    return this;
  },
  hopLeft: function() {
    this.jQ.insertBefore(this.prev.jQ.first());
    this.next = this.prev;
    this.prev = this.prev.prev;
    return this;
  },
  hopRight: function() {
    this.jQ.insertAfter(this.next.jQ.last());
    this.prev = this.next;
    this.next = this.next.next;
    return this;
  },
  moveLeft: function() {
    if (this.selection)
      this.insertBefore(this.selection.prev.next || this.parent.firstChild).clearSelection();
    else {
      if (this.prev) {
        if (this.prev.lastChild)
          this.appendTo(this.prev.lastChild)
        else
          this.hopLeft();
      }
      else { //we're at the beginning of a block
        if (this.parent.prev)
          this.appendTo(this.parent.prev);
        else if (this.parent.parent)
          this.insertBefore(this.parent.parent);
        //else we're at the beginning of the root, so do nothing.
      }
    }
    return this.show();
  },
  moveRight: function() {
    if (this.selection)
      this.insertAfter(this.selection.next.prev || this.parent.lastChild).clearSelection();
    else {
      if (this.next) {
        if (this.next.firstChild)
          this.prependTo(this.next.firstChild)
        else
          this.hopRight();
      }
      else { //we're at the end of a block
        if (this.parent.next)
          this.prependTo(this.parent.next);
        else if (this.parent.parent)
          this.insertAfter(this.parent.parent);
        //else we're at the end of the root, so do nothing.
      }
    }
    return this.show();
  },
  write: function(ch) {
    if (this.selection) {
      //gotta do this before this.selection is mutated by 'new cmd(this.selection)'
      this.prev = this.selection.prev;
      this.next = this.selection.next;
    }

    var cmd;
    if (ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
      cmd = new Variable(ch);
    else if (cmd = CharCmds[ch] || LatexCmds[ch])
      cmd = new cmd(this.selection, ch);
    else
      cmd = new VanillaSymbol(ch);

    if (this.selection) {
      if (cmd instanceof Symbol)
        this.selection.remove();
      delete this.selection;
    }

    return this.insertNew(cmd);
  },
  insertNew: function(cmd) {
    cmd.parent = this.parent;
    cmd.next = this.next;
    cmd.prev = this.prev;

    if (this.prev)
      this.prev.next = cmd;
    else
      this.parent.firstChild = cmd;

    if (this.next)
      this.next.prev = cmd;
    else
      this.parent.lastChild = cmd;

    cmd.jQ.insertBefore(this.jQ);
    this.prev = cmd;

    //adjust context-sensitive spacing
    cmd.respace();
    if (this.next)
      this.next.respace();
    if (this.prev)
      this.prev.respace();

    cmd.placeCursor(this);

    this.redraw();

    return this;
  },
  unwrapGramp: function() {
    var gramp = this.parent.parent,
      greatgramp = gramp.parent,
      prev = gramp.prev,
      cursor = this;

    gramp.eachChild(function() {
      if (this.isEmpty()) return;

      this.eachChild(function() {
        this.parent = greatgramp;
        this.jQ.insertBefore(gramp.jQ);
      });
      this.firstChild.prev = prev;
      if (prev)
        prev.next = this.firstChild;
      else
        greatgramp.firstChild = this.firstChild;

      prev = this.lastChild;
    });
    prev.next = gramp.next;
    if (gramp.next)
      gramp.next.prev = prev;
    else
      greatgramp.lastChild = prev;

    if (!this.next) { //then find something to be next to insertBefore
      if (this.prev)
        this.next = this.prev.next;
      else {
        while (!this.next) {
          this.parent = this.parent.next;
          if (this.parent)
            this.next = this.parent.firstChild;
          else {
            this.next = gramp.next;
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    if (this.next)
      this.insertBefore(this.next);
    else
      this.appendTo(greatgramp);

    gramp.jQ.remove();

    if (gramp.prev)
      gramp.prev.respace();
    if (gramp.next)
      gramp.next.respace();
  },
  backspace: function() {
    if (this.deleteSelection());
    else if (this.prev) {
      if (this.prev.isEmpty())
        this.prev = this.prev.remove().prev;
      else
        this.selectLeft();
    }
    else if (this.parent.parent) {
      if (this.parent.parent.isEmpty())
        return this.insertAfter(this.parent.parent).backspace();
      else
        this.unwrapGramp();
    }

    if (this.prev)
      this.prev.respace();
    if (this.next)
      this.next.respace();
    this.redraw();

    return this;
  },
  deleteForward: function() {
    if (this.deleteSelection());
    else if (this.next) {
      if (this.next.isEmpty())
        this.next = this.next.remove().next;
      else
        this.selectRight();
    }
    else if (this.parent.parent) {
      if (this.parent.parent.isEmpty())
        return this.insertBefore(this.parent.parent).deleteForward();
      else
        this.unwrapGramp();
    }

    if (this.prev)
      this.prev.respace();
    if (this.next)
      this.next.respace();
    this.redraw();

    return this;
  },
  selectLeft: function() {
    if (this.selection) {
      if (this.selection.prev === this.prev) { //if cursor is at left edge of selection,
        if (this.prev) { //then extend left if possible
          this.hopLeft().next.jQ.prependTo(this.selection.jQ);
          this.selection.prev = this.prev;
        }
        else if (this.parent.parent) //else level up if possible
          this.insertBefore(this.parent.parent).selection.levelUp();
      }
      else { //else cursor is at right edge of selection, retract left
        this.prev.jQ.insertAfter(this.selection.jQ);
        this.hopLeft().selection.next = this.next;
        if (this.selection.prev === this.prev)
          this.deleteSelection();
      }
    }
    else {
      if (this.prev)
        this.hopLeft();
      else //end of a block
        if (this.parent.parent)
          this.insertBefore(this.parent.parent);

      this.hide().selection = new Selection(this.parent, this.prev, this.next.next);
    }
  },
  selectRight: function() {
    if (this.selection) {
      if (this.selection.next === this.next) { //if cursor is at right edge of selection,
        if (this.next) { //then extend right if possible
          this.hopRight().prev.jQ.appendTo(this.selection.jQ);
          this.selection.next = this.next;
        }
        else if (this.parent.parent) //else level up if possible
          this.insertAfter(this.parent.parent).selection.levelUp();
      }
      else { //else cursor is at left edge of selection, retract right
        this.next.jQ.insertBefore(this.selection.jQ);
        this.hopRight().selection.prev = this.prev;
        if (this.selection.next === this.next)
          this.deleteSelection();
      }
    }
    else {
      if (this.next)
        this.hopRight();
      else //end of a block
        if (this.parent.parent)
          this.insertAfter(this.parent.parent);

      this.hide().selection = new Selection(this.parent, this.prev.prev, this.next);
    }
  },
  clearSelection: function() {
    if (this.show().selection) {
      this.selection.clear();
      delete this.selection;
    }
    return this;
  },
  deleteSelection: function() {
    if (!this.show().selection) return false;

    this.prev = this.selection.prev;
    this.next = this.selection.next;
    this.selection.remove();
    delete this.selection;
    return true;
  }
}

function Selection(parent, prev, next) {
  MathFragment.apply(this, arguments);
}
Selection.prototype = $.extend(new MathFragment, {
  jQinit: function(children) {
    this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  },
  levelUp: function() {
    this.clear().jQinit(this.parent.parent.jQ);

    this.prev = this.parent.parent.prev;
    this.next = this.parent.parent.next;
    this.parent = this.parent.parent.parent;

    return this;
  },
  clear: function() {
    this.jQ.replaceWith(this.jQ.children());
    return this;
  },
  blockify: function() {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return MathFragment.prototype.blockify.call(this);
  },
  detach: function() {
    var block = MathFragment.prototype.blockify.call(this);
    this.blockify = function() {
      this.jQ.replaceWith(block.jQ = this.jQ = this.jQ.children());
      return block;
    };
    return this;
  }
});
