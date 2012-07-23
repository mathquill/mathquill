/********************************************
 * Cursor and Selection "singleton" classes
 *******************************************/

/* The main thing that manipulates the Math DOM. Makes sure to manipulate the
HTML DOM to match. */

/* Sort of singletons, since there should only be one per editable math
textbox, but any one HTML document can contain many such textboxes, so any one
JS environment could actually contain many instances. */

//A fake cursor in the fake textbox that the math is rendered in.
var Cursor = P(function(_) {
  _.init = function(root) {
    this.parent = this.root = root;
    var jQ = this.jQ = this._jQ = $('<span class="cursor">&zwj;</span>');

    //closured for setInterval
    this.blink = function(){ jQ.toggleClass('blink'); }

    this.upDownCache = {};
  };

  _.left = 0;
  _.right = 0;
  _.parent = 0;
  _.show = function() {
    this.jQ = this._jQ.removeClass('blink');
    if ('intervalId' in this) //already was shown, just restart interval
      clearInterval(this.intervalId);
    else { //was hidden and detached, insert this.jQ back into HTML DOM
      if (this.right) {
        if (this.selection && this.selection.leftmost.left === this.left)
          this.jQ.insertBefore(this.selection.jQ);
        else
          this.jQ.insertBefore(this.right.jQ.first());
      }
      else
        this.jQ.appendTo(this.parent.jQ);
      this.parent.focus();
    }
    this.intervalId = setInterval(this.blink, 500);
    return this;
  };
  _.hide = function() {
    if ('intervalId' in this)
      clearInterval(this.intervalId);
    delete this.intervalId;
    this.jQ.detach();
    this.jQ = $();
    return this;
  };
  _.insertAt = function(parent, prev, next) {
    var old_parent = this.parent;

    this.parent = parent;
    this.left = prev;
    this.right = next;

    old_parent.blur(); //blur may need to know cursor's destination
  };
  _.insertBefore = function(el) {
    this.insertAt(el.parent, el.left, el)
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertBefore(el.jQ.first());
    return this;
  };
  _.insertAfter = function(el) {
    this.insertAt(el.parent, el, el.right);
    this.parent.jQ.addClass('hasCursor');
    this.jQ.insertAfter(el.jQ.last());
    return this;
  };
  _.prependTo = function(el) {
    this.insertAt(el, 0, el.leftmostChild);
    if (el.textarea) //never insert before textarea
      this.jQ.insertAfter(el.textarea);
    else
      this.jQ.prependTo(el.jQ);
    el.focus();
    return this;
  };
  _.appendTo = function(el) {
    this.insertAt(el, el.rightmostChild, 0);
    this.jQ.appendTo(el.jQ);
    el.focus();
    return this;
  };


  leftOrRight(function(left, right) {
    _[hop[left]] = function() {
      this.jQ[insert[left].of](this[left][jQ[left.most]]());
      this[right] = this[left];
      this[left] = this[left][left];
      return this;
    };

    _[move[left].within] = function(block) {
      if (this[left]) {
        if (this[left][right.most.child]) this[insert[right].most](this[left][right.most.child]);
        else this[hop[left]]();
      }
      else {
        // if we're at the left (or right) edge of the containing block, do nothing
        if (this.parent === block) return;

        if (this.parent[left]) this[insert[right].most](this.parent[left]);
        else this[insert[left].of](this.parent.parent);
      }
    };

    _[move[left]] = function() {
      clearUpDownCache(this);

      if (this.selection) this[insert[left].of](this.selection[left.most]).clearSelection();
      else this[move[left].within](this.root);

      return this.show();
    };
  });

  /**
   * moveUp and moveDown have almost identical algorithms:
   * - first check next and prev, if so prepend/appendTo them
   * - else check the parent's 'up'/'down' property - if it's a function,
   *   call it with the cursor as the sole argument and use the return value.
   *
   *   Given undefined, will bubble up to the next ancestor block.
   *   Given false, will stop bubbling.
   *   Given a MathBlock,
   *     + moveUp will appendTo it
   *     + moveDown will prependTo it
   *
   */
  _.moveUp = function() { return moveUpDown(this, 'up'); };
  _.moveDown = function() { return moveUpDown(this, 'down'); };
  function moveUpDown(self, dir) {
    if (self.right[dir]) self.prependTo(self.right[dir]);
    else if (self.left[dir]) self.appendTo(self.left[dir]);
    else {
      var ancestorBlock = self.parent;
      do {
        var prop = ancestorBlock[dir];
        if (prop) {
          if (typeof prop === 'function') prop = ancestorBlock[dir](self);
          if (prop === false || prop instanceof MathBlock) {
            self.upDownCache[ancestorBlock.id] = { parent: self.parent, left: self.left, right: self.right };

            if (prop instanceof MathBlock) {
              var cached = self.upDownCache[prop.id];

              if (cached) {
                if (cached.right) {
                  self.insertBefore(cached.right);
                } else {
                  self.appendTo(cached.parent);
                }
              } else {
                var pageX = offset(self).left;
                self.appendTo(prop);
                self.seekHoriz(pageX, prop);
              }
            }
            break;
          }
        }
        ancestorBlock = ancestorBlock.parent.parent;
      } while (ancestorBlock);
    }

    return self.clearSelection().show();
  }

  _.seek = function(target, pageX, pageY) {
    clearUpDownCache(this);
    var cmd, block, cursor = this.clearSelection().show();
    if (target.hasClass('empty')) {
      cursor.prependTo(MathElement[target.attr(mqBlockId)]);
      return cursor;
    }

    cmd = MathElement[target.attr(mqCmdId)];
    if (cmd instanceof Symbol) { //insert at whichever side is closer
      if (target.outerWidth() > 2*(pageX - target.offset().left))
        cursor.insertBefore(cmd);
      else
        cursor.insertAfter(cmd);

      return cursor;
    }
    if (!cmd) {
      block = MathElement[target.attr(mqBlockId)];
      if (!block) { //if no MathQuill data, try parent, if still no, just start from the root
        target = target.parent();
        cmd = MathElement[target.attr(mqCmdId)];
        if (!cmd) {
          block = MathElement[target.attr(mqBlockId)];
          if (!block) block = cursor.root;
        }
      }
    }

    if (cmd)
      cursor.insertAfter(cmd);
    else
      cursor.appendTo(block);

    return cursor.seekHoriz(pageX, cursor.root);
  };
  _.seekHoriz = function(pageX, block) {
    //move cursor to position closest to click
    var cursor = this;
    var dist = offset(cursor).left - pageX;
    var prevDist;

    do {
      cursor.moveLeftWithin(block);
      prevDist = dist;
      dist = offset(cursor).left - pageX;
    }
    while (dist > 0 && (cursor.left || cursor.parent !== block));

    if (-dist > prevDist) cursor.moveRightWithin(block);

    return cursor;
  };
  function offset(self) {
    //in Opera 11.62, .getBoundingClientRect() and hence jQuery::offset()
    //returns all 0's on inline elements with negative margin-right (like
    //the cursor) at the end of their parent, so temporarily remove the
    //negative margin-right when calling jQuery::offset()
    //Opera bug DSK-360043
    //http://bugs.jquery.com/ticket/11523
    //https://github.com/jquery/jquery/pull/717
    var offset = self.jQ.removeClass('cursor').offset();
    self.jQ.addClass('cursor');
    return offset;
  }
  _.writeLatex = function(latex) {
    var self = this;
    clearUpDownCache(self);
    self.show().deleteSelection();

    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    if (block) {
      block.children().adopt(self.parent, self.left, self.right);
      MathElement.jQize(block.join('html')).insertBefore(self.jQ);
      self.left = block.rightmostChild;
      block.finalizeInsert();
      self.parent.bubble('redraw');
    }

    return this.hide();
  };
  _.write = function(ch) {
    return this.show().insertCh(ch);
  };
  _.insertCh = function(ch) {
    var cmd;
    if (ch.match(/^[a-eg-zA-Z]$/)) //exclude f because want florin
      cmd = Variable(ch);
    else if (cmd = CharCmds[ch] || LatexCmds[ch])
      cmd = cmd(ch);
    else
      cmd = VanillaSymbol(ch);

    if (this.selection) {
      this.left = this.selection.leftmost.left;
      this.right = this.selection.rightmost.right;
      cmd.replaces(this.selection);
      delete this.selection;
    }

    return this.insertNew(cmd);
  };
  _.insertNew = function(cmd) {
    cmd.createBefore(this);
    return this;
  };
  _.insertCmd = function(latexCmd, replacedFragment) {
    var cmd = LatexCmds[latexCmd];
    if (cmd) {
      cmd = cmd(replacedFragment, latexCmd);
      this.insertNew(cmd);
      if (cmd instanceof Symbol && replacedFragment)
        replacedFragment.remove();
    }
    else {
      cmd = TextBlock(latexCmd);
      cmd.leftmostChild.focus = function(){ delete this.focus; return this; };
      this.insertNew(cmd).insertAfter(cmd);
      if (replacedFragment)
        replacedFragment.remove();
    }
    return this;
  };
  _.unwrapGramp = function() {
    var gramp = this.parent.parent;
    var greatgramp = gramp.parent;
    var next = gramp.right;
    var cursor = this;

    var prev = gramp.left;
    gramp.disown().eachChild(function(uncle) {
      if (uncle.isEmpty()) return;

      uncle.children()
        .adopt(greatgramp, prev, next)
        .each(function(cousin) {
          cousin.jQ.insertBefore(gramp.jQ.first());
        })
      ;

      prev = uncle.rightmostChild;
    });

    if (!this.right) { //then find something to be next to insertBefore
      if (this.left)
        this.right = this.left.right;
      else {
        while (!this.right) {
          this.parent = this.parent.right;
          if (this.parent)
            this.right = this.parent.leftmostChild;
          else {
            this.right = gramp.right;
            this.parent = greatgramp;
            break;
          }
        }
      }
    }
    if (this.right)
      this.insertBefore(this.right);
    else
      this.appendTo(greatgramp);

    gramp.jQ.remove();

    if (gramp.left)
      gramp.left.respace();
    if (gramp.right)
      gramp.right.respace();
  };

  leftOrRight(function(left, right) {
    _[del[left]] = function() {
      clearUpDownCache(this);
      this.show();

      if (this.deleteSelection()); // pass
      else if (this[left]) {
        if (this[left].isEmpty())
          this[left] = this[left].remove()[left];
        else
          this[select[left]]();
      }
      else if (this.parent !== this.root) {
        if (this.parent.parent.isEmpty())
          return this[insert[right].of](this.parent.parent)[del[left]]();
        else
          this.unwrapGramp();
      }

      if (this.left) this.left.respace();
      if (this.right) this.right.respace();
      this.parent.bubble('redraw');

      return this;
    };
  });

  _.selectFrom = function(anticursor) {
    //find ancestors of each with common parent
    var oneA = this, otherA = anticursor; //one ancestor, the other ancestor
    loopThroughAncestors: while (true) {
      for (var oneI = this; oneI !== oneA.parent.parent; oneI = oneI.parent.parent) //one intermediate, the other intermediate
        if (oneI.parent === otherA.parent) {
          left = oneI;
          right = otherA;
          break loopThroughAncestors;
        }

      for (var otherI = anticursor; otherI !== otherA.parent.parent; otherI = otherI.parent.parent)
        if (oneA.parent === otherI.parent) {
          left = oneA;
          right = otherI;
          break loopThroughAncestors;
        }

      if (oneA.parent.parent)
        oneA = oneA.parent.parent;
      if (otherA.parent.parent)
        otherA = otherA.parent.parent;
    }
    //figure out which is left/prev and which is right/next
    var left, right, leftRight;
    if (left.right !== right) {
      for (var next = left; next; next = next.right) {
        if (next === right.left) {
          leftRight = true;
          break;
        }
      }
      if (!leftRight) {
        leftRight = right;
        right = left;
        left = leftRight;
      }
    }
    this.hide().selection = Selection(left.left.right || left.parent.leftmostChild, right.right.left || right.parent.rightmostChild);
    this.insertAfter(right.right.left || right.parent.rightmostChild);
    this.root.selectionChanged();
  };

  var select = { left: 'selectLeft', right: 'selectRight' };
  leftOrRight(function(left, right) {
    _[select[left]] = function() {
      clearUpDownCache(this);
      if (this.selection) {
        if (this.selection[left.most] === this[right]) { //if cursor is at left (or right) edge of selection;
          if (this[left]) //then extend left (or right) if possible
            this[hop[left]]().selection[extend[left]]();
          else if (this.parent !== this.root) //else level up if possible
            this[insert[left].of](this.parent.parent).selection.levelUp();
        }
        else { //else cursor is at right (or left) edge of selection, retract left (or right) if possible
          this[hop[left]]();
          if (this.selection.leftmost === this.selection.rightmost) {
            this.clearSelection().show(); //clear selection if retracting to nothing
            return; //skip this.root.selectionChanged(), this.clearSelection() does it anyway
          }
          this.selection[retract[left]]();
        }
      }
      else {
        if (this[left])
          this[hop[left]]();
        else //end of a block
          if (this.parent !== this.root)
            this[insert[left].of](this.parent.parent);
          else
            return;

        this.hide().selection = Selection(this[right]);
      }
      this.root.selectionChanged();
    };
  });

  function clearUpDownCache(self) {
    self.upDownCache = {};
  }

  _.prepareMove = function() {
    clearUpDownCache(this);
    return this.show().clearSelection();
  };

  _.prepareEdit = function() {
    clearUpDownCache(this);
    return this.show().deleteSelection();
  }

  _.clearSelection = function() {
    if (this.selection) {
      this.selection.clear();
      delete this.selection;
      this.root.selectionChanged();
    }
    return this;
  };
  _.deleteSelection = function() {
    if (!this.selection) return false;

    this.left = this.selection.leftmost.left;
    this.right = this.selection.rightmost.right;
    this.selection.remove();
    this.root.selectionChanged();
    return delete this.selection;
  };
});

var Selection = P(MathFragment, function(_, _super) {
  _.init = function() {
    var frag = this;
    _super.init.apply(frag, arguments);

    frag.jQwrap(frag.jQ);
  };
  _.jQwrap = function(children) {
    this.jQ = children.wrapAll('<span class="selection"></span>').parent();
      //can't do wrapAll(this.jQ = $(...)) because wrapAll will clone it
  };
  _.adopt = function() {
    this.jQ.replaceWith(this.jQ = this.jQ.children());
    return _super.adopt.apply(this, arguments);
  };
  _.clear = function() {
    this.jQ.replaceWith(this.jQ.children());
    return this;
  };
  _.levelUp = function() {
    var seln = this,
      gramp = seln.leftmost = seln.rightmost = seln.rightmost.parent.parent;
    seln.clear().jQwrap(gramp.jQ);
    return seln;
  };
  leftOrRight(function(left, right) {
    _[extend[left]] = function() {
      this[left.most] = this[left.most][left];
      this[left.most].jQ[insert[left].most](this.jQ);
    };
    _[retract[right]] = function() {
      this[left.most].jQ[insert[left].of](this.jQ);
      this[left.most] = this[left.most][right];
    };
  });
});
